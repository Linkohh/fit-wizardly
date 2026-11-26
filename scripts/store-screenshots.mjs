#!/usr/bin/env node
/**
 * Store screenshots and listing-copy check (roadmap 4.3, Lane A Day 6).
 *
 * Usage:
 *   node scripts/store-screenshots.mjs                  # check the copy, build, preview, capture every device
 *   node scripts/store-screenshots.mjs --check-copy     # only check docs/store/LISTING.md (no browser)
 *   node scripts/store-screenshots.mjs --check-copy --strict   # also fail on [bracketed placeholders] (Day 9)
 *   node scripts/store-screenshots.mjs --base-url=http://127.0.0.1:4173   # use a server that's already running
 *   node scripts/store-screenshots.mjs --devices=apple-6.9,google-phone   # a subset
 *   node scripts/store-screenshots.mjs --theme=light     # default: dark
 *
 * Environment:
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE  path to a Chromium to use (for example /opt/pw-browsers/chromium in a cloud session)
 *
 * Output: docs/store/screenshots/<device>/<nn>-<screen>.jpg (git-ignored). JPEG, because App Store Connect
 * rejects images with an alpha channel and Playwright's PNGs carry one.
 *
 * Required sizes (portrait, iPhone only: the app is iPhone-only and portrait-only, D4):
 *   Apple, checked 2026-11-26 against App Store Connect Help → Screenshot specifications:
 *     - 6.9"/6.7" (Dynamic Island, large): 1320×2868, 1290×2796 or 1260×2736. Provide this set; smaller sizes are
 *       scaled down from it when the interface is the same.
 *     - 6.5" (Face ID, large): 1284×2778 or 1242×2688. "Required if … Dynamic Island (large display) aren't provided."
 *     - 6.1"/6.3" (Dynamic Island, medium): 1206×2622 or 1179×2556. The page reads as requiring at least one
 *       screenshot for this class; captured too, so it's there if App Store Connect asks.
 *     - 1 to 10 screenshots per size; .jpeg, .jpg or .png; no alpha channel.
 *   Google Play, as last known (support.google.com can't be reached from the agent environment; Lincoln checks in
 *   Play Console): 2 to 8 phone screenshots, 16:9 or 9:16, each side 320–3840 px, JPEG or 24-bit PNG, up to 8 MB;
 *   at least 1080 px on the short side to be eligible for promotion.
 *
 * Demo data: made through the app itself, as a guest with no Supabase (the same path as
 * playwright/lifter-loop.spec.ts): consent → onboarding → wizard → plan → one finished workout. Five more finished
 * workouts are cloned from that one with earlier dates and lighter weights, so History and Analytics have a trend.
 * Then a second workout is left in progress for the logger shot. The saved storage (IndexedDB included) is handed
 * to every device context.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LISTING_PATH = path.join(ROOT, 'docs/store/LISTING.md');
const OUTPUT_DIR = path.join(ROOT, 'docs/store/screenshots');
const PREVIEW_PORT = 4317;
const PLAN_STORE_KEY = 'fitwizard-plans';

/** CSS viewport × device scale factor = the pixel size the store asks for. */
export const DEVICES = [
  { id: 'apple-6.9', store: 'Apple', label: '6.9" iPhone (Dynamic Island, large)', width: 440, height: 956, scale: 3 },
  { id: 'apple-6.5', store: 'Apple', label: '6.5" iPhone (Face ID, large)', width: 428, height: 926, scale: 3 },
  { id: 'apple-6.1', store: 'Apple', label: '6.1"/6.3" iPhone (Dynamic Island, medium)', width: 402, height: 874, scale: 3 },
  // 432 CSS px rather than 360: at 360 the workout logger overflows on the right (see the Lane A Day 6 handoff).
  { id: 'google-phone', store: 'Google', label: 'Android phone, 9:16', width: 432, height: 768, scale: 2.5 },
];

export const SCREENS = ['home', 'wizard-muscles', 'plan', 'workout-mid-set', 'history', 'analytics'];

