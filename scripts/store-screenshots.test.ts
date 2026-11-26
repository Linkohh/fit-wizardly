import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkListing, countCharacters, DEVICES, jpegSize, parseListingBlocks } from './store-screenshots.mjs';

function block(id: string, max: number, text: string): string {
  return `<!-- listing:${id} max=${max} -->\n\`\`\`text\n${text}\n\`\`\`\n`;
}

describe('parseListingBlocks', () => {
  it('reads each marked text block with its limit, keeping inner newlines', () => {
    const markdown = `# Title\n\n${block('name', 30, 'FitWizard')}\nprose\n\n${block('description', 4000, 'Line one\n• Line two')}`;
    expect(parseListingBlocks(markdown)).toEqual([
      { id: 'name', max: 30, text: 'FitWizard' },
      { id: 'description', max: 4000, text: 'Line one\n• Line two' },
    ]);
  });

  it('ignores code blocks without a listing marker', () => {
    expect(parseListingBlocks('```text\nnot a field\n```')).toEqual([]);
  });
});

describe('checkListing', () => {
  it('passes copy within its limit', () => {
    expect(checkListing([{ id: 'name', max: 30, text: 'FitWizard' }])).toEqual({ errors: [], warnings: [] });
  });

  it('counts a bullet as one character, like the stores', () => {
    expect(countCharacters('• ab')).toBe(4);
    expect(checkListing([{ id: 'short', max: 4, text: '• ab' }]).errors).toEqual([]);
  });

  it('fails copy over its limit', () => {
    expect(checkListing([{ id: 'apple-subtitle', max: 5, text: 'Too long' }]).errors).toEqual([
      'apple-subtitle: 8 characters, limit 5',
    ]);
  });

  it.each([
    ['AI-powered plans', 'AI'],
    ['Train with your coach', 'coach'],
    ['Join a circle of lifters', 'circle'],
    ['Go premium for more', 'premium'],
    ['Helps treat back pain', 'treat'],
  ])('rejects banned wording: %s', (text, word) => {
    const { errors } = checkListing([{ id: 'description', max: 4000, text }]);
    expect(errors.some((error) => error.includes(`"${word}`))).toBe(true);
  });

  it('allows words that only contain a banned term, and the medical disclaimer', () => {
    const text = 'Maintain your training. Health & Fitness. This is not medical advice; talk to a doctor.';
    expect(checkListing([{ id: 'description', max: 4000, text }]).errors).toEqual([]);
  });

  it('warns about placeholders, and fails on them with strict', () => {
    const blocks = [{ id: 'support', max: 100, text: 'Email [support email: Lincoln to provide]' }];
    expect(checkListing(blocks).warnings).toHaveLength(1);
    expect(checkListing(blocks).errors).toEqual([]);
    expect(checkListing(blocks, { strict: true }).errors).toHaveLength(1);
  });

  it('fails when nothing is marked', () => {
    expect(checkListing([]).errors).toHaveLength(1);
  });
});

describe('docs/store/LISTING.md', () => {
  it('fits every character limit and avoids banned wording', () => {
    const markdown = readFileSync(path.resolve(__dirname, '../docs/store/LISTING.md'), 'utf8');
    const blocks = parseListingBlocks(markdown);
    expect(blocks.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['name', 'apple-subtitle', 'google-short', 'apple-keywords', 'description']),
    );
    expect(checkListing(blocks).errors).toEqual([]);
  });
});

describe('jpegSize', () => {
  it('reads the size from a baseline SOF0 marker', () => {
    // SOI, then an APP0 segment (length 4), then SOF0: length 17, precision 8, height 2868, width 1320.
    const bytes = Buffer.from([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x0b, 0x34, 0x05, 0x28, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    ]);
    expect(jpegSize(bytes)).toEqual({ width: 1320, height: 2868 });
  });

  it('returns null for data that is not a JPEG', () => {
    expect(jpegSize(Buffer.from('not a jpeg at all'))).toBeNull();
  });
});

describe('DEVICES', () => {
  it('produce the pixel sizes the stores ask for', () => {
    const sizes = Object.fromEntries(DEVICES.map((device) => [device.id, `${device.width * device.scale}x${device.height * device.scale}`]));
    expect(sizes).toEqual({
      'apple-6.9': '1320x2868',
      'apple-6.5': '1284x2778',
      'apple-6.1': '1206x2622',
      'google-phone': '1080x1920',
    });
  });
});
