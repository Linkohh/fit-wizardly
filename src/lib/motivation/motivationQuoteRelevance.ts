const RELEVANT_TERMS = [
  'fitness',
  'fit',
  'effort',
  'discipline',
  'disciplined',
  'growth',
  'consistency',
  'consistent',
  'health',
  'healthy',
  'resilience',
  'resilient',
  'strength',
  'strong',
  'goals',
  'goal',
  'habit',
  'habits',
  'progress',
  'mindset',
  'training',
  'train',
  'exercise',
  'workout',
  'gym',
  'courage',
  'endurance',
  'stamina',
  'perseverance',
  'persistence',
  'challenge',
  'recovery',
  'wellness',
  'movement',
  'body',
  'mind',
  'potential',
  'improve',
  'improvement',
  'commitment',
  'routine',
  'action',
  'achieve',
  'achievement',
  'believe',
  'belief',
  'determination',
  'failure',
  'grit',
  'impossible',
  'persevere',
  'possible',
  'success',
  'successful',
  'will',
  'work',
];

const RELEVANT_PATTERNS = RELEVANT_TERMS.map(
  (term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
);

export function isRelevantMotivationQuote(quote: string) {
  const trimmed = quote.trim();

  if (!trimmed) {
    return false;
  }

  return RELEVANT_PATTERNS.some((pattern) => pattern.test(trimmed));
}
