#!/usr/bin/env node
/**
 * Reports the chunks the browser must download before the app can start:
 * everything referenced by dist/index.html, with raw and gzip sizes.
 *
 * Usage: npm run build && npm run bundle:report
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ASSET_REFERENCE = /(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g;

/**
 * @param {string} indexHtml
 * @returns {string[]} /assets/*.js and /assets/*.css paths, deduplicated, in document order
 */
export function parseInitialChunks(indexHtml) {
  const seen = new Set();
  for (const match of indexHtml.matchAll(ASSET_REFERENCE)) {
    seen.add(match[1]);
  }
  return [...seen];
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexPath = path.join(distDir, 'index.html');

  if (!existsSync(indexPath)) {
    console.error('dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
  }

  const chunks = parseInitialChunks(readFileSync(indexPath, 'utf8'));
  let totalRaw = 0;
  let totalGzip = 0;

  console.log('Initial chunks (referenced by dist/index.html):');
  for (const chunk of chunks) {
    const filePath = path.join(distDir, chunk);
    if (!existsSync(filePath)) {
      console.log(`  ${chunk}  (missing on disk)`);
      continue;
    }
    const contents = readFileSync(filePath);
    const gzip = gzipSync(contents).length;
    totalRaw += contents.length;
    totalGzip += gzip;
    console.log(`  ${chunk}  ${formatKb(contents.length)} raw / ${formatKb(gzip)} gzip`);
  }

  console.log(`Total: ${chunks.length} files, ${formatKb(totalRaw)} raw / ${formatKb(totalGzip)} gzip`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
