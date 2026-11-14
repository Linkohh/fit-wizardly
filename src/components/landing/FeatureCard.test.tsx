import { fireEvent, render, screen } from '@testing-library/react';
import { Dumbbell } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HOVER_QUIPS } from '@/data/hoverQuips';
import { FeatureCard } from './FeatureCard';

const feature = {
    key: 'equipment',
    icon: Dumbbell,
    title: 'Equipment Matching',
    description: 'Plans tailored to your available equipment',
    gradient: 'from-blue-500 to-cyan-500',
    variant: 'achievement' as const,
};

describe('FeatureCard tooltip', () => {
    it('renders the icon tooltip outside the card so the card cannot clip it', async () => {
        const { container } = render(
            <TooltipProvider delayDuration={0}>
                <FeatureCard feature={feature} onClick={vi.fn()} />
            </TooltipProvider>
        );
        const card = container.querySelector('.overflow-hidden');
        const iconTrigger = container.querySelector('.mx-auto');
        expect(card).not.toBeNull();
        expect(iconTrigger).not.toBeNull();

        fireEvent.pointerMove(iconTrigger as Element);

        const tooltip = await screen.findByRole('tooltip');
        expect(card?.contains(tooltip)).toBe(false);
    });

    it('shows a motivational quip instead of repeating the card description', async () => {
        const { container } = render(
            <TooltipProvider delayDuration={0}>
                <FeatureCard feature={feature} onClick={vi.fn()} />
            </TooltipProvider>
        );

        fireEvent.pointerMove(container.querySelector('.mx-auto') as Element);

        const tooltip = await screen.findByRole('tooltip');
        expect(HOVER_QUIPS).toContain(tooltip.textContent);
        expect(tooltip).not.toHaveTextContent(feature.description);
    });
});
