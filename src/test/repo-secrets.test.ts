import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n');

describe('ngrok config hygiene', () => {
  it('does not track ngrok.yml (local config holds a real authtoken)', () => {
    expect(tracked).not.toContain('ngrok.yml');
  });

  it('ignores ngrok.yml in .gitignore', () => {
    const ignored = execSync('git check-ignore -q --no-index ngrok.yml; echo $?', {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    expect(ignored).toBe('0');
  });

  it('ships ngrok.example.yml with a placeholder token only', () => {
    const example = path.join(root, 'ngrok.example.yml');
    expect(existsSync(example)).toBe(true);
    const token = /^\s*authtoken:\s*(\S+)/m.exec(readFileSync(example, 'utf8'))?.[1];
    expect(token).toBe('YOUR_NGROK_AUTH_TOKEN');
  });
});
