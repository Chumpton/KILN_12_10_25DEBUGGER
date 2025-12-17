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

const bodyImg = new Image(); bodyImg.src = '/world_edit/Animals/Bunny/Body.png';
const headImg = new Image(); headImg.src = '/world_edit/Animals/Bunny/Head.png';

export const renderBunny = (
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

    // --- DETERMINISTIC RANDOM WALK ---
    // 1. Seed
    const seed = Math.floor(seedX * 1000 + seedY);
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    // 2. Time Segmentation (4s Cycle)
    const CYCLE_DURATION = 4000;
    const cycleIndex = Math.floor(time / CYCLE_DURATION);
    const cycleProgress = (time % CYCLE_DURATION) / CYCLE_DURATION; // 0..1

    // 3. Generate Waypoints
    const getTarget = (index: number) => {
        const r1 = random(seed + index * 2);
        const r2 = random(seed + index * 2 + 1);
        const range = 60; // Smaller range for bunny
        return {
            x: (r1 - 0.5) * 2 * range,
            y: (r2 - 0.5) * 2 * range
        };
    };

    const targetProps = getTarget(cycleIndex);
    const prevTargetProps = getTarget(cycleIndex - 1);

    // 4. Movement Logic
    const moveFraction = 0.6;
    let offsetX = 0;
    let offsetY = 0;
    let isMoving = false;
    let velocityX = 0;

    if (cycleProgress < moveFraction) {
        // MOVING
        isMoving = true;
        const t = cycleProgress / moveFraction; // 0..1
        // Linear Move

        offsetX = prevTargetProps.x + (targetProps.x - prevTargetProps.x) * t;
        offsetY = prevTargetProps.y + (targetProps.y - prevTargetProps.y) * t;

        velocityX = targetProps.x - prevTargetProps.x;
    } else {
        // IDLE
        isMoving = false;
        offsetX = targetProps.x;
        offsetY = targetProps.y;
        velocityX = 0;
    }

    // Determine Facing
    const moveDeltaX = targetProps.x - prevTargetProps.x;
    const facingRight = moveDeltaX > 0;
    const dirX = facingRight ? 1 : -1;

    // Draw Position
    const rootX = x + offsetX;
    const rootY = y + offsetY;

    // Animation Vars
    // Hop Bob
    const moveBob = isMoving ? Math.abs(Math.sin(time / 50)) * 6 : 0; // Faster, higher bob

    const drawX = rootX;
    const drawY = rootY - moveBob;

    const shadowX = rootX;
    const shadowY = rootY;

    const anchorX = rootX;
    const anchorY = rootY;

    // Get Rig Data
    const rig = ENTITY_RIGS['bunny'] || { parts: {} };
    const parts = rig.parts;
    const getPart = (name: string, def: any) => parts[name] || def;

    // 1. Body
    const bodyPart = getPart('body', { x: 0, y: 0, rotation: 0 });

    const bodyX = anchorX + (bodyPart.x * dirX * scale);
    const bodyY = anchorY + (bodyPart.y * scale) - moveBob;
    const bodyRot = isMoving
        ? (Math.sin(time / 50) * 0.1) * dirX // Tilt forward when hopping
        : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Body
    if (bodyImg.complete) drawPart(ctx, bodyImg, bodyX, bodyY, bodyRot, scale, dirX, 0.5, 0.9);

    // 2. Head (Attached to Body)
    const headPart = getPart('head', { x: 10, y: -20, rotation: 0 });
    const headX = bodyX + (headPart.x * dirX * scale);
    const headY = bodyY + (headPart.y * scale);
    const headRot = (Math.sin(time / 300) * 0.1) * dirX + (headPart.rotation || 0);

    if (headImg.complete) drawPart(ctx, headImg, headX, headY, headRot, scale, dirX, 0.2, 0.8);
};
