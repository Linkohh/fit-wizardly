import { AnatomyPanel } from '@/components/wizard/anatomy/AnatomyPanel';
import { useTranslation } from 'react-i18next';

export function AnatomyStep() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary inline-block">
          {t('wizard.anatomy.title')}
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          {t('wizard.anatomy.subtitle')}
        </p>
      </div>

      <AnatomyPanel />
    </div>
  );
}
