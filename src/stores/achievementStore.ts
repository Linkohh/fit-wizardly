import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BadgeId =
  | 'first_plan'
  | 'plans_10'
  | 'plans_25'
  | 'plans_50'
  | 'plans_100'
  | 'trainer_activated'
  | 'first_client'
  | 'clients_5'
  | 'clients_10'
  | 'clients_50'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'template_creator'
  | 'all_equipment'
  | 'full_body_fan'
  // Logging badges
  | 'first_workout'
  | 'logger'
  | 'data_nerd'
  | 'iron_will'
  | 'tonnage_king'
  | 'pr_machine'
  // Wisdom badges
  | 'exercise_scientist'
  | 'programming_nerd'
  | 'wisdom_master'
  | 'concept_collector'
  // Circle badges
  | 'circle_founder'
  | 'team_player'
  | 'circle_champion'
  | 'social_butterfly';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
}

export const BADGES: Record<BadgeId, Omit<Badge, 'unlockedAt'>> = {
  first_plan: {
    id: 'first_plan',
    name: 'First Steps',
    description: 'Created your first workout plan',
    icon: '🎯',
    tier: 'bronze',
  },
  plans_10: {
    id: 'plans_10',
    name: 'Getting Serious',
    description: 'Generated 10 workout plans',
    icon: '📋',
    tier: 'bronze',
  },
  plans_25: {
    id: 'plans_25',
    name: 'Plan Master',
    description: 'Generated 25 workout plans',
    icon: '🏆',
    tier: 'silver',
  },
  plans_50: {
    id: 'plans_50',
    name: 'Fitness Architect',
    description: 'Generated 50 workout plans',
    icon: '🏛️',
    tier: 'gold',
  },
  plans_100: {
    id: 'plans_100',
    name: 'Legend',
    description: 'Generated 100 workout plans',
    icon: '👑',
    tier: 'platinum',
  },
  trainer_activated: {
    id: 'trainer_activated',
    name: 'Trainer Mode',
    description: 'Activated trainer mode',
    icon: '🎓',
    tier: 'bronze',
  },
  first_client: {
    id: 'first_client',
    name: 'First Client',
    description: 'Added your first client',
    icon: '🤝',
    tier: 'bronze',
  },
  clients_5: {
    id: 'clients_5',
    name: 'Growing Team',
    description: 'Managing 5 clients',
    icon: '👥',
    tier: 'silver',
  },
  clients_10: {
    id: 'clients_10',
    name: 'Popular Trainer',
    description: 'Managing 10 clients',
    icon: '⭐',
    tier: 'gold',
  },
  clients_50: {
    id: 'clients_50',
    name: 'Fitness Empire',
    description: 'Managing 50 clients',
    icon: '🌟',
    tier: 'platinum',
  },
  streak_3: {
    id: 'streak_3',
    name: 'Consistent',
    description: '3-day planning streak',
    icon: '🔥',
    tier: 'bronze',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day planning streak',
    icon: '💪',
    tier: 'silver',
  },
  streak_14: {
    id: 'streak_14',
    name: 'Dedicated',
    description: '14-day planning streak',
    icon: '🎖️',
    tier: 'gold',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Unstoppable',
    description: '30-day planning streak',
    icon: '💎',
    tier: 'platinum',
  },
  template_creator: {
    id: 'template_creator',
    name: 'Template Creator',
    description: 'Created your first template',
    icon: '📝',
    tier: 'bronze',
  },
  all_equipment: {
    id: 'all_equipment',
    name: 'Fully Equipped',
    description: 'Used all equipment types in plans',
    icon: '🏋️',
    tier: 'silver',
  },
  full_body_fan: {
    id: 'full_body_fan',
    name: 'Full Body Fan',
    description: 'Created 5 full body plans',
    icon: '🧬',
    tier: 'bronze',
  },
  // Logging badges
  first_workout: {
    id: 'first_workout',
    name: 'First Rep',
    description: 'Logged your first workout',
    icon: '💪',
    tier: 'bronze',
  },
  logger: {
    id: 'logger',
    name: 'Logger',
    description: 'Logged 10 workouts',
    icon: '📓',
    tier: 'bronze',
  },
  data_nerd: {
    id: 'data_nerd',
    name: 'Data Nerd',
    description: 'Logged 50 workouts',
    icon: '📊',
    tier: 'silver',
  },
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    description: '4 weeks with 100% workout completion',
    icon: '⚔️',
    tier: 'gold',
  },
  tonnage_king: {
    id: 'tonnage_king',
    name: 'Tonnage King',
    description: 'Lifted 1,000,000 lbs total volume',
    icon: '👑',
    tier: 'platinum',
  },
  pr_machine: {
    id: 'pr_machine',
    name: 'PR Machine',
    description: 'Set 10 personal records',
    icon: '🏆',
    tier: 'gold',
  },
  // Wisdom badges
  exercise_scientist: {
    id: 'exercise_scientist',
    name: 'Exercise Scientist',
    description: 'Asked 10 questions to Wisdom AI',
    icon: '🔬',
    tier: 'bronze',
  },
  programming_nerd: {
    id: 'programming_nerd',
    name: 'Programming Nerd',
    description: 'Asked 25 questions to Wisdom AI',
    icon: '🧠',
    tier: 'silver',
  },
  wisdom_master: {
    id: 'wisdom_master',
    name: 'Wisdom Master',
    description: 'Asked 50 questions to Wisdom AI',
    icon: '🎓',
    tier: 'gold',
  },
  concept_collector: {
    id: 'concept_collector',
    name: 'Concept Collector',
    description: 'Learned 10 training concepts',
    icon: '📚',
    tier: 'silver',
  },
  // Circle badges
  circle_founder: {
    id: 'circle_founder',
    name: 'Circle Founder',
    description: 'Created your first accountability circle',
    icon: '👥',
    tier: 'bronze',
  },
  team_player: {
    id: 'team_player',
    name: 'Team Player',
    description: 'Joined your first circle',
    icon: '🤝',
    tier: 'bronze',
  },
  circle_champion: {
    id: 'circle_champion',
    name: 'Circle Champion',
    description: 'Won a weekly challenge',
    icon: '🏅',
    tier: 'gold',
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Member of 3 or more circles',
    icon: '🦋',
    tier: 'silver',
  },
};

