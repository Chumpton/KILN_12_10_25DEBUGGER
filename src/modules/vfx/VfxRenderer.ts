
import { Camera } from '../../engine/graphics/Camera';
import { Vector2 } from '../../types';
import { TILE_WIDTH } from '../../constants';

export interface VisualEffect {
    id: string;
    type: 'nova' | 'particle' | 'text' | 'ring' | 'surge' | 'shatter' | 'sprite' | 'lightning_chain';
    pos: Vector2;
    velocity?: Vector2;
    life: number;
    maxLife: number;
    color: string;
    data?: any; // radius, size, text, spriteUrl, animateFlip, etc.
}

export const VfxRenderer = {
    render: (ctx: CanvasRenderingContext2D, camera: Camera, effects: VisualEffect[]) => {
        effects.forEach(vfx => {
            const s = camera.toScreen(vfx.pos.x, vfx.pos.y);
            const pct = Math.max(0, Math.min(1, vfx.life / vfx.maxLife));
            const invPct = 1 - pct;

            ctx.save();
            ctx.translate(s.x, s.y);

            if (vfx.type === 'sprite' && vfx.data?.spriteUrl) {
                const img = new Image();
                img.src = vfx.data.spriteUrl;

                if (img.complete) {
                    // Animation: Flip
                    if (vfx.data.animateFlip) {
                        // Fast oscillation for "coin flip" effect
                        // Use global time or life. Life goes 1 -> 0.
                        const flipParam = (pct * 20); // 20 radians over lifetime
                        const scaleX = Math.sin(flipParam);
                        ctx.scale(scaleX, 1);
                    }

                    // Simple Pop Scale (Grow then shrink slightly? or Constant?)
                    // User said "Bigger over the whole NPC".
                    let size = vfx.data.size || 1;

                    // Optional Flash (Tint) - difficult with raw canvas image without buffer, 
                    // but we can use globalCompositeOperation for simple flash if needed.

                    ctx.drawImage(img, -16 * size, -16 * size, 32 * size, 32 * size);
                }

            } else if (vfx.type === 'nova') {
                // Expanding Ring
                const maxRadius = (vfx.data?.radius || 1.5) * TILE_WIDTH;
                ctx.globalAlpha = pct;
                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(0, maxRadius * invPct), 0, Math.PI * 2);
                ctx.stroke();

            } else if (vfx.type === 'ring') {
                // Contracting Ring (Absorption Halo)
                // Starts large, gets small
                const startRadius = (vfx.data?.radius || 1.0) * TILE_WIDTH;
                const currentRadius = startRadius * pct;

                ctx.globalAlpha = 0.6;
                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 2 + (invPct * 4);
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(0, currentRadius), 0, Math.PI * 2);
                ctx.stroke();

            } else if (vfx.type === 'surge') {
                // Vertical Stream / Particle
                ctx.globalAlpha = pct;
                ctx.fillStyle = vfx.color;
                const size = vfx.data?.size || 4;
                ctx.beginPath();
                ctx.arc(0, 0, size * pct, 0, Math.PI * 2);
                ctx.fill();

                // Trail
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 20 * invPct);
                ctx.strokeStyle = vfx.color;
                ctx.stroke();

            } else if (vfx.type === 'particle') {
                // Generic Particle
                ctx.globalAlpha = pct;
                ctx.fillStyle = vfx.color;
                const size = vfx.data?.size || 3;

                if (vfx.data?.shape === 'rect') {
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (vfx.type === 'shatter') {
                // Spinning Shards
                const count = 3;
                const spread = 20 * invPct;
                const rot = invPct * Math.PI * 2;

                for (let i = 0; i < count; i++) {
                    ctx.save();
                    const angle = (i / count) * Math.PI * 2 + rot;
                    const dx = Math.cos(angle) * spread;
                    const dy = Math.sin(angle) * spread;
                    ctx.translate(dx, dy);
                    ctx.rotate(angle + rot);

                    ctx.fillStyle = vfx.color;
                    ctx.beginPath();
                    ctx.moveTo(0, -5);
                    ctx.lineTo(3, 3);
                    ctx.lineTo(-3, 3);
                    ctx.fill();
                    ctx.restore();
                }
            } else if (vfx.type === 'text') {
                // Floating Text
                ctx.fillStyle = vfx.color;
                ctx.font = 'bold 16px sans-serif'; // Default
                if (vfx.data?.font) ctx.font = vfx.data.font;

                ctx.textAlign = 'center';
                // Rise up
                const yOffset = -20 * invPct;
                ctx.fillText(vfx.data?.text || '', 0, yOffset);
            } else if (vfx.type === 'lightning_chain') {
                // Lightning Bolt
                if (vfx.data?.target) {
                    const targetScreen = camera.toScreen(vfx.data.target.x, vfx.data.target.y);
                    // Support visual offset (e.g. aiming for chest/head)
                    if (vfx.data.targetOffset) {
                        targetScreen.x += (vfx.data.targetOffset.x || 0);
                        targetScreen.y += (vfx.data.targetOffset.y || 0);
                    }

                    // We are already translated to start (vfx.pos) -> (0,0)
                    // So we need relative coords for target
                    const dx = targetScreen.x - s.x;
                    const dy = targetScreen.y - s.y;
                    const dist = Math.hypot(dx, dy);

                    ctx.strokeStyle = vfx.color;
                    ctx.lineWidth = vfx.data.thickness || 2;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = vfx.color;
                    ctx.shadowBlur = 10;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);

                    // ZigZag Logic
                    const segments = Math.floor(dist / 20); // every 20px
                    if (segments > 0) {
                        for (let i = 1; i < segments; i++) {
                            const t = i / segments;
                            const jitter = (Math.random() - 0.5) * 20; // +/- 10px
                            // Perpendicular jitter could be better but simple random is mostly fine for fast lightning
                            ctx.lineTo(dx * t + jitter, dy * t + jitter);
                        }
                    }
                    ctx.lineTo(dx, dy);
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset
                }
            }

            ctx.restore();
        });
    }
};
