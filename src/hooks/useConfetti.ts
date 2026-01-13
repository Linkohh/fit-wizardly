import { useEffect, useRef, useCallback } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
}

const COLORS = [
    '#8B5CF6', // Primary purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#EF4444', // Red
];

/**
 * Creates a confetti burst animation at the center of the screen.
 * Lightweight canvas-based implementation.
 */
export function useConfetti() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    const createParticles = useCallback((count: number = 100) => {
        const particles: Particle[] = [];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const velocity = 8 + Math.random() * 8;

            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 5,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 8 + Math.random() * 8,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                life: 1,
            });
        }

        return particles;
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current = particlesRef.current.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // Gravity
            p.vx *= 0.99; // Air resistance
            p.rotation += p.rotationSpeed;
            p.life -= 0.015;

            if (p.life <= 0) return false;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;

            // Draw confetti piece (rectangle)
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);

            ctx.restore();

            return true;
        });

        if (particlesRef.current.length > 0) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            // Cleanup canvas
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
            canvasRef.current = null;
        }
    }, []);

    const fire = useCallback(() => {
        // Create canvas if it doesn't exist
        if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);
            canvasRef.current = canvas;
        }

        // Add particles
        particlesRef.current = [
            ...particlesRef.current,
            ...createParticles(100),
        ];

        // Start animation if not already running
        if (!animationFrameRef.current) {
            animate();
        }
    }, [createParticles, animate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (canvasRef.current && canvasRef.current.parentNode) {
                canvasRef.current.parentNode.removeChild(canvasRef.current);
            }
        };
    }, []);

    return { fire };
}
