import { describe, expect, it } from 'vitest';
import { getPairedIds, getSideLabel } from './pairedMuscles';

describe('getPairedIds', () => {
  it('returns [left, right] from either side', () => {
    expect(getPairedIds('biceps-left')).toEqual(['biceps-left', 'biceps-right']);
    expect(getPairedIds('biceps-right')).toEqual(['biceps-left', 'biceps-right']);
  });

  it('returns the id alone for unpaired muscles', () => {
    expect(getPairedIds('erector-spinae')).toEqual(['erector-spinae']);
  });

  it('returns the id alone when the partner does not exist', () => {
    expect(getPairedIds('nonexistent-left')).toEqual(['nonexistent-left']);
  });
});

describe('getSideLabel', () => {
  it('strips a trailing side suffix', () => {
    expect(getSideLabel('Biceps Brachii (Left)')).toBe('Biceps Brachii');
    expect(getSideLabel('Biceps Brachii (Right)')).toBe('Biceps Brachii');
  });

  it('leaves other names unchanged', () => {
    expect(getSideLabel('Erector Spinae')).toBe('Erector Spinae');
    expect(getSideLabel('Soleus (left)')).toBe('Soleus (left)');
    expect(getSideLabel('Soleus(Left)')).toBe('Soleus(Left)');
    expect(getSideLabel('Left (Left) thing')).toBe('Left (Left) thing');
  });
});
