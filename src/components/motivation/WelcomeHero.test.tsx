import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WelcomeHero } from './WelcomeHero';

type HeroTiltResult = {
  rotateX: number;
  rotateY: number;
  handlePointerMove: (event: unknown) => void;
  handlePointerLeave: () => void;
  handlePointerUp: () => void;
  handlePointerCancel: () => void;
  enableMotion: (options?: { userInitiated?: boolean }) => Promise<'granted' | 'denied' | 'unsupported'>;
  canEnableSensor: boolean;
  isTouchFallbackActive: boolean;
  isSensorActive: boolean;
  isEnablingMotion: boolean;
  sensorStatus: 'idle' | 'enabled' | 'denied' | 'unsupported' | 'error';
};

const mocks = vi.hoisted(() => ({
  shouldReduceMotion: false,
  motionTilt: true,
  motionTiltActivatedThisSession: false,
  nativeApp: false,
  isMobile: false,
  setMotionTiltActivatedThisSession: vi.fn(),
  handlePointerMove: vi.fn(),
  handlePointerLeave: vi.fn(),
  handlePointerUp: vi.fn(),
  handlePointerCancel: vi.fn(),
  enableMotion: vi.fn(async () => 'granted' as const),
  requestMotionTiltPermission: vi.fn(async () => ({
    available: true,
    permission: 'granted' as const,
    source: 'web' as const,
  })),
  wasMotionPermissionGranted: vi.fn(() => false),
  override: {} as Partial<HeroTiltResult>,
  lastUseHeroTiltArgs: null as unknown,
}));

const useHeroTiltMock = vi.hoisted(() =>
  vi.fn((args: unknown): HeroTiltResult => {
    mocks.lastUseHeroTiltArgs = args;

    return {
      rotateX: 0,
      rotateY: 0,
      handlePointerMove: mocks.handlePointerMove,
      handlePointerLeave: mocks.handlePointerLeave,
      handlePointerUp: mocks.handlePointerUp,
      handlePointerCancel: mocks.handlePointerCancel,
      enableMotion: mocks.enableMotion,
      canEnableSensor: false,
      isTouchFallbackActive: false,
      isSensorActive: false,
      isEnablingMotion: false,
      sensorStatus: 'idle',
      ...mocks.override,
    };
  })
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    shouldReduceMotion: mocks.shouldReduceMotion,
    prefersReducedMotion: mocks.shouldReduceMotion,
    reducedMotionEnabled: mocks.shouldReduceMotion,
  }),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: (selector: (state: {
    settings: { motionTilt?: boolean };
    motionTiltActivatedThisSession: boolean;
    setMotionTiltActivatedThisSession: (value: boolean) => void;
  }) => unknown) =>
    selector({
      settings: {
        motionTilt: mocks.motionTilt,
      },
      motionTiltActivatedThisSession: mocks.motionTiltActivatedThisSession,
      setMotionTiltActivatedThisSession: mocks.setMotionTiltActivatedThisSession,
    }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mocks.isMobile,
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.nativeApp,
}));

vi.mock('@/lib/motion-tilt', () => ({
  requestMotionTiltPermission: () => mocks.requestMotionTiltPermission(),
  wasMotionPermissionGranted: () => mocks.wasMotionPermissionGranted(),
}));

vi.mock('./InteractiveWord', () => ({
  InteractiveWord: ({ word }: { word: string }) => <span>{word}</span>,
}));

vi.mock('@/hooks/use-hero-tilt', () => ({
  useHeroTilt: (args: unknown) => useHeroTiltMock(args),
}));

function renderHero() {
  return render(
    <MemoryRouter>
      <WelcomeHero />
    </MemoryRouter>
  );
}

describe('WelcomeHero tilt integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.shouldReduceMotion = false;
    mocks.motionTilt = true;
    mocks.motionTiltActivatedThisSession = false;
    mocks.nativeApp = false;
    mocks.isMobile = false;
    mocks.override = {};
    mocks.lastUseHeroTiltArgs = null;
    mocks.wasMotionPermissionGranted.mockReturnValue(false);
  });

  it('keeps the hero static on mobile until the user opts in', async () => {
    mocks.isMobile = true;

    renderHero();

    expect(mocks.lastUseHeroTiltArgs).toMatchObject({
      isEnabled: false,
    });
    expect(mocks.enableMotion).not.toHaveBeenCalled();

    const optInButton = screen.getByRole('button', { name: /enable motion tilt/i });
    fireEvent.click(optInButton);

    await waitFor(() => {
      expect(mocks.requestMotionTiltPermission).toHaveBeenCalledTimes(1);
      expect(mocks.setMotionTiltActivatedThisSession).toHaveBeenCalledWith(true);
    });
  });

  it('does not show sensor CTA on desktop and still forwards pointer move', () => {
    const { container } = renderHero();

    expect(screen.queryByRole('button', { name: 'Enable Motion Tilt' })).not.toBeInTheDocument();

    const heroSection = container.querySelector('section');
    expect(heroSection).not.toBeNull();

    fireEvent.pointerMove(heroSection as HTMLElement, {
      pointerType: 'mouse',
      clientX: 240,
      clientY: 180,
    });

    expect(mocks.handlePointerMove).toHaveBeenCalledTimes(1);
  });

  it('disables tilt behavior when reduced motion is enabled', () => {
    mocks.shouldReduceMotion = true;

    renderHero();

    expect(mocks.lastUseHeroTiltArgs).toMatchObject({
      isEnabled: false,
    });
    expect(screen.queryByRole('button', { name: 'Enable Motion Tilt' })).not.toBeInTheDocument();
  });
});
