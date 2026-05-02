import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { useWizardStore } from '@/stores/wizardStore';
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
  }) as unknown as Plan;

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
    useWizardStore.getState().setIsTrainer(false);
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

  it('allows local accounts to enable trainer mode without authorization', () => {
    useTrainerStore.getState().setTrainerMode(true);

    expect(useTrainerStore.getState().isTrainerMode).toBe(true);
  });

  it('refuses to enable trainer mode for authenticated profiles without trainer authorization', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as import('@supabase/supabase-js').User,
      session: {} as import('@supabase/supabase-js').Session,
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
      user: { id: 'user-1' } as import('@supabase/supabase-js').User,
      session: {} as import('@supabase/supabase-js').Session,
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

  it('clears in-memory trainer session data', () => {
    const store = useTrainerStore.getState();
    const client = store.addClient('Private Client', 'Sensitive notes');

    store.setTrainerMode(true);
    store.selectClient(client.id);
    store.assignPlan(client.id, 'plan-1');
    store.saveAsTemplate('Private Template', buildPlan(), ['strength']);
    store.sendMessage(client.id, 'Secret message', 'trainer');
    useWizardStore.getState().setIsTrainer(true);

    store.clearTrainerSession();

    const state = useTrainerStore.getState();
    expect(state.isTrainerMode).toBe(false);
    expect(state.clients).toEqual([]);
    expect(state.selectedClientId).toBeNull();
    expect(state.assignments).toEqual([]);
    expect(state.templates).toEqual([]);
    expect(state.messages).toEqual([]);
    expect(useWizardStore.getState().selections.isTrainer).toBe(false);
  });
});
