import { Muscle } from '../types';
import { SIDE_ORDER } from '../lib/sortMuscles';

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
    views: ['front', 'side'],
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['pectoralis-major-right', 'anterior-deltoid-left'],
    paths: {
      front: 'M100,85 L100,90 C95,92 85,95 75,100 C65,105 55,108 50,105 L45,95 C43,88 48,80 58,78 C70,76 85,78 100,85 Z',
      side: 'M109,81 C109,81 113.2,83.8 115,86 C116.8,88.2 118.2,91 120,94 C121.8,97 124.8,100.8 126,104 C127.3,107.2 127.7,110.2 127.5,113 C127.3,115.8 126.4,119.2 125,121 C123.6,122.8 121.2,124.5 119,124 C116.8,123.5 114.3,121.2 112,118 C109.7,114.8 105,105 105,105 C105,105 105.3,96 106,92 C106.7,88 109,81 109,81 Z'
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
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['external-oblique-left', 'pectoralis-major-left'],
    paths: {
      front: 'M55,108 L50,112 L48,120 L52,118 M52,118 L48,126 L52,124 M52,124 L50,132 L55,128 L60,115 Z',
      side: 'M104,116 C104,116 108,119.3 110,121 C112,122.7 116,126 116,126 C116,126 111.8,127.5 112,129 C112.2,130.5 117,135 117,135 C117,135 112.5,136.5 112.5,138 C112.5,139.5 117,144 117,144 C117,144 112.3,145.5 112,147 C111.7,148.5 115,153 115,153 C115,153 110.2,154.8 108,154 C105.8,153.2 103.2,151.7 102,148 C100.8,144.3 100.7,137.3 101,132 C101.3,126.7 104,116 104,116 Z'
    }
  },
  {
    id: 'serratus-anterior-right',
    name: 'Serratus Anterior (Right)',
    scientificName: 'Serratus Anterior',
    group: 'chest',
    function: 'Protracts and rotates scapula upward',
    exercises: ['Push-ups Plus', 'Scapular Push-ups', 'Ab Rollout'],
    views: ['front'],
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
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['lateral-deltoid-left', 'pectoralis-major-left'],
    paths: {
      front: 'M58,78 C50,75 42,78 38,85 L35,100 C38,108 45,110 50,105 L55,95 C56,88 56,82 58,78 Z',
      side: 'M106.3,75.6 C106.3,75.6 108,76.5 108.8,77.6 C109.6,78.7 110.7,79.9 111.3,82 C111.9,84.1 112.4,87 112.6,90 C112.8,93 112.7,97 112.3,100 C112,103 111.6,105.7 110.5,108 C109.5,110.3 107.4,112.3 106,114 C104.7,115.8 102.4,118.5 102.4,118.5 C102.4,118.5 104.7,107.1 105.4,102 C106.1,96.9 106.7,92.4 106.8,88 C107,83.6 106.3,75.6 106.3,75.6 Z'
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
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['anterior-deltoid-left', 'posterior-deltoid-left'],
    paths: {
      front: 'M38,85 C32,82 26,88 25,95 L27,110 C30,115 35,112 38,108 L35,100 Z',
      back: 'M38,85 C32,82 26,88 25,95 L27,110 C30,115 35,112 38,108 L35,100 Z',
      side: 'M95.8,75.2 C95.8,75.2 98.5,74.5 100,74.4 C101.5,74.4 104.7,74.9 104.7,74.9 C104.7,74.9 105.8,83.5 105.8,88 C105.8,92.5 105.4,97.3 104.6,102 C103.8,106.7 102,112.8 101.2,116 C100.4,119.2 100,121 100,121 C100,121 99.4,119.2 98.8,116 C98.2,112.8 97,106.7 96.4,102 C95.8,97.3 95.5,92.5 95.4,88 C95.3,83.5 95.8,75.2 95.8,75.2 Z'
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
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['lateral-deltoid-left', 'trapezius-middle'],
    paths: {
      back: 'M55,78 C48,75 40,78 36,85 L33,100 C36,108 42,110 48,105 L52,95 C53,88 53,82 55,78 Z',
      side: 'M94.2,76.3 C94.2,76.3 93.9,83.7 94,88 C94.1,92.3 94.2,96.9 94.8,102 C95.4,107.1 97.8,118.5 97.8,118.5 C97.8,118.5 95.4,115.8 94,114 C92.6,112.3 90.6,110.3 89.5,108 C88.4,105.7 87.9,103 87.6,100 C87.4,97 87.5,93.2 88,90 C88.5,86.8 89.5,83.3 90.5,81 C91.5,78.7 94.2,76.3 94.2,76.3 Z'
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
    views: ['back', 'front', 'side'],
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['trapezius-middle', 'levator-scapulae'],
    paths: {
      back: 'M100,55 L60,72 C55,75 55,80 58,82 L100,70 L142,82 C145,80 145,75 140,72 Z',
      front: 'M100,55 L75,68 C72,70 72,74 75,76 L100,70 L125,76 C128,74 128,70 125,68 Z',
      side: 'M91.5,56 C91.5,56 93.6,59.8 94.5,62 C95.4,64.2 95.9,66.8 97,69 C98.1,71.3 101,75.5 101,75.5 C101,75.5 97.2,77.5 95,78.5 C92.8,79.5 90.5,80 88,81.5 C85.5,83 80,87.5 80,87.5 C80,87.5 79.7,83.8 80.5,82 C81.3,80.3 83.5,78.8 85,77 C86.5,75.2 88.1,73 89.5,71 C90.9,69 93,67.5 93.3,65 C93.6,62.5 91.5,56 91.5,56 Z'
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
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['latissimus-dorsi-right', 'teres-major-left'],
    paths: {
      back: 'M52,100 L48,108 C42,125 40,145 45,165 L55,185 C60,192 68,195 75,190 L85,175 L95,145 L100,120 L90,105 L75,100 Z',
      side: 'M93,104 C93,104 94.8,118.2 95,125 C95.2,131.8 94.5,138.3 94,145 C93.5,151.7 92.8,158.3 92,165 C91.2,171.7 90,179.5 89,185 C88,190.5 86.8,194.7 86,198 C85.2,201.3 84,205 84,205 C84,205 83,199.2 82.5,195 C82,190.8 81.8,185.8 81,180 C80.2,174.2 78.6,166.7 77.5,160 C76.4,153.3 75.2,146.7 74.5,140 C73.8,133.3 72.9,125.3 73.5,120 C74.1,114.7 75.9,110.8 78,108 C80.1,105.2 83.5,103.7 86,103 C88.5,102.3 93,104 93,104 Z'
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
    views: ['back', 'side'],
    sideOrder: SIDE_ORDER.torso,
    layer: 'deep',
    relatedMuscles: ['rhomboid-right', 'trapezius-middle'],
    paths: {
      back: 'M75,85 L85,82 L90,100 L85,115 L75,110 Z',
      side: 'M78,86 C78,86 81,88.8 82,92 C83,95.2 84,100.7 84,105 C84,109.3 82.8,114.2 82,118 C81.2,121.8 79,128 79,128 C79,128 76.3,122 75.5,118 C74.7,114 74.1,108.2 74,104 C73.9,99.8 74.3,96 75,93 C75.7,90 78,86 78,86 Z'
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
    layer: 'deep',
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
    views: ['back', 'side'],
    sideOrder: SIDE_ORDER.torso,
    layer: 'deep',
    relatedMuscles: ['latissimus-dorsi-left', 'teres-minor-left'],
    paths: {
      back: 'M52,95 L48,100 L50,112 L58,108 L55,98 Z',
      side: 'M82,131 C82,131 85.7,128.2 88,126 C90.3,123.8 94,120 96,118 C98,116 100,114 100,114 C100,114 99.7,118.2 98,121 C96.3,123.8 92.3,128.7 90,131 C87.7,133.3 85.3,135 84,135 C82.7,135 82,131 82,131 Z'
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
    layer: 'deep',
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
    views: ['back', 'side'],
    sideOrder: SIDE_ORDER.torso,
    layer: 'deep',
    relatedMuscles: ['teres-minor-left', 'supraspinatus-left'],
    paths: {
      back: 'M55,85 L75,82 L78,100 L75,115 L55,108 L52,95 Z',
      side: 'M86,95 C86,95 91.2,96.2 93,98 C94.8,99.8 96.7,103 97,106 C97.3,109 96.5,113.3 95,116 C93.5,118.7 88,122 88,122 C88,122 85.9,115.3 85.5,112 C85.1,108.7 85.4,104.8 85.5,102 C85.6,99.2 86,95 86,95 Z'
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
    layer: 'deep',
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
    views: ['back', 'side'],
    sideOrder: SIDE_ORDER.torso,
    layer: 'deep',
    relatedMuscles: ['multifidus', 'quadratus-lumborum'],
    paths: {
      back: 'M92,120 L95,120 L98,200 L95,205 L92,205 Z M108,120 L105,120 L102,200 L105,205 L108,205 Z',
      side: 'M77,132 C77,132 79.8,139.5 81,145 C82.3,150.5 83.4,158.3 84.5,165 C85.6,171.7 86.9,178.7 87.5,185 C88.1,191.3 88.6,197.8 88,203 C87.4,208.2 85.5,212.2 84,216 C82.5,219.8 79,226 79,226 C79,226 76.1,217.8 76.5,214 C76.9,210.2 80.6,207.3 81.5,203 C82.4,198.7 82.3,193.5 82,188 C81.7,182.5 80.4,176.3 79.5,170 C78.6,163.7 77.3,155 76.5,150 C75.7,145 74.4,143 74.5,140 C74.6,137 77,132 77,132 Z'
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
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['biceps-right', 'brachialis-left'],
    paths: {
      front: 'M30,112 C26,115 23,125 22,140 L22,165 C23,175 27,178 32,175 L35,165 L37,140 C38,125 36,115 30,112 Z',
      side: 'M110,114 C108.8,115.7 106.6,120.5 105,124 C103.5,127.5 101.4,129.8 100.5,135 C99.7,140.2 100,148.8 99.9,155 C99.9,161.2 100,166.8 100.2,172 C100.5,177.2 101,182.3 101.6,186 C102.2,189.7 103.9,194 103.9,194 C103.9,194 106.2,189.7 107.3,186 C108.4,182.3 109.7,177.2 110.5,172 C111.3,166.8 111.7,161.2 112.1,155 C112.5,148.8 112.6,140.2 112.7,135 C112.8,129.8 112.7,127.5 112.6,124 C112.5,120.5 112.4,115.7 112,114 C111.6,112.3 111.1,112.3 110,114 Z'
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
    sideOrder: SIDE_ORDER.nearArm,
    layer: 'deep',
    relatedMuscles: ['biceps-left', 'brachioradialis-left'],
    paths: {
      front: 'M25,165 C22,168 20,175 20,182 L22,195 C24,200 28,198 30,192 L32,180 C33,172 30,166 25,165 Z',
      side: 'M97.5,145 C96.4,147.5 95.4,154.5 95.1,160 C94.8,165.5 95,173 95.5,178 C95.9,183 96.8,186.5 97.7,190 C98.6,193.5 100.7,199 100.7,199 C100.7,199 102.3,193.5 102.7,190 C103.1,186.5 103.1,183 103.1,178 C103.1,173 103,165.5 102.7,160 C102.5,154.5 102.4,147.5 101.5,145 C100.6,142.5 98.5,142.5 97.5,145 Z'
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
    layer: 'deep',
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
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['triceps-right'],
    paths: {
      back: 'M30,112 C24,115 20,128 18,145 L18,175 C20,185 26,188 32,182 L35,165 L38,140 C40,125 38,115 30,112 Z',
      side: 'M87.3,113 C86.9,114.5 87.3,119.2 87.3,122 C87.3,124.8 87.3,125.3 87.3,130 C87.4,134.7 87.3,143.3 87.6,150 C87.8,156.7 88.2,164.2 88.9,170 C89.6,175.8 90.8,180.7 91.9,185 C93.1,189.3 95.8,196 95.8,196 C95.8,196 97.3,189.3 97.7,185 C98.2,180.7 98.5,175.8 98.7,170 C98.9,164.2 99,156.7 99,150 C98.9,143.3 99.1,134.7 98.5,130 C97.9,125.3 96.8,124.8 95.4,122 C93.9,119.2 91.2,114.5 89.8,113 C88.5,111.5 87.7,111.5 87.3,113 Z'
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
    views: ['front', 'side'],
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['brachioradialis-left', 'forearm-extensors-left'],
    paths: {
      front: 'M22,195 C18,200 15,215 14,235 L15,260 C17,268 22,268 25,262 L27,235 C28,215 26,200 22,195 Z',
      side: 'M97.8,201 C97.1,202.8 97.6,207.5 97.7,212 C97.7,216.5 97.9,223 98.1,228 C98.3,233 98.8,238 99,242 C99.3,246 99.4,249.2 99.7,252 C99.9,254.8 100,257.8 100.6,259 C101.2,260.2 102.7,260.2 103.4,259 C104,257.8 104.3,254.8 104.4,252 C104.5,249.2 104.2,246 104,242 C103.8,238 103.5,233 103.2,228 C103,223 102.8,216.5 102.6,212 C102.3,207.5 102.7,202.8 101.9,201 C101.1,199.2 98.5,199.2 97.8,201 Z'
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
    views: ['back', 'side'],
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['brachioradialis-left', 'forearm-flexors-left'],
    paths: {
      back: 'M20,195 C16,200 13,218 12,240 L13,265 C15,272 20,272 24,265 L26,240 C27,218 24,200 20,195 Z',
      side: 'M91.1,200 C90.1,202 90.5,207.3 90.6,212 C90.7,216.7 91.2,223 91.7,228 C92.2,233 93,238 93.6,242 C94.2,246 94.8,249.2 95.4,252 C96.1,254.8 97.7,259 97.7,259 C97.7,259 98.9,254.8 99,252 C99.1,249.2 98.5,246 98.2,242 C97.9,238 97.4,233 97.2,228 C96.9,223 96.9,216.7 96.9,212 C96.8,207.3 97.8,202 96.9,200 C95.9,198 92.2,198 91.1,200 Z'
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
    sideOrder: SIDE_ORDER.nearArm,
    relatedMuscles: ['brachioradialis-right', 'biceps-left', 'brachialis-left'],
    paths: {
      front: 'M28,178 C24,185 22,200 20,220 L19,245 C20,252 24,252 28,248 L30,220 C31,200 30,185 28,178 Z',
      side: 'M102.5,199 C101.8,200.5 103,204.2 103.3,208 C103.6,211.8 104,217 104.3,222 C104.6,227 104.9,233 105.1,238 C105.3,243 105.5,252 105.5,252 C105.5,252 108,243 108.9,238 C109.7,233 110.4,227 110.7,222 C111,217 111.1,211.8 110.6,208 C110.1,204.2 109,200.5 107.6,199 C106.3,197.5 103.3,197.5 102.5,199 Z'
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
    views: ['front', 'side'],
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['external-oblique-left', 'external-oblique-right'],
    paths: {
      front: 'M88,105 L88,195 L100,200 L112,195 L112,105 L100,100 Z',
      side: 'M118.5,128 C118.5,128 120.7,126.2 121.5,127 C122.3,127.8 123.4,129.2 123.5,133 C123.6,136.8 122.7,143.5 122,150 C121.3,156.5 119.8,164.5 119.5,172 C119.2,179.5 119.7,188.3 120,195 C120.3,201.7 121.5,207.5 121.5,212 C121.5,216.5 120,222 120,222 C120,222 117.6,217.3 117,212 C116.4,206.7 116.9,197 116.5,190 C116.1,183 114.3,176.7 114.5,170 C114.7,163.3 116.7,155.8 117.5,150 C118.3,144.2 119.3,138.7 119.5,135 C119.7,131.3 118.5,128 118.5,128 Z'
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
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['internal-oblique-left', 'rectus-abdominis'],
    paths: {
      front: 'M60,115 C65,112 75,115 82,120 L85,145 L88,195 C82,205 70,210 62,200 L58,175 C55,150 55,125 60,115 Z',
      side: 'M100,153 C100,153 104.7,157.3 107,158 C109.3,158.7 114,157 114,157 C114,157 112.9,164.5 113,170 C113.1,175.5 114,183 114.5,190 C115,197 115.6,206.7 116,212 C116.4,217.3 117,222 117,222 C117,222 111.2,219.7 108,218 C104.8,216.3 101,213.7 98,212 C95,210.3 90,208 90,208 C90,208 90.3,196.3 91,190 C91.7,183.7 93.2,175.3 94,170 C94.8,164.7 95,160.8 96,158 C97,155.2 100,153 100,153 Z'
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
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['gluteus-maximus-right', 'gluteus-medius-left'],
    paths: {
      back: 'M65,200 C58,205 52,215 50,230 C52,250 60,260 75,255 L95,245 L100,220 L90,205 C82,200 72,198 65,200 Z',
      side: 'M84,210 C84,210 88.8,213 91,216 C93.2,219 95.3,223.2 97,228 C98.7,232.8 100.3,239.3 101,245 C101.7,250.7 101,262 101,262 C101,262 96.7,264.7 94,266 C91.3,267.3 87.7,269.3 85,270 C82.3,270.7 79.8,271.7 78,270 C76.2,268.3 75.5,264 74,260 C72.5,256 69.8,251 69,246 C68.3,241 68.8,234.7 69.5,230 C70.2,225.3 71.6,221 73,218 C74.4,215 76.2,213.3 78,212 C79.8,210.7 84,210 84,210 Z'
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
    sideOrder: SIDE_ORDER.torso,
    layer: 'deep',
    relatedMuscles: ['gluteus-maximus-left', 'gluteus-minimus-left'],
    paths: {
      back: 'M55,185 C48,188 45,195 48,205 L58,215 L75,205 L78,192 C75,185 65,182 55,185 Z',
      side: 'M91,206 C91,206 95.5,206 98,207 C100.5,208 104,209.5 106,212 C108,214.5 110,218.3 110,222 C110,225.7 107.7,231 106,234 C104.3,237 100,240 100,240 C100,240 97.2,233.3 96,230 C94.8,226.7 94,223 93,220 C92,217 90.3,214.3 90,212 C89.7,209.7 91,206 91,206 Z'
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
    layer: 'deep',
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
    sideOrder: SIDE_ORDER.nearLeg,
    relatedMuscles: ['vastus-lateralis-left', 'vastus-medialis-left'],
    paths: {
      front: 'M78,230 C72,235 68,250 66,275 L65,310 C66,325 70,330 78,328 L85,320 L88,280 C90,255 88,238 78,230 Z',
      side: 'M116.5,232 C116.5,232 119,235.7 120,240 C121,244.3 122.2,250.5 122.5,258 C122.8,265.5 122.5,276.7 122,285 C121.5,293.3 120.3,301.2 119.3,308 C118.3,314.8 116,326 116,326 C116,326 114.6,316.8 114.3,310 C114,303.2 114,293 114,285 C114,277 114.2,268.8 114.4,262 C114.6,255.2 114.7,249 115,244 C115.4,239 116.5,232 116.5,232 Z'
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
    sideOrder: SIDE_ORDER.nearLeg,
    relatedMuscles: ['rectus-femoris-left', 'vastus-medialis-left'],
    paths: {
      front: 'M62,210 C55,218 50,240 48,275 L48,315 C50,330 58,335 65,328 L68,310 L66,275 C66,245 62,225 62,210 Z',
      side: 'M106.5,245 C106.5,245 110.5,250.2 111.5,256 C112.5,261.8 112.4,271.8 112.5,280 C112.6,288.2 112.2,297.3 112.3,305 C112.4,312.7 113,326 113,326 C113,326 108.2,332.8 106,333 C103.8,333.2 101.3,330.5 100,327 C98.8,323.5 98.8,317.3 98.5,312 C98.3,306.7 98.4,300 98.5,295 C98.6,290 98.5,286.7 99,282 C99.5,277.3 100.3,273.2 101.5,267 C102.8,260.8 106.5,245 106.5,245 Z'
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
    sideOrder: SIDE_ORDER.nearLeg,
    relatedMuscles: ['semitendinosus-left', 'semimembranosus-left'],
    paths: {
      back: 'M60,255 C55,262 50,285 48,315 L50,340 C55,350 65,350 72,342 L78,315 C80,285 75,262 68,255 Z',
      side: 'M86,272 C86,272 91.3,275.2 93,279 C94.8,282.8 95.9,289.5 96.5,295 C97.1,300.5 96.8,306.7 96.5,312 C96.2,317.3 95.2,322.5 94.5,327 C93.8,331.5 92.5,339 92.5,339 C92.5,339 90.5,332.5 90,328 C89.5,323.5 89.7,317 89.3,312 C88.9,307 88.4,302.3 87.8,298 C87.2,293.7 85.8,290.3 85.5,286 C85.2,281.7 86,272 86,272 Z'
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
    views: ['back', 'side'],
    sideOrder: SIDE_ORDER.nearLeg,
    relatedMuscles: ['biceps-femoris-left', 'semimembranosus-left'],
    paths: {
      back: 'M78,255 C82,262 86,285 88,318 L86,345 C82,355 75,352 72,342 L70,310 C68,280 72,260 78,255 Z',
      side: 'M79,274 C79,274 82.3,280.8 83.5,286 C84.7,291.2 85.3,299 86,305 C86.7,311 87,316.5 87.5,322 C88,327.5 89,338 89,338 C89,338 87.7,334 86.8,331 C85.9,328 84.5,324.3 83.5,320 C82.5,315.7 81.6,310 80.8,305 C80,300 79.1,294 78.6,290 C78.1,286 77.4,283.7 77.5,281 C77.6,278.3 79,274 79,274 Z'
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
    sideOrder: SIDE_ORDER.nearLeg,
    relatedMuscles: ['gastrocnemius-right', 'soleus-left'],
    paths: {
      back: 'M58,345 C52,350 48,365 48,385 L50,408 C54,415 62,415 68,408 L72,385 C74,365 70,352 62,345 Z M78,345 C82,350 86,365 88,385 L86,408 C82,415 74,418 72,408 Z',
      side: 'M86,340 C86,340 92.2,341.7 94,345 C95.8,348.3 96.7,354.2 97,360 C97.3,365.8 96.7,374.2 96,380 C95.3,385.8 93.7,390.3 93,395 C92.3,399.7 92,408 92,408 C92,408 90.9,401.8 89.5,398 C88.1,394.2 85,389.7 83.5,385 C82,380.3 80.8,375.2 80.5,370 C80.3,364.8 81.1,359 82,354 C82.9,349 86,340 86,340 Z'
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
    sideOrder: SIDE_ORDER.nearLeg,
    layer: 'deep',
    relatedMuscles: ['gastrocnemius-left', 'soleus-right'],
    paths: {
      back: 'M55,405 C50,408 48,418 50,430 L55,438 C60,442 68,440 72,432 L75,418 C76,410 70,405 62,405 Z',
      side: 'M88,360 C88,360 96,361.7 98,365 C100,368.3 99.8,374.5 100,380 C100.2,385.5 99.8,392.7 99,398 C98.2,403.3 95,412 95,412 C95,412 92.3,408.3 91,405 C89.7,401.7 88,397 87,392 C86,387 84.8,380.3 85,375 C85.2,369.7 88,360 88,360 Z'
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
    layer: 'deep',
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
    sideOrder: SIDE_ORDER.nearLeg,
    relatedMuscles: ['tibialis-anterior-right'],
    paths: {
      front: 'M72,340 C68,345 65,365 64,390 L66,418 C70,425 78,425 82,418 L85,390 C86,365 82,348 75,340 Z',
      side: 'M107,342 C107,342 110.4,346.2 111,350 C111.6,353.8 110.8,359.2 110.5,365 C110.2,370.8 109.8,378.3 109,385 C108.3,391.7 106.8,400.2 106,405 C105.2,409.8 104,414 104,414 C104,414 102.8,405.7 102.5,400 C102.2,394.3 102.1,386.7 102,380 C101.9,373.3 101.8,365.3 102,360 C102.3,354.7 102.7,351 103.5,348 C104.3,345 107,342 107,342 Z'
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
    sideOrder: SIDE_ORDER.torso,
    relatedMuscles: ['sternocleidomastoid-right', 'trapezius-upper'],
    paths: {
      front: 'M92,55 C88,58 85,65 86,72 L92,78 L100,75 L98,65 C98,58 96,55 92,55 Z',
      side: 'M93.5,44 C93.5,44 95.4,45.8 97,48 C98.6,50.2 101.2,54 103,57 C104.8,60 106.9,63.1 108,66 C109.1,68.9 109.5,74.5 109.5,74.5 C109.5,74.5 107,75.1 105.5,73.5 C104,71.9 102.2,68.3 100.5,65 C98.8,61.8 96.7,57.5 95.5,54 C94.3,50.5 93.5,44 93.5,44 Z'
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
  },

  // Deep layer, front and back views (2026-11-15)
  {
    id: 'pectoralis-minor-left',
    name: 'Pectoralis Minor (Left)',
    scientificName: 'Pectoralis Minor',
    group: 'chest',
    function: 'Pulls the shoulder blade forward and down; assists breathing',
    exercises: ['Dips', 'Push-Up Plus', 'Cable Pullover'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['pectoralis-major-left', 'serratus-anterior-left'],
    paths: {
      front: 'M60,80 C65,79 70,83 75,88 C80,93 86,99 88,105 C84,107 79,106 75,103 C70,98 64,91 61,86 C59,83 59,81 60,80 Z'
    }
  },
  {
    id: 'pectoralis-minor-right',
    name: 'Pectoralis Minor (Right)',
    scientificName: 'Pectoralis Minor',
    group: 'chest',
    function: 'Pulls the shoulder blade forward and down; assists breathing',
    exercises: ['Dips', 'Push-Up Plus', 'Cable Pullover'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['pectoralis-major-right', 'serratus-anterior-right'],
    paths: {
      front: 'M140,80 C135,79 130,83 125,88 C120,93 114,99 112,105 C116,107 121,106 125,103 C130,98 136,91 139,86 C141,83 141,81 140,80 Z'
    }
  },
  {
    id: 'subscapularis-left',
    name: 'Subscapularis (Left)',
    scientificName: 'Subscapularis',
    group: 'back',
    function: 'Internal rotation of the arm (rotator cuff)',
    exercises: ['Cable Internal Rotation', 'Band Internal Rotation'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['infraspinatus-left', 'teres-minor-left', 'supraspinatus-left'],
    paths: {
      front: 'M46,92 C50,89 57,90 62,94 C64,98 63,103 60,108 C55,106 50,102 47,98 C45,96 45,94 46,92 Z'
    }
  },
  {
    id: 'subscapularis-right',
    name: 'Subscapularis (Right)',
    scientificName: 'Subscapularis',
    group: 'back',
    function: 'Internal rotation of the arm (rotator cuff)',
    exercises: ['Cable Internal Rotation', 'Band Internal Rotation'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['infraspinatus-right', 'teres-minor-right', 'supraspinatus-right'],
    paths: {
      front: 'M154,92 C150,89 143,90 138,94 C136,98 137,103 140,108 C145,106 150,102 153,98 C155,96 155,94 154,92 Z'
    }
  },
  {
    id: 'transverse-abdominis',
    name: 'Transverse Abdominis',
    scientificName: 'Transversus Abdominis',
    group: 'core',
    function: 'Deep core stabilization; draws the abdomen in',
    exercises: ['Plank', 'Dead Bug', 'Stomach Vacuum'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['rectus-abdominis', 'external-oblique-left', 'external-oblique-right'],
    paths: {
      front: 'M62,140 C75,134 90,132 100,132 C110,132 125,134 138,140 C141,155 141,172 137,190 C125,198 110,202 100,202 C90,202 75,198 63,190 C59,172 59,155 62,140 Z'
    }
  },
  {
    id: 'iliopsoas-left',
    name: 'Iliopsoas (Left)',
    scientificName: 'Iliopsoas',
    group: 'legs',
    function: 'Hip flexion (primary hip flexor)',
    exercises: ['Hanging Leg Raise', 'Psoas March', 'Mountain Climbers'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['rectus-femoris-left', 'adductor-left'],
    paths: {
      front: 'M92,168 C96,170 97,178 96,188 C95,200 91,214 86,226 C84,232 81,236 79,234 C77,230 79,222 81,212 C84,198 87,184 89,174 C89,171 90,168 92,168 Z'
    }
  },
  {
    id: 'iliopsoas-right',
    name: 'Iliopsoas (Right)',
    scientificName: 'Iliopsoas',
    group: 'legs',
    function: 'Hip flexion (primary hip flexor)',
    exercises: ['Hanging Leg Raise', 'Psoas March', 'Mountain Climbers'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['rectus-femoris-right', 'adductor-right'],
    paths: {
      front: 'M108,168 C104,170 103,178 104,188 C105,200 109,214 114,226 C116,232 119,236 121,234 C123,230 121,222 119,212 C116,198 113,184 111,174 C111,171 110,168 108,168 Z'
    }
  },
  {
    id: 'vastus-intermedius-left',
    name: 'Vastus Intermedius (Left)',
    scientificName: 'Vastus Intermedius',
    group: 'legs',
    function: 'Knee extension (deep quadriceps)',
    exercises: ['Leg Extension', 'Front Squat', 'Sissy Squat'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['rectus-femoris-left', 'vastus-lateralis-left', 'vastus-medialis-left'],
    paths: {
      front: 'M71,245 C76,241 82,242 85,248 C88,268 88,292 85,315 C83,322 76,323 73,317 C69,295 68,268 71,245 Z'
    }
  },
  {
    id: 'vastus-intermedius-right',
    name: 'Vastus Intermedius (Right)',
    scientificName: 'Vastus Intermedius',
    group: 'legs',
    function: 'Knee extension (deep quadriceps)',
    exercises: ['Leg Extension', 'Front Squat', 'Sissy Squat'],
    views: ['front'],
    layer: 'deep',
    relatedMuscles: ['rectus-femoris-right', 'vastus-lateralis-right', 'vastus-medialis-right'],
    paths: {
      front: 'M129,245 C124,241 118,242 115,248 C112,268 112,292 115,315 C117,322 124,323 127,317 C131,295 132,268 129,245 Z'
    }
  },
  {
    id: 'supraspinatus-left',
    name: 'Supraspinatus (Left)',
    scientificName: 'Supraspinatus',
    group: 'back',
    function: 'Starts arm abduction (rotator cuff)',
    exercises: ['Full Can Raise', 'Cable Lateral Raise'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['infraspinatus-left', 'teres-minor-left', 'subscapularis-left'],
    paths: {
      back: 'M58,77 C65,73 76,72 85,75 C87,77 87,80 85,81.5 C77,82.5 67,82.5 60,81.5 C57,80.5 56.5,78.5 58,77 Z'
    }
  },
  {
    id: 'supraspinatus-right',
    name: 'Supraspinatus (Right)',
    scientificName: 'Supraspinatus',
    group: 'back',
    function: 'Starts arm abduction (rotator cuff)',
    exercises: ['Full Can Raise', 'Cable Lateral Raise'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['infraspinatus-right', 'teres-minor-right', 'subscapularis-right'],
    paths: {
      back: 'M142,77 C135,73 124,72 115,75 C113,77 113,80 115,81.5 C123,82.5 133,82.5 140,81.5 C143,80.5 143.5,78.5 142,77 Z'
    }
  },
  {
    id: 'teres-minor-left',
    name: 'Teres Minor (Left)',
    scientificName: 'Teres Minor',
    group: 'back',
    function: 'Lateral rotation of the arm (rotator cuff)',
    exercises: ['Face Pulls', 'Side-Lying External Rotation'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['infraspinatus-left', 'supraspinatus-left', 'teres-major-left'],
    paths: {
      back: 'M50,92 C53,91 57,94 61,98 C64,101 67,104 68,107 C66,109 63,108 60,106 C56,103 52,99 49,96 C48,94 48,93 50,92 Z'
    }
  },
  {
    id: 'teres-minor-right',
    name: 'Teres Minor (Right)',
    scientificName: 'Teres Minor',
    group: 'back',
    function: 'Lateral rotation of the arm (rotator cuff)',
    exercises: ['Face Pulls', 'Side-Lying External Rotation'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['infraspinatus-right', 'supraspinatus-right', 'teres-major-right'],
    paths: {
      back: 'M150,92 C147,91 143,94 139,98 C136,101 133,104 132,107 C134,109 137,108 140,106 C144,103 148,99 151,96 C152,94 152,93 150,92 Z'
    }
  },
  {
    id: 'gluteus-minimus-left',
    name: 'Gluteus Minimus (Left)',
    scientificName: 'Gluteus Minimus',
    group: 'glutes',
    function: 'Hip abduction and pelvic stability',
    exercises: ['Side-Lying Hip Abduction', 'Banded Lateral Walk', 'Clamshell'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['gluteus-medius-left', 'gluteus-maximus-left'],
    paths: {
      back: 'M56,196 C62,191 70,191 75,196 C77,203 75,211 70,217 C66,220 61,219 58,215 C54,209 53,202 56,196 Z'
    }
  },
  {
    id: 'gluteus-minimus-right',
    name: 'Gluteus Minimus (Right)',
    scientificName: 'Gluteus Minimus',
    group: 'glutes',
    function: 'Hip abduction and pelvic stability',
    exercises: ['Side-Lying Hip Abduction', 'Banded Lateral Walk', 'Clamshell'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['gluteus-medius-right', 'gluteus-maximus-right'],
    paths: {
      back: 'M144,196 C138,191 130,191 125,196 C123,203 125,211 130,217 C134,220 139,219 142,215 C146,209 147,202 144,196 Z'
    }
  },
  {
    id: 'semimembranosus-left',
    name: 'Semimembranosus (Left)',
    scientificName: 'Semimembranosus',
    group: 'legs',
    function: 'Knee flexion and hip extension (inner hamstring)',
    exercises: ['Romanian Deadlift', 'Seated Leg Curl', 'Good Morning'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['semitendinosus-left', 'biceps-femoris-left'],
    paths: {
      back: 'M78,270 C82,268 85,272 86,280 C87,300 86,325 83,345 C82,350 78,351 77,346 C75,325 75,298 76,278 C76,274 77,271 78,270 Z'
    }
  },
  {
    id: 'semimembranosus-right',
    name: 'Semimembranosus (Right)',
    scientificName: 'Semimembranosus',
    group: 'legs',
    function: 'Knee flexion and hip extension (inner hamstring)',
    exercises: ['Romanian Deadlift', 'Seated Leg Curl', 'Good Morning'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['semitendinosus-right', 'biceps-femoris-right'],
    paths: {
      back: 'M122,270 C118,268 115,272 114,280 C113,300 114,325 117,345 C118,350 122,351 123,346 C125,325 125,298 124,278 C124,274 123,271 122,270 Z'
    }
  },
  {
    id: 'plantaris-left',
    name: 'Plantaris (Left)',
    scientificName: 'Plantaris',
    group: 'calves',
    function: 'Assists ankle plantar flexion and knee flexion',
    exercises: ['Seated Calf Raise', 'Standing Calf Raise'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['gastrocnemius-left', 'soleus-left'],
    paths: {
      back: 'M62,350 C66,348 70,351 71,357 C72,366 71,378 69,390 C68,394 65,394 64,390 C63,378 61,366 60,357 C60,353 60,351 62,350 Z'
    }
  },
  {
    id: 'plantaris-right',
    name: 'Plantaris (Right)',
    scientificName: 'Plantaris',
    group: 'calves',
    function: 'Assists ankle plantar flexion and knee flexion',
    exercises: ['Seated Calf Raise', 'Standing Calf Raise'],
    views: ['back'],
    layer: 'deep',
    relatedMuscles: ['gastrocnemius-right', 'soleus-right'],
    paths: {
      back: 'M138,350 C134,348 130,351 129,357 C128,366 129,378 131,390 C132,394 135,394 136,390 C137,378 139,366 140,357 C140,353 140,351 138,350 Z'
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
