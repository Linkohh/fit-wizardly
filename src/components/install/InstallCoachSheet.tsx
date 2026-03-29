import { ArrowDownToLine, Chrome, Globe2, Share2, Sparkles, X } from 'lucide-react';
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
import { useInstallCoach } from '@/hooks/use-install-coach';
import { cn } from '@/lib/utils';

function InstallCoachChooser({
  canNativeInstall,
  onInstallShortcut,
  onStayInBrowser,
}: {
  canNativeInstall: boolean;
  onInstallShortcut: () => void;
  onStayInBrowser: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md dark:bg-white/5">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-28 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.22)_0%,rgba(168,85,247,0.1)_48%,transparent_72%)] blur-2xl" />
        <div className="relative space-y-3">
          <Button
            type="button"
            variant="ghost"
            className="group h-auto w-full justify-start rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 text-left hover:border-white/20 hover:bg-white/10"
            onClick={onStayInBrowser}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-foreground shadow-[0_16px_30px_rgba(6,8,20,0.22)]">
                <Globe2 className="h-5 w-5" />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block text-sm font-semibold text-foreground">
                  {t('install_coach.chooser.browser_title', 'Stay in Browser')}
                </span>
                <span className="block text-sm leading-5 text-muted-foreground">
                  {t(
                    'install_coach.chooser.browser_detail',
                    'Keep moving in Safari or Chrome today and come back to the shortcut later from the menu.',
                  )}
                </span>
              </span>
            </div>
          </Button>

          <Button
            type="button"
            className="group h-auto w-full justify-start rounded-[1.4rem] border border-primary/25 bg-gradient-to-r from-primary via-fuchsia-500 to-pink-500 px-4 py-4 text-left text-primary-foreground shadow-[0_22px_45px_rgba(192,76,255,0.28)] transition-transform duration-300 hover:-translate-y-0.5"
            onClick={onInstallShortcut}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/15 text-primary-foreground shadow-[0_18px_34px_rgba(84,18,112,0.28)]">
                {canNativeInstall ? (
                  <ArrowDownToLine className="h-5 w-5" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block text-sm font-semibold text-primary-foreground">
                  {t('install_coach.chooser.install_title', 'Install Shortcut')}
                </span>
                <span className="block text-sm leading-5 text-primary-foreground/85">
                  {canNativeInstall
                    ? t(
                        'install_coach.chooser.install_detail_android',
                        'Install FitWizard like an app from this browser for a cleaner, one-tap launch.',
                      )
                    : t(
                        'install_coach.chooser.install_detail_ios',
                        'Open the native share flow, then save FitWizard to your Home Screen for the app-style launch.',
                      )}
                </span>
              </span>
            </div>
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-muted-foreground">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {t('install_coach.chooser.note_title', 'Shortcut benefits')}
          </p>
          <p className="mt-1 leading-5">
            {t(
              'install_coach.chooser.note_detail',
              'The Home Screen shortcut opens faster, hides extra browser chrome, and keeps FitWizard closer to your workout flow.',
            )}
          </p>
        </div>
      </div>
    </>
  );
}

function InstallCoachNudge({
  detail,
  platformLabel,
  title,
  onBack,
  onComplete,
}: {
  detail: string;
  platformLabel: string;
  title: string;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md dark:bg-white/5">
        <div className="pointer-events-none absolute inset-x-5 top-4 h-24 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18)_0%,rgba(59,130,246,0.12)_48%,transparent_74%)] blur-2xl" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {platformLabel}
          </div>
          <div className="space-y-2">
            <h3 className="text-[1.25rem] font-black leading-tight tracking-[-0.03em] text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
          </div>
        </div>
      </div>

      <SheetFooter className="mt-5 flex-col gap-2 sm:flex-col sm:space-x-0">
        <Button
          type="button"
          className="w-full rounded-2xl bg-gradient-to-r from-primary via-fuchsia-500 to-pink-500 text-primary-foreground shadow-[0_18px_40px_rgba(192,76,255,0.34)] transition-transform duration-300 hover:-translate-y-0.5"
          onClick={onComplete}
        >
          {t('install_coach.primary_complete', 'I added it')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-2xl border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          onClick={onBack}
        >
          {t('install_coach.secondary_back', 'Back')}
        </Button>
      </SheetFooter>
    </>
  );
}

export function InstallCoachSheet() {
  const { t } = useTranslation();
  const {
    canNativeInstall,
    canShareShortcut,
    dismissCoach,
    isEligible,
    isOpen,
    markInstalled,
    platform,
    promptNativeInstall,
    promptShareShortcut,
    showChooser,
    showNudge,
    view,
  } = useInstallCoach();

  const isIosSafari = platform === 'ios-safari';
  const isIosChrome = platform === 'ios-chrome';
  const isAndroid = platform === 'android-chrome';

  const eyebrow = isIosSafari
    ? t('install_coach.eyebrow_safari', 'Safari Web App')
    : isIosChrome
      ? t('install_coach.eyebrow_chrome', 'Chrome Shortcut')
      : t('install_coach.eyebrow_android', 'Install FitWizard');

  const nudgeTitle = isIosSafari
    ? t('install_coach.safari.nudge.title', 'Finish in Safari')
    : isIosChrome
      ? t('install_coach.chrome.nudge.title', 'Finish in Chrome')
      : t('install_coach.android.nudge.title', 'Finish in your browser');

  const nudgeDetail = isIosSafari
    ? t(
        'install_coach.safari.nudge.detail',
        'In Safari, choose Add to Home Screen, keep Open as Web App on, then tap Add.',
      )
    : isIosChrome
      ? t(
          'install_coach.chrome.nudge.detail',
          "In Chrome, open the share menu, choose Add to Home Screen, then confirm the FitWizard icon.",
        )
      : t(
          'install_coach.android.nudge.detail',
          'Open the browser menu and choose Install app or Add to Home screen to finish saving FitWizard.',
        );

  const handleInstallShortcut = async () => {
    if (isAndroid && canNativeInstall) {
      await promptNativeInstall();
      return;
    }

    if (canShareShortcut) {
      await promptShareShortcut();
    }

    showNudge();
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
          'install-coach-sheet inset-x-0 mx-auto flex w-full max-w-[40rem] flex-col gap-0 overflow-hidden rounded-t-[2rem] border border-white/10 px-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-0 shadow-[0_-30px_80px_rgba(7,2,20,0.65)]',
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
                  {view === 'chooser'
                    ? t('install_coach.chooser.title', 'How do you want to open FitWizard?')
                    : nudgeTitle}
                </SheetTitle>
                <SheetDescription className="max-w-[32rem] text-left text-sm leading-6 text-muted-foreground">
                  {view === 'chooser'
                    ? t(
                        'install_coach.chooser.description',
                        'Choose the smoother long-term launch path now, or keep moving in the browser and decide later.',
                      )
                    : nudgeDetail}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {view === 'chooser' ? (
            <InstallCoachChooser
              canNativeInstall={canNativeInstall}
              onInstallShortcut={() => {
                void handleInstallShortcut();
              }}
              onStayInBrowser={dismissCoach}
            />
          ) : (
            <InstallCoachNudge
              detail={nudgeDetail}
              platformLabel={eyebrow}
              title={nudgeTitle}
              onBack={showChooser}
              onComplete={markInstalled}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
