import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClientCard } from './ClientCard';
import type { Client } from '@/types/fitness';

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: () => ({
    deleteClient: vi.fn(),
  }),
}));

describe('ClientCard', () => {
  it('does not render a remote avatar image', () => {
    const client = {
      id: 'client-1',
      displayName: 'Private Client',
      notes: 'Sensitive notes',
      createdAt: new Date('2026-04-11T12:00:00.000Z'),
    } as Client;

    const { container } = render(<ClientCard client={client} />);

    expect(screen.getByText('Private Client')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toContain('dicebear');
  });
});
