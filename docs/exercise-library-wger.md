# wger Exercise Library Integration Report

Last generated: 2026-03-15T17:08:46.073Z

## Endpoint verification
- Public endpoint used at runtime: `GET /api/v2/exerciseinfo/`
- Public verified backup-only endpoints: `GET /api/v2/exerciseimage/`, `GET /api/v2/muscle/`
- Authentication required for read-only exercise content: No
- Runtime source of truth: official public `exerciseinfo` endpoint with pagination
- Exercise records already include image metadata: Yes
- Secondary image endpoint required in v1: No

## Verified live wrapper shape
- `count`
- `next`
- `previous`
- `results`

## Verified `exerciseinfo` fields in use
- `id`, `uuid`
- `category`
- `muscles`
- `muscles_secondary`
- `equipment`
- `license`, `license_author`
- `images`
- `translations`
- `total_authors_history`

## Normalized internal model
- `id = "wger:{id}"`
- `source = "wger"`
- `sourceId`, `sourceUuid`, `slug`
- `name`, `description`
- `aliases`, `localizedContent`
- `category = { id, name, slug }`
- `primaryMuscles`, `secondaryMuscles`
- `equipment`
- `imageUrl`, `imageUrls`
- `licenseInfo`
- `searchText`
- `lastSyncedAt`

## Snapshot summary
- Normalized record count: 885
- Records with at least one image: 261
- Records without an image: 624

## Integration flow
1. Boot from persisted last-known-good normalized cache when available
2. Fall back to the bundled normalized wger snapshot when cache is unavailable
3. Fall back to the adapted curated local dataset when snapshot is unavailable
4. Start a background live sync only after the UI is already usable
5. Promote live data only after pagination, normalization, and minimum-record validation succeed

## Boot sequence
1. Persisted last-known-good normalized cache
2. Bundled normalized wger snapshot
3. Adapted current curated local dataset
4. Background live sync after UI is already usable

## Risk notes
- Licensing risk: exercise text and images must be reviewed per-record before commercial or closed-source launch
- Schema drift risk: live sync is rejected when required fields or pagination shape are invalid
- Missing-image risk: cards keep their media area and render the fallback heartbeat hero instead
- Uptime risk: the library is local-first and does not require the live API to render

## Licensing note
- wger application code is AGPL
- exercise content licensing is separate and must be reviewed per record metadata
- this integration retains `licenseInfo` on normalized records
- using the public API from a separate app does not, by itself, require this app's codebase to be open sourced