/**
 * Words the listing must not use. `\b` keeps "AI" from matching inside words such as "maintain".
 * Medical-claim words are banned everywhere except the disclaimer, which says "not medical advice"
 * (so "medical" itself isn't banned).
 */
export const BANNED_TERMS = [
  { pattern: /\bAI\b/, reason: 'no AI claim (roadmap 0.1)' },
  { pattern: /artificial intelligence|machine learning|\bsmart coach/i, reason: 'no AI claim (roadmap 0.1)' },
  { pattern: /\bcoach(es|ing)?\b|\btrainers?\b|\bclients?\b/i, reason: 'the coach tools are off in v1' },
  { pattern: /\bcircles?\b|\bfriends?\b|\bcommunity\b|\bleaderboards?\b|\bchallenges?\b|\bsocial\b/i, reason: 'Circles is off in v1' },
  { pattern: /\bsubscri(be|ption)s?\b|\bpremium\b|\bpro version\b|\bupgrade\b|\bin-app purchase/i, reason: 'the app is free, with no purchases' },
  { pattern: /\bcures?\b|\btreat(s|ment)?\b|\bdiagnos|\bheal(s|ing)?\b|\btherap|\brehab|\bclinical|\bprevents? injur|\bguarantee/i, reason: 'no medical claims' },
];

const BLOCK_PATTERN = /<!--\s*listing:([a-z0-9-]+)\s+max=(\d+)\s*-->\s*\r?\n```text\r?\n([\s\S]*?)\r?\n```/g;
const PLACEHOLDER_PATTERN = /\[[^\]\n]*(Lincoln|TODO|TBD)[^\]\n]*\]/;

/** Every `<!-- listing:id max=N -->` + ```text block in LISTING.md, in order. */
export function parseListingBlocks(markdown) {
  const blocks = [];
  for (const match of markdown.matchAll(BLOCK_PATTERN)) {
    blocks.push({ id: match[1], max: Number(match[2]), text: match[3] });
  }
  return blocks;
}

/** Characters as the stores count them: Unicode code points, so "•" is one. */
export function countCharacters(text) {
  return [...text].length;
}

/**
 * Checks each block's length and wording. Returns `{ errors, warnings }`; placeholders are errors
 * only with `strict` (Day 9), warnings otherwise.
 */
export function checkListing(blocks, { strict = false } = {}) {
  const errors = [];
  const warnings = [];
  if (blocks.length === 0) errors.push('No listing blocks found. Each needs "<!-- listing:id max=N -->" then a ```text block.');
  const seen = new Set();
  for (const block of blocks) {
    if (seen.has(block.id)) errors.push(`${block.id}: appears twice`);
    seen.add(block.id);
    const length = countCharacters(block.text);
    if (length === 0) errors.push(`${block.id}: empty`);
    if (length > block.max) errors.push(`${block.id}: ${length} characters, limit ${block.max}`);
    for (const { pattern, reason } of BANNED_TERMS) {
      const found = block.text.match(pattern);
      if (found) errors.push(`${block.id}: "${found[0]}" (${reason})`);
    }
    if (block.id === 'apple-keywords' && /,\s|\s,/.test(block.text)) {
      warnings.push(`${block.id}: spaces around commas count against the 100 characters`);
    }
    const placeholder = block.text.match(PLACEHOLDER_PATTERN);
    if (placeholder) (strict ? errors : warnings).push(`${block.id}: placeholder ${placeholder[0]}`);
  }
  return { errors, warnings };
}

/** Width and height of a baseline or progressive JPEG, from its SOF marker. */
export function jpegSize(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function parseArgs(argv) {
  const options = { checkCopyOnly: false, strict: false, baseUrl: null, devices: null, theme: 'dark' };
  for (const arg of argv) {
    if (arg === '--check-copy') options.checkCopyOnly = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg.startsWith('--base-url=')) options.baseUrl = arg.slice('--base-url='.length).replace(/\/$/, '');
    else if (arg.startsWith('--devices=')) options.devices = arg.slice('--devices='.length).split(',');
    else if (arg.startsWith('--theme=')) options.theme = arg.slice('--theme='.length);
    else throw new Error(`Unknown option ${arg}`);
  }
  if (!['dark', 'light'].includes(options.theme)) throw new Error('--theme must be dark or light');
  return options;
}

