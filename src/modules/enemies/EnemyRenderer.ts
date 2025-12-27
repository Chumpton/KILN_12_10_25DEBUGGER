import { Enemy } from '../../types';
import { ENTITY_RIGS } from '../../data/EntityRigDefinitions';
import { getAsset } from '../../utils/AssetLoader';

// Asset loading helper
const get = (key: string) => getAsset(key) || new Image();

const assets = {
    get torso() { return get('SKELETON_TORSO'); },
    get head() { return get('ENEMY_HEAD') || get('SKELETON_HEAD'); },
    get legs() { return get('SKELETON_LEGS'); },
    get foot() { return get('SKELETON_FOOT'); },
    get arm() { return get('SKELETON_ARM'); },
    get hand() { return get('SKELETON_HAND'); }
};

type DrawCommand = {
    z: number;
    // For Image
    img?: HTMLImageElement;
    px?: number;
    py?: number;
    matrix: DOMMatrix;
};

export class EnemyRenderer {

    public render(
        ctx: CanvasRenderingContext2D,
        enemy: Enemy,
        x: number,
        y: number
    ): void {
        const time = Date.now();
        const facingRight = enemy.facingRight;
        const isHit = enemy.hitTimer > 0;
        const isDying = enemy.enemyState === 'DYING';

        ctx.save();

        // Death Animation (Fall Backward & Bounce)
        if (isDying) {
            // progress: 1.0 (start) -> 0.0 (end)
            const progress = enemy.deathTimer / 30;
            const t = 1.0 - progress; // 0.0 -> 1.0

            // Rotate back 90 degrees (HALF_PI)
            // If facing left, we rotate the other way
            const rotation = (Math.PI / 2) * t * (facingRight ? -1 : 1);

            // Fall to ground (y) with a small bounce
            // Simple bounce curve: drops fast, hits, bounces up slightly, performs rest
            let dropOffset = 0;
            if (t < 0.6) {
                // Falling
                dropOffset = t * 20;
            } else {
                // Bouncing
                const bounceT = (t - 0.6) / 0.4;
                dropOffset = 12 - Math.sin(bounceT * Math.PI) * 5;
            }

            ctx.translate(x, y + dropOffset);
            ctx.rotate(rotation);
            ctx.translate(-x, -(y + dropOffset));
        }

        // Apply global flip for facing direction
        if (!facingRight) {
            ctx.translate(x, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }

        // Render skeletal body
        this.renderSkeleton(ctx, x, y, enemy, facingRight, time, isHit);

        ctx.restore();

        // Render Health bar if damaged
        if (!isDying && (isHit || enemy.hp < enemy.maxHp)) {
            this.renderHealthBar(ctx, x, y, enemy);
        }

        // Render Status Effects (Burn, Freeze, etc.)
        this.renderStatusEffects(ctx, x, y, enemy);
    }

    private renderStatusEffects(ctx: CanvasRenderingContext2D, x: number, y: number, enemy: Enemy) {
        const activeEffects: string[] = [];
        if (enemy.burnTimer > 0) activeEffects.push('burn');
        if (enemy.freezeTimer > 0) activeEffects.push('freeze');
        if (enemy.shockTimer > 0) activeEffects.push('shock');

        if (activeEffects.length === 0) return;

        const time = Date.now();
        const pulse = Math.sin(time / 100) * 2;
        const iconSpacing = 20;
        const totalWidth = (activeEffects.length - 1) * iconSpacing;
        const startX = x - totalWidth / 2;
        const baseY = y - 135 + pulse;

        activeEffects.forEach((effect, index) => {
            const dx = startX + index * iconSpacing;
            ctx.save();
            ctx.translate(dx, baseY);

            if (effect === 'burn') {
                // Draw Flame
                ctx.fillStyle = '#ff4500';
                ctx.shadowColor = '#ffaa00';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.quadraticCurveTo(6, -4, 4, 4);
                ctx.quadraticCurveTo(0, 8, -4, 4);
                ctx.quadraticCurveTo(-6, -4, 0, -8);
                ctx.fill();
                // Core
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.quadraticCurveTo(3, -2, 2, 2);
                ctx.quadraticCurveTo(0, 4, -2, 2);
                ctx.quadraticCurveTo(-3, -2, 0, -4);
                ctx.fill();
            } else if (effect === 'freeze') {
                // Draw Snowflake
                ctx.strokeStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 8;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    ctx.save();
                    ctx.rotate((i * Math.PI) / 3);
                    ctx.moveTo(0, -7);
                    ctx.lineTo(0, 7);
                    // Flakes
                    ctx.moveTo(0, -4); ctx.lineTo(-3, -6);
                    ctx.moveTo(0, -4); ctx.lineTo(3, -6);
                    ctx.moveTo(0, 4); ctx.lineTo(-3, 6);
                    ctx.moveTo(0, 4); ctx.lineTo(3, 6);
                    ctx.restore();
                }
                ctx.stroke();
            } else if (effect === 'shock') {
                // Draw Lightning Bolt
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(3, -8);
                ctx.lineTo(-2, -1);
                ctx.lineTo(2, -1);
                ctx.lineTo(-3, 8); // Tip
                ctx.lineTo(1, 1);
                ctx.lineTo(-3, 1);
                ctx.closePath();
                ctx.fill();

                // Draw Stack Count
                const stacks = enemy.shockStacks || 0;
                if (stacks > 0) {
                    ctx.shadowBlur = 0; // Clear shadow for text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'left';
                    // Superscript X + count
                    ctx.fillText(`x${stacks}`, 4, -4);
                }
            }

            ctx.restore();
        });
    }

