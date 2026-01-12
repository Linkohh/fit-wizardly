/**
 * Wisdom Templates
 * 
 * Template-based explanation system for common fitness questions.
 * Uses pattern matching and context from planGenerator to provide
 * educational responses without requiring LLM API calls.
 */

import type {
    WisdomMessage,
    WisdomResponse,
    WisdomContext,
    OptPhase,
    Plan,
} from '@/types/fitness';

// ============================================
// PHASE EXPLANATIONS
// ============================================

const PHASE_EXPLANATIONS: Record<OptPhase, { name: string; focus: string; description: string }> = {
    stabilization_endurance: {
        name: 'Stabilization Endurance (Phase 1)',
        focus: 'Building foundational stability and muscular endurance',
        description: 'This phase uses lighter weights, higher reps (12-20), and unstable surfaces to build the foundation. It\'s perfect for beginners or returning from a break. The goal is to improve joint stability, core strength, and prepare your body for heavier loads.',
    },
    strength_endurance: {
        name: 'Strength Endurance (Phase 2)',
        focus: 'Combining strength with stamina through supersets',
        description: 'This phase pairs a strength exercise with a stabilization exercise in supersets. You\'ll do moderate weight (8-12 reps) followed immediately by a lighter exercise. This builds muscular endurance while maintaining strength gains.',
    },
    muscular_development: {
        name: 'Muscular Development (Phase 3)',
        focus: 'Maximizing muscle growth (hypertrophy)',
        description: 'The classic "bodybuilding" phase. You\'ll use moderate-to-heavy weights for 6-12 reps with controlled tempos. The higher volume and time-under-tension optimize muscle fiber recruitment and growth stimulus.',
    },
    maximal_strength: {
        name: 'Maximal Strength (Phase 4)',
        focus: 'Building peak strength and neural adaptations',
        description: 'Heavy weights, lower reps (1-5), longer rest periods. This phase trains your nervous system to recruit more motor units, making you stronger without necessarily adding size. Rest periods of 3-5 minutes allow full recovery.',
    },
    power: {
        name: 'Power (Phase 5)',
        focus: 'Explosive strength and athletic performance',
        description: 'Combines heavy loading with explosive movements. You\'ll superset a strength exercise with a plyometric movement. This develops the ability to generate force quickly - essential for sports performance.',
    },
};

// ============================================
// CONCEPT EXPLANATIONS
// ============================================

const CONCEPT_EXPLANATIONS: Record<string, { title: string; explanation: string; followUp?: string }> = {
    rir: {
        title: 'RIR (Reps in Reserve)',
        explanation: 'RIR stands for "Reps in Reserve" - how many more reps you could have done with good form. RIR 2 means you stopped 2 reps before failure. This helps manage fatigue while still providing enough stimulus for growth. Throughout a 4-week mesocycle, RIR typically decreases from 3 to 1, with Week 4 being a deload (RIR 4).',
        followUp: 'Would you like to know how to estimate your RIR accurately?',
    },
    volume: {
        title: 'Training Volume',
        explanation: 'Volume = Sets × Reps × Weight. It\'s the total work you do for a muscle group. Research suggests 10-20 sets per muscle per week for optimal growth. Your plan is designed to hit these targets while staying within your recovery capacity based on experience level.',
        followUp: 'Want to learn about the relationship between volume and recovery?',
    },
    progressive_overload: {
        title: 'Progressive Overload',
        explanation: 'The principle that muscles need increasingly challenging stimuli to grow. This can be achieved by adding weight, reps, sets, or reducing rest times. Your weekly progression is built into the RIR scheme - as RIR decreases, intensity effectively increases even at the same weight.',
        followUp: 'Would you like tips on when to increase weight?',
    },
    tempo: {
        title: 'Tempo Training',
        explanation: 'Tempo notation like "4-2-1" means: 4 seconds lowering (eccentric), 2 seconds pause at bottom, 1 second lifting (concentric). Controlling tempo increases time-under-tension, which is crucial for hypertrophy. Slower eccentrics cause more muscle damage, triggering growth.',
        followUp: 'Should I explain how tempo changes in different phases?',
    },
    supersets: {
        title: 'Supersets',
        explanation: 'Performing two exercises back-to-back with minimal rest. Your plan uses these strategically based on NASM principles: either pairing antagonist muscles (push/pull) for efficiency, or pairing a strength move with a stability move to enhance neural recruitment.',
        followUp: 'Want to know when supersets are most effective?',
    },
    split: {
        title: 'Training Split',
        explanation: 'How workouts are organized across the week. Your plan uses a split optimized for your training frequency. Full Body (2-3 days) hits everything each session, Upper/Lower (4 days) alternates halves, and Push/Pull/Legs (5-6 days) groups by movement pattern for maximum volume.',
    },
    deload: {
        title: 'Deload Week',
        explanation: 'Week 4 in your mesocycle is a deload - reduced intensity (higher RIR) to allow recovery and adaptation. This isn\'t wasting time; it\'s when your body consolidates gains. Think of it as "backing off to come back stronger." Skip deloads and you risk overtraining.',
    },
};

