import { Camera } from '../engine/graphics/Camera';
import { Vector2 } from '../types';

interface Firefly {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    alphaSpeed: number; // For pulsing
    life: number;
    maxLife: number;
    color: string;
}

export class AtmosphereSystem {
    private fireflies: Firefly[] = [];
    private maxFireflies = 100;
    private spawnTimer = 0;
    private spawnRate = 100; // ms

    // Colors: Magical Green, Golden, Soft Blue
    private colors = ['#a3e635', '#facc15', '#60a5fa', '#c084fc'];

    constructor() { }

    public update(dt: number, camera: Camera) {
        // 1. Spawn new fireflies around the camera view
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.fireflies.length < this.maxFireflies) {
            this.spawnFirefly(camera);
            this.spawnTimer = this.spawnRate;
        }

        // 2. Update existing fireflies
        for (let i = this.fireflies.length - 1; i >= 0; i--) {
            const fly = this.fireflies[i];

            // Movement (Simulate slightly erratic floating)
            fly.x += fly.vx * (dt / 16);
            fly.y += fly.vy * (dt / 16);

            // Random subtle direction change
            if (Math.random() < 0.05) {
                fly.vx += (Math.random() - 0.5) * 0.1;
                fly.vy += (Math.random() - 0.5) * 0.1;

                // Clamp velocity
                fly.vx = Math.max(-0.5, Math.min(0.5, fly.vx));
                fly.vy = Math.max(-0.5, Math.min(0.5, fly.vy));
            }

            // Alpha Pulse
            fly.alpha += fly.alphaSpeed * (dt / 1000);
            if (fly.alpha >= 1) {
                fly.alpha = 1;
                fly.alphaSpeed *= -1;
            } else if (fly.alpha <= 0.1) {
                fly.alpha = 0.1;
                fly.alphaSpeed *= -1;
            }

            // Cull if too far from camera
            const bounds = camera.getVisibleBounds();
            const buffer = 10; // tiles
            if (fly.x < bounds.minX - buffer || fly.x > bounds.maxX + buffer ||
                fly.y < bounds.minY - buffer || fly.y > bounds.maxY + buffer) {
                // Respawn closer instead of just removing to maintain density? 
                // Alternatively remove and let spawner handle it.
                this.fireflies.splice(i, 1);
            }
        }
    }

    private spawnFirefly(camera: Camera) {
        const bounds = camera.getVisibleBounds();
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        // Spawn slightly outside or inside view
        // Let's spawn randomly within a slightly larger rect than view
        const rangeX = width + 10;
        const rangeY = height + 10;

        const x = bounds.minX - 5 + Math.random() * rangeX;
        const y = bounds.minY - 5 + Math.random() * rangeY;

        this.fireflies.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.05, // Much slower (was 0.3)
            vy: (Math.random() - 0.5) * 0.05,
            size: 0.2 + Math.random() * 0.8, // Smaller (was 0.5 - 2.0)
            alpha: Math.random(),
            alphaSpeed: 0.2 + Math.random() * 0.3, // Slower pulse (was 0.5-1.0)
            life: 1000,
            maxLife: 1000,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        });
    }

    public render(ctx: CanvasRenderingContext2D, camera: Camera) {
        ctx.save();

        // Additive blending for glow effect
        ctx.globalCompositeOperation = 'lighter';

        for (const fly of this.fireflies) {
            const screen = camera.toScreen(fly.x, fly.y);

            // Culling Screen Space
            // (Optional optimization)

            // Draw Core
            ctx.globalAlpha = fly.alpha;
            ctx.fillStyle = fly.color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, fly.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw Glow
            ctx.globalAlpha = fly.alpha * 0.4;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, fly.size * 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
