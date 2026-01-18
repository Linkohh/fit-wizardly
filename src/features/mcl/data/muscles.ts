import { Muscle } from '../types';

/**
 * Anatomically accurate muscle data with proper human body proportions
 *
 * ViewBox: 200 x 440 (width x height)
 * Based on 8-head proportion rule:
 * - Head: 0-55 (1 head)
 * - Neck to shoulders: 55-70
 * - Chest/upper torso: 70-140
 * - Core/abs: 140-200
 * - Hips/pelvis: 200-230
 * - Upper legs: 230-330
 * - Lower legs: 330-410
 * - Feet: 410-440
 *
 * Center line: x=100
 * Shoulder width: 30-170
 * Waist width: 65-135
 * Hip width: 60-140
 */

export const muscles: Muscle[] = [
  // ==================== CHEST (FRONT VIEW) ====================
  {
    id: 'pectoralis-major-left',
    name: 'Pectoralis Major (Left)',
    scientificName: 'Pectoralis Major',
    group: 'chest',
    function: 'Arm adduction, medial rotation, and flexion of the shoulder',
    exercises: ['Bench Press', 'Push-ups', 'Chest Fly', 'Dips'],
    views: ['front'],
    relatedMuscles: ['pectoralis-major-right', 'anterior-deltoid-left'],
    paths: {
      front: 'M100,85 L100,90 C95,92 85,95 75,100 C65,105 55,108 50,105 L45,95 C43,88 48,80 58,78 C70,76 85,78 100,85 Z'
    }
  },
  {
    id: 'pectoralis-major-right',
    name: 'Pectoralis Major (Right)',
    scientificName: 'Pectoralis Major',
    group: 'chest',
    function: 'Arm adduction, medial rotation, and flexion of the shoulder',
    exercises: ['Bench Press', 'Push-ups', 'Chest Fly', 'Dips'],
    views: ['front'],
    relatedMuscles: ['pectoralis-major-left', 'anterior-deltoid-right'],
    paths: {
      front: 'M100,85 L100,90 C105,92 115,95 125,100 C135,105 145,108 150,105 L155,95 C157,88 152,80 142,78 C130,76 115,78 100,85 Z'
    }
  },
  {
    id: 'serratus-anterior-left',
    name: 'Serratus Anterior (Left)',
    scientificName: 'Serratus Anterior',
    group: 'chest',
    function: 'Protracts and rotates scapula upward',
    exercises: ['Push-ups Plus', 'Scapular Push-ups', 'Ab Rollout'],
    views: ['front', 'side'],
    relatedMuscles: ['external-oblique-left', 'pectoralis-major-left'],
    paths: {
      front: 'M55,108 L50,112 L48,120 L52,118 M52,118 L48,126 L52,124 M52,124 L50,132 L55,128 L60,115 Z',
      side: 'M70,100 L65,108 L62,130 L70,125 Z'
    }
  },
  {
    id: 'serratus-anterior-right',
    name: 'Serratus Anterior (Right)',
    scientificName: 'Serratus Anterior',
    group: 'chest',
    function: 'Protracts and rotates scapula upward',
    exercises: ['Push-ups Plus', 'Scapular Push-ups', 'Ab Rollout'],
    views: ['front', 'side'],
    relatedMuscles: ['external-oblique-right', 'pectoralis-major-right'],
    paths: {
      front: 'M145,108 L150,112 L152,120 L148,118 M148,118 L152,126 L148,124 M148,124 L150,132 L145,128 L140,115 Z'
    }
  },

  // ==================== SHOULDERS ====================
  {
    id: 'anterior-deltoid-left',
    name: 'Anterior Deltoid (Left)',
    scientificName: 'Deltoideus Anterior',
    group: 'shoulders',
    function: 'Shoulder flexion and medial rotation',
    exercises: ['Shoulder Press', 'Front Raise', 'Arnold Press'],
    views: ['front', 'side'],
    relatedMuscles: ['lateral-deltoid-left', 'pectoralis-major-left'],
    paths: {
      front: 'M58,78 C50,75 42,78 38,85 L35,100 C38,108 45,110 50,105 L55,95 C56,88 56,82 58,78 Z',
      side: 'M85,75 C78,72 72,75 70,82 L68,95 C70,102 76,105 82,100 L85,88 Z'
    }
  },
  {
    id: 'anterior-deltoid-right',
    name: 'Anterior Deltoid (Right)',
    scientificName: 'Deltoideus Anterior',
    group: 'shoulders',
    function: 'Shoulder flexion and medial rotation',
    exercises: ['Shoulder Press', 'Front Raise', 'Arnold Press'],
    views: ['front'],
    relatedMuscles: ['lateral-deltoid-right', 'pectoralis-major-right'],
    paths: {
      front: 'M142,78 C150,75 158,78 162,85 L165,100 C162,108 155,110 150,105 L145,95 C144,88 144,82 142,78 Z'
    }
  },
  {
    id: 'lateral-deltoid-left',
    name: 'Lateral Deltoid (Left)',
    scientificName: 'Deltoideus Lateralis',
    group: 'shoulders',
    function: 'Shoulder abduction',
    exercises: ['Lateral Raise', 'Upright Row', 'Shoulder Press'],
    views: ['front', 'back', 'side'],
    relatedMuscles: ['anterior-deltoid-left', 'posterior-deltoid-left'],
    paths: {
      front: 'M38,85 C32,82 26,88 25,95 L27,110 C30,115 35,112 38,108 L35,100 Z',
      back: 'M38,85 C32,82 26,88 25,95 L27,110 C30,115 35,112 38,108 L35,100 Z',
      side: 'M75,78 C68,75 62,80 60,90 L62,108 C65,115 72,112 75,105 Z'
    }
  },
  {
    id: 'lateral-deltoid-right',
    name: 'Lateral Deltoid (Right)',
    scientificName: 'Deltoideus Lateralis',
    group: 'shoulders',
    function: 'Shoulder abduction',
    exercises: ['Lateral Raise', 'Upright Row', 'Shoulder Press'],
    views: ['front', 'back'],
    relatedMuscles: ['anterior-deltoid-right', 'posterior-deltoid-right'],
    paths: {
      front: 'M162,85 C168,82 174,88 175,95 L173,110 C170,115 165,112 162,108 L165,100 Z',
      back: 'M162,85 C168,82 174,88 175,95 L173,110 C170,115 165,112 162,108 L165,100 Z'
    }
  },
  {
    id: 'posterior-deltoid-left',
    name: 'Posterior Deltoid (Left)',
    scientificName: 'Deltoideus Posterior',
    group: 'shoulders',
    function: 'Shoulder extension and lateral rotation',
    exercises: ['Reverse Fly', 'Face Pulls', 'Bent Over Raises'],
    views: ['back', 'side'],
    relatedMuscles: ['lateral-deltoid-left', 'trapezius-middle'],
    paths: {
      back: 'M55,78 C48,75 40,78 36,85 L33,100 C36,108 42,110 48,105 L52,95 C53,88 53,82 55,78 Z',
      side: 'M60,78 C55,75 50,80 48,90 L50,105 C55,110 62,105 65,95 Z'
    }
  },
  {
    id: 'posterior-deltoid-right',
    name: 'Posterior Deltoid (Right)',
    scientificName: 'Deltoideus Posterior',
    group: 'shoulders',
    function: 'Shoulder extension and lateral rotation',
    exercises: ['Reverse Fly', 'Face Pulls', 'Bent Over Raises'],
    views: ['back'],
    relatedMuscles: ['lateral-deltoid-right', 'trapezius-middle'],
    paths: {
      back: 'M145,78 C152,75 160,78 164,85 L167,100 C164,108 158,110 152,105 L148,95 C147,88 147,82 145,78 Z'
    }
  },

  // ==================== BACK ====================
  {
    id: 'trapezius-upper',
    name: 'Upper Trapezius',
    scientificName: 'Trapezius (Superior)',
    group: 'back',
    function: 'Elevates and rotates scapula, extends neck',
    exercises: ['Shrugs', 'Upright Rows', 'Face Pulls'],
    views: ['back', 'front'],
    relatedMuscles: ['trapezius-middle', 'levator-scapulae'],
    paths: {
      back: 'M100,55 L60,72 C55,75 55,80 58,82 L100,70 L142,82 C145,80 145,75 140,72 Z',
      front: 'M100,55 L75,68 C72,70 72,74 75,76 L100,70 L125,76 C128,74 128,70 125,68 Z'
    }
  },
  {
    id: 'trapezius-middle',
    name: 'Middle Trapezius',
    scientificName: 'Trapezius (Middle)',
    group: 'back',
    function: 'Retracts scapula',
    exercises: ['Face Pulls', 'Rows', 'Reverse Fly'],
    views: ['back'],
    relatedMuscles: ['trapezius-upper', 'trapezius-lower', 'rhomboids'],
    paths: {
      back: 'M58,82 L55,85 L52,100 L58,95 L100,85 L142,95 L148,100 L145,85 L142,82 L100,70 Z'
    }
  },
  {
    id: 'trapezius-lower',
    name: 'Lower Trapezius',
    scientificName: 'Trapezius (Inferior)',
    group: 'back',
    function: 'Depresses and rotates scapula',
    exercises: ['Y-Raises', 'Prone Trap Raise', 'Face Pulls'],
    views: ['back'],
    relatedMuscles: ['trapezius-middle', 'rhomboids'],
    paths: {
      back: 'M100,85 L85,95 L80,115 L100,140 L120,115 L115,95 Z'
    }
  },
  {
    id: 'latissimus-dorsi-left',
    name: 'Latissimus Dorsi (Left)',
    scientificName: 'Latissimus Dorsi',
    group: 'back',
    function: 'Arm adduction, extension, and medial rotation',
    exercises: ['Pull-ups', 'Lat Pulldown', 'Rows', 'Deadlift'],
    views: ['back', 'side'],
    relatedMuscles: ['latissimus-dorsi-right', 'teres-major-left'],
    paths: {
      back: 'M52,100 L48,108 C42,125 40,145 45,165 L55,185 C60,192 68,195 75,190 L85,175 L95,145 L100,120 L90,105 L75,100 Z',
      side: 'M60,100 C55,110 52,130 55,150 L60,175 C65,185 75,180 80,165 L82,130 L75,105 Z'
    }
  },
  {
    id: 'latissimus-dorsi-right',
    name: 'Latissimus Dorsi (Right)',
    scientificName: 'Latissimus Dorsi',
    group: 'back',
    function: 'Arm adduction, extension, and medial rotation',
    exercises: ['Pull-ups', 'Lat Pulldown', 'Rows', 'Deadlift'],
    views: ['back'],
    relatedMuscles: ['latissimus-dorsi-left', 'teres-major-right'],
    paths: {
      back: 'M148,100 L152,108 C158,125 160,145 155,165 L145,185 C140,192 132,195 125,190 L115,175 L105,145 L100,120 L110,105 L125,100 Z'
    }
  },
  {
    id: 'rhomboid-left',
    name: 'Rhomboid (Left)',
    scientificName: 'Rhomboideus',
    group: 'back',
    function: 'Retracts and elevates scapula',
    exercises: ['Rows', 'Face Pulls', 'Reverse Fly'],
    views: ['back'],
    relatedMuscles: ['rhomboid-right', 'trapezius-middle'],
    paths: {
      back: 'M75,85 L85,82 L90,100 L85,115 L75,110 Z'
    }
  },
  {
    id: 'rhomboid-right',
    name: 'Rhomboid (Right)',
    scientificName: 'Rhomboideus',
    group: 'back',
    function: 'Retracts and elevates scapula',
    exercises: ['Rows', 'Face Pulls', 'Reverse Fly'],
    views: ['back'],
    relatedMuscles: ['rhomboid-left', 'trapezius-middle'],
    paths: {
      back: 'M125,85 L115,82 L110,100 L115,115 L125,110 Z'
    }
  },
  {
    id: 'teres-major-left',
    name: 'Teres Major (Left)',
    scientificName: 'Teres Major',
    group: 'back',
    function: 'Arm adduction and medial rotation',
    exercises: ['Lat Pulldown', 'Rows', 'Pull-ups'],
    views: ['back'],
    relatedMuscles: ['latissimus-dorsi-left', 'teres-minor-left'],
    paths: {
      back: 'M52,95 L48,100 L50,112 L58,108 L55,98 Z'
    }
  },
  {
    id: 'teres-major-right',
    name: 'Teres Major (Right)',
    scientificName: 'Teres Major',
    group: 'back',
    function: 'Arm adduction and medial rotation',
    exercises: ['Lat Pulldown', 'Rows', 'Pull-ups'],
    views: ['back'],
    relatedMuscles: ['latissimus-dorsi-right', 'teres-minor-right'],
    paths: {
      back: 'M148,95 L152,100 L150,112 L142,108 L145,98 Z'
    }
  },
  {
    id: 'infraspinatus-left',
    name: 'Infraspinatus (Left)',
    scientificName: 'Infraspinatus',
    group: 'back',
    function: 'Lateral rotation of arm (rotator cuff)',
    exercises: ['Face Pulls', 'External Rotation'],
    views: ['back'],
    relatedMuscles: ['teres-minor-left', 'supraspinatus-left'],
    paths: {
      back: 'M55,85 L75,82 L78,100 L75,115 L55,108 L52,95 Z'
    }
  },
  {
    id: 'infraspinatus-right',
    name: 'Infraspinatus (Right)',
    scientificName: 'Infraspinatus',
    group: 'back',
    function: 'Lateral rotation of arm (rotator cuff)',
    exercises: ['Face Pulls', 'External Rotation'],
    views: ['back'],
    relatedMuscles: ['teres-minor-right', 'supraspinatus-right'],
    paths: {
      back: 'M145,85 L125,82 L122,100 L125,115 L145,108 L148,95 Z'
    }
  },
  {
    id: 'erector-spinae',
    name: 'Erector Spinae',
    scientificName: 'Erector Spinae',
    group: 'back',
    function: 'Spinal extension and lateral flexion',
    exercises: ['Deadlift', 'Back Extension', 'Good Morning'],
    views: ['back'],
    relatedMuscles: ['multifidus', 'quadratus-lumborum'],
    paths: {
      back: 'M92,120 L95,120 L98,200 L95,205 L92,205 Z M108,120 L105,120 L102,200 L105,205 L108,205 Z'
    }
  },

  // ==================== ARMS - BICEPS ====================
  {
    id: 'biceps-left',
    name: 'Biceps (Left)',
    scientificName: 'Biceps Brachii',
    group: 'arms',
    function: 'Elbow flexion and forearm supination',
    exercises: ['Bicep Curls', 'Chin-ups', 'Hammer Curls'],
    views: ['front', 'side'],
    relatedMuscles: ['biceps-right', 'brachialis-left'],
    paths: {
      front: 'M30,112 C26,115 23,125 22,140 L22,165 C23,175 27,178 32,175 L35,165 L37,140 C38,125 36,115 30,112 Z',
      side: 'M72,108 C68,112 65,125 65,145 L66,170 C68,178 74,178 78,172 L80,145 C80,125 78,112 72,108 Z'
    }
  },
  {
    id: 'biceps-right',
    name: 'Biceps (Right)',
    scientificName: 'Biceps Brachii',
    group: 'arms',
    function: 'Elbow flexion and forearm supination',
    exercises: ['Bicep Curls', 'Chin-ups', 'Hammer Curls'],
    views: ['front'],
    relatedMuscles: ['biceps-left', 'brachialis-right'],
    paths: {
      front: 'M170,112 C174,115 177,125 178,140 L178,165 C177,175 173,178 168,175 L165,165 L163,140 C162,125 164,115 170,112 Z'
    }
  },
  {
    id: 'brachialis-left',
    name: 'Brachialis (Left)',
    scientificName: 'Brachialis',
    group: 'arms',
    function: 'Elbow flexion (primary flexor)',
    exercises: ['Hammer Curls', 'Reverse Curls'],
    views: ['front', 'side'],
    relatedMuscles: ['biceps-left', 'brachioradialis-left'],
    paths: {
      front: 'M25,165 C22,168 20,175 20,182 L22,195 C24,200 28,198 30,192 L32,180 C33,172 30,166 25,165 Z',
      side: 'M68,165 C65,168 63,178 64,188 L66,198 C68,202 72,200 74,195 L75,180 C75,170 72,165 68,165 Z'
    }
  },
  {
    id: 'brachialis-right',
    name: 'Brachialis (Right)',
    scientificName: 'Brachialis',
    group: 'arms',
    function: 'Elbow flexion (primary flexor)',
    exercises: ['Hammer Curls', 'Reverse Curls'],
    views: ['front'],
    relatedMuscles: ['biceps-right', 'brachioradialis-right'],
    paths: {
      front: 'M175,165 C178,168 180,175 180,182 L178,195 C176,200 172,198 170,192 L168,180 C167,172 170,166 175,165 Z'
    }
  },

  // ==================== ARMS - TRICEPS ====================
  {
    id: 'triceps-left',
    name: 'Triceps (Left)',
    scientificName: 'Triceps Brachii',
    group: 'arms',
    function: 'Elbow extension',
    exercises: ['Tricep Pushdown', 'Dips', 'Close-Grip Bench'],
    views: ['back', 'side'],
    relatedMuscles: ['triceps-right'],
    paths: {
      back: 'M30,112 C24,115 20,128 18,145 L18,175 C20,185 26,188 32,182 L35,165 L38,140 C40,125 38,115 30,112 Z',
      side: 'M58,108 C52,112 48,128 48,150 L50,178 C52,186 58,186 62,180 L65,150 C65,128 62,112 58,108 Z'
    }
  },
  {
    id: 'triceps-right',
    name: 'Triceps (Right)',
    scientificName: 'Triceps Brachii',
    group: 'arms',
    function: 'Elbow extension',
    exercises: ['Tricep Pushdown', 'Dips', 'Close-Grip Bench'],
    views: ['back'],
    relatedMuscles: ['triceps-left'],
    paths: {
      back: 'M170,112 C176,115 180,128 182,145 L182,175 C180,185 174,188 168,182 L165,165 L162,140 C160,125 162,115 170,112 Z'
    }
  },

  // ==================== ARMS - FOREARMS ====================
  {
    id: 'forearm-flexors-left',
    name: 'Forearm Flexors (Left)',
    scientificName: 'Flexor Carpi Group',
    group: 'arms',
    function: 'Wrist flexion and grip strength',
    exercises: ['Wrist Curls', 'Farmer Walks'],
    views: ['front'],
    relatedMuscles: ['brachioradialis-left', 'forearm-extensors-left'],
    paths: {
      front: 'M22,195 C18,200 15,215 14,235 L15,260 C17,268 22,268 25,262 L27,235 C28,215 26,200 22,195 Z'
    }
  },
  {
    id: 'forearm-flexors-right',
    name: 'Forearm Flexors (Right)',
    scientificName: 'Flexor Carpi Group',
    group: 'arms',
    function: 'Wrist flexion and grip strength',
    exercises: ['Wrist Curls', 'Farmer Walks'],
    views: ['front'],
    relatedMuscles: ['brachioradialis-right', 'forearm-extensors-right'],
    paths: {
      front: 'M178,195 C182,200 185,215 186,235 L185,260 C183,268 178,268 175,262 L173,235 C172,215 174,200 178,195 Z'
    }
  },
  {
    id: 'forearm-extensors-left',
    name: 'Forearm Extensors (Left)',
    scientificName: 'Extensor Carpi Group',
    group: 'arms',
    function: 'Wrist extension and grip strength',
    exercises: ['Reverse Wrist Curls', 'Farmer Walks'],
    views: ['back'],
    relatedMuscles: ['brachioradialis-left', 'forearm-flexors-left'],
    paths: {
      back: 'M20,195 C16,200 13,218 12,240 L13,265 C15,272 20,272 24,265 L26,240 C27,218 24,200 20,195 Z'
    }
  },
  {
    id: 'forearm-extensors-right',
    name: 'Forearm Extensors (Right)',
    scientificName: 'Extensor Carpi Group',
    group: 'arms',
    function: 'Wrist extension and grip strength',
    exercises: ['Reverse Wrist Curls', 'Farmer Walks'],
    views: ['back'],
    relatedMuscles: ['brachioradialis-right', 'forearm-flexors-right'],
    paths: {
      back: 'M180,195 C184,200 187,218 188,240 L187,265 C185,272 180,272 176,265 L174,240 C173,218 176,200 180,195 Z'
    }
  },

  // ==================== ARMS - BRACHIORADIALIS ====================
  {
    id: 'brachioradialis-left',
    name: 'Brachioradialis (Left)',
    scientificName: 'Brachioradialis',
    group: 'arms',
    function: 'Elbow flexion with forearm in neutral position',
    exercises: ['Hammer Curls', 'Reverse Curls', 'Chin-ups'],
    views: ['front', 'side'],
    relatedMuscles: ['brachioradialis-right', 'biceps-left', 'brachialis-left'],
    paths: {
      front: 'M28,178 C24,185 22,200 20,220 L19,245 C20,252 24,252 28,248 L30,220 C31,200 30,185 28,178 Z',
      side: 'M70,175 C66,182 64,200 63,222 L63,248 C65,255 70,255 74,250 L76,222 C76,200 74,182 70,175 Z'
    }
  },
  {
    id: 'brachioradialis-right',
    name: 'Brachioradialis (Right)',
    scientificName: 'Brachioradialis',
    group: 'arms',
    function: 'Elbow flexion with forearm in neutral position',
    exercises: ['Hammer Curls', 'Reverse Curls', 'Chin-ups'],
    views: ['front'],
    relatedMuscles: ['brachioradialis-left', 'biceps-right', 'brachialis-right'],
    paths: {
      front: 'M172,178 C176,185 178,200 180,220 L181,245 C180,252 176,252 172,248 L170,220 C169,200 170,185 172,178 Z'
    }
  },

  // ==================== CORE / ABS ====================
  {
    id: 'rectus-abdominis',
    name: 'Rectus Abdominis',
    scientificName: 'Rectus Abdominis',
    group: 'core',
    function: 'Trunk flexion and compression of abdomen',
    exercises: ['Crunches', 'Leg Raises', 'Planks'],
    views: ['front'],
    relatedMuscles: ['external-oblique-left', 'external-oblique-right'],
    paths: {
      front: 'M88,105 L88,195 L100,200 L112,195 L112,105 L100,100 Z'
    }
  },
  {
    id: 'abs-upper',
    name: 'Upper Abs',
    scientificName: 'Rectus Abdominis (Superior)',
    group: 'core',
    function: 'Upper trunk flexion',
    exercises: ['Crunches', 'Cable Crunches'],
    views: ['front'],
    relatedMuscles: ['rectus-abdominis'],
    paths: {
      front: 'M90,108 L90,130 L100,133 L110,130 L110,108 L100,105 Z'
    }
  },
  {
    id: 'abs-middle',
    name: 'Middle Abs',
    scientificName: 'Rectus Abdominis (Middle)',
    group: 'core',
    function: 'Core stabilization',
    exercises: ['Planks', 'Dead Bug'],
    views: ['front'],
    relatedMuscles: ['rectus-abdominis'],
    paths: {
      front: 'M90,133 L90,158 L100,162 L110,158 L110,133 L100,136 Z'
    }
  },
  {
    id: 'abs-lower',
    name: 'Lower Abs',
    scientificName: 'Rectus Abdominis (Inferior)',
    group: 'core',
    function: 'Pelvic tilt and lower trunk flexion',
    exercises: ['Leg Raises', 'Reverse Crunches'],
    views: ['front'],
    relatedMuscles: ['rectus-abdominis'],
    paths: {
      front: 'M90,162 L90,192 L100,198 L110,192 L110,162 L100,166 Z'
    }
  },
  {
    id: 'external-oblique-left',
    name: 'External Oblique (Left)',
    scientificName: 'Obliquus Externus Abdominis',
    group: 'core',
    function: 'Trunk rotation and lateral flexion',
    exercises: ['Russian Twists', 'Side Planks'],
    views: ['front', 'side'],
    relatedMuscles: ['internal-oblique-left', 'rectus-abdominis'],
    paths: {
      front: 'M60,115 C65,112 75,115 82,120 L85,145 L88,195 C82,205 70,210 62,200 L58,175 C55,150 55,125 60,115 Z',
      side: 'M70,110 C75,108 82,112 85,120 L85,180 C80,195 68,198 62,185 L60,140 C60,120 65,112 70,110 Z'
    }
  },
  {
    id: 'external-oblique-right',
    name: 'External Oblique (Right)',
    scientificName: 'Obliquus Externus Abdominis',
    group: 'core',
    function: 'Trunk rotation and lateral flexion',
    exercises: ['Russian Twists', 'Side Planks'],
    views: ['front'],
    relatedMuscles: ['internal-oblique-right', 'rectus-abdominis'],
    paths: {
      front: 'M140,115 C135,112 125,115 118,120 L115,145 L112,195 C118,205 130,210 138,200 L142,175 C145,150 145,125 140,115 Z'
    }
  },

  // ==================== GLUTES ====================
  {
    id: 'gluteus-maximus-left',
    name: 'Gluteus Maximus (Left)',
    scientificName: 'Gluteus Maximus',
    group: 'glutes',
    function: 'Hip extension and lateral rotation',
    exercises: ['Squats', 'Hip Thrusts', 'Deadlifts'],
    views: ['back', 'side'],
    relatedMuscles: ['gluteus-maximus-right', 'gluteus-medius-left'],
    paths: {
      back: 'M65,200 C58,205 52,215 50,230 C52,250 60,260 75,255 L95,245 L100,220 L90,205 C82,200 72,198 65,200 Z',
      side: 'M55,195 C48,200 45,215 48,235 L55,255 C65,265 78,255 82,240 L85,215 C82,200 70,192 55,195 Z'
    }
  },
  {
    id: 'gluteus-maximus-right',
    name: 'Gluteus Maximus (Right)',
    scientificName: 'Gluteus Maximus',
    group: 'glutes',
    function: 'Hip extension and lateral rotation',
    exercises: ['Squats', 'Hip Thrusts', 'Deadlifts'],
    views: ['back'],
    relatedMuscles: ['gluteus-maximus-left', 'gluteus-medius-right'],
    paths: {
      back: 'M135,200 C142,205 148,215 150,230 C148,250 140,260 125,255 L105,245 L100,220 L110,205 C118,200 128,198 135,200 Z'
    }
  },
  {
    id: 'gluteus-medius-left',
    name: 'Gluteus Medius (Left)',
    scientificName: 'Gluteus Medius',
    group: 'glutes',
    function: 'Hip abduction and stabilization',
    exercises: ['Clamshells', 'Side Lying Leg Raises'],
    views: ['back', 'side'],
    relatedMuscles: ['gluteus-maximus-left', 'gluteus-minimus-left'],
    paths: {
      back: 'M55,185 C48,188 45,195 48,205 L58,215 L75,205 L78,192 C75,185 65,182 55,185 Z',
      side: 'M52,180 C45,185 42,195 45,210 L55,220 L68,208 L70,192 C68,182 60,178 52,180 Z'
    }
  },
  {
    id: 'gluteus-medius-right',
    name: 'Gluteus Medius (Right)',
    scientificName: 'Gluteus Medius',
    group: 'glutes',
    function: 'Hip abduction and stabilization',
    exercises: ['Clamshells', 'Side Lying Leg Raises'],
    views: ['back'],
    relatedMuscles: ['gluteus-maximus-right', 'gluteus-minimus-right'],
    paths: {
      back: 'M145,185 C152,188 155,195 152,205 L142,215 L125,205 L122,192 C125,185 135,182 145,185 Z'
    }
  },

  // ==================== LEGS - QUADRICEPS ====================
  {
    id: 'rectus-femoris-left',
    name: 'Rectus Femoris (Left)',
    scientificName: 'Rectus Femoris',
    group: 'legs',
    function: 'Knee extension and hip flexion',
    exercises: ['Squats', 'Leg Press', 'Leg Extensions'],
    views: ['front', 'side'],
    relatedMuscles: ['vastus-lateralis-left', 'vastus-medialis-left'],
    paths: {
      front: 'M78,230 C72,235 68,250 66,275 L65,310 C66,325 70,330 78,328 L85,320 L88,280 C90,255 88,238 78,230 Z',
      side: 'M78,225 C72,232 68,250 66,280 L66,320 C68,335 76,338 82,330 L85,285 C86,255 84,235 78,225 Z'
    }
  },
  {
    id: 'rectus-femoris-right',
    name: 'Rectus Femoris (Right)',
    scientificName: 'Rectus Femoris',
    group: 'legs',
    function: 'Knee extension and hip flexion',
    exercises: ['Squats', 'Leg Press', 'Leg Extensions'],
    views: ['front'],
    relatedMuscles: ['vastus-lateralis-right', 'vastus-medialis-right'],
    paths: {
      front: 'M122,230 C128,235 132,250 134,275 L135,310 C134,325 130,330 122,328 L115,320 L112,280 C110,255 112,238 122,230 Z'
    }
  },
  {
    id: 'vastus-lateralis-left',
    name: 'Vastus Lateralis (Left)',
    scientificName: 'Vastus Lateralis',
    group: 'legs',
    function: 'Knee extension',
    exercises: ['Squats', 'Leg Press', 'Lunges'],
    views: ['front', 'side'],
    relatedMuscles: ['rectus-femoris-left', 'vastus-medialis-left'],
    paths: {
      front: 'M62,210 C55,218 50,240 48,275 L48,315 C50,330 58,335 65,328 L68,310 L66,275 C66,245 62,225 62,210 Z',
      side: 'M68,210 C60,220 55,245 54,280 L54,320 C56,335 65,340 72,330 L75,285 C76,250 74,225 68,210 Z'
    }
  },
  {
    id: 'vastus-lateralis-right',
    name: 'Vastus Lateralis (Right)',
    scientificName: 'Vastus Lateralis',
    group: 'legs',
    function: 'Knee extension',
    exercises: ['Squats', 'Leg Press', 'Lunges'],
    views: ['front'],
    relatedMuscles: ['rectus-femoris-right', 'vastus-medialis-right'],
    paths: {
      front: 'M138,210 C145,218 150,240 152,275 L152,315 C150,330 142,335 135,328 L132,310 L134,275 C134,245 138,225 138,210 Z'
    }
  },
  {
    id: 'vastus-medialis-left',
    name: 'Vastus Medialis (Left)',
    scientificName: 'Vastus Medialis',
    group: 'legs',
    function: 'Knee extension and patellar tracking',
    exercises: ['Squats', 'Leg Extensions'],
    views: ['front'],
    relatedMuscles: ['rectus-femoris-left', 'vastus-lateralis-left'],
    paths: {
      front: 'M88,280 C92,285 95,300 94,320 L90,335 C85,340 78,338 78,330 L80,310 C82,295 85,282 88,280 Z'
    }
  },
  {
    id: 'vastus-medialis-right',
    name: 'Vastus Medialis (Right)',
    scientificName: 'Vastus Medialis',
    group: 'legs',
    function: 'Knee extension and patellar tracking',
    exercises: ['Squats', 'Leg Extensions'],
    views: ['front'],
    relatedMuscles: ['rectus-femoris-right', 'vastus-lateralis-right'],
    paths: {
      front: 'M112,280 C108,285 105,300 106,320 L110,335 C115,340 122,338 122,330 L120,310 C118,295 115,282 112,280 Z'
    }
  },
  {
    id: 'adductor-left',
    name: 'Adductors (Left)',
    scientificName: 'Adductor Magnus',
    group: 'legs',
    function: 'Hip adduction',
    exercises: ['Sumo Squats', 'Cable Adductions'],
    views: ['front'],
    relatedMuscles: ['adductor-right'],
    paths: {
      front: 'M88,210 C92,215 96,230 97,255 L95,295 C92,310 85,315 80,305 L78,270 C78,240 82,218 88,210 Z'
    }
  },
  {
    id: 'adductor-right',
    name: 'Adductors (Right)',
    scientificName: 'Adductor Magnus',
    group: 'legs',
    function: 'Hip adduction',
    exercises: ['Sumo Squats', 'Cable Adductions'],
    views: ['front'],
    relatedMuscles: ['adductor-left'],
    paths: {
      front: 'M112,210 C108,215 104,230 103,255 L105,295 C108,310 115,315 120,305 L122,270 C122,240 118,218 112,210 Z'
    }
  },

  // ==================== LEGS - HAMSTRINGS ====================
  {
    id: 'biceps-femoris-left',
    name: 'Biceps Femoris (Left)',
    scientificName: 'Biceps Femoris',
    group: 'legs',
    function: 'Knee flexion and hip extension',
    exercises: ['Romanian Deadlift', 'Leg Curls'],
    views: ['back', 'side'],
    relatedMuscles: ['semitendinosus-left', 'semimembranosus-left'],
    paths: {
      back: 'M60,255 C55,262 50,285 48,315 L50,340 C55,350 65,350 72,342 L78,315 C80,285 75,262 68,255 Z',
      side: 'M52,250 C48,260 45,290 45,325 L48,350 C52,360 62,358 68,345 L72,305 C74,275 68,255 52,250 Z'
    }
  },
  {
    id: 'biceps-femoris-right',
    name: 'Biceps Femoris (Right)',
    scientificName: 'Biceps Femoris',
    group: 'legs',
    function: 'Knee flexion and hip extension',
    exercises: ['Romanian Deadlift', 'Leg Curls'],
    views: ['back'],
    relatedMuscles: ['semitendinosus-right', 'semimembranosus-right'],
    paths: {
      back: 'M140,255 C145,262 150,285 152,315 L150,340 C145,350 135,350 128,342 L122,315 C120,285 125,262 132,255 Z'
    }
  },
  {
    id: 'semitendinosus-left',
    name: 'Semitendinosus (Left)',
    scientificName: 'Semitendinosus',
    group: 'legs',
    function: 'Knee flexion and hip extension',
    exercises: ['Romanian Deadlift', 'Leg Curls'],
    views: ['back'],
    relatedMuscles: ['biceps-femoris-left', 'semimembranosus-left'],
    paths: {
      back: 'M78,255 C82,262 86,285 88,318 L86,345 C82,355 75,352 72,342 L70,310 C68,280 72,260 78,255 Z'
    }
  },
  {
    id: 'semitendinosus-right',
    name: 'Semitendinosus (Right)',
    scientificName: 'Semitendinosus',
    group: 'legs',
    function: 'Knee flexion and hip extension',
    exercises: ['Romanian Deadlift', 'Leg Curls'],
    views: ['back'],
    relatedMuscles: ['biceps-femoris-right', 'semimembranosus-right'],
    paths: {
      back: 'M122,255 C118,262 114,285 112,318 L114,345 C118,355 125,352 128,342 L130,310 C132,280 128,260 122,255 Z'
    }
  },

  // ==================== CALVES ====================
  {
    id: 'gastrocnemius-left',
    name: 'Gastrocnemius (Left)',
    scientificName: 'Gastrocnemius',
    group: 'calves',
    function: 'Ankle plantarflexion and knee flexion',
    exercises: ['Standing Calf Raises', 'Jump Rope'],
    views: ['back', 'side'],
    relatedMuscles: ['gastrocnemius-right', 'soleus-left'],
    paths: {
      back: 'M58,345 C52,350 48,365 48,385 L50,408 C54,415 62,415 68,408 L72,385 C74,365 70,352 62,345 Z M78,345 C82,350 86,365 88,385 L86,408 C82,415 74,418 72,408 Z',
      side: 'M52,340 C46,348 42,370 44,395 L48,415 C54,425 66,422 72,410 L75,380 C76,358 68,345 52,340 Z'
    }
  },
  {
    id: 'gastrocnemius-right',
    name: 'Gastrocnemius (Right)',
    scientificName: 'Gastrocnemius',
    group: 'calves',
    function: 'Ankle plantarflexion and knee flexion',
    exercises: ['Standing Calf Raises', 'Jump Rope'],
    views: ['back'],
    relatedMuscles: ['gastrocnemius-left', 'soleus-right'],
    paths: {
      back: 'M142,345 C148,350 152,365 152,385 L150,408 C146,415 138,415 132,408 L128,385 C126,365 130,352 138,345 Z M122,345 C118,350 114,365 112,385 L114,408 C118,415 126,418 128,408 Z'
    }
  },
  {
    id: 'soleus-left',
    name: 'Soleus (Left)',
    scientificName: 'Soleus',
    group: 'calves',
    function: 'Ankle plantarflexion',
    exercises: ['Seated Calf Raises'],
    views: ['back', 'side'],
    relatedMuscles: ['gastrocnemius-left', 'soleus-right'],
    paths: {
      back: 'M55,405 C50,408 48,418 50,430 L55,438 C60,442 68,440 72,432 L75,418 C76,410 70,405 62,405 Z',
      side: 'M50,408 C45,412 44,425 48,435 L55,442 C62,445 72,440 75,430 L76,415 C75,408 65,405 50,408 Z'
    }
  },
  {
    id: 'soleus-right',
    name: 'Soleus (Right)',
    scientificName: 'Soleus',
    group: 'calves',
    function: 'Ankle plantarflexion',
    exercises: ['Seated Calf Raises'],
    views: ['back'],
    relatedMuscles: ['gastrocnemius-right', 'soleus-left'],
    paths: {
      back: 'M145,405 C150,408 152,418 150,430 L145,438 C140,442 132,440 128,432 L125,418 C124,410 130,405 138,405 Z'
    }
  },
  {
    id: 'tibialis-anterior-left',
    name: 'Tibialis Anterior (Left)',
    scientificName: 'Tibialis Anterior',
    group: 'calves',
    function: 'Ankle dorsiflexion',
    exercises: ['Toe Raises', 'Tibialis Raises'],
    views: ['front', 'side'],
    relatedMuscles: ['tibialis-anterior-right'],
    paths: {
      front: 'M72,340 C68,345 65,365 64,390 L66,418 C70,425 78,425 82,418 L85,390 C86,365 82,348 75,340 Z',
      side: 'M80,338 C75,345 72,368 72,395 L74,420 C78,428 86,426 90,418 L92,388 C92,362 88,345 80,338 Z'
    }
  },
  {
    id: 'tibialis-anterior-right',
    name: 'Tibialis Anterior (Right)',
    scientificName: 'Tibialis Anterior',
    group: 'calves',
    function: 'Ankle dorsiflexion',
    exercises: ['Toe Raises', 'Tibialis Raises'],
    views: ['front'],
    relatedMuscles: ['tibialis-anterior-left'],
    paths: {
      front: 'M128,340 C132,345 135,365 136,390 L134,418 C130,425 122,425 118,418 L115,390 C114,365 118,348 125,340 Z'
    }
  },

  // ==================== NECK ====================
  {
    id: 'sternocleidomastoid-left',
    name: 'Sternocleidomastoid (Left)',
    scientificName: 'Sternocleidomastoid',
    group: 'shoulders',
    function: 'Neck flexion and rotation',
    exercises: ['Neck Curls', 'Neck Rotation'],
    views: ['front', 'side'],
    relatedMuscles: ['sternocleidomastoid-right', 'trapezius-upper'],
    paths: {
      front: 'M92,55 C88,58 85,65 86,72 L92,78 L100,75 L98,65 C98,58 96,55 92,55 Z',
      side: 'M88,52 C82,55 78,65 80,75 L88,82 L95,78 L92,65 C92,58 90,52 88,52 Z'
    }
  },
  {
    id: 'sternocleidomastoid-right',
    name: 'Sternocleidomastoid (Right)',
    scientificName: 'Sternocleidomastoid',
    group: 'shoulders',
    function: 'Neck flexion and rotation',
    exercises: ['Neck Curls', 'Neck Rotation'],
    views: ['front'],
    relatedMuscles: ['sternocleidomastoid-left', 'trapezius-upper'],
    paths: {
      front: 'M108,55 C112,58 115,65 114,72 L108,78 L100,75 L102,65 C102,58 104,55 108,55 Z'
    }
  }
];

// Create a Map for O(1) muscle lookups
const muscleMap = new Map<string, Muscle>(muscles.map(m => [m.id, m]));

// Helper function to get muscle by ID - O(1) lookup
export const getMuscleById = (id: string): Muscle | undefined => {
  return muscleMap.get(id);
};

// Helper function to get muscles by group
export const getMusclesByGroup = (group: string): Muscle[] => {
  return muscles.filter(m => m.group === group);
};

// Helper function to get muscles visible in a specific view
export const getMusclesByView = (view: 'front' | 'back' | 'side'): Muscle[] => {
  return muscles.filter(m => m.views.includes(view));
};

// Helper function to search muscles by name
export const searchMuscles = (query: string): Muscle[] => {
  const lowerQuery = query.toLowerCase();
  return muscles.filter(
    m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.scientificName.toLowerCase().includes(lowerQuery) ||
      m.group.toLowerCase().includes(lowerQuery)
  );
};