function runCopyCheck(strict) {
  const blocks = parseListingBlocks(readFileSync(LISTING_PATH, 'utf8'));
  const { errors, warnings } = checkListing(blocks, { strict });
  for (const block of blocks) console.log(`  ${block.id.padEnd(18)} ${String(countCharacters(block.text)).padStart(4)} / ${block.max}`);
  for (const warning of warnings) console.warn(`  warning: ${warning}`);
  for (const error of errors) console.error(`  error: ${error}`);
  return errors.length === 0;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))));
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Preview server didn't answer at ${url}`);
}

async function startPreview() {
  await run('npm', ['run', 'build']);
  const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: true,
  });
  const baseUrl = `http://127.0.0.1:${PREVIEW_PORT}`;
  await waitForServer(baseUrl);
  return { baseUrl, stop: () => { try { process.kill(-server.pid); } catch { /* already gone */ } } };
}

/** Wait for finite animations to end (the same rule as the lifter-loop axe scans), then two frames. */
async function settle(page) {
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .every((animation) => animation.playState !== 'running' && animation.playState !== 'pending'),
    undefined,
    { timeout: 10_000 },
  ).catch(() => { /* a long animation shouldn't stop the run */ });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  // Count-up numbers (useCountUp) run on requestAnimationFrame, not Web Animations, so give them time.
  await page.waitForTimeout(1_500);
}

async function wizardStep(page, stepNumber) {
  await page.getByRole('paragraph').filter({ hasText: `Step ${stepNumber} of 6` }).waitFor();
}

async function pickMuscle(page, name) {
  const search = page.getByRole('searchbox', { name: 'Search muscles by name or nickname' });
  await search.fill(name);
  const button = page.getByRole('region', { name: /Muscles matching/ }).getByRole('button', { name, exact: true });
  try {
    await button.click({ timeout: 3_000 });
    return true;
  } catch {
    console.warn(`  muscle "${name}" not found in search; skipped`);
    return false;
  } finally {
    await search.fill('');
  }
}

async function logSet(page, setNumber, weight, reps, { complete = true } = {}) {
  const set = page.getByRole('group', { name: `Set ${setNumber}`, exact: true });
  await set.getByRole('spinbutton', { name: /^Weight/ }).fill(weight);
  await set.getByRole('spinbutton', { name: 'Reps' }).fill(reps);
  const rir = set.getByRole('slider').first();
  await rir.press('Home');
  for (let step = 0; step < 2; step += 1) await rir.press('ArrowRight');
  if (complete) await set.getByRole('button', { name: 'Complete Set' }).click();
}

async function startDay(page, dayIndex) {
  await page.getByRole('button', { name: 'Start Workout' }).nth(dayIndex).click();
  await page.waitForURL(new RegExp(`/workout/[^/]+/${dayIndex}$`));
  await page.getByRole('button', { name: 'Skip For Today' }).click();
}