// ============================================
// QUESTION PATTERNS
// ============================================

interface QuestionPattern {
    patterns: RegExp[];
    handler: (context: WisdomContext, planContext?: Plan) => WisdomResponse;
}

const QUESTION_PATTERNS: QuestionPattern[] = [
    // Phase questions
    {
        patterns: [
            /why.*phase/i,
            /what.*phase/i,
            /explain.*phase/i,
            /phase.*mean/i,
        ],
        handler: (context, plan) => {
            const phase = context.phase || plan?.selections.optPhase || 'muscular_development';
            const phaseInfo = PHASE_EXPLANATIONS[phase];

            return {
                content: `**${phaseInfo.name}**\n\n${phaseInfo.description}\n\n🎯 **Focus:** ${phaseInfo.focus}`,
                suggestedFollowUps: [
                    'What comes after this phase?',
                    'How long should I stay in this phase?',
                    'Why not just lift heavy all the time?',
                ],
                conceptsIntroduced: ['phase', 'periodization'],
            };
        },
    },

    // RIR questions
    {
        patterns: [
            /what.*rir/i,
            /rir.*mean/i,
            /reps.*reserve/i,
            /how.*close.*failure/i,
        ],
        handler: () => {
            const concept = CONCEPT_EXPLANATIONS.rir;
            return {
                content: `**${concept.title}**\n\n${concept.explanation}\n\n💡 *${concept.followUp}*`,
                suggestedFollowUps: [
                    'How do I know if I hit the right RIR?',
                    'Why not train to failure every set?',
                    'What if I misjudge my RIR?',
                ],
                conceptsIntroduced: ['rir', 'intensity'],
            };
        },
    },

    // Sets/volume questions
    {
        patterns: [
            /why.*sets/i,
            /how many sets/i,
            /volume/i,
            /enough sets/i,
        ],
        handler: (context, plan) => {
            const experience = plan?.selections.experienceLevel || 'intermediate';
            const volumeRanges = {
                beginner: '8-12 sets per muscle per week',
                intermediate: '12-16 sets per muscle per week',
                advanced: '16-20+ sets per muscle per week',
            };

            return {
                content: `**Training Volume Explained**\n\nAs a **${experience}** lifter, your plan targets ${volumeRanges[experience]}.\n\n${CONCEPT_EXPLANATIONS.volume.explanation}\n\n📊 Research shows this range optimizes the stimulus-to-fatigue ratio for your experience level.`,
                suggestedFollowUps: [
                    'Can I do more sets for faster results?',
                    'How is volume calculated?',
                    'What if I recover faster than average?',
                ],
                conceptsIntroduced: ['volume', 'recovery'],
            };
        },
    },

    // Rest questions
    {
        patterns: [
            /why.*rest/i,
            /rest.*time/i,
            /how long.*rest/i,
            /rest period/i,
        ],
        handler: (context, plan) => {
            const phase = context.phase || plan?.selections.optPhase || 'muscular_development';
            const restGuidelines = {
                stabilization_endurance: '30-60 seconds (keeps heart rate elevated)',
                strength_endurance: '0-60 seconds (maintains metabolic stress)',
                muscular_development: '60-90 seconds (balances recovery and pump)',
                maximal_strength: '3-5 minutes (full neural recovery)',
                power: '1-2 minutes (partial recovery for explosiveness)',
            };

            return {
                content: `**Rest Periods in ${PHASE_EXPLANATIONS[phase].name}**\n\nYour recommended rest: **${restGuidelines[phase]}**\n\nRest isn't laziness - it's strategic! Shorter rest increases metabolic stress (good for hypertrophy), while longer rest allows heavier loads (good for strength). Your phase dictates the sweet spot.`,
                suggestedFollowUps: [
                    'What if I feel ready sooner?',
                    'Should I time my rest strictly?',
                    'How does rest affect muscle growth?',
                ],
                conceptsIntroduced: ['rest', 'recovery'],
            };
        },
    },

    // Exercise swap questions
    {
        patterns: [
            /swap.*exercise/i,
            /replace.*exercise/i,
            /can.*instead/i,
            /substitute/i,
            /alternative/i,
        ],
        handler: () => {
            return {
                content: `**Exercise Substitutions**\n\nYou can swap exercises using the "Swap" button on each exercise card. When substituting, look for exercises that:\n\n1. **Target the same primary muscle groups**\n2. **Use similar movement patterns** (push, pull, hinge, etc.)\n3. **Match your available equipment**\n\nThe swap modal shows suitable alternatives based on these criteria. Your volume and intensity stay the same - only the movement changes.`,
                suggestedFollowUps: [
                    'What if I can\'t do any version of an exercise?',
                    'Are machine exercises as good as free weights?',
                    'How often should I change exercises?',
                ],
                conceptsIntroduced: ['exercise_selection'],
            };
        },
    },

    // Progressive overload questions
    {
        patterns: [
            /progress/i,
            /increase weight/i,
            /when.*add/i,
            /overload/i,
            /get stronger/i,
        ],
        handler: () => {
            const concept = CONCEPT_EXPLANATIONS.progressive_overload;
            return {
                content: `**${concept.title}**\n\n${concept.explanation}\n\n📈 **When to increase weight:**\n- When you consistently hit the top of your rep range at the target RIR\n- Example: Prescribed 8-12 reps @ RIR 2, you hit 12 reps at RIR 2 for 2 sessions → add 2.5-5%`,
                suggestedFollowUps: [
                    'What if I can\'t add weight?',
                    'How much weight should I add?',
                    'What about double progression?',
                ],
                conceptsIntroduced: ['progressive_overload', 'intensity'],
            };
        },
    },

    // General plan questions
    {
        patterns: [
            /why.*plan/i,
            /explain.*plan/i,
            /how.*work/i,
            /structure/i,
        ],
        handler: (context, plan) => {
            const split = plan?.splitType || 'push_pull_legs';
            const days = plan?.selections.daysPerWeek || 4;
            const goal = plan?.selections.goal || 'hypertrophy';
            const phase = context.phase || plan?.selections.optPhase || 'muscular_development';

            const splitNames = {
                full_body: 'Full Body',
                upper_lower: 'Upper/Lower',
                push_pull_legs: 'Push/Pull/Legs',
            };

            return {
                content: `**Your Plan Breakdown**\n\n🗓️ **Split:** ${splitNames[split]} (${days} days/week)\n🎯 **Goal:** ${goal.charAt(0).toUpperCase() + goal.slice(1)}\n📊 **Phase:** ${PHASE_EXPLANATIONS[phase].name}\n\nThis structure was chosen because:\n\n1. **Frequency matches recovery** - ${days} days allows optimal stimulus without overtraining\n2. **Split optimizes volume** - ${splitNames[split]} groups muscles logically for your frequency\n3. **Phase matches goal** - ${PHASE_EXPLANATIONS[phase].focus}`,
                suggestedFollowUps: [
                    'Why this split specifically?',
                    'Can I train more often?',
                    'What\'s next after 4 weeks?',
                ],
                conceptsIntroduced: ['split', 'periodization', 'frequency'],
            };
        },
    },
];

