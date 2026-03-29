import { useCallback, useMemo } from 'react';
import { ExerciseSuggestions } from '@/components/wizard/ExerciseSuggestions';
import { useWizardStore } from '@/stores/wizardStore';
import { useWizardForm, anatomyStepSchema } from '@/hooks/useWizardForm';
import { FormError } from '@/components/ui/form-error';
import { MuscleSelector } from '@/features/mcl';
import { formatIdentifierLabel } from '@/lib/displayText';
import { mapLegacyToMcl, mapMclToLegacy } from '@/lib/muscleMapping';
import { useThemeStore } from '@/stores/themeStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

const EMPTY_TARGET_MUSCLES: string[] = [];

export function AnatomyPanel() {
    const { t } = useTranslation();
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

    const selectedTargetLabels = watchedTargetMuscles.map((muscle) => formatIdentifierLabel(muscle));
    const selectedEquipmentLabels = selections.equipment.map((equipment) => formatIdentifierLabel(equipment));
    const selectedEquipmentText = selectedEquipmentLabels.length > 0
        ? selectedEquipmentLabels.join(' · ')
        : t('wizard.anatomy.equipment_empty', 'No equipment selected yet');

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
                <FormError error={errors.targetMuscles?.message} />
            </div>

            <div className="mx-auto w-full max-w-[1120px]">
                <div
                    data-testid="anatomy-selector-shell"
                    className="w-full h-[min(62vh,560px)] supports-[height:100dvh]:h-[min(62dvh,560px)] sm:h-[600px] rounded-[1.75rem] overflow-hidden surface-premium-strong surface-premium-stroke"
                >
                    <MuscleSelector
                        selectedMuscles={selectedMclIds}
                        onSelectionChange={handleSelectionChange}
                        showPresets={true}
                        showInfoPanel={true}
                        showSelectionSidebar={true}
                        showSideView={!isMobile}
                        showLegend={false}
                        headerControlsMode="embedded"
                        theme={themeMode}
                        height="100%"
                        className="w-full bg-transparent"
                    />
                </div>
            </div>

            <section
                data-testid="anatomy-support-grid"
                className="mx-auto grid w-full max-w-[1120px] gap-4 lg:grid-cols-3"
            >
                <div className="rounded-[1.5rem] border border-border/60 bg-background/18 p-5 backdrop-blur-xl md:bg-background/30">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                            {t('wizard.anatomy.selected_title', 'Selected focus')}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {watchedTargetMuscles.length > 0
                                ? t('wizard.anatomy.selected_count', '{{count}} muscle groups selected', { count: watchedTargetMuscles.length })
                                : t('wizard.anatomy.selected_empty', 'Choose at least one focus area to shape the split.')}
                        </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTargetLabels.length > 0 ? (
                            selectedTargetLabels.map((label) => (
                                <span
                                    key={label}
                                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary"
                                >
                                    {label}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {t('wizard.anatomy.selected_empty', 'Choose at least one focus area to shape the split.')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-[1.5rem] border border-border/60 bg-background/14 p-5 backdrop-blur-xl md:bg-background/24">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                        {t('wizard.anatomy.equipment_title', 'Available tools')}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {selectedEquipmentText}
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-border/60 bg-background/14 p-5 backdrop-blur-xl md:bg-background/24">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                        {t('wizard.anatomy.coaching_note_title', 'Coach note')}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t('wizard.anatomy.coaching_note_copy', 'Your selections here drive exercise choice, weekly volume, and how each day in the split is balanced.')}
                    </p>
                </div>
            </section>

            {watchedTargetMuscles.length > 0 && selections.equipment.length > 0 && (
                <ExerciseSuggestions
                    muscles={watchedTargetMuscles}
                    equipment={selections.equipment}
                    experienceLevel={selections.experienceLevel}
                    className="mx-auto mt-6 max-w-[1120px]"
                />
            )}
        </div>
    );
}
