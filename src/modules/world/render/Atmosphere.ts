/**
 * Atmosphere.ts
 * Manages environmental effects: Wind sway calculation and Particle systems.
 */

import { Vector2 } from '../../../types';
import { pseudoRandom } from '../WorldGen';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    alpha: number;
}

export interface AtmosphereState {
    windTime: number;
    windStrength: number; // 0 to 1
    particles: Particle[];
}

export const createAtmosphere = (): AtmosphereState => ({
    windTime: 0,
    windStrength: 0.5,
    particles: []
});

/**
 * Returns a sway value between -1 and 1 based on global time and position.
 * Position is used to create a "wave" effect across the grass/trees.
 */
export const getWindSway = (state: AtmosphereState, worldX: number, worldY: number): number => {
    // Global wind oscillation
    const time = state.windTime;

    // Low frequency base wind
    const base = Math.sin(time * 0.001);

    // Higher max gust
    const gust = Math.sin(time * 0.003 + worldX * 0.1 + worldY * 0.05);

    // Combine
    return (base * 0.4 + gust * 0.6) * state.windStrength;
};

export const updateAtmosphere = (state: AtmosphereState, isNight: boolean, playerPos: Vector2) => {
    state.windTime += 16; // Assume ~60fps, 16ms delta

    // Vary wind strength slowly
    state.windStrength = 0.5 + Math.sin(state.windTime * 0.0001) * 0.3;

    // PARTICLE SYSTEM
    const targetParticleCount = 50;

    // Spawn particles
    if (state.particles.length < targetParticleCount) {
        // Spawn around player
        const range = 20; // Visibility radius
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * range;

        state.particles.push({
            x: playerPos.x + Math.cos(angle) * dist,
            y: playerPos.y + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            life: Math.random() * 200 + 100,
            maxLife: 300,
            size: isNight ? 2 + Math.random() : 1 + Math.random(), // Fireflies larger
            alpha: 0
        });
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life--;
        p.x += p.vx + (Math.sin(state.windTime * 0.002) * 0.01); // Drift with wind
        p.y += p.vy;

        // Fade in/out
        const lifePct = p.life / p.maxLife;
        if (lifePct > 0.8) p.alpha = (1 - lifePct) * 5; // Fade in
        else if (lifePct < 0.2) p.alpha = lifePct * 5; // Fade out
        else p.alpha = 1.0;

        if (p.life <= 0) {
            state.particles.splice(i, 1);
        }
    }
};

export const renderParticles = (ctx: CanvasRenderingContext2D, state: AtmosphereState, isNight: boolean, scrollX: number, scrollY: number) => {
    ctx.save();

    state.particles.forEach(p => {
        const screenX = (p.x * 32) + (p.y * -32) + scrollX; // Standard Iso Projection (simplified)
        // Wait, the game uses `toScreen`. We should probably stick to world coordinates rendering 
        // if we are inside the main transform loop.
        // But `renderParticles` is likely called at the end on top of everything.
        // Let's assume the caller handles the camera transform if using world coords, 
        // OR we manually project if we are drawing overlay.

        // Actually, looking at GameCanvas, it projects every item. 
        // So we should just draw at world coords but we need to know the projection.
        // HOWEVER, generic renderers in `render` folder usually take SCREEN X/Y.
        // So we will just loop in GameCanvas and call a simple `renderParticle` or do it here if we pass converter?
        // Let's just output World Coords and let GameCanvas project them, OR 
        // pass a projection function.

        // For now, let's keep this function simple and assume we are calculating screen pos in GameCanvas loop 
        // or passing a screen converter is messy. 
        // Let's just return the particle data and let GameCanvas render it, 
        // OR render it here if we pass Screen X, Y.
    });

    // Actually, `renderTree` takes screen X/Y. So this should too.
    // But this function iterates ALL particles.
    // So it needs a way to project.

    // Better idea: GameCanvas iterates particles, projects them, and calls `renderParticle(ctx, sx, sy, ...)`
    // So let's export a single particle renderer.

    ctx.restore();
};

export const renderParticle = (ctx: CanvasRenderingContext2D, screenX: number, screenY: number, p: Particle, isNight: boolean) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;

    // Dust Mote (Always, no Fireflies)
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(screenX, screenY, p.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
