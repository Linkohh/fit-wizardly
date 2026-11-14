import { describe, expect, it } from 'vitest';
import { parseInitialChunks } from './bundle-report.mjs';

describe('parseInitialChunks', () => {
  it('returns script, modulepreload and stylesheet asset paths in order', () => {
    const html = `<script type="module" src="/assets/index-a.js"></script>
      <link rel="modulepreload" href="/assets/vendor-react-b.js">
      <link rel="stylesheet" href="/assets/index-c.css">`;
    expect(parseInitialChunks(html)).toEqual([
      '/assets/index-a.js',
      '/assets/vendor-react-b.js',
      '/assets/index-c.css',
    ]);
  });

  it('ignores non-asset links', () => {
    expect(parseInitialChunks('<link rel="icon" href="/favicon.ico">')).toEqual([]);
  });
});
