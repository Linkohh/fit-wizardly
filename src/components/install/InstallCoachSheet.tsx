import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ChevronDown, ChevronUp, Share2, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useInstallCoach } from '@/hooks/use-install-coach';
import type { InstallCoachPlatform } from '@/lib/install-coach';
import { cn } from '@/lib/utils';

type InstallCoachContent = {
  body: string;
  eyebrow: string;
  helpLabel: string;
  helper: string;
  primaryAction: string;
  steps: string[];
  title: string;
};

function InstallCoachHelp({ steps }: { steps: string[] }) {
  return (
    <div className="mt-4 rounded-[1.5rem] border border-primary/15 bg-primary/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/12 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="text-sm leading-6 text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function getInstallCoachContent(
  platform: InstallCoachPlatform,
  canNativeInstall: boolean,
  t: (key: string, fallback?: string) => string,
): InstallCoachContent {
  if (platform === 'ios-safari') {
    return {
      eyebrow: t('install_coach.eyebrow_safari', 'Safari Web App'),
      title: t('install_coach.safari.handoff.title', 'Add FitWizard to your Home Screen'),
      body: t(
        'install_coach.safari.handoff.description',
        'Launch faster, keep the workout flow cleaner, and open FitWizard with less browser chrome.',
      ),
      primaryAction: t('install_coach.safari.handoff.primary', 'Open Safari Share'),
      helper: t(
        'install_coach.safari.handoff.helper',
        'Then choose Add to Home Screen in Safari.',
      ),
      helpLabel: t('install_coach.help_label', 'Need the steps?'),
      steps: [
        t(
          'install_coach.safari.steps.view_more',
          'Tap View More if Add to Home Screen is not visible.',
        ),
        t('install_coach.safari.steps.add_home', 'Choose Add to Home Screen.'),
        t(
          'install_coach.safari.steps.open_as_app',
          'Keep Open as Web App on, then tap Add.',
        ),
      ],
    };
  }

  if (platform === 'ios-chrome') {
    return {
      eyebrow: t('install_coach.eyebrow_chrome', 'Chrome Shortcut'),
      title: t('install_coach.chrome.handoff.title', 'Add FitWizard to your Home Screen'),
      body: t(
        'install_coach.chrome.handoff.description',
        'Keep FitWizard one tap away without leaving the iPhone browser flow you already use.',
      ),
      primaryAction: t('install_coach.chrome.handoff.primary', 'Open Share Menu'),
      helper: t(
        'install_coach.chrome.handoff.helper',
        'Then choose Add to Home Screen.',
      ),
      helpLabel: t('install_coach.help_label', 'Need the steps?'),
      steps: [
        t('install_coach.chrome.steps.open_menu', 'Open the share menu.'),
        t('install_coach.chrome.steps.choose_add', 'Choose Add to Home Screen.'),
        t(
          'install_coach.chrome.steps.confirm',
          'Confirm the FitWizard icon.',
        ),
      ],
    };
  }

  return {
    eyebrow: t('install_coach.eyebrow_android', 'Install FitWizard'),
    title: t('install_coach.android.handoff.title', 'Install FitWizard like an app'),
    body: t(
      'install_coach.android.handoff.description',
      'Save FitWizard to your Home Screen for a faster launch and a cleaner workout flow.',
    ),
    primaryAction: canNativeInstall
      ? t('install_coach.android.handoff.primary', 'Install FitWizard')
      : t('install_coach.android.handoff.primary_fallback', 'Show install steps'),
    helper: canNativeInstall
      ? t(
          'install_coach.android.handoff.helper',
          'Approve the install prompt from your browser.',
        )
      : t(
          'install_coach.android.handoff.helper_fallback',
          'If the prompt does not appear, use the browser menu instead.',
        ),
    helpLabel: t('install_coach.help_label', 'Need the steps?'),
    steps: [
      t('install_coach.android.steps.menu', 'Open the browser menu.'),
      t(
        'install_coach.android.steps.choose_add',
        'Choose Install app or Add to Home screen.',
      ),
      t('install_coach.android.steps.confirm', 'Confirm the install.'),
    ],
  };
}

type InstallCoachSheetProps = {
  enableAutoPrompt?: boolean;
};

export function InstallCoachSheet({ enableAutoPrompt = true }: InstallCoachSheetProps) {
  const { t } = useTranslation();
  const {
    canNativeInstall,
    canShareShortcut,
    closeCoach,
    dismissCoach,
    isEligible,
    isOpen,
    openCoach,
    platform,
    promptNativeInstall,
    promptShareShortcut,
  } = useInstallCoach({ enableAutoPrompt });
  const [showHelp, setShowHelp] = useState(false);

  const isIos = platform === 'ios-safari' || platform === 'ios-chrome';
  const isAndroid = platform === 'android-chrome';
  const content = useMemo(
    () => getInstallCoachContent(platform, canNativeInstall, t),
    [canNativeInstall, platform, t],
  );

  useEffect(() => {
    if (!isOpen) {
      setShowHelp(false);
    }
  }, [isOpen]);

  const handlePrimaryAction = async () => {
    if (isAndroid) {
      if (canNativeInstall) {
        await promptNativeInstall();
        return;
      }

      setShowHelp(true);
      return;
    }

    if (!canShareShortcut) {
      setShowHelp(true);
      return;
    }

    closeCoach();
    const shareResult = await promptShareShortcut();

    if (shareResult === 'unsupported' || shareResult === 'error') {
      openCoach();
      setShowHelp(true);
    }
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
        showCloseButton={false}
        className={cn(
          'install-coach-sheet inset-x-0 mx-auto flex w-full max-w-[38rem] flex-col gap-0 overflow-hidden rounded-t-[2rem] border border-white/10 px-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-0 shadow-[0_-30px_80px_rgba(7,2,20,0.65)]',
          '[@media(max-height:760px)]:max-w-[36rem] [@media(max-height:760px)]:rounded-t-[1.75rem] [@media(max-height:760px)]:pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]',
          'bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.24),transparent_32%),linear-gradient(180deg,rgba(30,12,53,0.98)_0%,rgba(14,8,30,0.98)_48%,rgba(7,10,26,0.98)_100%)]',
          'dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.22),transparent_34%),linear-gradient(180deg,rgba(30,12,53,0.98)_0%,rgba(14,8,30,0.98)_48%,rgba(7,10,26,0.98)_100%)]',
          'border-primary/20 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,240,255,0.96)_42%,rgba(235,245,255,0.98)_100%)]',
        )}
        enableBlur
      >
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/20 dark:bg-white/20 [@media(max-height:760px)]:mt-2" />

        <div className="px-5 pb-2 pt-5 sm:px-6 [@media(max-height:760px)]:px-4 [@media(max-height:760px)]:pt-4">
          <SheetHeader className="space-y-0 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {content.eyebrow}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                onClick={dismissCoach}
                aria-label={t('install_coach.close', 'Close add to Home Screen prompt')}
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>

            <div className="mt-4 flex items-start gap-4 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/10 bg-white/10 shadow-[0_18px_45px_rgba(180,60,255,0.25)] backdrop-blur">
                <img
                  src="/app-icon-192.png"
                  alt={t('install_coach.app_icon_alt', 'FitWizard app icon')}
                  className="h-11 w-11 rounded-[0.9rem] object-cover"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <SheetTitle className="text-left text-[1.7rem] font-black leading-[1.02] tracking-[-0.04em] text-foreground [@media(max-height:760px)]:text-[1.5rem]">
                  {content.title}
                </SheetTitle>
                <SheetDescription className="max-w-[32rem] text-left text-sm leading-6 text-muted-foreground [@media(max-height:760px)]:text-[13px] [@media(max-height:760px)]:leading-5">
                  {content.body}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-3 [@media(max-height:760px)]:mt-5 [@media(max-height:760px)]:space-y-2.5">
            <Button
              type="button"
              className="h-auto w-full justify-start rounded-[1.5rem] border border-primary/25 bg-gradient-to-r from-primary via-fuchsia-500 to-pink-500 px-4 py-4 text-left text-primary-foreground shadow-[0_22px_45px_rgba(192,76,255,0.28)] transition-transform duration-300 hover:-translate-y-0.5 [@media(max-height:760px)]:rounded-[1.35rem] [@media(max-height:760px)]:py-3.5"
              onClick={() => {
                void handlePrimaryAction();
              }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/15 text-primary-foreground shadow-[0_18px_34px_rgba(84,18,112,0.28)]">
                  {isAndroid && canNativeInstall ? (
                    <ArrowDownToLine className="h-5 w-5" />
                  ) : (
                    <Share2 className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-semibold text-primary-foreground [@media(max-height:760px)]:text-[0.92rem]">
                    {content.primaryAction}
                  </span>
                  <span className="block text-sm leading-5 text-primary-foreground/85 [@media(max-height:760px)]:text-[0.84rem] [@media(max-height:760px)]:leading-4.5">
                    {content.helper}
                  </span>
                </span>
              </div>
            </Button>

            <div className="flex items-center justify-between gap-3 border-t border-primary/10 pt-3 dark:border-white/8 [@media(max-height:760px)]:pt-2.5">
              <Button
                type="button"
                variant="ghost"
                className="h-auto rounded-full px-1 text-sm font-medium text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                onClick={dismissCoach}
              >
                {t('install_coach.dismiss', 'Not now')}
              </Button>

              {isIos || !canNativeInstall ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto rounded-full px-1 text-sm font-medium text-primary/85 hover:bg-transparent hover:text-primary"
                  onClick={() => setShowHelp((current) => !current)}
                >
                  {content.helpLabel}
                  {showHelp ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
              ) : null}
            </div>
          </div>

          {showHelp ? <InstallCoachHelp steps={content.steps} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
