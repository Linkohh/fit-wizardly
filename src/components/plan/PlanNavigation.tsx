import { Pencil, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface PlanNavigationProps {
    onStartOver: () => void;
}

export function PlanNavigation({ onStartOver }: PlanNavigationProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();

    return (
        <div className="w-full space-y-4 md:space-y-4 fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-50 md:static md:bg-transparent md:border-none md:p-0 md:z-auto print:hidden">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Start Over (Stationary Anchor) */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-10 px-3 -ml-2"
                            aria-label="Start Over"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Start Over</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-static border-white/10">
                        <AlertDialogHeader>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-destructive" />
                                <AlertDialogTitle className="text-xl">Start Over?</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-base text-muted-foreground pt-2">
                                This will clear all your current selections (Goal, Equipment, Muscles) and return you to the beginning.
                                <br /><br />
                                Are you sure you want to continue?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="hover:bg-white/10">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    onStartOver();
                                    toast({
                                        title: "Wizard Reset",
                                        description: "Ready for a fresh start! 🚀",
                                    });
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6 font-semibold"
                            >
                                Yes, Start Over
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Right: Edit Selections (Primary Action) */}
                <Button
                    variant="gradient"
                    onClick={() => navigate('/wizard')}
                    className="touch-target flex items-center gap-2 px-6"
                >
                    <Pencil className="h-4 w-4" />
                    <span>Edit Selections</span>
                </Button>
            </div>
        </div>
    );
}
