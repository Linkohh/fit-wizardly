import { useMemo } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Chrome,
  PlusSquare,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useInstallCoach } from '@/hooks/use-install-coach';

type InstallStep = {
  accent: string;
  icon: typeof Share2;
  title: string;
  detail: string;
};

export function InstallCoachSheet() {
  const { t } = useTranslation();
  const {
    canNativeInstall,
    dismissCoach,
    isEligible,
    isOpen,
    markInstalled,
    platform,
    promptNativeInstall,
  } = useInstallCoach();

  const isIosSafari = platform === 'ios-safari';
  const isIosChrome = platform === 'ios-chrome';
  const isAndroid = platform === 'android-chrome';

  const eyebrow = isIosSafari
    ? t('install_coach.eyebrow_safari', 'Safari Web App')
    : isIosChrome
      ? t('install_coach.eyebrow_chrome', 'Chrome Shortcut')
      : t('install_coach.eyebrow_android', 'Install FitWizard');

  const steps = useMemo<InstallStep[]>(() => {
    if (isIosChrome) {
      return [
        {
          accent: 'from-fuchsia-500/30 via-pink-500/10 to-transparent',
          icon: Chrome,
          title: t('install_coach.chrome.steps.open_menu.title', 'Open Chrome’s share menu'),
          detail: t(
            'install_coach.chrome.steps.open_menu.detail',
            'Tap the share control in Chrome, then open the browser options for this page.',
          ),
        },
        {
          accent: 'from-violet-500/30 via-cyan-500/10 to-transparent',
          icon: PlusSquare,
          title: t('install_coach.chrome.steps.choose_add.title', 'Pick Add to Home Screen'),
          detail: t(
            'install_coach.chrome.steps.choose_add.detail',
            'Scroll through the action list until you see Add to Home Screen, then select it.',
          ),
        },
        {
          accent: 'from-cyan-500/30 via-emerald-500/10 to-transparent',
          icon: CheckCircle2,
          title: t('install_coach.chrome.steps.confirm.title', 'Confirm the FitWizard icon'),
          detail: t(
            'install_coach.chrome.steps.confirm.detail',
            'Keep the FitWizard title you want, then tap Add so it lands on your Home Screen.',
          ),
        },
      ];
    }

    if (isAndroid) {
      return [
        {
          accent: 'from-fuchsia-500/30 via-pink-500/10 to-transparent',
          icon: ArrowDownToLine,
          title: canNativeInstall
            ? t('install_coach.android.steps.native.title', 'Install FitWizard directly')
            : t('install_coach.android.steps.menu.title', 'Open the browser menu'),
          detail: canNativeInstall
            ? t(
                'install_coach.android.steps.native.detail',
                'Your browser can install FitWizard like an app. Tap the install button below to continue.',
              )
            : t(
                'install_coach.android.steps.menu.detail',
                'If the direct install prompt is unavailable, open the browser menu for this page.',
              ),
        },
        {
          accent: 'from-violet-500/30 via-cyan-500/10 to-transparent',
          icon: PlusSquare,
          title: t('install_coach.android.steps.choose_add.title', 'Choose Install app or Add to Home screen'),
          detail: t(
            'install_coach.android.steps.choose_add.detail',
            'Use the browser option that installs FitWizard or saves it to your Home Screen.',
          ),
        },
        {
          accent: 'from-cyan-500/30 via-emerald-500/10 to-transparent',
          icon: CheckCircle2,
          title: t('install_coach.android.steps.confirm.title', 'Confirm the install'),
          detail: t(
            'install_coach.android.steps.confirm.detail',
            'Approve the install and launch FitWizard from your Home Screen like a real app.',
          ),
        },
      ];
    }

    return [
      {
        accent: 'from-fuchsia-500/30 via-pink-500/10 to-transparent',
        icon: Share2,
        title: t('install_coach.safari.steps.share.title', 'Tap the Share button in Safari'),
        detail: t(
          'install_coach.safari.steps.share.detail',
          'Use Safari’s share control for this page so you can save FitWizard to your Home Screen.',
        ),
      },
      {
        accent: 'from-violet-500/30 via-cyan-500/10 to-transparent',
        icon: PlusSquare,
        title: t('install_coach.safari.steps.add_home.title', 'Choose Add to Home Screen'),
        detail: t(
          'install_coach.safari.steps.add_home.detail',
          'Scroll through the action list until Add to Home Screen appears, then select it.',
        ),
      },
      {
        accent: 'from-cyan-500/30 via-emerald-500/10 to-transparent',
        icon: CheckCircle2,
        title: t(
          'install_coach.safari.steps.open_as_app.title',
          'Keep Open as Web App enabled, then tap Add',
        ),
        detail: t(
          'install_coach.safari.steps.open_as_app.detail',
          'Leave the app-style toggle on so FitWizard launches as a full-screen web app from your Home Screen.',
        ),
      },
    ];
  }, [canNativeInstall, isAndroid, isIosChrome, t]);

  const handlePrimaryAction = async () => {
    if (isAndroid && canNativeInstall) {
      await promptNativeInstall();
      return;
    }

    markInstalled();
  };

  if (!isEligible) {
    return null;
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          dismissCoach();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className={cn(
          'install-coach-sheet inset-x-0 mx-auto flex w-full max-w-[42rem] flex-col gap-0 overflow-hidden rounded-t-[2rem] border border-white/10 px-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-0 shadow-[0_-30px_80px_rgba(7,2,20,0.65)]',
          'bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.24),transparent_34%),linear-gradient(180deg,rgba(30,12,53,0.98)_0%,rgba(14,8,30,0.98)_48%,rgba(7,10,26,0.98)_100%)]',
          'dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.22),transparent_34%),linear-gradient(180deg,rgba(30,12,53,0.98)_0%,rgba(14,8,30,0.98)_48%,rgba(7,10,26,0.98)_100%)]',
          'border-primary/20 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,240,255,0.96)_42%,rgba(235,245,255,0.98)_100%)]',
        )}
        enableBlur
      >
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/20 dark:bg-white/20" />

        <div className="px-5 pb-2 pt-5 sm:px-6">
          <SheetHeader className="space-y-0 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                onClick={dismissCoach}
                aria-label={t('install_coach.close', 'Close install guide')}
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>
            <div className="mt-4 flex items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/10 bg-white/10 shadow-[0_18px_45px_rgba(180,60,255,0.25)] backdrop-blur">
                <img
                  src="/app-icon-192.png"
                  alt={t('install_coach.app_icon_alt', 'FitWizard app icon')}
                  className="h-11 w-11 rounded-[0.9rem] object-cover"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <SheetTitle className="text-left text-[1.7rem] font-black leading-[1.02] tracking-[-0.04em] text-foreground">
                  {t('install_coach.title', 'Add FitWizard to your Home Screen')}
                </SheetTitle>
                <SheetDescription className="max-w-[32rem] text-left text-sm leading-6 text-muted-foreground">
                  {t(
                    'install_coach.description',
                    'Save FitWizard like a real app so it launches faster, feels cleaner, and stays one tap away from your training flow.',
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md dark:bg-white/5">
            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-background/70 px-3.5 py-3.5 shadow-[0_14px_35px_rgba(3,6,18,0.16)]"
                  >
                    <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-r opacity-70', step.accent)} />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/12 text-primary shadow-[0_10px_30px_rgba(168,85,247,0.2)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground/8 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {t('install_coach.step_badge', 'Step')} {index + 1}
                          </span>
                          {index === 2 && isIosSafari ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                              {t('install_coach.open_as_app_chip', 'Open as Web App')}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-5 text-foreground">{step.title}</p>
                        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {t('install_coach.helper_title', 'Quick note:')}
            </span>{' '}
            {t(
              'install_coach.helper_copy',
              'If you close this now, you can reopen the guide from the mobile menu on the home screen any time.',
            )}
          </div>

          <SheetFooter className="mt-5 flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              type="button"
              className="w-full rounded-2xl bg-gradient-to-r from-primary via-fuchsia-500 to-pink-500 text-primary-foreground shadow-[0_18px_40px_rgba(192,76,255,0.34)] transition-transform duration-300 hover:-translate-y-0.5"
              onClick={() => {
                void handlePrimaryAction();
              }}
            >
              {isAndroid && canNativeInstall
                ? t('install_coach.primary_install', 'Install FitWizard')
                : t('install_coach.primary_complete', 'I added it')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-2xl border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              onClick={dismissCoach}
            >
              {t('install_coach.secondary_dismiss', 'Maybe later')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
