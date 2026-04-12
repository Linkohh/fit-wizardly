import { useEffect, useState } from 'react';
import { BarChart3, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  CONSENT_REQUEST_EVENT,
  CONSENT_RESOLVED_EVENT,
  CONSENT_STORAGE_KEY,
  NUTRITION_LOOKUP_CONSENT_STORAGE_KEY,
} from '@/lib/consent';

export function ConsentModal() {
  const [open, setOpen] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [nutritionLookupOptIn, setNutritionLookupOptIn] = useState(false);
  const { setConsent } = useAnalyticsStore();

  useEffect(() => {
    const hasConsented = localStorage.getItem(CONSENT_STORAGE_KEY);

    if (!hasConsented) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, []);

  useEffect(() => {
    const openConsentTray = () => {
      const hasStoredConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (hasStoredConsent) {
        setAnalyticsOptIn(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === 'true');
        setNutritionLookupOptIn(localStorage.getItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY) === 'true');
      }

      setOpen(true);
    };

    window.addEventListener(CONSENT_REQUEST_EVENT, openConsentTray);
    return () => window.removeEventListener(CONSENT_REQUEST_EVENT, openConsentTray);
  }, []);

  const handleAgree = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
    window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
    setConsent(analyticsOptIn);

    if (analyticsOptIn) {
      localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
    }

    if (nutritionLookupOptIn) {
      localStorage.setItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY);
    }

    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        }
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        enableBlur
        data-testid="consent-tray"
        data-surface="consent-tray"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="mx-auto w-[calc(100%-1rem)] max-w-[46rem] gap-0 overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(246,239,255,0.96)_42%,rgba(236,244,255,0.97)_100%)] px-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-0 shadow-[0_-16px_48px_rgba(77,38,129,0.22)] motion-reduce:duration-0 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.18),transparent_36%),linear-gradient(180deg,rgba(28,14,46,0.98)_0%,rgba(16,11,34,0.98)_46%,rgba(10,12,29,0.98)_100%)] dark:shadow-[0_-24px_72px_rgba(4,0,20,0.58)] sm:bottom-5 sm:w-[min(calc(100%-2rem),46rem)] sm:rounded-[2.15rem]"
      >
        <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/20" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />

        <div className="relative px-5 pb-1 pt-5 sm:px-7 sm:pt-6">
          <SheetHeader className="space-y-0 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-primary/18 bg-white/70 shadow-[0_18px_44px_rgba(173,65,255,0.14)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:shadow-[0_18px_48px_rgba(130,48,255,0.2)]">
                <ShieldAlert className="h-6 w-6 text-primary" />
              </div>

              <div className="min-w-0 space-y-2 pt-1">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/16 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Welcome Flow
                </div>
                <SheetTitle className="text-left text-[1.75rem] font-black leading-[1.02] tracking-[-0.045em] text-foreground sm:text-[1.95rem]">
                  Welcome to FitWizard
                </SheetTitle>
                <SheetDescription className="max-w-[34rem] text-left text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                  Your AI workout companion is ready. Before we begin, confirm these basics.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-5 space-y-3">
            <section className="rounded-[1.6rem] border border-primary/12 bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur dark:border-white/8 dark:bg-white/[0.055] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
              <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                Before we start, please agree:
              </p>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span>
                    I understand this is <strong className="font-semibold text-foreground">not medical advice</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span>I will consult a doctor before starting new exercises.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span>
                    My data is stored <strong className="font-semibold text-foreground">locally</strong> on this device.
                  </span>
                </li>
              </ul>
            </section>

            <section className="rounded-[1.45rem] border border-primary/12 bg-gradient-to-r from-primary/[0.08] via-fuchsia-500/[0.07] to-secondary/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur dark:border-white/8 dark:from-primary/10 dark:via-fuchsia-500/[0.09] dark:to-secondary/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="analytics-consent"
                  checked={analyticsOptIn}
                  onCheckedChange={(checked) => setAnalyticsOptIn(checked === true)}
                  className="mt-1 h-5 w-5 rounded-md border-primary/50 bg-white/85 dark:bg-black/20"
                />
                <div className="min-w-0">
                  <Label
                    htmlFor="analytics-consent"
                    className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Help improve FitWizard
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-[0.82rem]">
                    Share anonymous usage data to help us make the app better. No personal info is collected.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.45rem] border border-primary/12 bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur dark:border-white/8 dark:bg-white/[0.055] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="nutrition-lookup-consent"
                  checked={nutritionLookupOptIn}
                  onCheckedChange={(checked) => setNutritionLookupOptIn(checked === true)}
                  className="mt-1 h-5 w-5 rounded-md border-primary/50 bg-white/85 dark:bg-black/20"
                />
                <div className="min-w-0">
                  <Label
                    htmlFor="nutrition-lookup-consent"
                    className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    Third-party food search
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-[0.82rem]">
                    Allow OpenFoodFacts lookups when you search foods. Your query leaves this device to fetch results.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <SheetFooter className="mt-5 flex-col gap-3 border-t border-white/10 pt-4 dark:border-white/6 sm:flex-col sm:space-x-0">
            <p className="text-center text-xs leading-5 text-muted-foreground sm:text-[0.82rem]">
              By clicking &quot;I Agree&quot;, you accept our{' '}
              <Link
                to="/legal"
                className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/legal"
                className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Privacy Policy
              </Link>
              .
            </p>

            <Button
              type="button"
              variant="gradient"
              size="xl"
              onClick={handleAgree}
              className="h-14 w-full rounded-[1.4rem] text-base font-semibold shadow-[0_18px_42px_rgba(190,63,255,0.26)] sm:h-[3.6rem]"
            >
              I Agree &amp; Continue
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