// ============================================
// FALLBACK RESPONSE
// ============================================

function getFallbackResponse(): WisdomResponse {
    return {
        content: `I'm here to help you understand your training! Here are some things I can explain:\n\n• **Your plan structure** - Why it's organized this way\n• **RIR and intensity** - How hard to push\n• **Volume and sets** - Why this amount of work\n• **Exercise selection** - Why these movements\n• **Progression** - How to get stronger over time\n\nWhat would you like to learn about?`,
        suggestedFollowUps: [
            'Explain my current phase',
            'What does RIR mean?',
            'Why this many sets?',
            'How do I progress?',
        ],
    };
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateWisdomResponse(
    question: string,
    context: WisdomContext,
    planContext?: Plan,
    conversationHistory?: WisdomMessage[]
): Promise<WisdomResponse> {
    // Find matching pattern
    for (const pattern of QUESTION_PATTERNS) {
        for (const regex of pattern.patterns) {
            if (regex.test(question)) {
                return pattern.handler(context, planContext);
            }
        }
    }

    // Check for specific concept mentions
    for (const [key, concept] of Object.entries(CONCEPT_EXPLANATIONS)) {
        if (question.toLowerCase().includes(key.replace('_', ' '))) {
            return {
                content: `**${concept.title}**\n\n${concept.explanation}${concept.followUp ? `\n\n💡 *${concept.followUp}*` : ''}`,
                suggestedFollowUps: [
                    'Tell me more about progressive overload',
                    'How does this affect my results?',
                    'What else should I know?',
                ],
                conceptsIntroduced: [key],
            };
        }
    }

    // Fallback response
    return getFallbackResponse();
}

// ============================================
// EXPORTS FOR TESTING
// ============================================

export { PHASE_EXPLANATIONS, CONCEPT_EXPLANATIONS };
