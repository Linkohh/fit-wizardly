import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientDetails from './ClientDetails';
import type { Client } from '@/types/fitness';

vi.mock('@/components/trainer/AssignPlanDialog', () => ({
  AssignPlanDialog: () => <div data-testid="assign-plan-dialog" />,
}));

vi.mock('@/components/trainer/ClientProgress', () => ({
  ClientProgress: () => <div data-testid="client-progress" />,
}));

vi.mock('@/components/trainer/ClientMessages', () => ({
  ClientMessages: () => <div data-testid="client-messages" />,
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: () => ({
    getClient: () =>
      ({
        id: 'client-1',
        displayName: 'Private Client',
        notes: 'Hypertrophy',
        createdAt: new Date('2026-04-11T12:00:00.000Z'),
      }) as Client,
    deleteClient: vi.fn(),
    getClientAssignments: () => [],
    getTemplate: () => null,
    unassignPlan: vi.fn(),
  }),
}));

describe('ClientDetails', () => {
  it('does not render a remote avatar image', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/clients/client-1']}>
        <Routes>
          <Route path="/clients/:clientId" element={<ClientDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Private Client')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toContain('dicebear');
  });
});
