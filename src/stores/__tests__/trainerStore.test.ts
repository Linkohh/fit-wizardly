import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { useTrainerStore } from '@/stores/trainerStore';
import type { Plan } from '@/types/fitness';

const buildPlan = (): Plan =>
  ({
    id: 'plan-1',
    splitType: 'upper_lower',
    selections: {
      daysPerWeek: 3,
      sessionDuration: 60,
      equipment: ['bodyweight'],
      targetMuscles: [],
      constraints: [],
      goal: 'hypertrophy',
      experienceLevel: 'intermediate',
    },
    workoutDays: [],
    weeklyVolume: [],
    rirProgression: [],
    notes: [],
  }) as Plan;

describe('trainerStore persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isConfigured: true,
      showAuthModal: false,
      redirectUrl: null,
    });
    useTrainerStore.setState({
      isTrainerMode: false,
      clients: [],
      selectedClientId: null,
      assignments: [],
      templates: [],
      messages: [],
    });
  });

  it('does not persist client, template, or message records', () => {
    const store = useTrainerStore.getState();

    store.addClient('Private Client', 'Sensitive notes');
    store.saveAsTemplate('Private Template', buildPlan(), ['strength']);
    store.sendMessage('client-1', 'Secret message', 'trainer');

    const persisted = JSON.parse(window.localStorage.getItem('fitwizard-trainer') ?? '{"state":{}}');

    expect(persisted.state.isTrainerMode).toBe(false);
    expect(persisted.state.clients).toBeUndefined();
    expect(persisted.state.templates).toBeUndefined();
    expect(persisted.state.messages).toBeUndefined();
  });

  it('refuses to enable trainer mode for profiles without trainer authorization', () => {
    useAuthStore.setState({
      profile: {
        id: 'user-1',
        display_name: 'Member',
        username: null,
        avatar_url: null,
        experience_level: null,
        primary_goal: null,
        timezone: 'America/New_York',
        created_at: null,
        role: 'client',
        is_trainer: false,
      },
    });

    useTrainerStore.getState().setTrainerMode(true);

    expect(useTrainerStore.getState().isTrainerMode).toBe(false);
  });

  it('allows verified trainer profiles to enable trainer mode', () => {
    useAuthStore.setState({
      profile: {
        id: 'user-1',
        display_name: 'Coach Nova',
        username: null,
        avatar_url: null,
        experience_level: null,
        primary_goal: null,
        timezone: 'America/New_York',
        created_at: null,
        role: 'trainer',
        is_trainer: true,
      },
    });

    useTrainerStore.getState().setTrainerMode(true);

    expect(useTrainerStore.getState().isTrainerMode).toBe(true);
  });
});