    private renderHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, enemy: Enemy) {
        // Match Player UI Style (UIRenderer.ts)
        const barWidth = 50;
        const barHeight = 6;
        // Position higher (approx matching 'hp_bar' in EntityRigDefinitions)
        const verticalOffset = -120;

        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);

        ctx.save();
        ctx.translate(x, y + verticalOffset);

        // Background (Dark Grey - #1f2937)
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);

        // Fill (Red - #ef4444)
        if (hpPercent > 0) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-barWidth / 2, 0, barWidth * hpPercent, barHeight);
        }

        // Border (Black - #000000)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, 0, barWidth, barHeight);

        ctx.restore();
    }

    private renderSkeleton(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        enemy: Enemy,
        facingRight: boolean,
        time: number,
        isHit: boolean
    ): void {
        const config = ENTITY_RIGS['skeleton_npc'];
        if (!config) return;

        const parts = config.parts;
        const scale = config.scale || 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Calculate Simple Animations
        const isIdle = enemy.aiState === 'IDLE' && !enemy.isDead; // Assuming IDLE means standing still
        // Note: EnemySystem sets 'IDLE' for Dummy.
        const runSpeed = 150;
        const runAmp = isIdle ? 0 : 0.5;
        const breath = Math.sin(time / 500) * 1.5;

        const legLRot = Math.sin(time / runSpeed) * runAmp;
        const legRRot = Math.sin(time / runSpeed + Math.PI) * runAmp;
        const armLRot = Math.sin(time / runSpeed + Math.PI) * runAmp;
        const armRRot = Math.sin(time / runSpeed) * runAmp;

        // Use a simple animation object to mimic PlayerRenderer structure
        const animations: any = {
            'torso': { offsetY: breath, rotation: 0, offsetX: 0 },
            'head': { offsetY: 0, rotation: 0, offsetX: 0 },
            'arm_l': { rotation: armLRot, offsetX: 0, offsetY: 0 },
            'arm_r': { rotation: armRRot, offsetX: 0, offsetY: 0 },
            'leg_l': { rotation: legLRot, offsetX: 0, offsetY: 0 },
            'leg_r': { rotation: legRRot, offsetX: 0, offsetY: 0 },
        };

        const drawList: DrawCommand[] = [];

        const recordDraw = (img: HTMLImageElement, z: number, px: number, py: number) => {
            if (img.complete) {
                drawList.push({
                    img,
                    z,
                    px,
                    py,
                    matrix: ctx.getTransform()
                });
            }
        };

        // Render body parts (Logic copied from PlayerRenderer.ts renderBodyParts)
        this.renderBodyParts(ctx, parts, animations, recordDraw, enemy);

        ctx.restore();

        // Sort and draw all parts by z-index
        drawList.sort((a, b) => a.z - b.z).forEach(cmd => {
            ctx.save();
            ctx.setTransform(cmd.matrix);
            if (cmd.img) {
                // Draw the sprite normally first
                ctx.drawImage(cmd.img, cmd.px!, cmd.py!);

                // Hit flash effect - glow only the shape of the PNG
                // Hit flash effect - glow only the shape of the PNG
                if (isHit) {
                    // Create a double flash effect at 2x speed
                    // hitTimer counts down from 5 to 0 (5 frames total)
                    // We want 2 complete flashes in that time
                    const progress = enemy.hitTimer / 5; // 1.0 to 0.0
                    const flashCycle = Math.sin(progress * Math.PI * 4); // 2 complete cycles (4 * PI = 2 full waves)
                    const flashIntensity = Math.max(0, flashCycle); // Only positive values (flash on, not off)

                    if (flashIntensity > 0) {
                        ctx.save();

                        // Create a white glow that follows the sprite shape
                        ctx.shadowColor = '#ffffff';
                        ctx.shadowBlur = 8 * flashIntensity;
                        ctx.globalCompositeOperation = 'source-atop';

                        // Draw the image again with white tint to create glow
                        ctx.globalAlpha = 0.7 * flashIntensity;
                        ctx.drawImage(cmd.img, cmd.px!, cmd.py!);

                        // Add outer glow
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.shadowBlur = 15 * flashIntensity;
                        ctx.shadowColor = `rgba(255, 255, 255, ${0.8 * flashIntensity})`;
                        ctx.drawImage(cmd.img, cmd.px!, cmd.py!);

                        ctx.restore();
                    }
                }

                // CHILL / FREEZE OVERLAY
                if (enemy.freezeTimer > 0) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.globalAlpha = 0.5; // 50% opacity
                    ctx.fillStyle = '#00ffff'; // Cyan

                    // We can't just fillRect because we want to tint the image content only
                    // But source-atop works on existing content. 
                    // To tint the *specific sprite* we just drew:
                    // 1. We just drew the sprite.
                    // 2. We set source-atop.
                    // 3. We fillRect covering the sprite area (or drawImage again with tint?).
                    // Actually, source-atop draws NEW content ONLY where OLD content exists.
                    // So we can fillRect over the sprite bounds.
                    const w = cmd.img.width;
                    const h = cmd.img.height;

                    // Since it's 'source-atop' against the *entire canvas*, we need to be careful if we are not isolated.
                    // BUT: We are creating a composite stack per-sprite? No, we are drawing directly to main ctx.
                    // Use a tint function or drawImage with a filter if supported? Filter is expensive.
                    // Re-drawing same image with a tint is often done by offscreen buffer, but that's slow.
                    // Simple approach: Use 'source-atop' assuming the sprite is the only thing in this specific localized area?
                    // No, that risks tinting the background if we didn't isolate this sprite.
                    // However, we are in a 'drawList.forEach' loop.
                    // If we want to tint JUST this sprite, we usually need to perform the tinting in a scratch canvas or use a shader.
                    // Canvas 2D "Tint": 
                    // 1. ctx.globalCompositeOperation = 'source-atop'
                    // 2. ctx.fillStyle = color
                    // 3. ctx.fillRect(x, y, w, h)
                    // THIS ONLY WORKS if we are drawing onto a transparent layer where only the sprite exists.
                    // Here we are drawing onto the MAIN canvas which has background.
                    // So 'source-atop' will see the background pixels too.

                    // ALTERNATIVE: Draw a semi-transparent blue version of the image ON TOP?
                    // Just drawing the image again with globalAlpha doesn't change color.
                    // Unless we use 'lighter' (additive) with blue?
                    // Or cache a blue version.
                    // "Slight transparent chilled overlay" -> Just additive blue?

                    ctx.globalCompositeOperation = 'lighter'; // Additive
                    ctx.globalAlpha = 0.4;
                    // Draw a blue-tinted primitive? No.
                    // Draw the image again? No that just brightens.
                    // A simple cheap way: Draw a colored rect with 'screen' or 'overlay' blend mode?
                    // No, that affects background.

                    // TRICK: mask the tint to the image using a temporary canvas? 
                    // Or just use 'shadow' trick?
                    // Set shadowColor = blue, shadowBlur = 0, offset = 0.
                    // Draw image again.
                    // If the image has alpha, the shadow will appear behind it?
                    // No, drop-shadow follows alpha.
                    // If we draw shadow ON TOP?

                    // Let's use the standard offscreen tint approach if we want correct "Overlay".
                    // But for performance, maybe just 'lighter' for "Ice Glint" is enough?
                    // User asked for "slight transparent chilled overlay".
                    // Let's try: 'source-over' with a blue-ish filter? No filter support in all browsers/contexts efficiently.

                    // COMPROMISE: Draw a blue circle at feet? No, "on their body".
                    // Let's try 'lighter' blend with a slightly blue-shifted duplicate.
                    // Or just drawing the image again with a blue filter?
                    // ctx.filter = 'sepia(1) hue-rotate(180deg) saturate(3)'; // Blue-ish
                    // This is supported in most modern browsers.

                    if (ctx.filter !== undefined) {
                        ctx.filter = 'sepia(1) hue-rotate(130deg) saturate(5) brightness(0.8)'; // Cyan/Blue
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(cmd.img, cmd.px!, cmd.py!);
                        ctx.filter = 'none';
                    } else {
                        // Fallback: Additive Blue-ish Glow
                        ctx.shadowColor = '#00ffff';
                        ctx.shadowBlur = 2; // Tight glow
                        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                        ctx.globalCompositeOperation = 'lighter';
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(cmd.img, cmd.px!, cmd.py!);
                    }

                    ctx.restore();
                }
            }
            ctx.restore();
        });
    }

    private renderBodyParts(
        ctx: CanvasRenderingContext2D,
        parts: any,
        animations: any,
        recordDraw: Function,
        enemy: Enemy
    ): void {
        const partsList = [
            { name: 'arm_r', img: assets.arm },
            { name: 'leg_r', img: assets.legs },
            { name: 'leg_l', img: assets.legs },
            { name: 'torso', img: assets.torso },
            { name: 'arm_l', img: assets.arm }
        ];

        // Calculate torso Y with breathing for arm positioning
        const torsoBasePart = parts['torso'] || { y: -45 };
        const torsoAnim = animations['torso'] || { offsetY: 0 };
        const torsoY = torsoBasePart.y + torsoAnim.offsetY;

        partsList.forEach(({ name, img }) => {
            const part = parts[name];
            if (!part) return; // Crash safety

            const anim = animations[name] || { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };

            if (!img.complete) return;

            ctx.save();

            // Arms are positioned relative to torso Y (for breathing sync)
            // Legs and torso use absolute positions
            const basesY = name.includes('arm') ? torsoY + part.y : part.y + anim.offsetY;
            const basesX = part.x + anim.offsetX;

            ctx.translate(basesX, basesY);
            ctx.rotate((part.rotation || 0) + anim.rotation);

            ctx.scale((part.scale || 1) * (part.flipX ? -1 : 1), part.scale || 1);

            recordDraw(img, part.zIndex ?? 0, -img.width / 2, name === 'torso' ? -img.height : 0);

            // Render child parts (hands, feet, head)
            this.renderChildParts(ctx, name, parts, img, recordDraw, animations);

            ctx.restore();
        });
    }

    private renderChildParts(
        ctx: CanvasRenderingContext2D,
        parentName: string,
        parts: any,
        parentImg: HTMLImageElement,
        recordDraw: Function,
        animations: any
    ): void {
        // Hands for arms
        if (parentName.includes('arm') && assets.hand.complete) {
            const handName = parentName.replace('arm', 'hand');
            const hand = parts[handName];
            if (hand) {
                ctx.save();
                ctx.translate(hand.x, parentImg.height - 2 + hand.y);
                ctx.rotate(hand.rotation || 0);
                ctx.scale((hand.scale || 1) * (hand.flipX ? -1 : 1), hand.scale || 1);
                recordDraw(assets.hand, hand.zIndex ?? 1, -assets.hand.width / 2, 0);
                ctx.restore();
            }
        }

        // Feet for legs
        if (parentName.includes('leg') && assets.foot.complete) {
            const footName = parentName.replace('leg', 'foot');
            const foot = parts[footName];
            if (foot) {
                // Logic matches renderSkeletalNPC.ts / PlayerRenderer
                const leg = parts[parentName] || { x: 0, y: 0, scale: 1 };
                const lScale = leg.scale || 1;
                const relX = (foot.x - leg.x) / lScale;
                const relY = (foot.y - leg.y) / lScale;

                ctx.save();
                ctx.translate(relX, relY);
                ctx.rotate(foot.rotation || 0);
                // Decouple scale from parent leg
                const fScaleX = (foot.scale || 1) / lScale;
                const fScaleY = (foot.scale || 1) / lScale;
                ctx.scale(fScaleX * (foot.flipX ? -1 : 1), fScaleY);

                recordDraw(assets.foot, foot.zIndex ?? 0, -assets.foot.width / 2, -assets.foot.height / 2);
                ctx.restore();
            }
        }

        // Head for torso
        if (parentName === 'torso' && assets.head.complete) {
            const head = parts['head'];
            if (head) {
                const headAnim = animations['head'] || { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };

                ctx.save();
                // Position relative to parent transform (Torso Bottom).
                ctx.translate(head.x, -parentImg.height + head.y);

                // Apply Anim (if we had head animation)
                ctx.translate(headAnim.offsetX, headAnim.offsetY);
                ctx.rotate(head.rotation + headAnim.rotation);

                ctx.scale((head.scale || 1) * (head.flipX ? -1 : 1), head.scale || 1);
                recordDraw(assets.head, head.zIndex ?? 7, -assets.head.width / 2, -assets.head.height);
                ctx.restore();
            }
        }
    }
}

export const enemyRenderer = new EnemyRenderer();