/** Copy the one real finished workout into `count` earlier ones, a week's progress apart. */
async function cloneHistory(page, count) {
  await page.evaluate(async ({ key, count }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('fitwizard');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const store = (mode) => db.transaction('kv', mode).objectStore('kv');
    const raw = await new Promise((resolve, reject) => {
      const request = store('readonly').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const saved = JSON.parse(raw);
    // The real workout took seconds; give every demo workout a believable length.
    const latest = { ...saved.state.workoutLogs[0], duration: 52 };
    latest.startedAt = new Date(new Date(latest.completedAt).getTime() - 52 * 60 * 1000).toISOString();
    const dayMs = 24 * 60 * 60 * 1000;
    const clones = [];
    for (let index = 1; index <= count; index += 1) {
      const shift = index * 3.5 * dayMs;
      const factor = 1 - index * 0.04;
      const exercises = latest.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({ ...set, weight: Math.round((set.weight * factor) / 2.5) * 2.5 })),
      }));
      const totalVolume = exercises.reduce(
        (sum, exercise) => sum + exercise.sets.reduce((inner, set) => inner + (set.completed ? set.weight * set.reps : 0), 0),
        0,
      );
      clones.push({
        ...latest,
        id: `${latest.id}-demo-${index}`,
        duration: 52 - index * 2,
        startedAt: new Date(new Date(latest.completedAt).getTime() - shift - (52 - index * 2) * 60 * 1000).toISOString(),
        completedAt: new Date(new Date(latest.completedAt).getTime() - shift).toISOString(),
        exercises,
        totalVolume,
      });
    }
    saved.state.workoutLogs = [latest, ...clones];
    await new Promise((resolve, reject) => {
      const request = store('readwrite').put(JSON.stringify(saved), key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  }, { key: PLAN_STORE_KEY, count });
}

/** Builds the demo data once and returns the storage state (IndexedDB included). */
async function seedDemoData(browser, baseUrl, theme) {
  const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 430, height: 932 }, colorScheme: theme });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();

  await page.waitForURL(/\/onboarding$/);
  await page.getByLabel('What should we call you?').fill('Alex');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /^Gain Muscle/ }).click();
  await page.getByRole('button', { name: "Let's Go!" }).click();
  await page.waitForURL(/\/wizard$/);

  const next = page.getByRole('button', { name: 'Next', exact: true });
  await wizardStep(page, 2);
  await next.click(); // limitations: none
  await wizardStep(page, 3);
  await page.getByRole('button', { name: 'Full Gym' }).click();
  await next.click();
  await wizardStep(page, 4);
  const picked = [];
  for (const muscle of ['Pectoralis Major', 'Latissimus Dorsi', 'Gluteus Maximus', 'Anterior Deltoid']) {
    if (await pickMuscle(page, muscle)) picked.push(muscle);
  }
  if (picked.length === 0) throw new Error('No muscle could be picked in the wizard');
  await next.click();
  await wizardStep(page, 5);
  await next.click();
  await wizardStep(page, 6);
  await page.getByRole('button', { name: 'Generate Plan' }).click();
  await page.waitForURL(/\/plan$/);

  // One finished workout: three sets of the first exercise.
  await startDay(page, 0);
  await logSet(page, 1, '135', '10');
  await logSet(page, 2, '145', '8');
  await logSet(page, 3, '145', '8');
  await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
  await page.getByRole('alertdialog', { name: 'How was the workout?' }).getByRole('button', { name: 'Just Right' }).click();
  await page.getByRole('heading', { name: /Workout Complete!/ }).waitFor();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForURL(/\/plan$/);

  await cloneHistory(page, 5);
  await page.reload();

  // A second workout left in progress: set 1 done, set 2 filled in but not completed.
  await page.goto('/plan');
  await startDay(page, 1);
  await logSet(page, 1, '95', '12');
  await logSet(page, 2, '100', '10', { complete: false });
  const workoutPath = new URL(page.url()).pathname;
  await page.waitForTimeout(1_000); // let the in-progress workout reach IndexedDB

  const storageState = await context.storageState({ indexedDB: true });
  await context.close();
  return { storageState, workoutPath };
}

