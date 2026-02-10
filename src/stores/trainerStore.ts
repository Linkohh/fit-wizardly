import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Assignment, Template, Plan, Message } from '@/types/fitness';
import { useWizardStore } from '@/stores/wizardStore';

interface TrainerState {
  isTrainerMode: boolean;
  clients: Client[];
  selectedClientId: string | null;
  assignments: Assignment[];
  templates: Template[];
  messages: Message[];

  // Mode actions
  toggleTrainerMode: () => void;
  setTrainerMode: (enabled: boolean) => void;

  // Client actions
  addClient: (name: string, notes?: string) => Client;
  updateClient: (id: string, updates: Partial<Pick<Client, 'displayName' | 'notes'>>) => void;
  deleteClient: (id: string) => void;
  selectClient: (id: string | null) => void;
  getClient: (id: string) => Client | undefined;

  // Assignment actions
  assignPlan: (clientId: string, planId: string) => Assignment;
  unassignPlan: (assignmentId: string) => void;
  getClientAssignments: (clientId: string) => Assignment[];

  // Template actions
  saveAsTemplate: (name: string, plan: Plan, tags?: string[]) => Template;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;

  // Message actions
  sendMessage: (clientId: string, content: string, sender: 'trainer' | 'client') => Message;
  markMessagesAsRead: (clientId: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      isTrainerMode: false,
      clients: [],
      selectedClientId: null,
      assignments: [],
      templates: [],
      messages: [],

      toggleTrainerMode: () => set((state) => {
        const nextMode = !state.isTrainerMode;
        useWizardStore.getState().setIsTrainer(nextMode);
        return {
          isTrainerMode: nextMode,
          selectedClientId: null,
        };
      }),

      setTrainerMode: (enabled) => set((state) => {
        useWizardStore.getState().setIsTrainer(enabled);
        return {
          isTrainerMode: enabled,
          selectedClientId: enabled ? state.selectedClientId : null,
        };
      }),

      addClient: (displayName, notes) => {
        const client: Client = {
          id: generateId(),
          displayName,
          notes,
          createdAt: new Date(),
        };
        set((state) => ({ clients: [...state.clients, client] }));
        return client;
      },

      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map(c =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id),
        assignments: state.assignments.filter(a => a.clientId !== id),
        selectedClientId: state.selectedClientId === id ? null : state.selectedClientId,
      })),

      selectClient: (id) => set({ selectedClientId: id }),

      getClient: (id) => get().clients.find(c => c.id === id),

      assignPlan: (clientId, planId) => {
        const assignment: Assignment = {
          id: generateId(),
          clientId,
          planId,
          assignedAt: new Date(),
        };
        set((state) => ({ assignments: [...state.assignments, assignment] }));
        return assignment;
      },

      unassignPlan: (assignmentId) => set((state) => ({
        assignments: state.assignments.filter(a => a.id !== assignmentId),
      })),

      getClientAssignments: (clientId) =>
        get().assignments.filter(a => a.clientId === clientId),

      saveAsTemplate: (name, plan, tags = []) => {
        const template: Template = {
          id: generateId(),
          name,
          planSnapshot: plan,
          tags,
          createdAt: new Date(),
        };
        set((state) => ({ templates: [...state.templates, template] }));
        return template;
      },

      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
      })),

      getTemplate: (id) => get().templates.find(t => t.id === id),

      // Message actions
      sendMessage: (clientId, content, sender) => {
        const message: Message = {
          id: generateId(),
          clientId,
          content,
          sender,
          timestamp: new Date(),
          isRead: false,
        };
        set((state) => ({ messages: [...state.messages, message] }));
        return message;
      },

      markMessagesAsRead: (clientId) => set((state) => ({
        messages: state.messages.map(m =>
          m.clientId === clientId && !m.isRead ? { ...m, isRead: true } : m
        ),
      })),
    }),
    {
      name: 'fitwizard-trainer',
    }
  )
);
