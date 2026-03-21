import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'exercise-data');
const LEGACY_ASSET_PATH = path.join(PUBLIC_DIR, 'legacy-exercises.v1.json');
const SNAPSHOT_SOURCE_PATH = path.join(
  ROOT_DIR,
  'src',
  'features',
  'exercise-library',
  'data',
  'wger-snapshot.json'
);
const SNAPSHOT_ASSET_PATH = path.join(PUBLIC_DIR, 'wger-snapshot.v1.json');

async function main() {
  const { EXERCISE_DATABASE } = await import('../src/data/exercises.ts');
  const snapshotRaw = await fs.readFile(SNAPSHOT_SOURCE_PATH, 'utf8');

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(
    LEGACY_ASSET_PATH,
    `${JSON.stringify(EXERCISE_DATABASE, null, 2)}\n`
  );
  await fs.writeFile(SNAPSHOT_ASSET_PATH, snapshotRaw);

  console.log(
    `Wrote ${EXERCISE_DATABASE.length} legacy exercises and snapshot asset to public/exercise-data`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
