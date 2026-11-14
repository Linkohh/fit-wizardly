/**
 * Short, corny, motivational one-liners shown when hovering a feature card icon
 * on the home page. English only by decision (2026-11-13), like the app's other
 * motivation quotes. All original; keep each one at or under the length cap so
 * the tooltip stays compact.
 */
export const MAX_HOVER_QUIP_LENGTH = 60;

export const HOVER_QUIPS: readonly string[] = [
    'Sweat now, flex later.',
    'Leg day builds character. And legs.',
    'Your couch will miss you. Go anyway.',
    'Reps today, bragging rights tomorrow.',
    'You showed up. The hard part is over.',
    'Warm-ups: because you are not a microwave meal.',
    'One more rep. Okay, two. Fine, three.',
    'Future you says thanks in advance.',
    'Gravity is free. Use it.',
    'Lift things up. Put them down. Feel amazing.',
    'Muscles are just hard work you can see.',
    'Be the person your water bottle believes in.',
    'Rest days are part of the plan. So is this one.',
    'Progress is slow. Quitting is slower.',
    'Small plates still count as plates.',
    'Stronger than yesterday. Sorer too.',
    'You cannot spell "legendary" without "leg day".',
    'The bar is not going to lift itself.',
    'Discipline: doing it even when the playlist is bad.',
    'Every set is a tiny vote for future you.',
    'Do it for the stairs you will not fear.',
    'Sore today, smug tomorrow.',
    'Burpees: character building, allegedly.',
    'Consistency beats intensity. Nap after.',
    'Plans work when you do.',
    'Your only competition is last week.',
    'Stretch like nobody is watching.',
    'Abs are made of patience. And planks.',
    'The first rep is the heaviest.',
    'Wizards train too. Where do you think robes hide gains?',
    'Cast the spell: three sets of ten.',
    'Mana is low? Hydrate.',
    'Level up. No cheat codes needed.',
    'Gains loading. Please do not unplug.',
    'Today’s effort is tomorrow’s warm-up.',
    'Motivation is flaky. Habits show up.',
    'Earn the shower.',
    'You are one workout away from a better mood.',
    'Skip the excuses, not the session.',
    'Slow progress still laps the couch.',
    'Squat like you dropped your phone.',
    'Deadlifts: picking things up, professionally.',
    'Form first. Ego later. Preferably never.',
    'Tired is temporary. Proud lasts all day.',
    'The plan is ready when you are.',
    'Good things come to those who rep.',
    'Showing up is a superpower.',
    'Protein and patience. That is the recipe.',
    'Your muscles have a great memory. Remind them.',
    'A little progress is still a lot of awesome.',
    'Breathe in confidence. Breathe out excuses.',
    'Plot twist: you actually enjoy this.',
    'Stronger is a habit, not a mood.',
    'No magic wand. Just reps. Lots of reps.',
    'Five minutes in, you will be glad you started.',
    'Train like your snacks depend on it.',
    'Rome was not built in a day. Neither were quads.',
    'You versus you. You are going to win.',
    'Cardio: because stairs happen.',
    'Make your warm-up jealous of your workout.',
];

/**
 * Picks a random quip, never the same one twice in a row.
 * `random` is injectable so tests are deterministic.
 */
export function pickHoverQuip(previous?: string, random: () => number = Math.random): string {
    const index = Math.min(Math.floor(random() * HOVER_QUIPS.length), HOVER_QUIPS.length - 1);
    const quip = HOVER_QUIPS[index];

    if (quip !== previous) return quip;
    return HOVER_QUIPS[(index + 1) % HOVER_QUIPS.length];
}
