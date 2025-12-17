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

const bodyImg = new Image(); bodyImg.src = '/world_edit/Animals/Squirrel/Body.png';
const headImg = new Image(); headImg.src = '/world_edit/Animals/Squirrel/Head.png';
const tailImg = new Image(); tailImg.src = '/world_edit/Animals/Squirrel/Tail.png';

export const renderSquirrel = (
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
    // Use World Position (seedX, seedY) for stability so camera movement doesn't reshuffle RNG
    const seed = Math.floor(seedX * 1000 + seedY);
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    // 2. Time Segmentation
    const CYCLE_DURATION = 4000; // New decision every 4 seconds
    const cycleIndex = Math.floor(time / CYCLE_DURATION);
    const cycleProgress = (time % CYCLE_DURATION) / CYCLE_DURATION; // 0..1

    // 3. Generate Waypoints (Current and Next)
    // We generate pseudo-random offsets for the CURRENT cycle target and NEXT cycle target
    const getTarget = (index: number) => {
        const r1 = random(seed + index * 2);     // x random
        const r2 = random(seed + index * 2 + 1); // y random
        // 10x10 grid = +/- 5 tiles. Assuming 32px tiles = +/- 160px.
        const range = 100;
        return {
            x: (r1 - 0.5) * 2 * range,
            y: (r2 - 0.5) * 2 * range
        };
    };

    const targetProps = getTarget(cycleIndex);
    const prevTargetProps = getTarget(cycleIndex - 1);

    // 4. Movement Logic (Move for first 60% of cycle, then idle)
    const moveFraction = 0.6;
    let offsetX = 0;
    let offsetY = 0;
    let isMoving = false;
    let velocityX = 0;

    if (cycleProgress < moveFraction) {
        // MOVING
        isMoving = true;
        const t = cycleProgress / moveFraction; // 0..1
        // LOW SPEED LINEAR MOVE (User Request: "1 set speed")

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
    // If moving, face direction. If idle, keep facing last direction (or random look around?)
    // For stateless, "last direction" is hard. simpler: face direction of last move.
    // We can infer last move direction from the delta of (target - prev).
    const moveDeltaX = targetProps.x - prevTargetProps.x;
    const facingRight = moveDeltaX > 0;
    const dirX = facingRight ? 1 : -1;

    // Draw Position
    const rootX = x + offsetX;
    const rootY = y + offsetY;

    // Animation Vars
    // Bob faster when moving
    const moveBob = isMoving ? Math.abs(Math.sin(time / 100)) * 3 : 0;

    // Apply Bob to body Y
    // const drawY = rootY - moveBob; // we used rootY - moveBob in prev code for drawing
    // Let's keep consistent variable names for below code 
    const drawX = rootX;
    const drawY = rootY - moveBob;
    const bodyRot = isMoving
        ? (Math.sin(time / 100) * 0.05) * dirX
        : (Math.sin(time / 500) * 0.02); // Slow breathe when idle

    // No... existing code uses rootX/Y in specific ways. Let's map back to existing vars.
    // Existing used 'drawX/Y' for shadow and 'rootX/Y' for body.
    // Shadow should be at ground (rootY). Body at rootY - bob.

    const shadowX = rootX;
    const shadowY = rootY;

    // For the rest of the file (Tail/Body/Head), we need to set the variables they use.
    // They used 'rootX' and 'rootY' (which had bob).
    // Let's redefine 'rootX'/'rootY' to match drawing expectation (drawing pivot).
    // Shadow uses shadowX/Y.

    // Re-assigning variables for compatibility with existing code below:
    // "rootX" below was used as the anchor for body/tail/head.
    const anchorX = rootX;
    // const anchorY = rootY - moveBob; 
    // Actually the code below does: const bodyY = rootY + (bodyPart.y * scale) - moveBob;
    // So 'rootY' below should be the GROUND Y.
    const anchorY = rootY;

    // Velocity proxy for animation intensity
    const velocity = isMoving ? 1 : 0;

    // Get Rig Data
    const rig = ENTITY_RIGS['squirrel'] || { parts: {} };
    const parts = rig.parts;

    // Helper to get part local offset (or default)
    const getPart = (name: string, def: any) => parts[name] || def;

    // 1. Body (Attached to Root)
    const bodyPart = getPart('body', { x: 0, y: 0, rotation: 0 });
    // const moveBob = Math.abs(Math.sin(time / 100)) * 3; // This is now calculated above

    // Body World Pos = Root + BodyLocal + Bob
    // Note: Rig X/Y are usually "right facing". 
    // If facing left, we flip X offset? usually yes if scaleX is -1.
    // In `renderSkeletalNPC`, `computeWorld` does: `x: parent.x + (lx * cos - ly * sin) * parent.scale`
    // And `scaleX` handles the image flip.
    // Here we are doing simpler logic.
    // Let's assume Rig X is "Forward".

    const bodyX = anchorX + (bodyPart.x * dirX * scale);
    const bodyY = anchorY + (bodyPart.y * scale) - moveBob;
    // const bodyRot = (Math.sin(time / 100) * 0.05 + (velocity * 0.05)) * dirX + (bodyPart.rotation || 0); // This is now calculated above

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 10 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Body
    // Wait, draw order matters. Tail is usually behind.

    // 2. Tail (Attached to Body)
    // Hierarchy: Tail is child of Body.
    const tailPart = getPart('tail', { x: -12, y: -2, rotation: 0 });
    const tailX = bodyX + (tailPart.x * dirX * scale);
    const tailY = bodyY + (tailPart.y * scale);
    const tailWave = Math.sin(time / 200) * 0.3;
    const tailRot = (tailWave + (velocity * -0.3)) * dirX + (tailPart.rotation || 0);

    if (tailImg.complete) drawPart(ctx, tailImg, tailX, tailY, tailRot, scale, dirX, 0.9, 0.9);

    // Draw Body Now
    if (bodyImg.complete) drawPart(ctx, bodyImg, bodyX, bodyY, bodyRot, scale, dirX, 0.5, 0.9);

    // 3. Head (Attached to Body)
    const headPart = getPart('head', { x: 12, y: -18, rotation: 0 });
    const headX = bodyX + (headPart.x * dirX * scale);
    const headY = bodyY + (headPart.y * scale);
    const headRot = (Math.sin(time / 300) * 0.1) * dirX + (headPart.rotation || 0);

    if (headImg.complete) drawPart(ctx, headImg, headX, headY, headRot, scale, dirX, 0.1, 0.8);
};
