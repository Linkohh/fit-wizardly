import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';


export function AuthModal() {
    const { showAuthModal, setShowAuthModal, signInWithEmail, isConfigured } = useAuthStore();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setError(null);

        const { error } = await signInWithEmail(email);

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setIsSent(true);
        }
    };

    const handleClose = () => {
        setShowAuthModal(false);
        setEmail('');
        setIsSent(false);
        setError(null);
    };

    if (!isConfigured) {
        return (
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Circles Feature Coming Soon</DialogTitle>
                        <DialogDescription>
                            The accountability circles feature requires backend setup.
                            Please check back later or contact the developer.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={handleClose} className="w-full">
                        Got it
                    </Button>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
            <DialogContent className="sm:max-w-md">
                {!isSent ? (
                    <>
                        <DialogHeader>
                            <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-2">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <DialogTitle className="text-center">Join Accountability Circles</DialogTitle>
                            <DialogDescription className="text-center">
                                Sign in with your email to create or join circles with workout buddies.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full gradient-primary text-white"
                                disabled={isLoading || !email.trim()}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Magic Link
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                No password needed. We'll email you a secure sign-in link.
                            </p>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <DialogTitle className="text-center">Check your email!</DialogTitle>
                            <DialogDescription className="text-center">
                                We sent a magic link to <strong>{email}</strong>.
                                Click the link in the email to sign in.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setIsSent(false)}
                            >
                                Use a different email
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={handleClose}
                            >
                                Close
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
