import * as fs from 'fs';
import * as path from 'path';
import { EXERCISE_DATABASE } from './src/data/exercises';

const updates: Record<string, { description?: string; steps?: string[] }> = {
    "dumbbell_bench_press": { "steps": ["Lie flat on a bench holding dumbbells above your chest.", "Keep your feet flat on the floor and your back slightly arched.", "Lower the dumbbells until they are level with your chest.", "Press them back up, squeezing your chest at the top."] },
    "incline_dumbbell_press": { "steps": ["Set an incline bench to 30-45 degrees.", "Hold dumbbells at shoulder level.", "Press the weights upward until your arms are straight.", "Slowly lower them back to the start position."] },
    "cable_fly": {
        "description": "Chest isolation using a cable machine for continuous tension.",
        "steps": ["Stand in the center of a cable crossover machine.", "Grab the handles and step forward to create tension.", "Keep a slight bend in your elbows and bring your hands together in an arc.", "Control the weight as you slowly return to the starting stretch."]
    },
    "inverted_row": { "steps": ["Set a barbell in a rack at waist height.", "Lie under the bar and grab it with an overhand grip wider than shoulder-width.", "Keep your body in a straight line from head to heels.", "Pull your chest to the bar, then lower yourself down with control."] },
    "chinup": {
        "description": "A vertical bodyweight pull targeting the lats and biceps.",
        "steps": ["Hang from a pull-up bar with an underhand grip.", "Keep your core tight and your chest up.", "Pull your chin over the bar.", "Lower yourself back to a full hang."]
    },
    "dumbbell_shoulder_press": { "steps": ["Sit on a bench with back support or stand tall.", "Hold dumbbells at shoulder height with palms facing forward.", "Press the weights straight up overhead until your arms are fully extended.", "Lower them back to your shoulders slowly."] },
    "bodyweight_squat": { "steps": ["Stand with your feet shoulder-width apart.", "Keep your chest up and push your hips back and down.", "Squat as low as you comfortably can.", "Drive through your heels to return to the standing position."] },
    "kettlebell_swing": { "steps": ["Stand with feet wider than shoulder-width, holding a kettlebell with both hands.", "Hinge at your hips and swing the bell back between your legs.", "Squeeze your glutes and thrust your hips forward to swing the bell to chest height.", "Let it swing back down naturally and repeat."] },
    "walking_lunge": { "steps": ["Stand tall with your feet together.", "Step forward with one leg and lower your hips until both knees are bent at a 90-degree angle.", "Push off your back foot to bring it forward into the next lunge.", "Continue alternating legs as you walk forward."] },
    "split_squat": { "steps": ["Stand in a staggered stance, one foot forward and one back.", "Lower your body straight down until your back knee almost touches the floor.", "Push back up to the starting position.", "Complete reps on one leg before switching."] },
    "bulgarian_split_squat": { "steps": ["Stand facing away from a bench with one foot resting on it behind you.", "Lower your hips until your front thigh is parallel to the ground.", "Keep your chest up and core tight.", "Drive through your front heel to stand back up."] },
    "step_up": {
        "description": "Unilateral leg exercise for building quad and glute strength.",
        "steps": ["Stand in front of a sturdy box or bench.", "Place one foot entirely on the box.", "Drive through that heel to step up, bringing your other foot up.", "Step back down under control and repeat."]
    },
    "barbell_curl": { "steps": ["Stand holding a barbell with an underhand grip, hands shoulder-width apart.", "Keep your elbows pinned to your sides.", "Curl the bar up toward your shoulders, squeezing your biceps.", "Lower the bar back down slowly."] },
    "dumbbell_curl": { "steps": ["Stand holding a dumbbell in each hand with palms facing forward.", "Keep your upper arms stationary.", "Curl the weights toward your shoulders.", "Slowly lower them back to the starting position."] },
    "skull_crusher": { "steps": ["Lie on a bench holding an EZ bar or dumbbells straight above your chest.", "Keep your upper arms locked in place.", "Bend your elbows to lower the weight toward your forehead.", "Extend your arms to push the weight back up."] },
    "overhead_tricep_extension": { "steps": ["Stand or sit holding a dumbbell or cable rope behind your neck.", "Keep your elbows pointing straight up.", "Extend your arms to raise the weight overhead.", "Slowly lower it back behind your head."] },
    "seated_calf_raise": { "steps": ["Sit on a calf raise machine with the pads resting above your knees.", "Lower your heels for a deep stretch.", "Press up onto the balls of your feet, contracting your calves.", "Slowly return to the start position."] },
    "farmers_carry": { "steps": ["Stand between two heavy dumbbells or kettlebells.", "Deadlift them up with a straight back.", "Walk forward with short, quick steps while keeping your chest tall.", "Carefully set the weights down once you reach your target distance."] },
    "shrug": { "steps": ["Stand holding dumbbells or a barbell at your sides.", "Keep your arms straight.", "Shrug your shoulders up toward your ears.", "Squeeze at the top, then lower slowly."] },
    "single_leg_squat": { "steps": ["Stand on one leg with your other leg extended out in front of you.", "Push your hips back and squat down as low as possible on the standing leg.", "Keep your chest up and balance steady.", "Drive through your heel to stand back up."] },
    "single_leg_rdl": { "steps": ["Stand balancing on one leg, holding a weight in the opposite hand.", "Keeping a slight bend in your standing knee, hinge forward at the hips.", "Extend your free leg straight back behind you.", "Return to standing and squeeze your glute."] },
    "stability_ball_plank": { "steps": ["Place your forearms on top of a stability ball.", "Step your feet back into a plank position.", "Keep your body perfectly straight and your core extremely tight.", "Hold the position without letting your hips sag."] },
    "squat_jump": {
        "description": "Explosive jumping variation of the squat to develop leg power.",
        "steps": ["Stand in an athletic stance with feet shoulder-width apart.", "Squat down by pushing your hips back.", "Explode straight upward, jumping as high as you can.", "Land softly and immediately go into the next repetition."]
    },
    "medicine_ball_chest_pass": { "steps": ["Stand facing a wall or a partner, holding a medicine ball at chest level.", "Keep your core braced and knees slightly bent.", "Explosively push the ball forward as hard as you can.", "Catch the rebound and repeat the motion quickly."] },
    "band_hip_adductions": { "steps": ["Anchor a resistance band low and loop it around the ankle closest to the anchor.", "Stand tall and hold onto a steady surface.", "Sweep the banded leg across your body in front of your other leg.", "Slowly return the leg to the starting position against the resistance."] },
    "barbell_squat_to_a_bench": { "steps": ["Set a bench or box behind you and rest a barbell on your upper back.", "Squat down by sitting your hips back until your glutes lightly tap the bench.", "Do not completely rest your weight on the bench.", "Drive back up to a standing position."] },
    "bicycling": { "steps": ["Adjust the bike seat so your leg is almost fully extended at the bottom pedal stroke.", "Keep your chest up and grip the handles comfortably.", "Pedal at a steady, consistent cadence.", "Increase resistance slightly if it feels too easy or your hips bounce."] },
    "body_up": { "steps": ["Start in a standard forearm plank position.", "Press both hands flat into the floor to lift your elbows off the ground simultaneously.", "Straighten your arms fully into a high plank.", "Lower yourself back down to your forearms with control."] },
    "clean": { "steps": ["Start with a barbell on the floor, gripping it just outside your legs.", "Pull the bar up powerfully, fully extending your hips, knees, and ankles.", "Shrug your shoulders and drop quickly under the bar.", "Catch the bar on your shoulders in a front squat position, then stand tall."] },
    "close_grip_ez_bar_press": { "steps": ["Lie on a bench holding an EZ-bar with hands close together on the inner grips.", "Lower the bar to your lower chest, keeping your elbows tucked close to your body.", "Press the bar straight back up to full extension.", "Focus on squeezing your triceps at the top."] },
    "ez_bar_skullcrusher": { "steps": ["Lie flat on a bench and press an EZ-bar straight above your chest.", "Keep your upper arms locked pointing straight up.", "Lower the bar by bending your elbows until it is just above your forehead.", "Extend your elbows to press the weight back to the top."] },
    "iron_cross": {
        "description": "Advanced gymnastics ring movement demonstrating extreme upper body strength.",
        "steps": ["Support yourself on gymnastics rings with arms straight by your sides.", "Slowly push the rings directly outward away from your body.", "Lower until your arms are perfectly parallel to the floor in a cross shape.", "Hold the position, keeping your core and shoulders highly engaged."]
    },
    "on_your_back_quad_stretch": { "steps": ["Lie face up on the floor or a mat.", "Bend one knee and grab your ankle or foot with your hand.", "Gently pull your heel toward your glute until you feel a stretch in the front of your thigh.", "Hold the stretch for 20-30 seconds, then switch legs."] },
    "one_arm_kettlebell_row": { "steps": ["Place one knee and hand on a bench while holding a kettlebell in your other hand.", "Keep your back flat and core tight.", "Pull the kettlebell up toward your hip, keeping your elbow close to your body.", "Lower the weight slowly under full control."] },
    "one_arm_kettlebell_swings": {
        "description": "Unilateral kettlebell swing to build power and challenge rotational core stability.",
        "steps": ["Stand in a wide stance, holding a kettlebell with one hand between your legs.", "Hinge sideways slightly, then thrust your hips forward to swing the bell to chest height.", "Keep your torso square; do not let the weight twist your body.", "Let it drop and hinge again for the next rep."]
    },
    "one_handed_hang": { "steps": ["Grip a pull-up bar firmly with one hand.", "Remove your other hand and let your body hang entirely from the single working arm.", "Keep your shoulder engaged (don't totally relax the joint) and your core tight.", "Hold for time, then repeat on the other arm."] },
    "push_press": {
        "description": "Explosive overhead press using leg drive to lift heavier weights.",
        "steps": ["Hold a barbell resting across your upper chest and shoulders.", "Dip your knees slightly while keeping your torso perfectly upright.", "Explosively drive up through your legs and press the bar overhead simultaneously.", "Lock the arms out, then safely return the bar to your chest."]
    },
    "shoulder_raise": { "steps": ["Stand holding dumbbells at your sides.", "Raise your arms straight out to the sides (lateral) or in front of you (frontal) depending on the variation.", "Stop when the weights reach shoulder level.", "Slowly lower them back to the start."] },
    "shoulder_stretch": { "steps": ["Stand or sit upright.", "Bring one arm straight across your chest.", "Use your other arm to gently pull the extended arm closer to your body until you feel a stretch.", "Hold for 20-30 seconds, then switch sides."] },
    "side_bridge": {
        "description": "Lateral core stability exercise targeting the obliques.",
        "steps": ["Lie on your side, resting on your forearm with your elbow directly beneath your shoulder.", "Stack your feet on top of each other.", "Lift your hips off the ground so your body forms a straight line.", "Hold this position, bracing your core tightly."]
    },
    "side_jackknife": {
        "description": "Dynamic oblique crunch performed on your side.",
        "steps": ["Lie on your side with your legs straight and stacked.", "Place the hand of your top arm behind your head.", "Simultaneously lift your top leg and your torso, bringing your elbow toward your leg.", "Lower back down with control."]
    },
    "triceps_stretch": { "steps": ["Stand or sit up straight.", "Raise one arm toward the ceiling, then bend your elbow to touch your upper back.", "Use your other hand to gently push the bent elbow further back.", "Hold the stretch for 20-30 seconds and repeat on the other side."] },
    "tricep_side_stretch": { "steps": ["Reach one arm straight across your body to the opposite side.", "Use your other hand or arm to pull the stretched arm closer to your chest.", "Keep your shoulder pressed down away from your ear.", "Feel the stretch across the back of the arm and hold."] },
    "two_arm_kettlebell_jerk": { "steps": ["Hold two kettlebells in the rack position at your chest.", "Dip slightly at the knees, keeping your torso vertical.", "Explosively drive upward with your legs to propel the bells off your chest.", "Quickly dip under the bells, locking your arms out overhead, then stand up tall."] },
    "upper_back_stretch": { "steps": ["Stand tall or sit up straight.", "Clasp your hands together in front of you with arms fully extended.", "Round your upper back and push your hands as far away as possible.", "Tuck your chin to your chest and hold the stretch."] }
};

let appliedCount = 0;

EXERCISE_DATABASE.forEach(ex => {
    if (updates[ex.id]) {
        if (updates[ex.id].description) {
            ex.description = updates[ex.id].description as string;
        }
        if (updates[ex.id].steps) {
            ex.steps = updates[ex.id].steps as string[];
        }
        appliedCount++;
    }
});

console.log(`Applied manual updates to ${appliedCount} exercises.`);

const tsPath = path.join(process.cwd(), 'src', 'data', 'exercises.ts');
const newTsContent = `import type { Exercise } from '@/types/fitness';\n\n// Generated automatically by migration script\nexport const EXERCISE_DATABASE: Exercise[] = ${JSON.stringify(EXERCISE_DATABASE, null, 2)};\n`;

fs.writeFileSync(tsPath, newTsContent, 'utf8');
console.log('Saved final manual updates to exercises.ts');
