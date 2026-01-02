import { AnatomyPanel } from '@/components/wizard/anatomy/AnatomyPanel';

export function AnatomyStep() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary inline-block">
          Select Target Muscles
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Click on the diagram or list to choose the muscle groups you want to train.
        </p>
      </div>

      <AnatomyPanel />
    </div>
  );
}
