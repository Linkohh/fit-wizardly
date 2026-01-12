import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Users, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useCircleStore } from '@/stores/circleStore';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface CreateCircleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Define validation schema
const createCircleSchema = z.object({
    name: z.string()
        .min(3, 'Circle name must be at least 3 characters')
        .max(50, 'Circle name must be less than 50 characters')
        .regex(/^[a-zA-Z0-9\s-]+$/, 'Only letters, numbers, spaces, and dashes allowed'),
    description: z.string()
        .max(200, 'Description must be less than 200 characters')
        .optional()
        .or(z.literal(''))
});

type CreateCircleForm = z.infer<typeof createCircleSchema>;

export function CreateCircleModal({ isOpen, onClose }: CreateCircleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { createCircle } = useCircleStore();
    const { toast } = useToast();

    // Initialize react-hook-form with Zod resolver
    const {
        register,
        handleSubmit,
        formState: { errors, isValid, touchedFields },
        reset,
        watch
    } = useForm<CreateCircleForm>({
        resolver: zodResolver(createCircleSchema),
        mode: 'onChange', // Validate on change
        defaultValues: {
            name: '',
            description: ''
        }
    });

    const nameValue = watch('name');
    const descriptionValue = watch('description');

    const onSubmit = async (data: CreateCircleForm) => {
        setIsLoading(true);

        const { circle, error } = await createCircle(
            data.name,
            data.description || undefined
        );

        setIsLoading(false);

        if (error) {
            toast({
                title: 'Error creating circle',
                description: error.message,
                variant: 'destructive',
            });
        } else if (circle) {
            toast({
                title: 'Circle created! 🎉',
                description: `${circle.name} is ready for members.`,
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
                            <Users className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <DialogTitle className="text-center">Create Circle</DialogTitle>
                        <DialogDescription className="text-center">
                            Start your own accountability circle
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 my-6">
                        {/* Circle Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-1">
                                Circle Name <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="name"
                                    placeholder="Morning Workout Crew"
                                    {...register('name')}
                                    className={cn(
                                        "pr-12 transition-all duration-200",
                                        errors.name && touchedFields.name && "ring-2 ring-destructive/50 bg-destructive/5 animate-shake",
                                        !errors.name && touchedFields.name && nameValue.length >= 3 && "ring-2 ring-green-500/50"
                                    )}
                                    aria-invalid={errors.name ? "true" : "false"}
                                    aria-describedby={errors.name ? "name-error" : undefined}
                                />
                                {/* Character counter */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    {nameValue?.length || 0}/50
                                </div>
                            </div>

                            {/* Error message */}
                            {errors.name && touchedFields.name && (
                                <div
                                    id="name-error"
                                    className="flex items-start gap-1.5 text-sm text-destructive animate-error-in"
                                    role="alert"
                                >
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{errors.name.message}</span>
                                </div>
                            )}

                            {/* Helper text when no error */}
                            {!errors.name && (
                                <p className="text-xs text-muted-foreground">
                                    Choose a memorable name for your circle
                                </p>
                            )}
                        </div>

                        {/* Description Field */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-xs text-muted-foreground">(Optional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="We train early, stay consistent, and support each other!"
                                rows={3}
                                {...register('description')}
                                className={cn(
                                    "resize-none transition-all duration-200",
                                    errors.description && touchedFields.description && "ring-2 ring-destructive/50 bg-destructive/5"
                                )}
                                aria-invalid={errors.description ? "true" : "false"}
                                aria-describedby={errors.description ? "description-error" : undefined}
                            />

                            {/* Character counter */}
                            <div className="flex justify-between items-center">
                                <div>
                                    {errors.description && touchedFields.description && (
                                        <div
                                            id="description-error"
                                            className="flex items-start gap-1.5 text-sm text-destructive animate-error-in"
                                            role="alert"
                                        >
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{errors.description.message}</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {descriptionValue?.length || 0}/200
                                </span>
                            </div>
                        </div>
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
                            className={cn(
                                "relative overflow-hidden",
                                !isValid && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Create Circle
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