interface AchievementState {
  // Stats
  totalPlansGenerated: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  weeklyGoal: number;
  weeklyProgress: number;
  userName: string;

  // Badges
  unlockedBadges: BadgeId[];
  newBadges: BadgeId[]; // Badges unlocked but not yet seen

  // Actions
  incrementPlansGenerated: () => BadgeId[];
  updateStreak: () => BadgeId[];
  unlockBadge: (badgeId: BadgeId) => boolean;
  markBadgesSeen: () => void;
  setWeeklyGoal: (goal: number) => void;
  incrementWeeklyProgress: () => void;
  resetWeeklyProgress: () => void;
  setUserName: (name: string) => void;
  getBadge: (badgeId: BadgeId) => Badge | undefined;
  getUnlockedBadges: () => Badge[];
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      totalPlansGenerated: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      weeklyGoal: 5,
      weeklyProgress: 0,
      userName: '',
      unlockedBadges: [],
      newBadges: [],

      incrementPlansGenerated: () => {
        const newBadges: BadgeId[] = [];

        set((state) => {
          const newTotal = state.totalPlansGenerated + 1;

          // Check plan milestones
          if (newTotal === 1 && !state.unlockedBadges.includes('first_plan')) {
            newBadges.push('first_plan');
          }
          if (newTotal >= 10 && !state.unlockedBadges.includes('plans_10')) {
            newBadges.push('plans_10');
          }
          if (newTotal >= 25 && !state.unlockedBadges.includes('plans_25')) {
            newBadges.push('plans_25');
          }
          if (newTotal >= 50 && !state.unlockedBadges.includes('plans_50')) {
            newBadges.push('plans_50');
          }
          if (newTotal >= 100 && !state.unlockedBadges.includes('plans_100')) {
            newBadges.push('plans_100');
          }

          return {
            totalPlansGenerated: newTotal,
            weeklyProgress: state.weeklyProgress + 1,
            unlockedBadges: [...state.unlockedBadges, ...newBadges],
            newBadges: [...state.newBadges, ...newBadges],
          };
        });

        return newBadges;
      },

      updateStreak: () => {
        const newBadges: BadgeId[] = [];
        const today = new Date().toDateString();

        set((state) => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();

          let newStreak = state.currentStreak;

          if (state.lastActivityDate === today) {
            // Already active today
            return state;
          } else if (state.lastActivityDate === yesterdayStr) {
            // Continuing streak
            newStreak = state.currentStreak + 1;
          } else {
            // Streak broken or first activity
            newStreak = 1;
          }

          // Check streak badges
          if (newStreak >= 3 && !state.unlockedBadges.includes('streak_3')) {
            newBadges.push('streak_3');
          }
          if (newStreak >= 7 && !state.unlockedBadges.includes('streak_7')) {
            newBadges.push('streak_7');
          }
          if (newStreak >= 14 && !state.unlockedBadges.includes('streak_14')) {
            newBadges.push('streak_14');
          }
          if (newStreak >= 30 && !state.unlockedBadges.includes('streak_30')) {
            newBadges.push('streak_30');
          }

          return {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, state.longestStreak),
            lastActivityDate: today,
            unlockedBadges: [...state.unlockedBadges, ...newBadges],
            newBadges: [...state.newBadges, ...newBadges],
          };
        });

        return newBadges;
      },

      unlockBadge: (badgeId) => {
        const state = get();
        if (state.unlockedBadges.includes(badgeId)) {
          return false;
        }

        set((state) => ({
          unlockedBadges: [...state.unlockedBadges, badgeId],
          newBadges: [...state.newBadges, badgeId],
        }));

        return true;
      },

      markBadgesSeen: () => set({ newBadges: [] }),

      setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),

      incrementWeeklyProgress: () => set((state) => ({
        weeklyProgress: state.weeklyProgress + 1,
      })),

      resetWeeklyProgress: () => set({ weeklyProgress: 0 }),

      setUserName: (name) => set({ userName: name }),

      getBadge: (badgeId) => {
        const state = get();
        if (!state.unlockedBadges.includes(badgeId)) {
          return undefined;
        }
        return { ...BADGES[badgeId], unlockedAt: new Date() };
      },

      getUnlockedBadges: () => {
        const state = get();
        return state.unlockedBadges.map((id) => ({
          ...BADGES[id],
          unlockedAt: new Date(),
        }));
      },
    }),
    {
      name: 'fitwizard-achievements',
    }
  )
);
