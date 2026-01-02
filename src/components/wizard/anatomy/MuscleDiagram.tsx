import { memo, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { MuscleGroup } from '@/types/fitness';

interface MuscleDiagramProps {
    view: 'front' | 'back';
    selectedMuscles: MuscleGroup[];
    onToggle: (muscleId: MuscleGroup) => void;
    hoveredMuscle: MuscleGroup | null;
    onHover: (muscleId: MuscleGroup | null) => void;
}

// Muscle ID to display name mapping
const MUSCLE_NAMES: Record<MuscleGroup, string> = {
    chest: 'Chest',
    front_deltoid: 'Front Delts',
    side_deltoid: 'Side Delts',
    rear_deltoid: 'Rear Delts',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    abs: 'Abs',
    obliques: 'Obliques',
    quads: 'Quads',
    hip_flexors: 'Hip Flexors',
    adductors: 'Adductors',
    traps: 'Traps',
    upper_back: 'Upper Back',
    lats: 'Lats',
    lower_back: 'Lower Back',
    glutes: 'Glutes',
    hamstrings: 'Hamstrings',
    calves: 'Calves',
    neck: 'Neck',
};

// Front/Back muscle categorization
const FRONT_MUSCLES: MuscleGroup[] = ['chest', 'front_deltoid', 'side_deltoid', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'hip_flexors', 'adductors'];
const BACK_MUSCLES: MuscleGroup[] = ['traps', 'rear_deltoid', 'upper_back', 'lats', 'lower_back', 'triceps', 'glutes', 'hamstrings', 'calves', 'neck'];

// ============================================================================
// ANATOMICALLY CORRECT HUMAN SILHOUETTE SVG PATHS
// ViewBox: 0 0 200 400 (width x height ratio ~1:2 for human proportions)
// Reference: 8-head canon proportions
// ============================================================================

// Base human silhouette outline (for visual reference, not interactive)
const SILHOUETTE_FRONT = `
  M 100,12 
  C 92,12 86,18 86,28 C 86,38 92,46 100,46 C 108,46 114,38 114,28 C 114,18 108,12 100,12 Z
  M 96,46 L 96,52 L 68,58 L 58,62 L 42,68 L 38,78 L 36,98 L 38,118 L 44,138 L 50,158 
  L 54,168 L 52,188 L 48,208 L 44,228 L 42,238 L 44,248 L 48,258 
  M 104,46 L 104,52 L 132,58 L 142,62 L 158,68 L 162,78 L 164,98 L 162,118 L 156,138 L 150,158 
  L 146,168 L 148,188 L 152,208 L 156,228 L 158,238 L 156,248 L 152,258
  M 68,58 L 68,68 L 70,88 L 72,118 L 76,148 L 80,168 L 82,178 L 82,188 L 78,238 L 74,288 L 72,328 L 74,358 L 80,388
  M 132,58 L 132,68 L 130,88 L 128,118 L 124,148 L 120,168 L 118,178 L 118,188 L 122,238 L 126,288 L 128,328 L 126,358 L 120,388
`;

// ============================================================================
// FRONT VIEW MUSCLE REGIONS - Anatomically accurate curved paths
// ============================================================================
const FRONT_MUSCLE_PATHS: Record<string, { display: string; hit: string }> = {
    // CHEST - Pectoralis major, butterfly shape across upper chest
    chest: {
        display: `
      M 72,68 
      Q 75,62 100,62 Q 125,62 128,68
      Q 132,76 128,88 Q 120,96 100,98 Q 80,96 72,88 Q 68,76 72,68 Z
    `,
        hit: `M 68,58 Q 72,52 100,52 Q 128,52 132,58 Q 140,72 135,95 Q 120,108 100,110 Q 80,108 65,95 Q 60,72 68,58 Z`,
    },

    // FRONT DELTOID - Anterior deltoid, cap of shoulder
    front_deltoid: {
        display: `
      M 62,58 Q 68,54 72,58 Q 78,66 76,78 Q 72,86 66,88 Q 58,86 56,76 Q 54,66 62,58 Z
      M 138,58 Q 132,54 128,58 Q 122,66 124,78 Q 128,86 134,88 Q 142,86 144,76 Q 146,66 138,58 Z
    `,
        hit: `M 58,52 Q 68,46 76,52 Q 86,64 82,84 Q 76,96 62,96 Q 48,92 46,74 Q 46,58 58,52 Z M 142,52 Q 132,46 124,52 Q 114,64 118,84 Q 124,96 138,96 Q 152,92 154,74 Q 154,58 142,52 Z`,
    },

    // SIDE DELTOID - Lateral deltoid, side of shoulder
    side_deltoid: {
        display: `
      M 52,62 Q 56,58 60,62 Q 64,72 62,84 Q 58,92 52,92 Q 44,88 44,78 Q 44,68 52,62 Z
      M 148,62 Q 144,58 140,62 Q 136,72 138,84 Q 142,92 148,92 Q 156,88 156,78 Q 156,68 148,62 Z
    `,
        hit: `M 48,56 Q 58,50 66,58 Q 72,72 68,92 Q 60,104 46,100 Q 34,92 36,74 Q 38,58 48,56 Z M 152,56 Q 142,50 134,58 Q 128,72 132,92 Q 140,104 154,100 Q 166,92 164,74 Q 162,58 152,56 Z`,
    },

    // BICEPS - Upper arm, front
    biceps: {
        display: `
      M 54,94 Q 60,90 64,96 Q 68,108 66,128 Q 62,142 56,146 Q 48,144 46,130 Q 44,112 48,98 Q 50,92 54,94 Z
      M 146,94 Q 140,90 136,96 Q 132,108 134,128 Q 138,142 144,146 Q 152,144 154,130 Q 156,112 152,98 Q 150,92 146,94 Z
    `,
        hit: `M 50,88 Q 64,82 72,94 Q 78,112 74,140 Q 66,160 50,158 Q 36,152 36,126 Q 36,100 50,88 Z M 150,88 Q 136,82 128,94 Q 122,112 126,140 Q 134,160 150,158 Q 164,152 164,126 Q 164,100 150,88 Z`,
    },

    // FOREARMS - Lower arm
    forearms: {
        display: `
      M 52,150 Q 58,146 62,152 Q 66,168 64,192 Q 60,212 54,222 Q 46,220 44,204 Q 42,180 46,160 Q 48,152 52,150 Z
      M 148,150 Q 142,146 138,152 Q 134,168 136,192 Q 140,212 146,222 Q 154,220 156,204 Q 158,180 154,160 Q 152,152 148,150 Z
    `,
        hit: `M 48,142 Q 64,134 72,150 Q 78,174 74,208 Q 66,238 48,236 Q 32,228 34,196 Q 36,160 48,142 Z M 152,142 Q 136,134 128,150 Q 122,174 126,208 Q 134,238 152,236 Q 168,228 166,196 Q 164,160 152,142 Z`,
    },

    // ABS - Rectus abdominis, six-pack region
    abs: {
        display: `
      M 88,100 Q 94,96 106,96 Q 112,100 114,112 
      Q 116,132 114,156 Q 110,172 100,176 
      Q 90,172 86,156 Q 84,132 86,112 Q 88,100 88,100 Z
    `,
        hit: `M 82,92 Q 94,86 106,86 Q 120,92 122,116 Q 126,148 120,180 Q 108,196 100,196 Q 92,196 80,180 Q 74,148 78,116 Q 82,92 82,92 Z`,
    },

    // OBLIQUES - External obliques, side of torso
    obliques: {
        display: `
      M 72,96 Q 80,92 84,100 Q 88,120 86,156 Q 82,176 78,184 Q 70,180 70,160 Q 68,130 70,106 Q 72,96 72,96 Z
      M 128,96 Q 120,92 116,100 Q 112,120 114,156 Q 118,176 122,184 Q 130,180 130,160 Q 132,130 130,106 Q 128,96 128,96 Z
    `,
        hit: `M 66,88 Q 82,80 90,96 Q 98,128 92,172 Q 84,200 70,196 Q 56,188 58,152 Q 58,112 66,88 Z M 134,88 Q 118,80 110,96 Q 102,128 108,172 Q 116,200 130,196 Q 144,188 142,152 Q 142,112 134,88 Z`,
    },

    // QUADS - Quadriceps, front of thigh
    quads: {
        display: `
      M 78,188 Q 86,182 94,186 Q 100,196 98,236 Q 94,278 88,308 Q 80,318 76,310 Q 72,290 72,250 Q 72,208 78,188 Z
      M 122,188 Q 114,182 106,186 Q 100,196 102,236 Q 106,278 112,308 Q 120,318 124,310 Q 128,290 128,250 Q 128,208 122,188 Z
    `,
        hit: `M 72,180 Q 88,170 100,178 Q 112,188 108,244 Q 102,298 92,332 Q 78,346 70,332 Q 62,304 64,246 Q 66,196 72,180 Z M 128,180 Q 112,170 100,178 Q 88,188 92,244 Q 98,298 108,332 Q 122,346 130,332 Q 138,304 136,246 Q 134,196 128,180 Z`,
    },

    // HIP FLEXORS - Upper inner thigh area
    hip_flexors: {
        display: `
      M 80,178 Q 88,174 94,180 Q 98,190 94,204 Q 88,212 82,210 Q 74,204 76,192 Q 78,182 80,178 Z
      M 120,178 Q 112,174 106,180 Q 102,190 106,204 Q 112,212 118,210 Q 126,204 124,192 Q 122,182 120,178 Z
    `,
        hit: `M 74,170 Q 90,162 102,172 Q 112,186 106,216 Q 94,232 78,226 Q 62,216 66,192 Q 70,174 74,170 Z M 126,170 Q 110,162 98,172 Q 88,186 94,216 Q 106,232 122,226 Q 138,216 134,192 Q 130,174 126,170 Z`,
    },

    // ADDUCTORS - Inner thigh
    adductors: {
        display: `
      M 94,210 Q 100,206 106,210 Q 110,226 108,256 Q 104,278 100,282 Q 96,278 92,256 Q 90,226 94,210 Z
    `,
        hit: `M 90,202 Q 102,194 114,202 Q 122,226 118,270 Q 108,300 100,300 Q 92,300 82,270 Q 78,226 90,202 Z`,
    },
};

// ============================================================================
// BACK VIEW MUSCLE REGIONS - Anatomically accurate curved paths
// ============================================================================
const BACK_MUSCLE_PATHS: Record<string, { display: string; hit: string }> = {
    // NECK - Posterior neck muscles
    neck: {
        display: `
      M 94,44 Q 100,42 106,44 Q 110,50 108,58 Q 104,64 100,64 Q 96,64 92,58 Q 90,50 94,44 Z
    `,
        hit: `M 90,38 Q 100,34 110,38 Q 118,48 114,66 Q 106,78 100,78 Q 94,78 86,66 Q 82,48 90,38 Z`,
    },

    // TRAPS - Trapezius, diamond shape on upper back
    traps: {
        display: `
      M 80,52 Q 88,48 100,46 Q 112,48 120,52 
      Q 128,60 126,74 Q 118,86 100,90 Q 82,86 74,74 Q 72,60 80,52 Z
    `,
        hit: `M 74,46 Q 88,38 100,36 Q 112,38 126,46 Q 138,58 134,82 Q 122,102 100,106 Q 78,102 66,82 Q 62,58 74,46 Z`,
    },

    // REAR DELTOID - Posterior deltoid
    rear_deltoid: {
        display: `
      M 58,58 Q 66,54 72,60 Q 78,72 74,86 Q 68,94 60,92 Q 50,88 50,76 Q 50,64 58,58 Z
      M 142,58 Q 134,54 128,60 Q 122,72 126,86 Q 132,94 140,92 Q 150,88 150,76 Q 150,64 142,58 Z
    `,
        hit: `M 52,50 Q 68,42 80,54 Q 90,72 84,96 Q 72,112 54,106 Q 38,98 40,72 Q 42,54 52,50 Z M 148,50 Q 132,42 120,54 Q 110,72 116,96 Q 128,112 146,106 Q 162,98 160,72 Q 158,54 148,50 Z`,
    },

    // UPPER BACK - Rhomboids, mid-back
    upper_back: {
        display: `
      M 80,88 Q 90,84 100,84 Q 110,84 120,88 
      Q 128,98 126,116 Q 118,128 100,130 Q 82,128 74,116 Q 72,98 80,88 Z
    `,
        hit: `M 74,80 Q 90,72 100,72 Q 110,72 126,80 Q 140,96 136,124 Q 124,146 100,148 Q 76,146 64,124 Q 60,96 74,80 Z`,
    },

    // LATS - Latissimus dorsi, V-taper wings
    lats: {
        display: `
      M 60,88 Q 72,84 78,92 Q 84,108 82,132 Q 78,154 72,166 Q 64,170 60,162 Q 54,146 54,120 Q 54,98 60,88 Z
      M 140,88 Q 128,84 122,92 Q 116,108 118,132 Q 122,154 128,166 Q 136,170 140,162 Q 146,146 146,120 Q 146,98 140,88 Z
    `,
        hit: `M 52,80 Q 74,70 86,84 Q 98,108 94,146 Q 86,182 66,186 Q 46,180 42,142 Q 40,102 52,80 Z M 148,80 Q 126,70 114,84 Q 102,108 106,146 Q 114,182 134,186 Q 154,180 158,142 Q 160,102 148,80 Z`,
    },

    // LOWER BACK - Erector spinae
    lower_back: {
        display: `
      M 82,132 Q 92,128 100,128 Q 108,128 118,132 
      Q 126,144 124,164 Q 116,178 100,180 Q 84,178 76,164 Q 74,144 82,132 Z
    `,
        hit: `M 76,124 Q 92,116 100,116 Q 108,116 124,124 Q 138,142 134,174 Q 120,198 100,200 Q 80,198 66,174 Q 62,142 76,124 Z`,
    },

    // TRICEPS - Back of upper arm
    triceps: {
        display: `
      M 48,92 Q 56,88 62,94 Q 68,110 66,134 Q 60,150 52,152 Q 44,148 44,130 Q 42,108 48,92 Z
      M 152,92 Q 144,88 138,94 Q 132,110 134,134 Q 140,150 148,152 Q 156,148 156,130 Q 158,108 152,92 Z
    `,
        hit: `M 42,84 Q 58,76 70,88 Q 80,110 76,146 Q 66,172 46,168 Q 30,160 32,126 Q 34,94 42,84 Z M 158,84 Q 142,76 130,88 Q 120,110 124,146 Q 134,172 154,168 Q 170,160 168,126 Q 166,94 158,84 Z`,
    },

    // GLUTES - Gluteus maximus
    glutes: {
        display: `
      M 74,178 Q 86,172 100,174 Q 114,172 126,178 
      Q 136,192 132,216 Q 120,232 100,234 Q 80,232 68,216 Q 64,192 74,178 Z
    `,
        hit: `M 66,168 Q 86,156 100,158 Q 114,156 134,168 Q 150,188 144,226 Q 126,252 100,254 Q 74,252 56,226 Q 50,188 66,168 Z`,
    },

    // HAMSTRINGS - Back of thigh
    hamstrings: {
        display: `
      M 74,230 Q 84,224 92,228 Q 98,244 96,284 Q 92,318 86,340 Q 78,348 74,340 Q 70,318 70,280 Q 70,244 74,230 Z
      M 126,230 Q 116,224 108,228 Q 102,244 104,284 Q 108,318 114,340 Q 122,348 126,340 Q 130,318 130,280 Q 130,244 126,230 Z
    `,
        hit: `M 68,220 Q 86,208 100,216 Q 110,232 106,290 Q 100,342 88,368 Q 72,380 66,364 Q 58,330 60,276 Q 62,236 68,220 Z M 132,220 Q 114,208 100,216 Q 90,232 94,290 Q 100,342 112,368 Q 128,380 134,364 Q 142,330 140,276 Q 138,236 132,220 Z`,
    },

    // CALVES - Gastrocnemius
    calves: {
        display: `
      M 76,344 Q 84,338 90,344 Q 94,360 92,388 Q 88,408 84,416 Q 78,414 76,400 Q 74,376 76,352 Q 76,344 76,344 Z
      M 124,344 Q 116,338 110,344 Q 106,360 108,388 Q 112,408 116,416 Q 122,414 124,400 Q 126,376 124,352 Q 124,344 124,344 Z
    `,
        hit: `M 70,334 Q 86,324 96,336 Q 106,358 102,400 Q 94,432 80,432 Q 66,428 66,394 Q 64,354 70,334 Z M 130,334 Q 114,324 104,336 Q 94,358 98,400 Q 106,432 120,432 Q 134,428 134,394 Q 136,354 130,334 Z`,
    },
};

function MuscleDiagramComponent({ view, selectedMuscles, onToggle, hoveredMuscle, onHover }: MuscleDiagramProps) {
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const visibleMuscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
    const musclePaths = view === 'front' ? FRONT_MUSCLE_PATHS : BACK_MUSCLE_PATHS;

    const handleMouseMove = useCallback((e: React.MouseEvent, muscleId: MuscleGroup) => {
        if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 35,
            });
        }
        onHover(muscleId);
    }, [onHover]);

    const handleMouseLeave = useCallback(() => {
        setTooltipPos(null);
        onHover(null);
    }, [onHover]);

    const handleTouchStart = useCallback((muscleId: MuscleGroup, e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setTooltipPos({
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top - 50,
            });
        }
        longPressTimer.current = setTimeout(() => {
            onHover(muscleId);
        }, 300);
    }, [onHover]);

    const handleTouchEnd = useCallback((muscleId: MuscleGroup) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (!hoveredMuscle) {
            onToggle(muscleId);
        }
        onHover(null);
        setTooltipPos(null);
    }, [hoveredMuscle, onToggle, onHover]);

    // Human body silhouette - anatomically proportioned
    const silhouettePath = `
    M 100,10 
    C 90,10 84,18 84,30 C 84,42 90,50 100,50 C 110,50 116,42 116,30 C 116,18 110,10 100,10 Z
    
    M 94,50 L 94,56 
    L 68,62 L 56,68 L 44,78 L 40,92 L 38,120 L 42,148 L 50,168 
    L 54,176 L 50,200 L 44,240
    
    M 106,50 L 106,56 
    L 132,62 L 144,68 L 156,78 L 160,92 L 162,120 L 158,148 L 150,168 
    L 146,176 L 150,200 L 156,240
    
    M 68,62 L 72,68 L 74,100 L 76,140 L 80,180 
    L 82,186 Q 84,188 100,190 Q 116,188 118,186 
    L 120,180 L 124,140 L 126,100 L 128,68 L 132,62
    
    M 80,190 L 78,220 L 74,280 L 72,340 L 76,390
    M 120,190 L 122,220 L 126,280 L 128,340 L 124,390
  `;

    return (
        <div className="relative w-full aspect-[1/2] max-h-[500px] bg-gradient-to-b from-background/90 to-muted/10 rounded-2xl border border-border/30 backdrop-blur-xl overflow-hidden flex items-center justify-center p-4 shadow-2xl">
            {/* Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/3 w-20 h-20 bg-primary/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-secondary/8 rounded-full blur-3xl" />
            </div>

            <svg
                ref={svgRef}
                viewBox="0 0 200 420"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full max-w-[280px] relative z-10"
                role="group"
                aria-label={`${view === 'front' ? 'Front' : 'Back'} view muscle diagram`}
            >
                <defs>
                    <filter id="selectedGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feFlood floodColor="hsl(270, 80%, 60%)" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="hoverGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feFlood floodColor="hsl(180, 70%, 55%)" floodOpacity="0.35" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <pattern id="selectedStripes" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                    </pattern>
                </defs>

                {/* Base Body Silhouette */}
                <path
                    d={silhouettePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-primary/15"
                />

                {/* Head */}
                <ellipse cx="100" cy="30" rx="16" ry="20" className="fill-muted/20 stroke-primary/20" strokeWidth="0.5" />

                {/* Torso outline */}
                <path
                    d={`M 68,62 Q 72,56 100,54 Q 128,56 132,62 L 144,68 Q 160,80 162,100 L 162,120 Q 160,145 150,170 L 146,178 Q 130,190 100,192 Q 70,190 54,178 L 50,170 Q 40,145 38,120 L 38,100 Q 40,80 56,68 L 68,62 Z`}
                    className="fill-muted/15 stroke-primary/20"
                    strokeWidth="0.5"
                />

                {/* Left Arm */}
                <path
                    d={`M 56,68 Q 44,72 40,90 L 38,120 Q 40,145 48,168 L 54,178 Q 52,195 46,220 L 42,250`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />
                <path
                    d={`M 68,62 Q 58,66 54,78 L 52,100 Q 54,130 60,156 L 66,172 Q 62,195 56,220 L 52,250`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />

                {/* Right Arm */}
                <path
                    d={`M 144,68 Q 156,72 160,90 L 162,120 Q 160,145 152,168 L 146,178 Q 148,195 154,220 L 158,250`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />
                <path
                    d={`M 132,62 Q 142,66 146,78 L 148,100 Q 146,130 140,156 L 134,172 Q 138,195 144,220 L 148,250`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />

                {/* Legs */}
                <path
                    d={`M 80,188 L 78,220 L 74,280 L 72,340 L 76,400`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />
                <path
                    d={`M 96,192 L 94,220 L 90,280 L 88,340 L 86,400`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />
                <path
                    d={`M 104,192 L 106,220 L 110,280 L 112,340 L 114,400`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />
                <path
                    d={`M 120,188 L 122,220 L 126,280 L 128,340 L 124,400`}
                    fill="none"
                    className="stroke-primary/20"
                    strokeWidth="0.5"
                />

                {/* ===== DISPLAY LAYER ===== */}
                <g className="muscle-display-layer">
                    {visibleMuscles.map((muscleId) => {
                        const paths = musclePaths[muscleId];
                        if (!paths) return null;

                        const isSelected = selectedMuscles.includes(muscleId);
                        const isHovered = hoveredMuscle === muscleId;

                        return (
                            <g key={`display-${muscleId}`}>
                                {isSelected && (
                                    <path
                                        d={paths.display}
                                        fill="url(#selectedStripes)"
                                        className="pointer-events-none"
                                    />
                                )}
                                <path
                                    d={paths.display}
                                    className={cn(
                                        "transition-all duration-150 ease-out pointer-events-none",
                                        isSelected
                                            ? "fill-primary/60 stroke-primary stroke-[1.5]"
                                            : isHovered
                                                ? "fill-accent/25 stroke-accent stroke-[1.2]"
                                                : "fill-muted/30 stroke-primary/25 stroke-[0.5]"
                                    )}
                                    style={{
                                        filter: isSelected ? 'url(#selectedGlow)' : isHovered ? 'url(#hoverGlow)' : undefined,
                                    }}
                                />
                            </g>
                        );
                    })}
                </g>

                {/* ===== HIT LAYER (Invisible, larger targets) ===== */}
                <g className="muscle-hit-layer">
                    {visibleMuscles.map((muscleId) => {
                        const paths = musclePaths[muscleId];
                        if (!paths) return null;

                        return (
                            <path
                                key={`hit-${muscleId}`}
                                d={paths.hit}
                                fill="transparent"
                                stroke="transparent"
                                className="cursor-pointer"
                                onClick={() => onToggle(muscleId)}
                                onMouseEnter={(e) => handleMouseMove(e, muscleId)}
                                onMouseMove={(e) => handleMouseMove(e, muscleId)}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={(e) => handleTouchStart(muscleId, e)}
                                onTouchEnd={() => handleTouchEnd(muscleId)}
                                role="button"
                                tabIndex={0}
                                aria-pressed={selectedMuscles.includes(muscleId)}
                                aria-label={`${selectedMuscles.includes(muscleId) ? 'Deselect' : 'Select'} ${MUSCLE_NAMES[muscleId]}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onToggle(muscleId);
                                    }
                                }}
                                onFocus={() => onHover(muscleId)}
                                onBlur={() => onHover(null)}
                            >
                                <title>{MUSCLE_NAMES[muscleId]}</title>
                            </path>
                        );
                    })}
                </g>
            </svg>

            {/* Tooltip */}
            {hoveredMuscle && tooltipPos && (
                <div
                    className="absolute z-50 px-3 py-1.5 text-sm font-semibold text-primary-foreground bg-primary/95 rounded-lg shadow-xl pointer-events-none backdrop-blur-sm border border-primary-foreground/10 animate-in fade-in-0 zoom-in-95 duration-100"
                    style={{
                        left: Math.max(8, Math.min(tooltipPos.x - 35, 180)),
                        top: Math.max(8, tooltipPos.y),
                    }}
                >
                    {MUSCLE_NAMES[hoveredMuscle]}
                </div>
            )}

            {/* View Badge */}
            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold bg-background/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-border/40 shadow-sm">
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        view === 'front' ? "bg-primary" : "bg-secondary"
                    )} />
                    {view} view
                </span>
            </div>
        </div>
    );
}

export const MuscleDiagram = memo(MuscleDiagramComponent);
