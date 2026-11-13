import { afterEach, describe, expect, it, vi } from 'vitest';
import { devLog } from './devLog';

describe('devLog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not call console.log when DEV is false', () => {
    vi.stubEnv('DEV', false);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog('[Analytics] test');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('calls console.log when DEV is true', () => {
    vi.stubEnv('DEV', true);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog('[Analytics] test');
    expect(spy).toHaveBeenCalledWith('[Analytics] test');
    vi.unstubAllEnvs();
  });
});
