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
import { ShieldAlert, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ConsentModal() {
    const [open, setOpen] = useState(false);

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
                    <AlertDialogDescription className="text-center space-y-4 pt-2">
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
