import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMuscleSelection } from './useMuscleSelection';

describe('useMuscleSelection', () => {
    describe('basic selection', () => {
        it('should initialize with empty selection', () => {
            const { result } = renderHook(() => useMuscleSelection());

            expect(result.current.selectedIds).toEqual([]);
            expect(result.current.selectedMuscles).toEqual([]);
        });

        it('should initialize with provided selection', () => {
            const { result } = renderHook(() =>
                useMuscleSelection({ initialSelection: ['biceps-left', 'triceps-left'] })
            );

            expect(result.current.selectedIds).toEqual(['biceps-left', 'triceps-left']);
        });

        it('should toggle muscle selection', () => {
            const { result } = renderHook(() => useMuscleSelection());

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            expect(result.current.selectedIds).toContain('biceps-left');

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            expect(result.current.selectedIds).not.toContain('biceps-left');
        });

        it('should select muscle without toggling', () => {
            const { result } = renderHook(() => useMuscleSelection());

            act(() => {
                result.current.selectMuscle('biceps-left');
            });

            expect(result.current.selectedIds).toContain('biceps-left');

            // Selecting again should not duplicate
            act(() => {
                result.current.selectMuscle('biceps-left');
            });

            expect(result.current.selectedIds.filter(id => id === 'biceps-left')).toHaveLength(1);
        });

        it('should deselect specific muscle', () => {
            const { result } = renderHook(() =>
                useMuscleSelection({ initialSelection: ['biceps-left', 'triceps-left'] })
            );

            act(() => {
                result.current.deselectMuscle('biceps-left');
            });

            expect(result.current.selectedIds).not.toContain('biceps-left');
            expect(result.current.selectedIds).toContain('triceps-left');
        });

        it('should clear all selections', () => {
            const { result } = renderHook(() =>
                useMuscleSelection({ initialSelection: ['biceps-left', 'triceps-left'] })
            );

            act(() => {
                result.current.clearSelection();
            });

            expect(result.current.selectedIds).toEqual([]);
        });

        it('should set selection replacing existing', () => {
            const { result } = renderHook(() =>
                useMuscleSelection({ initialSelection: ['biceps-left'] })
            );

            act(() => {
                result.current.setSelection(['triceps-left', 'pectoralis-major-left']);
            });

            expect(result.current.selectedIds).toEqual(['triceps-left', 'pectoralis-major-left']);
        });
    });

    describe('single select mode', () => {
        it('should only keep one muscle selected in single select mode', () => {
            const { result } = renderHook(() =>
                useMuscleSelection({ multiSelect: false })
            );

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            expect(result.current.selectedIds).toEqual(['biceps-left']);

            act(() => {
                result.current.toggleMuscle('triceps-left');
            });

            expect(result.current.selectedIds).toEqual(['triceps-left']);
            expect(result.current.selectedIds).not.toContain('biceps-left');
        });
    });

    describe('undo/redo functionality', () => {
        it('should start with undo/redo disabled', () => {
            const { result } = renderHook(() => useMuscleSelection());

            expect(result.current.canUndo).toBe(false);
            expect(result.current.canRedo).toBe(false);
        });

        it('should enable undo after selection', () => {
            const { result } = renderHook(() => useMuscleSelection());

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
        });

        it('should undo selection', () => {
            const { result } = renderHook(() => useMuscleSelection());

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            expect(result.current.selectedIds).toContain('biceps-left');

            act(() => {
                result.current.undo();
            });

            expect(result.current.selectedIds).not.toContain('biceps-left');
            expect(result.current.canUndo).toBe(false);
            expect(result.current.canRedo).toBe(true);
        });

        it('should redo undone selection', () => {
            const { result } = renderHook(() => useMuscleSelection());

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            act(() => {
                result.current.undo();
            });

            act(() => {
                result.current.redo();
            });

            expect(result.current.selectedIds).toContain('biceps-left');
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
        });

        it('should clear redo history on new selection', () => {
            const { result } = renderHook(() => useMuscleSelection());

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            act(() => {
                result.current.undo();
            });

            expect(result.current.canRedo).toBe(true);

            act(() => {
                result.current.toggleMuscle('triceps-left');
            });

            expect(result.current.canRedo).toBe(false);
        });
    });

    describe('onChange callback', () => {
        it('should call onChange when selection changes', () => {
            const onChange = vi.fn();
            const { result } = renderHook(() =>
                useMuscleSelection({ onChange })
            );

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            expect(onChange).toHaveBeenCalledWith(['biceps-left']);
        });

        it('should call onChange on undo', () => {
            const onChange = vi.fn();
            const { result } = renderHook(() =>
                useMuscleSelection({ onChange })
            );

            act(() => {
                result.current.toggleMuscle('biceps-left');
            });

            onChange.mockClear();

            act(() => {
                result.current.undo();
            });

            expect(onChange).toHaveBeenCalledWith([]);
        });
    });

    describe('isSelected helper', () => {
        it('should correctly identify selected muscles', () => {
            const { result } = renderHook(() =>
                useMuscleSelection({ initialSelection: ['biceps-left'] })
            );

            expect(result.current.isSelected('biceps-left')).toBe(true);
            expect(result.current.isSelected('triceps-left')).toBe(false);
        });
    });
});
