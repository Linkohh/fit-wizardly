import { beforeEach, describe, expect, it } from 'vitest';
import { useWisdomStore } from '@/stores/wisdomStore';

describe('wisdomStore persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWisdomStore.setState({
      conversationHistory: [],
      isLoading: false,
      learningProgress: {
        topicsExplored: [],
        questionsAsked: 0,
        conceptsUnderstood: [],
        learningLevel: 'novice',
      },
      currentContext: {
        planId: null,
        exerciseId: null,
        weekNumber: 1,
        phase: undefined,
      },
      isOpen: false,
    });
  });

  it('does not persist conversation history or context to browser storage', () => {
    useWisdomStore.getState().addMessage({
      id: 'message-1',
      role: 'user',
      content: 'How much volume should I do?',
      timestamp: new Date('2026-04-11T12:00:00.000Z'),
    });

    useWisdomStore.getState().setContext({ planId: 'plan-1', exerciseId: 'exercise-1' });

    expect(window.localStorage.getItem('fitwizard-wisdom')).toBeNull();
  });
});
