import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BadgeDisplay } from './BadgeDisplay';
import { Confetti } from '@/components/ui/confetti';
import { BADGES, BadgeId } from '@/stores/achievementStore';
import { Sparkles } from 'lucide-react';

interface BadgeUnlockModalProps {
  badgeIds: BadgeId[];
  onClose: () => void;
}

export function BadgeUnlockModal({ badgeIds, onClose }: BadgeUnlockModalProps) {
  const [showConfetti] = useState(true);

  if (badgeIds.length === 0) return null;

  return (
    <>
      {showConfetti && <Confetti isActive={showConfetti} />}
      <Dialog open={badgeIds.length > 0} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              {badgeIds.length === 1 ? 'Badge Unlocked!' : 'Badges Unlocked!'}
              <Sparkles className="h-6 w-6 text-secondary animate-pulse" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex flex-wrap justify-center gap-6">
              {badgeIds.map((badgeId) => {
                const badge = BADGES[badgeId];
                return (
                  <div key={badgeId} className="flex flex-col items-center gap-2 animate-scale-in">
                    <BadgeDisplay badge={badgeId} size="lg" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{badge.name}</p>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={onClose} variant="gradient" className="w-full">
            Awesome! 🎉
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
