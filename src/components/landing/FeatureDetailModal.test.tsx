import { fireEvent, render, screen } from '@testing-library/react';
import { Dumbbell } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { FeatureDetailModal } from './FeatureDetailModal';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const feature = {
    key: 'equipment',
    icon: Dumbbell,
    title: 'Equipment Matching',
    description: 'Plans tailored to your available equipment',
    gradient: 'from-blue-500 to-cyan-500',
    variant: 'achievement' as const,
};

function renderModal(onClose = vi.fn()) {
    render(
        <MemoryRouter>
            <FeatureDetailModal feature={feature} isOpen onClose={onClose} />
        </MemoryRouter>
    );
    return onClose;
}

describe('FeatureDetailModal (desktop)', () => {
    it('offers exactly one Close control and keeps the main action', () => {
        renderModal();

        expect(screen.getAllByRole('button', { name: /close/i })).toHaveLength(1);
        expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument();
    });

    it('closes from the X', () => {
        const onClose = renderModal();
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes when Escape is pressed', () => {
        const onClose = renderModal();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ignores Escape while closed', () => {
        const onClose = vi.fn();
        render(
            <MemoryRouter>
                <FeatureDetailModal feature={feature} isOpen={false} onClose={onClose} />
            </MemoryRouter>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });
});
