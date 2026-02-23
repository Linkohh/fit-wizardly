import { useCallback, useMemo } from 'react';
import { ExerciseSuggestions } from '@/components/wizard/ExerciseSuggestions';
import { useWizardStore } from '@/stores/wizardStore';
import { useWizardForm, anatomyStepSchema } from '@/hooks/useWizardForm';
import { FormError } from '@/components/ui/form-error';
import { MuscleSelector } from '@/features/mcl';
import { mapLegacyToMcl, mapMclToLegacy } from '@/lib/muscleMapping';
import { useThemeStore } from '@/stores/themeStore';
import { useIsMobile } from '@/hooks/use-mobile';

const EMPTY_TARGET_MUSCLES: string[] = [];

export function AnatomyPanel() {
    const { selections, setTargetMuscles } = useWizardStore();
    const themeMode = useThemeStore((state) => state.mode);
    const isMobile = useIsMobile();

    // React Hook Form integration with Zustand sync
    const { watch, setValue, formState: { errors }, trigger } = useWizardForm({
        schema: anatomyStepSchema,
        defaultValues: {
            targetMuscles: selections.targetMuscles,
        },
        onSync: (values) => {
            if (values.targetMuscles !== undefined) setTargetMuscles(values.targetMuscles);
        },
    });

    // Watch target muscles for reactive updates
    const watchedTargetMuscles = watch('targetMuscles') ?? EMPTY_TARGET_MUSCLES;

    // Map Legacy Groups to MCL IDs for visualization
    const selectedMclIds = useMemo(() => mapLegacyToMcl(watchedTargetMuscles), [watchedTargetMuscles]);

    // Handle selection from MCL
    const handleSelectionChange = useCallback((newMclIds: string[]) => {
        // Map back to legacy groups
        const newGroups = mapMclToLegacy(newMclIds);

        setValue('targetMuscles', newGroups, { shouldValidate: true, shouldDirty: true });
        // Trigger validation immediately
        trigger('targetMuscles');

        // Update store directly for immediate feedback if needed (optional, handled by onSync usually)
        setTargetMuscles(newGroups);
    }, [setValue, setTargetMuscles, trigger]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
                {/* Validation error */}
                <FormError error={errors.targetMuscles?.message} />
            </div>

            {/* MCL Integration */}
            <div
                data-testid="anatomy-selector-shell"
                className="w-full h-[min(62vh,560px)] supports-[height:100dvh]:h-[min(62dvh,560px)] sm:h-[600px] rounded-2xl overflow-hidden surface-premium-strong surface-premium-stroke"
            >
                <MuscleSelector
                    selectedMuscles={selectedMclIds}
                    onSelectionChange={handleSelectionChange}
                    showPresets={true}
                    showInfoPanel={true}
                    showSelectionSidebar={true}
                    showSideView={!isMobile}
                    showLegend={false} // Cleaner look
                    theme={themeMode}
                    height="100%"
                    className="w-full bg-transparent"
                />
            </div>

            {/* Real-time Exercise Suggestions */}
            {watchedTargetMuscles.length > 0 && selections.equipment.length > 0 && (
                <ExerciseSuggestions
                    muscles={watchedTargetMuscles}
                    equipment={selections.equipment}
                    experienceLevel={selections.experienceLevel}
                    className="mt-6"
                />
            )}
        </div>
    );
}
