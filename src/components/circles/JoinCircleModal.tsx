import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useCircleStore } from '@/stores/circleStore';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface JoinCircleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const joinCircleSchema = z.object({
    inviteCode: z.string()
        .length(8, 'Invite code must be exactly 8 characters')
        .regex(/^[A-Z0-9]+$/, 'Invalid invite code format')
});

type JoinCircleForm = z.infer<typeof joinCircleSchema>;

export function JoinCircleModal({ isOpen, onClose }: JoinCircleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { joinCircle } = useCircleStore();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        watch,
        setValue
    } = useForm<JoinCircleForm>({
        resolver: zodResolver(joinCircleSchema),
        mode: 'onChange'
    });

    const codeValue = watch('inviteCode', '');

    // Auto-uppercase transform
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uppercase = e.target.value.toUpperCase();
        setValue('inviteCode', uppercase, { shouldValidate: true });
    };

    const onSubmit = async (data: JoinCircleForm) => {
        setIsLoading(true);
        const { error } = await joinCircle(data.inviteCode);
        setIsLoading(false);

        if (error) {
            toast({
                title: 'Could not join circle',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Joined circle! 🎉',
                description: 'Welcome to your new accountability circle.',
            });
            reset();
            onClose();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            reset();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-2 shadow-glow">
                            <UserPlus className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <DialogTitle className="text-center">Join Circle</DialogTitle>
                        <DialogDescription className="text-center">
                            Enter an invite code to join
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-6">
                        <Label htmlFor="inviteCode" className="sr-only">
                            Invite Code
                        </Label>
                        <Input
                            id="inviteCode"
                            placeholder="ABC12345"
                            {...register('inviteCode')}
                            onChange={handleCodeChange}
                            maxLength={8}
                            className={cn(
                                "text-center text-2xl font-mono tracking-[0.5em] transition-all duration-200",
                                errors.inviteCode && "ring-2 ring-destructive/50 bg-destructive/5 animate-shake",
                                !errors.inviteCode && codeValue.length === 8 && "ring-2 ring-green-500/50"
                            )}
                            aria-invalid={errors.inviteCode ? "true" : "false"}
                        />

                        {/* Progress indicator */}
                        <div className="mt-3 flex gap-1 justify-center">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1.5 w-8 rounded-full transition-all duration-200",
                                        i < codeValue.length
                                            ? errors.inviteCode
                                                ? "bg-destructive"
                                                : "bg-primary"
                                            : "bg-muted"
                                    )}
                                />
                            ))}
                        </div>

                        {errors.inviteCode && (
                            <div className="flex items-center justify-center gap-1.5 text-sm text-destructive mt-4 animate-error-in">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.inviteCode.message}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="gradient"
                            disabled={isLoading || !isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                'Join Circle'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
