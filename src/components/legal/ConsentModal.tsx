import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAnalyticsStore } from "@/stores/analyticsStore";

export function ConsentModal() {
    const [open, setOpen] = useState(false);
    const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
    const { setConsent } = useAnalyticsStore();

    useEffect(() => {
        const hasConsented = localStorage.getItem("fitwizard_consent_v1");
        if (!hasConsented) {
            // Small delay to ensure smooth hydration
            const timer = setTimeout(() => setOpen(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAgree = () => {
        localStorage.setItem("fitwizard_consent_v1", new Date().toISOString());
        // Set analytics consent based on user choice
        setConsent(analyticsOptIn);
        if (analyticsOptIn) {
            localStorage.setItem("fitwizard_analytics_consent", "true");
        }
        setOpen(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl">
                        Welcome to FitWizard!
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild className="text-center space-y-4 pt-2">
                        <div>
                            <p>
                                Your AI-powered workout companion is ready to help you achieve your goals.
                            </p>
                            <div className="bg-muted/50 p-4 rounded-lg text-left text-sm space-y-2 border">
                                <p className="font-semibold text-foreground">Before we start, please agree:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>I understand this is <strong>not medical advice</strong>.</li>
                                    <li>I will consult a doctor before starting new exercises.</li>
                                    <li>My data is stored <strong>locally</strong> on this device.</li>
                                </ul>
                            </div>

                            {/* Analytics Opt-In */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20 text-left">
                                <Checkbox
                                    id="analytics-consent"
                                    checked={analyticsOptIn}
                                    onCheckedChange={(checked) => setAnalyticsOptIn(checked === true)}
                                    className="mt-0.5"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="analytics-consent" className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer">
                                        <BarChart3 className="h-4 w-4 text-secondary" />
                                        Help improve FitWizard
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Share anonymous usage data to help us make the app better. No personal info is collected.
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                By clicking "I Agree", you accept our{" "}
                                <Link to="/legal" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link to="/legal" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                    Privacy Policy
                                </Link>.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogAction onClick={handleAgree} className="w-full sm:w-auto min-w-[150px]">
                        I Agree & Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
