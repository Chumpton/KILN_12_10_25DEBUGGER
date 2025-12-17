import { ENTITY_RIGS } from '../../../data/EntityRigDefinitions';

// Helper for simple transforms
const drawPart = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    rotation: number = 0,
    scale: number = 1,
    scaleX: number = 1,
    ox: number = 0.5,
    oy: number = 0.5
) => {
    if (!img.complete) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale * scaleX, scale);
    ctx.drawImage(img, -img.width * ox, -img.height * oy);
    ctx.restore();
};

const bodyImg = new Image(); bodyImg.src = '/world_edit/Animals/Wolf/Body.png';
const headImg = new Image(); headImg.src = '/world_edit/Animals/Wolf/Head.png';
const tailImg = new Image(); tailImg.src = '/world_edit/Animals/Wolf/Tail.png';
const legImg = new Image(); legImg.src = '/world_edit/Animals/Wolf/Leg.png';

export const renderBear = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number = 1,
    isMovingOverride: boolean = false,
    facingRightOverride: boolean = true,
    seedX: number = 0,
    seedY: number = 0
) => {
    const time = Date.now();

    // Use Brown Tint for Bear
    // We can't easily tint images in Canvas 2D without caching or composite ops that might affect background.
    // However, we can use filter if supported, or just rely on scale for now.
    // Let's try filter (widely supported enough for this environment likely).
    ctx.save();
    ctx.filter = 'sepia(1) saturate(2) hue-rotate(-30deg) brightness(0.6)';

    // --- DETERMINISTIC RANDOM WALK ---
    // 1. Seed
    const seed = Math.floor(seedX * 1000 + seedY);
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    // 2. Time Segmentation (6s Cycle)
    const CYCLE_DURATION = 6000;
    const cycleIndex = Math.floor(time / CYCLE_DURATION);
    const cycleProgress = (time % CYCLE_DURATION) / CYCLE_DURATION; // 0..1

    // 3. Generate Waypoints
    const getTarget = (index: number) => {
        const r1 = random(seed + index * 2);
        const r2 = random(seed + index * 2 + 1);
        const range = 80; // Valid roam range
        return {
            x: (r1 - 0.5) * 2 * range,
            y: (r2 - 0.5) * 2 * range
        };
    };

    const targetProps = getTarget(cycleIndex);
    const prevTargetProps = getTarget(cycleIndex - 1);

    // 4. Movement Logic
    const moveFraction = 0.5;
    let offsetX = 0; // We might not want random walk for player movement, but this renderer seems designed for NPCs?
    // Wait, PlayerRenderer passes x, y directly. The random walk logic in renderWolf seems to be for visual bobbing or idle roam IF controlled by AI.
    // Since we ignore x, y args in favor of 'rootX' calculated from random walk... wait.
    // In renderWolf: const rootX = x + offsetX;
    // If we are rendering the PLAYER, we want exact control.
    // The renderWolf seems to have built-in idle roam relative to input x,y?
    // That's annoying for a player renderer.
    // I should disable the random walk offset if it's the player. 
    // Usually 'seedX/Y' are 0 for player? 
    // Let's assume for Player we just pass 0 offsets.

    // Override offsets for Player Control
    // Just use input x,y
    offsetX = 0;
    let offsetY = 0;
    let isMoving = isMovingOverride;

    const dirX = facingRightOverride ? 1 : -1;

    // Draw Position
    const rootX = x;
    const rootY = y;

    // Animation Vars
    const walkBob = isMoving ? Math.sin(time / 200) * 2 : 0; // Slower bob for bear

    const anchorX = rootX;
    const anchorY = rootY;

    // SCALING: Bear is HUGE
    const finalScale = scale * 1.8;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY, 25 * finalScale, 8 * finalScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- DRAW ORDER: Tail -> Back Legs -> Body -> Front Legs -> Head ---

    // Tail (Stubby)
    const tailX = anchorX + (-20 * dirX * finalScale);
    const tailY = anchorY + (-5 * finalScale) - Math.abs(walkBob);
    const tailRot = (Math.sin(time / 200) * 0.1) * dirX;
    if (tailImg.complete) drawPart(ctx, tailImg, tailX, tailY, tailRot, finalScale * 0.5, dirX, 0.9, 0.5); // Smaller tail

    // Back Legs
    const legBackX = anchorX + (-15 * dirX * finalScale);
    const legBackY = anchorY;
    const legBackRot = isMoving ? Math.sin(time / 200) * 0.5 : 0;
    if (legImg.complete) drawPart(ctx, legImg, legBackX, legBackY, legBackRot, finalScale, dirX, 0.5, 0.1);

    // Body (Fat)
    const bodyX = anchorX + (0 * dirX * finalScale);
    const bodyY = anchorY + (-15 * finalScale) - Math.abs(walkBob);
    const bodyRot = isMoving ? (Math.sin(time / 200) * 0.05) * dirX : 0;
    if (bodyImg.complete) drawPart(ctx, bodyImg, bodyX, bodyY, bodyRot, finalScale * 1.2, dirX, 0.5, 0.5); // Wider body

    // Front Legs
    const legFrontX = anchorX + (15 * dirX * finalScale);
    const legFrontY = anchorY;
    const legFrontRot = isMoving ? Math.sin(time / 200 + Math.PI) * 0.5 : 0;
    if (legImg.complete) drawPart(ctx, legImg, legFrontX, legFrontY, legFrontRot, finalScale, dirX, 0.5, 0.1);

    // Head
    const headX = bodyX + (25 * dirX * finalScale);
    const headY = bodyY + (-5 * finalScale);
    const headRot = (Math.sin(time / 400) * 0.05) * dirX;
    if (headImg.complete) drawPart(ctx, headImg, headX, headY, headRot, finalScale, dirX, 0.2, 0.8);

    ctx.restore(); // Restore filter
};
