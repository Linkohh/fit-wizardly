import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { AnatomyPanel } from '@/components/wizard/anatomy/AnatomyPanel';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { useTranslation } from 'react-i18next';
import { getAutoPickMuscles } from './autoPickMuscles';

export function AnatomyStep() {
  const { t } = useTranslation();
  const setTargetMuscles = useWizardStore((state) => state.setTargetMuscles);
  // The panel keeps its own form state, so remount it after an auto-pick to show the new focus.
  const [panelVersion, setPanelVersion] = useState(0);

  const handleAutoPick = () => {
    setTargetMuscles(getAutoPickMuscles());
    setPanelVersion((version) => version + 1);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary inline-block">
          {t('wizard.anatomy.title')}
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          {t('wizard.anatomy.subtitle')}
        </p>
        <Button
          variant="outline"
          onClick={handleAutoPick}
          className="touch-target mt-4 gap-2 border-primary/40 hover:bg-primary/10"
        >
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          {t('wizard.anatomy.auto_pick', 'Let FitWizard choose')}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('wizard.anatomy.auto_pick_hint', 'Picks a balanced full-body focus. You can change it on the map.')}
        </p>
      </div>

      <AnatomyPanel key={panelVersion} />
    </div>
  );
}