/** Navigates to one screen and waits until it shows its content. */
async function openScreen(page, screen, workoutPath) {
  switch (screen) {
    case 'home':
      await page.goto('/');
      await page.getByRole('navigation', { name: 'Main navigation' }).waitFor().catch(() => {});
      break;
    case 'wizard-muscles': {
      await page.goto('/wizard');
      // Phones hide the stepper, so step with Back / Next (icon buttons with aria-labels) until
      // step 4. The wizard keeps the demo answers, so Next is enabled on every step.
      const counter = page.getByRole('paragraph').filter({ hasText: /^Step \d of 6$/ }).first();
      for (let moves = 0; moves < 6; moves += 1) {
        const current = Number((await counter.textContent())?.match(/Step (\d)/)?.[1]);
        if (current === 4) break;
        await page.getByRole('button', { name: current < 4 ? 'Next' : 'Back', exact: true }).click();
        await counter.filter({ hasNotText: `Step ${current} of 6` }).waitFor();
      }
      await wizardStep(page, 4);
      await page.getByRole('heading', { name: 'Select Target Muscles' }).evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
      break;
    }
    case 'plan':
      await page.goto('/plan');
      await page.getByRole('heading', { name: 'Your Workout Plan', level: 1 }).waitFor();
      break;
    case 'workout-mid-set':
      await page.goto(workoutPath);
      await page.getByRole('group', { name: 'Set 2', exact: true }).waitFor();
      await page.getByRole('group', { name: 'Set 2', exact: true }).scrollIntoViewIfNeeded();
      break;
    case 'history':
      await page.goto('/history');
      await page.getByTestId('history-empty-state').waitFor({ state: 'detached' }).catch(() => {});
      break;
    case 'analytics':
      await page.goto('/analytics');
      break;
    default:
      throw new Error(`Unknown screen ${screen}`);
  }
  if (screen !== 'workout-mid-set' && screen !== 'wizard-muscles') await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
}

async function captureDevice(browser, device, { baseUrl, storageState, workoutPath, theme }) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    storageState,
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    isMobile: true,
    hasTouch: true,
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const directory = path.join(OUTPUT_DIR, device.id);
  mkdirSync(directory, { recursive: true });
  const expected = { width: device.width * device.scale, height: device.height * device.scale };
  const problems = [];
  for (const [index, screen] of SCREENS.entries()) {
    const file = path.join(directory, `${String(index + 1).padStart(2, '0')}-${screen}.jpg`);
    try {
      await openScreen(page, screen, workoutPath);
      const buffer = await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      const size = jpegSize(buffer);
      if (!size || size.width !== expected.width || size.height !== expected.height) {
        problems.push(`${device.id}/${screen}: ${size ? `${size.width}×${size.height}` : 'unreadable'}, expected ${expected.width}×${expected.height}`);
      }
      console.log(`  ${path.relative(ROOT, file)}`);
    } catch (error) {
      problems.push(`${device.id}/${screen}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
  }
  await context.close();
  return problems;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log('Listing copy (docs/store/LISTING.md):');
  if (!runCopyCheck(options.strict)) {
    console.error('Listing copy check failed.');
    process.exitCode = 1;
    return;
  }
  console.log('Listing copy check passed.');
  if (options.checkCopyOnly) return;

  const devices = options.devices ? DEVICES.filter((device) => options.devices.includes(device.id)) : DEVICES;
  if (devices.length === 0) throw new Error(`No device matches --devices. Known: ${DEVICES.map((device) => device.id).join(', ')}`);

  const { chromium } = await import('playwright');
  const server = options.baseUrl ? { baseUrl: options.baseUrl, stop: () => {} } : await startPreview();
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    console.log(`Seeding demo data at ${server.baseUrl}…`);
    const { storageState, workoutPath } = await seedDemoData(browser, server.baseUrl, options.theme);
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    const problems = [];
    for (const device of devices) {
      console.log(`${device.store}: ${device.label}, ${device.width * device.scale}×${device.height * device.scale}`);
      problems.push(...(await captureDevice(browser, device, { baseUrl: server.baseUrl, storageState, workoutPath, theme: options.theme })));
    }
    if (problems.length > 0) {
      for (const problem of problems) console.error(`  error: ${problem}`);
      process.exitCode = 1;
    } else {
      console.log(`Wrote ${devices.length * SCREENS.length} screenshots to ${path.relative(ROOT, OUTPUT_DIR)}/`);
    }
  } finally {
    await browser.close();
    server.stop();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
