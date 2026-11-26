#!/usr/bin/env bash
# ============================================
# Local Postgres test harness for supabase/migrations
# ============================================
# Usage:  bash supabase/tests/run.sh
#
# What it does:
#   1. Finds Postgres binaries (installs `postgresql` with apt-get if missing).
#   2. Starts a throwaway cluster in a temp dir (unix socket only, no TCP).
#   3. Builds a template database: tests/setup.sql (auth stub, roles, grants),
#      then every migrations/*.sql in filename order.
#   4. Re-applies the migrations documented as re-runnable, to prove they are.
#   5. Runs each tests/*.test.sql in its own copy of the template database.
#   6. Stops the cluster and deletes the temp dir.
#
# Alternative: set TEST_DATABASE_URL to an existing server where you are a
# superuser (for example a CI service container). The script then skips steps
# 1, 2 and 6 and uses throwaway databases on that server.
#
# Exit code: 0 when every step and test passed, 1 otherwise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPABASE_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"

# Migrations whose file header / docs/SUPABASE_MIGRATIONS.md say they are
# safe to run twice. 001 and 003 are known NOT to be re-runnable.
RERUNNABLE_MIGRATIONS=(
  "002_exercise_interactions_schema.sql"
  "004_plans_schema.sql"
  "007_user_data.sql"
  "008_policy_fixes.sql"
  "009_purge_tombstone_content.sql"
)

TEMPLATE_DB="fw_test_template"
PORT="${TEST_PG_PORT:-54329}"
PG_DIR=""
PG_BIN=""
RUN_AS=()

log() { printf '[test:db] %s\n' "$*"; }

cleanup() {
  if [[ -n "$PG_DIR" && -d "$PG_DIR" ]]; then
    "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$PG_DIR/data" -m fast stop >/dev/null 2>&1 || true
    rm -rf "$PG_DIR"
  fi
}
trap cleanup EXIT

find_pg_bin() {
  if command -v pg_ctl >/dev/null 2>&1; then
    dirname "$(command -v pg_ctl)"
    return 0
  fi
  local candidate
  candidate="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
  if [[ -n "$candidate" && -x "$candidate/pg_ctl" ]]; then
    echo "$candidate"
    return 0
  fi
  return 1
}

start_local_cluster() {
  if ! PG_BIN="$(find_pg_bin)"; then
    log "Postgres not found; installing with apt-get (needs root)."
    export DEBIAN_FRONTEND=noninteractive
    apt-get install -y postgresql >/dev/null 2>&1 \
      || { apt-get update >/dev/null 2>&1 && apt-get install -y postgresql >/dev/null 2>&1; } \
      || { log "Could not install Postgres. Mark the SQL tests as unverified."; exit 1; }
    PG_BIN="$(find_pg_bin)" || { log "Postgres installed but pg_ctl not found."; exit 1; }
  fi

  PG_DIR="$(mktemp -d -t fw-pg-XXXXXX)"
  chmod 755 "$PG_DIR"

  # Postgres refuses to run as root. Use the `postgres` OS user when we are root.
  if [[ "$(id -u)" == "0" ]]; then
    if ! id postgres >/dev/null 2>&1; then
      useradd --system --no-create-home postgres
    fi
    chown postgres "$PG_DIR"
    RUN_AS=(runuser -u postgres --)
  else
    RUN_AS=(env)
  fi

  "${RUN_AS[@]}" "$PG_BIN/initdb" -D "$PG_DIR/data" -U postgres -A trust --no-sync >/dev/null
  "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$PG_DIR/data" -l "$PG_DIR/server.log" -w \
    -o "-k $PG_DIR -p $PORT -c listen_addresses='' -c fsync=off -c wal_level=logical" start >/dev/null

  export PGHOST="$PG_DIR" PGPORT="$PORT" PGUSER="postgres"
  log "Started Postgres $("$PG_BIN/postgres" --version | awk '{print $3}') at $PG_DIR"
}

psql_cmd() {
  # $1 = database, rest = extra psql args
  local db="$1"
  shift
  if [[ -n "${TEST_DATABASE_URL:-}" ]]; then
    psql "$(db_url "$db")" -X -q -v ON_ERROR_STOP=1 "$@"
  else
    "$PG_BIN/psql" -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"
  fi
}

# Swap the database name in TEST_DATABASE_URL.
db_url() {
  local db="$1"
  echo "${TEST_DATABASE_URL%/*}/$db"
}

main() {
  if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
    start_local_cluster
  else
    PG_BIN="$(dirname "$(command -v psql)")"
    log "Using TEST_DATABASE_URL server."
  fi

  # Hide "already exists, skipping" NOTICEs. Test files opt back in with
  # SET client_min_messages = notice.
  export PGOPTIONS="-c client_min_messages=warning"

  local failures=0

  psql_cmd postgres -c "DROP DATABASE IF EXISTS $TEMPLATE_DB" -c "CREATE DATABASE $TEMPLATE_DB"

  log "Applying setup.sql"
  psql_cmd "$TEMPLATE_DB" -f "$SCRIPT_DIR/setup.sql"

  local migration
  for migration in "$MIGRATIONS_DIR"/*.sql; do
    log "Applying $(basename "$migration")"
    psql_cmd "$TEMPLATE_DB" -f "$migration"
  done

  local name rerun_output
  for name in "${RERUNNABLE_MIGRATIONS[@]}"; do
    if [[ -f "$MIGRATIONS_DIR/$name" ]]; then
      if rerun_output="$(psql_cmd "$TEMPLATE_DB" -f "$MIGRATIONS_DIR/$name" 2>&1)"; then
        log "PASS  re-run $name"
      else
        log "FAIL  re-run $name"
        printf '%s\n' "$rerun_output" | sed 's/^/        /'
        failures=$((failures + 1))
      fi
    fi
  done

  local test_file test_db output
  for test_file in "$SCRIPT_DIR"/*.test.sql; do
    [[ -e "$test_file" ]] || continue
    test_db="fw_test_$(basename "$test_file" .test.sql | tr -c 'a-zA-Z0-9\n' '_')"
    psql_cmd postgres -c "DROP DATABASE IF EXISTS $test_db" -c "CREATE DATABASE $test_db TEMPLATE $TEMPLATE_DB"
    if output="$(psql_cmd "$test_db" -f "$test_file" 2>&1)"; then
      log "PASS  $(basename "$test_file")"
      [[ -n "$output" ]] && printf '%s\n' "$output" | sed 's/^/        /'
    else
      log "FAIL  $(basename "$test_file")"
      printf '%s\n' "$output" | sed 's/^/        /'
      failures=$((failures + 1))
    fi
    psql_cmd postgres -c "DROP DATABASE IF EXISTS $test_db"
  done

  psql_cmd postgres -c "DROP DATABASE IF EXISTS $TEMPLATE_DB"

  if [[ "$failures" -gt 0 ]]; then
    log "$failures failure(s)."
    exit 1
  fi
  log "All database checks passed."
}

main "$@"
