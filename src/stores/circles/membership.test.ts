import { describe, expect, it } from 'vitest';
import { getMemberDisplayName } from './membership';

describe('getMemberDisplayName', () => {
  it('prefers explicit profile metadata over email local-parts', () => {
    expect(
      getMemberDisplayName({
        email: 'trainer@example.com',
        user_metadata: { display_name: 'Coach Ada' },
      } as never),
    ).toBe('Coach Ada');
  });

  it('falls back to a generic label when no public name exists', () => {
    expect(
      getMemberDisplayName({
        email: 'trainer@example.com',
        user_metadata: {},
      } as never),
    ).toBe('A new member');
  });
});
