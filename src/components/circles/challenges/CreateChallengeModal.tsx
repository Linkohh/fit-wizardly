/**
 * Create Challenge Modal
 *
 * Form modal for creating new challenges within a circle.
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Target } from 'lucide-react';
import { format, addDays, addWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCircleStore } from '@/stores/circleStore';
import { useToast } from '@/components/ui/use-toast';

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    circleId: string;
}

const CHALLENGE_TYPES = [
    { value: 'workout_count', label: 'Total Workouts', description: 'Complete the most workouts' },
    { value: 'total_volume', label: 'Total Volume', description: 'Lift the most total weight' },
    { value: 'streak', label: 'Longest Streak', description: 'Maintain the longest workout streak' },
    { value: 'consistency', label: 'Consistency', description: 'Most consistent workout schedule' },
];

const DURATION_PRESETS = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: 'Custom', days: 0 },
];

export function CreateChallengeModal({
    isOpen,
    onClose,
    circleId,
}: CreateChallengeModalProps) {
    const { createChallenge } = useCircleStore();
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [challengeType, setChallengeType] = useState('workout_count');
    const [durationPreset, setDurationPreset] = useState(7);
    const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
    const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 8));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDurationChange = (days: number) => {
        setDurationPreset(days);
        if (days > 0) {
            setEndDate(addDays(startDate, days));
        }
    };

    const handleStartDateChange = (date: Date | undefined) => {
        if (date) {
            setStartDate(date);
            if (durationPreset > 0) {
                setEndDate(addDays(date, durationPreset));
            }
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast({
                title: 'Title required',
                description: 'Please enter a challenge title.',
                variant: 'destructive',
            });
            return;
        }

        if (endDate <= startDate) {
            toast({
                title: 'Invalid dates',
                description: 'End date must be after start date.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        const { error } = await createChallenge(
            circleId,
            title.trim(),
            challengeType,
            startDate,
            endDate,
            description.trim() || undefined
        );

        setIsSubmitting(false);

        if (error) {
            toast({
                title: 'Failed to create challenge',
                description: error.message,
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Challenge created!',
            description: 'Your challenge has been posted to the circle.',
        });

        // Reset form and close
        setTitle('');
        setDescription('');
        setChallengeType('workout_count');
        setDurationPreset(7);
        setStartDate(addDays(new Date(), 1));
        setEndDate(addDays(new Date(), 8));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-orange-500" />
                        Create Challenge
                    </DialogTitle>
                    <DialogDescription>
                        Set up a new challenge for your circle members to compete in.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Challenge Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Weekly Workout Warriors"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the challenge rules and goals..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                    </div>

                    {/* Challenge Type */}
                    <div className="space-y-2">
                        <Label>Challenge Type</Label>
                        <Select value={challengeType} onValueChange={setChallengeType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select challenge type" />
                            </SelectTrigger>
                            <SelectContent>
                                {CHALLENGE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div>
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {type.description}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Duration preset */}
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <div className="flex gap-2 flex-wrap">
                            {DURATION_PRESETS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    type="button"
                                    variant={durationPreset === preset.days ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleDurationChange(preset.days)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Date pickers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !startDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={handleStartDateChange}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !endDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => date && setEndDate(date)}
                                        disabled={(date) => date <= startDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        className="gradient-primary text-white"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim()}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Challenge'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
