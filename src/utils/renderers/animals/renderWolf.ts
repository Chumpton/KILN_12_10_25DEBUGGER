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
const legImg = new Image(); legImg.src = '/world_edit/Animals/Wolf/Leg.png'; // Assuming legs exist

export const renderWolf = (
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
    let offsetX = 0;
    let offsetY = 0;
    let isMoving = false;
    let velocityX = 0;

    if (cycleProgress < moveFraction) {
        // MOVING
        isMoving = true;
        const t = cycleProgress / moveFraction; // 0..1
        // Smooth Step?
        const smoothT = t * t * (3 - 2 * t);

        offsetX = prevTargetProps.x + (targetProps.x - prevTargetProps.x) * smoothT;
        offsetY = prevTargetProps.y + (targetProps.y - prevTargetProps.y) * smoothT;

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
    const walkBob = isMoving ? Math.sin(time / 100) * 3 : 0;

    const drawX = rootX;
    const drawY = rootY - Math.abs(walkBob);

    const shadowX = rootX;
    const shadowY = rootY;

    const anchorX = rootX;
    const anchorY = rootY;

    // Get Rig Data
    const rig = ENTITY_RIGS['wolf'] || { parts: {} }; // Fallback
    const parts = rig.parts;
    const getPart = (name: string, def: any) => parts ? (parts[name] || def) : def;

    // SCALING: Wolf is bigger than bunny
    const finalScale = scale * 1.2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 20 * finalScale, 6 * finalScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- DRAW ORDER: Tail -> Back Legs -> Body -> Front Legs -> Head ---

    // Tail
    const tailPart = getPart('tail', { x: -20, y: -10, rotation: 0 });
    const tailX = anchorX + (tailPart.x * dirX * finalScale);
    const tailY = anchorY + (tailPart.y * finalScale) - Math.abs(walkBob);
    const tailRot = (Math.sin(time / 200) * 0.2) * dirX;
    if (tailImg.complete) drawPart(ctx, tailImg, tailX, tailY, tailRot, finalScale, dirX, 0.9, 0.5);

    // Back Legs (Simplified)
    const legBackX = anchorX + (-15 * dirX * finalScale);
    const legBackY = anchorY;
    const legBackRot = isMoving ? Math.sin(time / 100) * 0.5 : 0;
    if (legImg.complete) drawPart(ctx, legImg, legBackX, legBackY, legBackRot, finalScale, dirX, 0.5, 0.1);

    // Body
    const bodyPart = getPart('body', { x: 0, y: -15, rotation: 0 });
    const bodyX = anchorX + (bodyPart.x * dirX * finalScale);
    const bodyY = anchorY + (bodyPart.y * finalScale) - Math.abs(walkBob);
    const bodyRot = isMoving ? (Math.sin(time / 100) * 0.05) * dirX : 0;
    if (bodyImg.complete) drawPart(ctx, bodyImg, bodyX, bodyY, bodyRot, finalScale, dirX, 0.5, 0.5);

    // Front Legs
    const legFrontX = anchorX + (15 * dirX * finalScale);
    const legFrontY = anchorY;
    const legFrontRot = isMoving ? Math.sin(time / 100 + Math.PI) * 0.5 : 0;
    if (legImg.complete) drawPart(ctx, legImg, legFrontX, legFrontY, legFrontRot, finalScale, dirX, 0.5, 0.1);

    // Head
    const headPart = getPart('head', { x: 25, y: -25, rotation: 0 });
    const headX = bodyX + (headPart.x * dirX * finalScale);
    const headY = bodyY + (headPart.y * finalScale);
    const headRot = (Math.sin(time / 400) * 0.05) * dirX;
    if (headImg.complete) drawPart(ctx, headImg, headX, headY, headRot, finalScale, dirX, 0.2, 0.8);
};
