const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'exerciseLibrary.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updates = {
    "stomach-vacuum": { "steps": ["Stand or sit upright with good posture.", "Exhale completely, forcing all the air out.", "Pull your belly button in toward your spine.", "Hold for 10-20 seconds.", "Release and repeat."] },
    "dead-bug": { "steps": ["Lie on your back with arms extended up and knees bent at 90 degrees.", "Brace your core to keep your lower back flat against the floor.", "Slowly extend one leg and the opposite arm toward the floor.", "Return to the starting position and repeat on the other side."] },
    "bird-dog": { "steps": ["Start on all fours with hands under shoulders and knees under hips.", "Keep your back flat and core engaged.", "Simultaneously extend your right arm forward and your left leg backward.", "Hold for a second, then return to the start and switch sides."] },
    "hollow-body-hold": { "steps": ["Lie flat on your back with arms extended above your head and legs straight.", "Press your lower back firmly into the floor.", "Lift your arms, head, shoulders, and legs slightly off the ground.", "Hold this tension for the desired duration."] },
    "pallof-press": { "steps": ["Stand perpendicular to a cable machine or banded anchor point.", "Hold the handle with both hands at chest level, stepping away to create tension.", "Press the cable straight out in front of you, resisting the pull to rotate.", "Pause, then slowly bring it back to your chest."] },
    "rkc-plank": { "steps": ["Get into a forearm plank position.", "Squeeze your glutes, quads, and core as tightly as possible.", "Pull your elbows toward your toes to create maximum full-body tension.", "Hold for 10-15 seconds."] },
    "swiss-ball-stir-pot": { "steps": ["Get into a forearm plank with your elbows on a stability ball.", "Keep your core tight and body in a straight line.", "Slowly roll your forearms in small circles.", "Change direction after a set number of circles."] },
    "jefferson-curl": { "steps": ["Stand tall on an elevated surface holding a light barbell or kettlebell.", "Tuck your chin to your chest and slowly roll your spine down vertebrae by vertebrae.", "Let the weight pull you into a deep stretch with straight legs.", "Slowly reverse the motion to return to a standing position."] },
    "cat-cow": {
        "description": "Gentle spinal mobility flow alternating between flexion and extension.",
        "steps": ["Start on all fours with a neutral spine.", "Inhale as you arch your back and look up (Cow).", "Exhale as you round your spine toward the ceiling and tuck your chin (Cat).", "Repeat smoothly to mobilize your spine."]
    },
    "bench-press": { "steps": ["Lie flat on a bench, gripping the bar slightly wider than shoulder-width.", "Unrack the barbell, holding it directly over your shoulders.", "Lower the bar with control to your mid-chest.", "Press forcefully back up to the starting position."] },
    "push-up": { "steps": ["Start in a high plank position with hands slightly wider than shoulders.", "Keep your core tight and body straight from head to heels.", "Lower your body until your chest nearly touches the floor.", "Push back up to the starting position."] },
    "overhead-press": { "steps": ["Stand tall with a barbell resting on your upper chest, grasping it slightly wider than shoulder-width.", "Engage your core and squeeze your glutes.", "Press the bar straight up overhead until your arms are fully extended.", "Lower back to the chest under control."] },
    "lateral-raise": { "steps": ["Stand tall holding dumbbells at your sides with a slight bend in your elbows.", "Raise the dumbbells out to the sides until they are level with your shoulders.", "Pause briefly at the top.", "Slowly lower the weights back to the starting position."] },
    "skullcrushers": { "steps": ["Lie on a bench holding an EZ-bar or dumbbells straight up over your chest.", "Keep your upper arms stationary.", "Bend your elbows to lower the weight down toward your forehead.", "Extend your arms back up to the starting position."] },
    "pull-up": { "steps": ["Hang from a pull-up bar with an overhand grip, hands slightly wider than shoulder-width.", "Engage your core and pull your shoulder blades down and back.", "Pull your body up until your chin clears the bar.", "Lower yourself in a controlled motion until your arms are fully extended."] },
    "barbell-row": { "steps": ["Stand with feet shoulder-width apart, holding a barbell with an overhand grip.", "Hinge at the hips until your torso is nearly parallel to the floor.", "Pull the bar toward your lower chest or upper stomach.", "Squeeze your shoulder blades, then slowly lower the bar."] },
    "deadlift": { "steps": ["Stand with mid-foot under the barbell.", "Hinge at the hips and grip the bar outside your knees.", "Flatten your back, lift your chest, and engage your lats.", "Drive through the floor to stand up, keeping the bar close to your body.", "Return the bar to the ground with control."] },
    "squat": { "steps": ["Rest a barbell securely on your upper back/traps.", "Stand with feet shoulder-width apart, core braced.", "Initiate the movement by pushing your hips back and bending your knees.", "Lower yourself until your hips drop below parallel.", "Drive through your feet to stand back up."] },
    "leg-press": { "steps": ["Sit in a leg press machine with feet shoulder-width apart on the sled.", "Release the safety catches and lower the weight slowly until knees are around 90 degrees.", "Drive through your entire foot to push the platform back up.", "Do not forcefully lock out your knees at the top."] },
    "bulgarian-split-squat": { "steps": ["Stand facing away from a bench with one foot resting behind you on it.", "Hold dumbbells at your sides.", "Lower your body until your front thigh is parallel to the ground.", "Push through your front heel to return to the starting position."] },
    "romanian-deadlift": { "steps": ["Stand holding a barbell or dumbbells in front of your thighs.", "Keep your legs mostly straight with a slight knee bend.", "Hinge backward at the hips, lowering the weight until you feel a hamstring stretch.", "Drive your hips forward to stand tall and squeeze your glutes."] },
    "calf-raise": { "steps": ["Stand with the balls of your feet on an elevated block or step.", "Let your heels drop down for a deep stretch.", "Press up onto your toes as high as possible, contracting your calves.", "Slowly lower back to the stretched position."] },
    "cable-crunch": { "steps": ["Kneel facing a cable pulley holding a rope attachment near your head.", "Keep your hips stationary.", "Flex your spine downward, crunching your elbows toward your knees.", "Slowly control the weight back up."] },
    "russian-twist": { "steps": ["Sit on the floor with your knees bent and feet slightly elevated.", "Lean back slightly, keeping your spine straight.", "Hold a weight or medicine ball and twist your torso to one side, touching it to the ground.", "Rotate to the other side and repeat."] },
    "box-jump": {
        "description": "Explosive plyometric movement jumping onto an elevated surface.",
        "steps": ["Stand facing a sturdy box in an athletic stance.", "Swing your arms back and descend into a quarter squat to load your jump.", "Explosively jump up and land softly on the box with both feet.", "Step down carefully—do not jump off backward."]
    },
    "farmers-walk": { "steps": ["Stand tall with heavy dumbbells or kettlebells in each hand.", "Keep your chest up, shoulders back, and core braced.", "Walk forward taking short, quick steps.", "Walk for distance or time, staying upright the entire time."] },
    "face-pulls": { "steps": ["Attach a rope to a cable pulley at upper-chest height.", "Grip the rope and step back to create tension.", "Pull the rope toward your face, letting your elbows flare high and out.", "Squeeze your rear delts and upper back, then slowly release."] },
    "incline-bench": { "steps": ["Set a bench to a 30-45 degree incline.", "Lie back, unrack the barbell or hold dumbbells.", "Lower the weight to your upper chest.", "Press the weight up and slightly back toward your face."] },
    "dips": { "steps": ["Support yourself on parallel bars with your arms fully extended.", "Lean forward slightly to target the chest, or stay upright for triceps.", "Lower your body until your shoulders drop slightly below your elbows.", "Press forcefully back up to the start."] },
    "tricep-pushdown": {
        "description": "Cable isolation exercise targeting the triceps with a pushdown motion.",
        "steps": ["Stand facing a cable machine holding a bar or rope attachment at chest level.", "Keep your elbows pinned to your sides.", "Push the attachment down until your arms are fully extended.", "Control the weight as it comes back up to chest height."]
    },
    "lat-pulldown": { "steps": ["Sit at a lat pulldown machine and grip the bar slightly wider than shoulder-width.", "Keep your torso relatively upright with a slight lean back.", "Pull the bar down toward your upper chest, squeezing your lats.", "Control the bar back to the starting position for a full stretch."] },
    "dumbbell-row": { "steps": ["Place one knee and one hand on a bench, keeping your back flat.", "Hold a dumbbell in your free hand with your arm extended.", "Pull the dumbbell up toward your hip.", "Squeeze your back, then slowly lower the weight."] },
    "bicep-curl": {
        "description": "Classic isolation exercise to build strength and size in the biceps.",
        "steps": ["Stand tall holding a barbell or dumbbells with an underhand grip.", "Keep your elbows tucked against your sides.", "Curl the weight up, contracting your biceps fully at the top.", "Lower the weight in a slow, controlled motion."]
    },
    "hammer-curl": { "steps": ["Stand holding dumbbells with a neutral grip (palms facing your sides).", "Keep your elbows stationary at your sides.", "Curl the weights toward your shoulders.", "Slowly lower them back down."] },
    "leg-curl": {
        "description": "Isolation exercise on a machine targeting the hamstring muscles.",
        "steps": ["Lie face down on a leg curl machine with the pad resting just above your ankles.", "Curl the weight up by pulling your heels toward your glutes.", "Squeeze the hamstrings hard at the peak of the movement.", "Lower the weight with control until your legs are fully extended."]
    },
    "hip-thrust": { "steps": ["Sit on the ground with a bench directly behind your upper back.", "Roll a padded barbell over your hips.", "Plant your feet flat on the floor, shoulder-width apart.", "Drive your hips directly upward, squeezing your glutes at the top.", "Lower your hips back down smoothly."] },
    "hanging-leg-raise": { "steps": ["Hang from a pull-up bar with a firm overhand grip.", "Keep your core tight and limit swinging.", "Raise your legs straight up until they form a 90-degree angle with your torso.", "Lower them back down with control."] },
    "ab-wheel": {
        "description": "Advanced core exercise using a wheel to resist extreme spinal extension.",
        "steps": ["Kneel on a soft pad while holding the handles of an ab wheel.", "Keeping your core tight, roll the wheel slowly out in front of you.", "Go as far out as you can without letting your lower back sag.", "Use your abdominals to pull yourself back to the starting position."]
    },
    "bicycle-crunch": { "steps": ["Lie flat on your back with your hands lightly resting behind your head.", "Lift your legs and bend your knees to 90 degrees.", "Bring one knee toward your chest while simultaneously twisting your opposite elbow to meet it.", "Alternate sides in a smooth, continuous pedaling motion."] },
    "med-ball-slam": { "steps": ["Stand with a non-bouncing medicine ball held in both hands.", "Reach up tall, bringing the ball overhead.", "Forcefully slam the ball straight down into the floor, hinging at your hips and bending your knees.", "Catch the ball as it bounces and repeats."] },
    "plyo-push-up": { "steps": ["Start in a standard push-up position.", "Lower your body until your chest is close to the floor.", "Explode upward with enough force to lift your hands off the ground.", "Land smoothly, immediately descending back into the next rep."] },
    "serratus-punch": { "steps": ["Lie on your back pressing light dumbbells straight up towards the ceiling.", "Without bending your elbows, protract your shoulder blades to push the weights slightly higher.", "Feel the contraction in the sides of your ribcage.", "Retract your shoulder blades to return to the start."] },
    "tibialis-raise": { "steps": ["Lean your back or glutes against a wall, walking your feet out 1-2 feet in front.", "Lock your knees straight.", "Raise your toes and the balls of your feet toward your shins.", "Lower them back to the floor slowly."] },
    "farmers-walk-heavy": { "steps": ["Stand between two heavy farmer’s walk handles or trap bar.", "Deadlift the weight up safely with your chest tall and core braced.", "Take short, rapid, controlled steps forward.", "Maintain posture; drop the weight carefully when you hit your distance or failure."] },
    "sled-push": { "steps": ["Grip the handles of a loaded sled.", "Lean forward, keeping your spine straight and core tight.", "Drive forcefully through your legs to march the sled forward.", "Keep a low, aggressive posture the entire distance."] },
    "planche": { "steps": ["Get into a push-up position, leaning forward slightly over your wrists.", "Protract your shoulders and push them down.", "Lean your weight forward.", "Raise your hips and hold your body perfectly parallel to the ground."] },
    "muscle-up": { "steps": ["Hang from the pull-up bar with a false grip, keeping a slight hollow body.", "Perform an explosive pull-up, driving your chest towards the bar.", "Aggressively transition your chest over the bar.", "Press up out of the dip to full extension."] },
    "landmine-press": { "steps": ["Stand holding the sleeve of a landmine barbell at shoulder height, holding a strong staggered stance.", "Keep your core braced and ribs tucked down.", "Press the bar up and away until your arm is fully locked out.", "Slowly lower it back down to your shoulder."] },
    "renegade-row": { "steps": ["Start in a push-up position with each hand gripping a dumbbell on the floor.", "Spread your feet wider than usual for balance and engage your core tightly.", "Row one dumbbell up to your hip while keeping your torso perfectly still.", "Lower the weight and repeat on the other side."] },
    "beast-crawl": {
        "description": "Primal mobility crawl requiring coordination and full body core stability.",
        "steps": ["Start on all fours with hands under shoulders and knees hovering an inch off the floor.", "Keep your back perfectly flat and level.", "Move forward by stepping with opposing limbs (e.g., right hand, left foot).", "Maintain control and low hips throughout."]
    },
    "running": {
        "description": "Continuous aerobic effort on road or treadmill to build endurance.",
        "steps": ["Start with a quick walking warm-up or dynamic stretch.", "Transition into an easy jog, focusing on a midfoot strike and upright posture.", "Pace yourself appropriately for the intended duration.", "Cool down with walking and stretching."]
    },
    "yoga": { "steps": ["Roll out a mat in a clear space.", "Start with some gentle breath work to center your focus.", "Follow your chosen sequence of poses, linking movement with your breathing.", "Conclude with an extended resting pose (Savasana)."] },
    "foam-rolling": { "steps": ["Place the foam roller on the floor and lie with the target muscle group resting on top.", "Apply appropriate body weight pressure onto the roller.", "Slowly roll back and forth over the length of the muscle.", "Pause for 20-30 seconds on specific tight spots or trigger points."] },
    "clamshells": { "steps": ["Lie on your side with hips stacked and knees bent at 45 degrees.", "Rest your head on your lower arm.", "Keeping your feet together, raise your top knee as high as you can without rolling your hips backward.", "Pause, then slowly lower the knee."] },
    "banded-lateral-walk": { "steps": ["Place a small resistance loop around your ankles or just above your knees.", "Lower into a quarter-squat athletic stance.", "Take a wide, controlled step laterally to the side.", "Follow smoothly with your trailing leg, keeping constant tension."] },
    "single-leg-rdl": { "steps": ["Stand tall, balancing on one foot, holding a dumbbell or kettlebell.", "Hinge forward at the hips, keeping a slight bend in the supporting knee while extending your free leg backward.", "Lower the weight until you feel a deep stretch in your hamstrings.", "Drive your hips back to the standing position."] },
    "decline-bench": { "steps": ["Secure your legs on a decline bench and unrack the barbell.", "Keep your core engaged against the pad.", "Lower the barbell directly to your lower chest.", "Powerfully press the barbell back up."] },
    "frontal-raise": {
        "description": "Shoulder isolation exercise bringing the arms straight out in front to target the anterior delts.",
        "steps": ["Stand or sit holding dumbbells in front of your thighs with a pronated or neutral grip.", "With a slight bend in your elbow, raise the weights straight in front of you.", "Stop when your arms are parallel to the floor.", "Slowly lower the weights back down."]
    },
    "seated-cable-row": { "steps": ["Sit with your feet firmly planted on the platform pads and a slight bend in your knees.", "Grip the attachment and sit upright with a flat back.", "Pull the handle straight toward your stomach or lower chest.", "Squeeze your shoulder blades, then let the cable slowly stretch your back as you return."] },
    "preacher-curl": { "steps": ["Sit down and position your upper arms firmly flat against the angled preacher pad.", "Grip the barbell or dumbbells firmly.", "Curl the weight upward entirely using your biceps.", "Lower the weight with control until your arms are near full extension."] },
    "front-squat": { "steps": ["Rest a barbell securely across your front deltoids and clavicle.", "Keep your chest tall and elbows pointed up.", "Squat straight down, tracking your knees over your toes.", "Drive out of the hole, leading up with your elbows."] },
    "goblet-squat": { "steps": ["Hold a kettlebell or dumbbell vertically against your upper chest.", "Set your feet shoulder width apart and squat down.", "Drop your hips until your elbows touch the inside of your knees.", "Drive through your legs back to a standing position."] },
    "glute-bridge": { "steps": ["Lie face up on the floor with your knees bent and feet flat.", "Brace your core to keep your spine in a neutral position.", "Drive through your heels to raise your hips until your body forms a straight line.", "Squeeze your glutes briefly, then lower down."] },
    "woodchopper": { "steps": ["Stand perpendicular to a cable machine set in a high or low position.", "Grip the handle with both hands.", "Rotate your torso and pull the cable diagonally across your body.", "Keep your arms relatively straight, returning slowly to the start."] },
    "depth-jump": { "steps": ["Stand on top of a plyometric box, focusing straight ahead.", "Step off the edge with one foot—do not jump.", "As both feet hit the ground simultaneously, immediately rebound and explode upward.", "Land softly in an athletic stance."] },
    "neck-flexion": { "steps": ["Lie on a bench with your head hanging off the edge face up, or use a neck harness.", "Place a weight plate on your forehead wrapped in a towel.", "Tuck your chin and curl your neck fully upwards towards your chest.", "Slowly lower your head back."] },
    "sandbag-load": { "steps": ["Stand over a heavy sandbag and grip it by wrapping your arms deeply underneath.", "Powerfully deadlift it to your lap, straddling it wide.", "Re-adjust your grip around the entire bag.", "Drive forcefully with your hips to roll and load the bag onto a platform."] },
    "atlas-stone": { "steps": ["Stand over the stone and straddle it slightly.", "Squat low, crush the stone against your chest with extended, overlapping arms.", "Extend your legs to pull the stone into your lap.", "Hinge back, re-grip the stone tightly, and explode upward to load it."] },
    "front-lever": { "steps": ["Hang from a pull-up bar or gymnastics rings.", "Engage your core, pull your shoulder blades down and back.", "Pivot backward at the shoulders.", "Raise your body to be perfectly parallel to the ground in a straight line."] },
    "human-flag": { "steps": ["Grip a vertical pole firmly.", "Push hard with the bottom arm and pull firmly with the top arm.", "Kick your legs up and engage your entire lateral chain.", "Hold your entire body out parallel to the ground like a flag."] },
    "turkish-get-up": { "steps": ["Lie flat on your back, holding a kettlebell straight up in one hand. Bend the same side knee.", "Roll onto your opposite elbow.", "Push up onto your extended hand.", "Lift your hips high and sweep your straight leg underneath to to a kneeling position.", "Stand up completely, then smoothly reverse back to the floor."] },
    "cossack-squat": { "steps": ["Stand with your feet in a very wide stance.", "Shift your weight to one side, squatting deeply on that leg.", "Keep the other leg completely straight with the toes pointing slightly up.", "Push through the bent leg to return to the center, then repeat on the opposite side."] },
    "crab-walk": { "steps": ["Sit on the floor, place your hands behind your hips, and bend your knees.", "Lift your hips up so your weight rests only on your hands and feet.", "Walk forward or backward by moving opposite hand and opposite foot simultaneously.", "Keep your chest elevated and hips off the ground."] },
    "jump-rope": { "steps": ["Stand upright holding a rope handle in each hand, rope resting behind your heels.", "Flick your wrists to swing the rope overhead.", "Jump slightly over the rope as it passes under your feet.", "Stay light on your toes, maintaining a regular rhythm."] },
    "rowing": { "steps": ["Sit on the ergometer, strap your feet firmly, and grab the handle.", "Start the 'catch' with knees bent and shins vertical, arms extended.", "Power through the 'drive' by pushing with your legs, leaning back slightly, and then pulling the handle.", "Reverse the motion smoothly during the 'recovery' phase."] },
    "dynamic-stretching": { "steps": ["Find an open area.", "Begin performing movements that take your joints slightly past their current range of motion without holding the stretch.", "Move quickly but under control.", "Gradually increase the range to thoroughly warm and mobilize the active muscles."] }
};

let updatedCount = 0;

data.exercises.forEach(ex => {
    if (updates[ex.id]) {
        if (updates[ex.id].description) {
            ex.description = updates[ex.id].description;
        }
        if (updates[ex.id].steps) {
            ex.steps = updates[ex.id].steps;
        }
        updatedCount++;
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
console.log(`Successfully updated ${updatedCount} exercises in exerciseLibrary.json`);

