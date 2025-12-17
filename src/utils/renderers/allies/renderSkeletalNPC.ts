
import { Ally } from '../../../types';
import { ENTITY_RIGS } from '../../../data/EntityRigDefinitions';

// Load assets from public directory
const torsoImg = new Image(); torsoImg.src = '/assets/PlayerSprite/torso.png';
const headImg = new Image(); headImg.src = '/assets/PlayerSprite/head.png';
const legsImg = new Image(); legsImg.src = '/assets/PlayerSprite/legs.png';
const footImg = new Image(); footImg.src = '/assets/PlayerSprite/foot.png';
const armImg = new Image(); armImg.src = '/assets/PlayerSprite/arm.png';
const handImg = new Image(); handImg.src = '/assets/PlayerSprite/hand.png';
const sword1Img = new Image(); sword1Img.src = '/assets/weapons/Sword1.png';

// Squirrel Assets
const sqBodyImg = new Image(); sqBodyImg.src = '/world_edit/Animals/Squirrel/Body.png';
const sqHeadImg = new Image(); sqHeadImg.src = '/world_edit/Animals/Squirrel/Head.png';
const sqTailImg = new Image(); sqTailImg.src = '/world_edit/Animals/Squirrel/Tail.png';

// Bunny Assets
const bunBodyImg = new Image(); bunBodyImg.src = '/world_edit/Animals/Bunny/Body.png';
const bunHeadImg = new Image(); bunHeadImg.src = '/world_edit/Animals/Bunny/Head.png';

// Wolf Assets
const wolfBodyImg = new Image(); wolfBodyImg.src = '/world_edit/Animals/Wolf/Body.png';
const wolfHeadImg = new Image(); wolfHeadImg.src = '/world_edit/Animals/Wolf/Head.png';
const wolfTailImg = new Image(); wolfTailImg.src = '/world_edit/Animals/Wolf/Tail.png';
// const wolfLegImg = new Image(); wolfLegImg.src = '/world_edit/Animals/Wolf/Leg.png'; 
const wolfLegFLImg = new Image(); wolfLegFLImg.src = '/world_edit/Animals/Wolf/Front Leg FrontSide.png';
const wolfLegFRImg = new Image(); wolfLegFRImg.src = '/world_edit/Animals/Wolf/Front Leg BackSide.png';
const wolfLegBLImg = new Image(); wolfLegBLImg.src = '/world_edit/Animals/Wolf/Back Leg FrontSide.png';
const wolfLegBRImg = new Image(); wolfLegBRImg.src = '/world_edit/Animals/Wolf/Back Leg BackSide.png';

// Horse Assets
const horseBodyImg = new Image(); horseBodyImg.src = '/assets/Mounts/Horse/Body.png';
const horseHeadImg = new Image(); horseHeadImg.src = '/assets/Mounts/Horse/Head.png';
const horseNeckImg = new Image(); horseNeckImg.src = '/assets/Mounts/Horse/Neck.png';
const horseTailImg = new Image(); horseTailImg.src = '/assets/Mounts/Horse/Tail.png';
const horseLegFLImg = new Image(); horseLegFLImg.src = '/assets/Mounts/Horse/FrontLegFrontSide.png';
const horseLegFRImg = new Image(); horseLegFRImg.src = '/assets/Mounts/Horse/FrontLegBackSide.png';
const horseLegBLImg = new Image(); horseLegBLImg.src = '/assets/Mounts/Horse/BackLegFrontSide.png';
const horseLegBRImg = new Image(); horseLegBRImg.src = '/assets/Mounts/Horse/BackLegBackSide.png';

// --- REFACTORED RENDERER ---
type PartKey = string;
type PartState = { x: number, y: number, rotation: number, scale: number, scaleX: number, z: number, img?: HTMLImageElement, ox: number, oy: number, name: string };

export const renderSkeletalNPC = (
    ctx: CanvasRenderingContext2D,
    ally: Ally & { facingRight?: boolean },
    x: number,
    y: number,
    overrideConfig?: any,
    showName: boolean = true,
    hasWeapon: boolean = false,
    rigKey: string = 'skeleton_npc', // Added rigKey
    partFilter?: (name: string) => boolean
): Record<string, { x: number, y: number, rotation: number, scale: number }> => {
    const time = Date.now();
    const isEditing = !!overrideConfig;
    const forceAnimate = (ally as any).isEditorAnimating;
    const isEditor = isEditing && !forceAnimate;
    const isMoving = (ally as any).isMoving;

    // --- 1. ANIMATION STATE ---
    const breath = isEditor ? 0 : Math.sin(time / 500) * 1.5;
    const sway = isEditor ? 0 : Math.sin(time / 1000) * 0.02;
    const armSway = isEditor ? 0 : Math.sin(time / 800) * 0.05;

    // Running vars
    const runSpeed = 150;
    const runAmplitude = 0.5;
    const legLSwing = (isMoving && !isEditor) ? Math.sin(time / runSpeed) * runAmplitude : 0;
    const legRSwing = (isMoving && !isEditor) ? Math.sin(time / runSpeed + Math.PI) * runAmplitude : 0;
    const armLSwing = (isMoving && !isEditor) ? Math.sin(time / runSpeed + Math.PI) * runAmplitude : armSway;
    const armRSwing = (isMoving && !isEditor) ? Math.sin(time / runSpeed) * runAmplitude : -armSway;
    const bounce = (isMoving && !isEditor) ? Math.abs(Math.sin(time / runSpeed)) * 4 : 0;

    const config = overrideConfig || ENTITY_RIGS[rigKey] || ENTITY_RIGS['skeleton_npc'];
    if (!config) return {};
    const parts = config.parts;

    // --- 2. CALCULATE TRANSFORMS (Relative -> World) ---
    const worldTransforms: Record<string, { x: number, y: number, rotation: number, scale: number }> = {};
    const drawCommands: PartState[] = [];

    // Helper to compose transforms
    const computeWorld = (
        parent: { x: number, y: number, rotation: number, scale: number },
        local: { x: number, y: number, rotation: number, scale: number, flipX?: boolean },
        animRot: number = 0,
        animOffX: number = 0,
        animOffY: number = 0
    ) => {
        const r = parent.rotation + (local.rotation || 0) + animRot;
        const lx = (local.x || 0) + animOffX;
        const ly = (local.y || 0) + animOffY;
        const cos = Math.cos(parent.rotation);
        const sin = Math.sin(parent.rotation);
        return {
            x: parent.x + (lx * cos - ly * sin) * parent.scale,
            y: parent.y + (lx * sin + ly * cos) * parent.scale,
            rotation: r,
            scale: parent.scale * (local.scale || 1),
            scaleX: (local.flipX ? -1 : 1)
        };
    };

    // Root
    const rootFn = { x: x, y: y - bounce, rotation: 0, scale: config.scale || 1.0 };

    // Shadow
    if (!partFilter || partFilter('shadow')) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(x, y, 16 * rootFn.scale, 6 * rootFn.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Hover/Select Glow
    const isHovered = (ally as any).isHovered;
    const isSelected = (ally as any).isSelected;
    if (isHovered || isSelected) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 15;
    }

    // --- SQUIRREL RIG ---
    if (rigKey === 'squirrel') {
        // 1. Body (Root)
        const bodyLocal = parts['body'] || { x: 0, y: 0, zIndex: 5 };
        const bodyWorld = computeWorld(rootFn, bodyLocal, 0);
        worldTransforms['body'] = bodyWorld;
        if (sqBodyImg.complete) drawCommands.push({ ...bodyWorld, z: bodyLocal.zIndex ?? 5, img: sqBodyImg, ox: 0.5, oy: 0.9, name: 'body' });

        // 2. Tail (Child of Body)
        const tailLocal = parts['tail'] || { x: -10, y: -5, zIndex: 1 };
        const tailWorld = computeWorld(bodyWorld, tailLocal, 0);
        worldTransforms['tail'] = tailWorld;
        if (sqTailImg.complete) drawCommands.push({ ...tailWorld, z: tailLocal.zIndex ?? 1, img: sqTailImg, ox: 0.8, oy: 0.9, name: 'tail' });

        // 3. Head (Child of Body)
        const headLocal = parts['head'] || { x: 10, y: -25, zIndex: 10 };
        const headWorld = computeWorld(bodyWorld, headLocal, 0);
        worldTransforms['head'] = headWorld;
        if (sqHeadImg.complete) drawCommands.push({ ...headWorld, z: headLocal.zIndex ?? 10, img: sqHeadImg, ox: 0.2, oy: 0.8, name: 'head' });

    } else if (rigKey === 'horse') {
        // --- HORSE ANIMATION (GALLOP & IDLE) ---
        // Gallop Logic: 4-beat gait simulation
        const gallopSpeed = 500; // ms per cycle (Adjust for speed feeling)
        const gPhase = (time / gallopSpeed) * (Math.PI * 2);

        let hBounce = 0;
        let hSway = 0;
        let legFLRot = 0;
        let legFRRot = 0;
        let legBLRot = 0;
        let legBRRot = 0;
        let tailBob = 0;
        let neckBob = 0;
        let headBob = 0;

        if (isMoving && !isEditor) {
            // -- GALLOP --
            // Body Bounce: Up/Down. Peaks twice per cycle (Front land, Back land)
            hBounce = Math.abs(Math.sin(gPhase)) * 6;

            // Body Sway: Pitch up (rearing) and down (diving)
            hSway = Math.sin(gPhase) * 0.15;

            // Legs: Phase offsets to simulate gallop
            // Front Legs reach forward (Negative Rot) then pull back (Positive Rot)
            legFLRot = Math.sin(gPhase) * 1.0;
            legFRRot = Math.sin(gPhase - 0.5) * 1.0;

            // Back Legs push (Positive Rot) then recover (Negative Rot)
            // Offset by PI to oppose front
            legBLRot = Math.sin(gPhase - Math.PI) * 1.0;
            legBRRot = Math.sin(gPhase - Math.PI - 0.5) * 1.0;

            tailBob = Math.sin(gPhase * 2) * 0.3;
            neckBob = -hSway * 0.8; // Counter-balance body
            headBob = -hSway * 0.5; // Keep head focused
        } else if (!isEditor) {
            // -- IDLE --
            const iPhase = time / 1500;
            hBounce = Math.sin(iPhase) * 1; // Breathing
            neckBob = Math.sin(iPhase) * 0.05;
            tailBob = Math.sin(iPhase * 3) * 0.1;
        }

        // 1. Body (Root)
        const bodyLocal = parts['body'] || { x: 0, y: 0, zIndex: 5 };
        const bodyWorld = computeWorld(rootFn, bodyLocal, hSway, 0, -hBounce);
        worldTransforms['body'] = bodyWorld;
        if (horseBodyImg.complete) drawCommands.push({ ...bodyWorld, z: bodyLocal.zIndex ?? 5, img: horseBodyImg, ox: 0.5, oy: 0.5, name: 'body' });

        // 2. Neck (Child of Body)
        const neckLocal = parts['neck'] || { x: 20, y: -10, zIndex: 6 };
        const neckWorld = computeWorld(bodyWorld, neckLocal, neckBob);
        worldTransforms['neck'] = neckWorld;
        if (horseNeckImg.complete) drawCommands.push({ ...neckWorld, z: neckLocal.zIndex ?? 6, img: horseNeckImg, ox: 0.2, oy: 0.8, name: 'neck' });

        // 3. Head (Child of Neck)
        const headLocal = parts['head'] || { x: 15, y: -15, zIndex: 7 };
        const headWorld = computeWorld(neckWorld, headLocal, headBob);
        worldTransforms['head'] = headWorld;
        if (horseHeadImg.complete) drawCommands.push({ ...headWorld, z: headLocal.zIndex ?? 7, img: horseHeadImg, ox: 0.3, oy: 0.7, name: 'head' });

        // 4. Tail (Child of Body)
        const tailLocal = parts['tail'] || { x: -25, y: -5, zIndex: 4 };
        const tailWorld = computeWorld(bodyWorld, tailLocal, tailBob - hSway);
        worldTransforms['tail'] = tailWorld;
        if (horseTailImg.complete) drawCommands.push({ ...tailWorld, z: tailLocal.zIndex ?? 4, img: horseTailImg, ox: 0.8, oy: 0.2, name: 'tail' });

        // 5. Legs (Children of Body)
        // Back Left (Near Back, zIndex 5)
        const legBLLocal = parts['leg_bl'] || { x: -20, y: 15, zIndex: 5 };
        const legBLWorld = computeWorld(bodyWorld, legBLLocal, legBLRot);
        worldTransforms['leg_bl'] = legBLWorld;
        if (horseLegBLImg.complete) drawCommands.push({ ...legBLWorld, z: legBLLocal.zIndex ?? 5, img: horseLegBLImg, ox: 0.5, oy: 0.2, name: 'leg_bl' });

        // Back Right (Far Back, zIndex 1)
        const legBRLocal = parts['leg_br'] || { x: -15, y: 10, zIndex: 1 };
        const legBRWorld = computeWorld(bodyWorld, legBRLocal, legBRRot);
        worldTransforms['leg_br'] = legBRWorld;
        if (horseLegBRImg.complete) drawCommands.push({ ...legBRWorld, z: legBRLocal.zIndex ?? 1, img: horseLegBRImg, ox: 0.5, oy: 0.2, name: 'leg_br' });

        // Front Left (Near Front, zIndex 5)
        const legFLLocal = parts['leg_fl'] || { x: 20, y: 15, zIndex: 5 };
        const legFLWorld = computeWorld(bodyWorld, legFLLocal, legFLRot);
        worldTransforms['leg_fl'] = legFLWorld;
        if (horseLegFLImg.complete) drawCommands.push({ ...legFLWorld, z: legFLLocal.zIndex ?? 5, img: horseLegFLImg, ox: 0.5, oy: 0.2, name: 'leg_fl' });

        // Front Right (Far Front, zIndex 1)
        const legFRLocal = parts['leg_fr'] || { x: 25, y: 10, zIndex: 1 };
        const legFRWorld = computeWorld(bodyWorld, legFRLocal, legFRRot);
        worldTransforms['leg_fr'] = legFRWorld;
        if (horseLegFRImg.complete) drawCommands.push({ ...legFRWorld, z: legFRLocal.zIndex ?? 1, img: horseLegFRImg, ox: 0.5, oy: 0.2, name: 'leg_fr' });

    } else if (rigKey === 'bunny') {
        // --- BUNNY RIG ---
        // 1. Body (Root)
        const bodyLocal = parts['body'] || { x: 0, y: 0, zIndex: 5 };
        const bodyWorld = computeWorld(rootFn, bodyLocal, 0);
        worldTransforms['body'] = bodyWorld;
        if (bunBodyImg.complete) drawCommands.push({ ...bodyWorld, z: bodyLocal.zIndex ?? 5, img: bunBodyImg, ox: 0.5, oy: 0.9, name: 'body' });

        // 2. Head (Child of Body)
        const headLocal = parts['head'] || { x: 10, y: -20, zIndex: 10 };
        const headWorld = computeWorld(bodyWorld, headLocal, 0);
        worldTransforms['head'] = headWorld;
        if (bunHeadImg.complete) drawCommands.push({ ...headWorld, z: headLocal.zIndex ?? 10, img: bunHeadImg, ox: 0.2, oy: 0.8, name: 'head' });

    } else if (rigKey === 'wolf') {
        // --- WOLF RIG ---
        const walkBob = (isMoving && !isEditor) ? Math.sin(time / 100) * 3 : 0;
        const tailRot = (isMoving && !isEditor) ? Math.sin(time / 200) * 0.2 : 0;
        const headRot = (isMoving && !isEditor) ? Math.sin(time / 400) * 0.05 : 0;

        // 1. Body
        const bodyLocal = parts['body'] || { x: 0, y: -15, zIndex: 5 };
        const bodyWorld = computeWorld(rootFn, bodyLocal, 0, 0, -Math.abs(walkBob));
        worldTransforms['body'] = bodyWorld;
        if (wolfBodyImg.complete) drawCommands.push({ ...bodyWorld, z: bodyLocal.zIndex ?? 5, img: wolfBodyImg, ox: 0.5, oy: 0.5, name: 'body' });

        // 2. Tail
        const tailLocal = parts['tail'] || { x: -20, y: -10, zIndex: 1 };
        const tailWorld = computeWorld(bodyWorld, tailLocal, tailRot); // Child of Body? Or RenderWolf implied sibling? renderWolf used anchorX which was root. 
        // Let's assume child of body for Skeletal consistency, adjusting offsets if needed.
        // Actually renderWolf used anchorX (Root) + Offset. So let's make them siblings of Body (Children of Root) or Children of Body.
        // If Body moves up/down with bob, Tail should too. So Child of Body is good.
        worldTransforms['tail'] = tailWorld;
        if (wolfTailImg.complete) drawCommands.push({ ...tailWorld, z: tailLocal.zIndex ?? 1, img: wolfTailImg, ox: 0.9, oy: 0.5, name: 'tail' });

        // 3. Head
        const headLocal = parts['head'] || { x: 25, y: -25, zIndex: 10 };
        const headWorld = computeWorld(bodyWorld, headLocal, headRot);
        worldTransforms['head'] = headWorld;
        if (wolfHeadImg.complete) drawCommands.push({ ...headWorld, z: headLocal.zIndex ?? 10, img: wolfHeadImg, ox: 0.2, oy: 0.8, name: 'head' });

        // 4. Legs
        // renderWolf used single `legImg` for all.
        const legRot = (isMoving && !isEditor) ? Math.sin(time / 100) * 0.5 : 0;

        ['leg_fl', 'leg_fr', 'leg_bl', 'leg_br'].forEach((key, i) => {
            const local = parts[key] || { x: 0, y: 0, zIndex: 1 };
            // Simple phase offset for variety
            const phase = (i % 2 === 0) ? 0 : Math.PI;
            const thisRot = (isMoving && !isEditor) ? Math.sin(time / 100 + phase) * 0.5 : 0;

            // Legs child of Root (don't bob with body)
            const legWorld = computeWorld(rootFn, local, thisRot);
            worldTransforms[key] = legWorld;

            let img = wolfLegFLImg;
            if (key === 'leg_fr') img = wolfLegFRImg;
            if (key === 'leg_bl') img = wolfLegBLImg;
            if (key === 'leg_br') img = wolfLegBRImg;

            if (img.complete && img.naturalWidth > 0) drawCommands.push({ ...legWorld, z: local.zIndex ?? 1, img: img, ox: 0.5, oy: 0.1, name: key });
        });

    } else if (rigKey === 'skeleton_mounted') {
        // --- MOUNTED SKELETON (Hybrid) ---
        // Requires special handling to animate both Horse parts and Player parts

        // --- A. HORSE ANIMATION ---
        const gallopSpeed = 500;
        const gPhase = (time / gallopSpeed) * (Math.PI * 2);
        let hBounce = 0;
        let hSway = 0;
        let legFLRot = 0; let legFRRot = 0; let legBLRot = 0; let legBRRot = 0;
        let tailBob = 0; let neckBob = 0; let headBob = 0;

        if (isMoving && !isEditor) {
            hBounce = Math.abs(Math.sin(gPhase)) * 6;
            hSway = Math.sin(gPhase) * 0.15;
            legFLRot = Math.sin(gPhase) * 1.0;
            legFRRot = Math.sin(gPhase - 0.5) * 1.0;
            legBLRot = Math.sin(gPhase - Math.PI) * 1.0;
            legBRRot = Math.sin(gPhase - Math.PI - 0.5) * 1.0;
            tailBob = Math.sin(gPhase * 2) * 0.3;
            neckBob = -hSway * 0.8;
            headBob = -hSway * 0.5;
        } else if (!isEditor) {
            const iPhase = time / 1500;
            hBounce = Math.sin(iPhase) * 1;
            neckBob = Math.sin(iPhase) * 0.05;
            tailBob = Math.sin(iPhase * 3) * 0.1;
        }

        // Apply Horse Parts
        // Mapped manually or we iterate? The Rig has them prefixed "horse_".
        // We can just iterate the PARTS in the Rig and detect prefixes/names.
        // But we need to apply specific animations to specific parts.

        // 1. HORSE BODY (Root of Horse)
        const mountBodyFn = computeWorld(rootFn, parts['horse_body'] || parts['body'] || { x: 0, y: 0, scale: 0.2, rotation: 0 }, hSway, 0, -hBounce);
        worldTransforms['horse_body'] = mountBodyFn;
        if (horseBodyImg.complete) drawCommands.push({ ...mountBodyFn, z: parts['horse_body']?.zIndex ?? 5, img: horseBodyImg, ox: 0.5, oy: 0.5, name: 'horse_body' });

        // 2. HORSE CHILDREN
        // Helper to swap left/right Z-Indices if facing Left
        const isFacingLeft = (ally && ally.facingRight === false);

        const Z_SWAP_PAIRS: Record<string, string> = {
            'arm_l': 'arm_r', 'arm_r': 'arm_l',
            'hand_l': 'hand_r', 'hand_r': 'hand_l',
            'leg_l': 'leg_r', 'leg_r': 'leg_l',
            'foot_l': 'foot_r', 'foot_r': 'foot_l',
            'weapon_r': 'weapon_l', 'weapon_l': 'weapon_r'
        };

        const getEffectiveZ = (key: string, defaultZ: number) => {
            if (isFacingLeft && Z_SWAP_PAIRS[key]) {
                const otherKey = Z_SWAP_PAIRS[key];
                return parts[otherKey]?.zIndex ?? defaultZ;
            }
            return defaultZ;
        };

        // 2. HORSE CHILDREN
        const processHorsePart = (key: string, parentWorld: any, img: HTMLImageElement, animRot: number, ox: number, oy: number) => {
            const local = parts[key];
            if (local) {
                const world = computeWorld(parentWorld, local, animRot);
                worldTransforms[key] = world;
                const ez = getEffectiveZ(key, local.zIndex ?? 5);
                if (img.complete) drawCommands.push({ ...world, z: ez, img, ox, oy, name: key });
                return world;
            }
            return parentWorld;
        };

        const neckW = processHorsePart('horse_neck', mountBodyFn, horseNeckImg, neckBob, 0.2, 0.8);
        processHorsePart('horse_head', neckW, horseHeadImg, headBob, 0.3, 0.7);
        processHorsePart('horse_tail', mountBodyFn, horseTailImg, tailBob - hSway, 0.8, 0.2);

        processHorsePart('horse_leg_fl', mountBodyFn, horseLegFLImg, legFLRot, 0.5, 0.2);
        processHorsePart('horse_leg_fr', mountBodyFn, horseLegFRImg, legFRRot, 0.5, 0.2);
        processHorsePart('horse_leg_bl', mountBodyFn, horseLegBLImg, legBLRot, 0.5, 0.2);
        processHorsePart('horse_leg_br', mountBodyFn, horseLegBRImg, legBRRot, 0.5, 0.2);

        // --- B. PLAYER ANIMATION ---
        // Player moves with the horse's bounce and sway.
        // We create a 'playerRoot' which acts as the Anchor (Ground + Bounce/Sway).
        // All player parts (Torso, Arms, Legs) are usually children of this Root (Siblings), 
        // matching the standard 'skeleton_npc' structure where offsets are absolute from center.

        // Root with Bounce
        // Root with Bounce
        const playerRoot = computeWorld(rootFn, { x: 0, y: 0, rotation: 0, scale: 1 }, hSway * 0.5, 0, breath - hBounce);

        // 1. TORSO
        const torsoLocal = parts['torso'] || { x: 0, y: -45, zIndex: 15 };
        const torsoWorld = computeWorld(playerRoot, torsoLocal);
        worldTransforms['torso'] = torsoWorld;

        // Dimensions
        const torsoHeight = (torsoImg.complete && torsoImg.naturalHeight > 0) ? torsoImg.naturalHeight : 40;
        const armHeight = (armImg.complete && armImg.naturalHeight > 0) ? armImg.naturalHeight : 32;

        if (torsoImg.complete) drawCommands.push({ ...torsoWorld, z: getEffectiveZ('torso', torsoLocal.zIndex ?? 15), img: torsoImg, ox: 0.5, oy: 1.0, name: 'torso' });

        // HEAD
        const headLocalRig = parts['head'] || { x: 0, y: 2, zIndex: 16 };
        const headLocalComp = { ...headLocalRig, y: headLocalRig.y - torsoHeight };
        const headWorld = computeWorld(torsoWorld, headLocalComp, sway * 0.5);
        worldTransforms['head'] = headWorld;
        if (headImg.complete) drawCommands.push({ ...headWorld, z: getEffectiveZ('head', headLocalRig.zIndex ?? 16), img: headImg, ox: 0.5, oy: 1.0, name: 'head' });

        // SHEATH
        const sheathLocal = parts['sheath'];
        if (hasWeapon && sheathLocal && sword1Img.complete) {
            const sheathWorld = computeWorld(torsoWorld, sheathLocal);
            worldTransforms['sheath'] = sheathWorld;
            drawCommands.push({ ...sheathWorld, z: getEffectiveZ('sheath', sheathLocal.zIndex ?? 16), img: sword1Img, ox: 0.5, oy: 0.5, name: 'sheath' });
        }

        // ARMS & LEGS
        const mArmSwing = 0;
        const mLegSwing = 0;

        const armParent = playerRoot;

        // Helper for Limbs (Reusing Humanoid Code Logic essentially, but with specific keys)
        const processLimb = (key: string, parent: any, img: HTMLImageElement, swing: number, ox: number, oy: number, manualZ?: number) => {
            const local = parts[key];
            if (local) {
                const world = computeWorld(parent, local, swing);
                worldTransforms[key] = world;
                const ez = getEffectiveZ(key, local.zIndex ?? manualZ ?? 0);
                if (img.complete) drawCommands.push({ ...world, z: ez, img, ox, oy, name: key });
                return world;
            }
            return null;
        };

        // ARM R
        const armRWorld = processLimb('arm_r', armParent, armImg, mArmSwing, 0.5, 0);
        if (armRWorld) {
            // Hand R
            const handRLocal = parts['hand_r'] || { x: 0, y: 0 };
            const handRComp = { ...handRLocal, y: handRLocal.y + (armHeight - 2) };
            const handRW = computeWorld(armRWorld, handRComp);
            worldTransforms['hand_r'] = handRW;
            if (handImg.complete) drawCommands.push({ ...handRW, z: getEffectiveZ('hand_r', parts['hand_r']?.zIndex ?? 6), img: handImg, ox: 0.5, oy: 0, name: 'hand_r' });

            // Weapon R
            if (hasWeapon && sword1Img.complete) {
                const wLocal = parts['weapon_r'] || { x: 0, y: 15 };
                const wW = computeWorld(handRW, wLocal);
                worldTransforms['weapon_r'] = wW;
                drawCommands.push({ ...wW, z: getEffectiveZ('weapon_r', wLocal?.zIndex ?? 7), img: sword1Img, ox: 0.5, oy: 1.0, name: 'weapon_r' });
            }
        }

        // ARM L
        const armLWorld = processLimb('arm_l', armParent, armImg, mArmSwing, 0.5, 0);
        if (armLWorld) {
            const handLLocal = parts['hand_l'] || { x: 0, y: 0 };
            const handLComp = { ...handLLocal, y: handLLocal.y + (armHeight - 2) };
            const handLW = computeWorld(armLWorld, handLComp);
            worldTransforms['hand_l'] = handLW;
            if (handImg.complete) drawCommands.push({ ...handLW, z: getEffectiveZ('hand_l', parts['hand_l']?.zIndex ?? 20), img: handImg, ox: 0.5, oy: 0, name: 'hand_l' });
        }

        // LEGS (Parented to PlayerRoot - SIBLINGS)
        // Ensure legs bounce with everything else.
        const legRWorld = processLimb('leg_r', playerRoot, legsImg, mLegSwing, 0.5, 0);
        if (legRWorld) {
            const footRLocal = parts['foot_r'] || { x: 0, y: 0 };
            const legRLocal = parts['leg_r'];
            const relX = (footRLocal.x - legRLocal.x);
            const relY = (footRLocal.y - legRLocal.y);
            const footRel = { ...footRLocal, x: relX, y: relY };

            const footRW = computeWorld(legRWorld, footRel);
            worldTransforms['foot_r'] = footRW;
            if (footImg.complete) drawCommands.push({ ...footRW, z: getEffectiveZ('foot_r', footRLocal.zIndex ?? 4), img: footImg, ox: 0.5, oy: 0.5, name: 'foot_r' });
        }

        const legLWorld = processLimb('leg_l', playerRoot, legsImg, mLegSwing, 0.5, 0);
        if (legLWorld) {
            const footLLocal = parts['foot_l'] || { x: 0, y: 0 };
            const legLLocal = parts['leg_l'];
            const relX = (footLLocal.x - legLLocal.x);
            const relY = (footLLocal.y - legLLocal.y);
            const footRel = { ...footLLocal, x: relX, y: relY };
            const footLW = computeWorld(legLWorld, footRel);
            worldTransforms['foot_l'] = footLW;
            if (footImg.complete) drawCommands.push({ ...footLW, z: getEffectiveZ('foot_l', footLLocal.zIndex ?? 20), img: footImg, ox: 0.5, oy: 0.5, name: 'foot_l' });
        }

    } else {
        // --- HUMANOID (EXISTING RIG) ---

        // TORSO (Root Child)
        const torsoLocal = parts['torso'] || { x: 0, y: -45, zIndex: 6 };
        const torsoWorld = computeWorld(rootFn, torsoLocal, sway, 0, breath);
        worldTransforms['torso'] = torsoWorld;

        // Dimensions
        const torsoHeight = (torsoImg.complete && torsoImg.naturalHeight > 0) ? torsoImg.naturalHeight : 40;
        const armHeight = (armImg.complete && armImg.naturalHeight > 0) ? armImg.naturalHeight : 32;

        if (torsoImg.complete) drawCommands.push({ ...torsoWorld, z: torsoLocal.zIndex ?? 6, img: torsoImg, ox: 0.5, oy: 1.0, name: 'torso' });

        // HEAD
        const headLocalRig = parts['head'] || { x: 0, y: 2, zIndex: 7 };
        const headLocalComp = { ...headLocalRig, y: headLocalRig.y - torsoHeight };
        const headWorld = computeWorld(torsoWorld, headLocalComp, sway * 0.5);
        worldTransforms['head'] = headWorld;
        if (headImg.complete) drawCommands.push({ ...headWorld, z: headLocalRig.zIndex ?? 7, img: headImg, ox: 0.5, oy: 1.0, name: 'head' });

        // SHEATH
        const sheathLocal = parts['sheath'];
        if (hasWeapon && sheathLocal && sword1Img.complete) {
            const sheathWorld = computeWorld(torsoWorld, sheathLocal);
            worldTransforms['sheath'] = sheathWorld;
            drawCommands.push({ ...sheathWorld, z: sheathLocal.zIndex ?? 6, img: sword1Img, ox: 0.5, oy: 0.5, name: 'sheath' });
        }

        // Virtual parent for arms
        const torsoBaseY = torsoLocal.y || -45;
        const armRParent = { ...rootFn, y: rootFn.y + (torsoBaseY * rootFn.scale) + (breath * rootFn.scale) };

        // ARM R (Back)
        const armRLocal = parts['arm_r'] || { x: 11, y: 0, zIndex: 0 };
        const armRWorld = computeWorld(armRParent, armRLocal, armRSwing);
        worldTransforms['arm_r'] = armRWorld;
        if (armImg.complete) drawCommands.push({ ...armRWorld, z: armRLocal.zIndex ?? 0, img: armImg, ox: 0.5, oy: 0, name: 'arm_r' });

        // HAND R
        const handRLocalRig = parts['hand_r'] || { x: 0, y: 0, zIndex: 1 };
        const handRLocalComp = { ...handRLocalRig, y: handRLocalRig.y + (armHeight - 2) };
        const handRWorld = computeWorld(armRWorld, handRLocalComp);
        worldTransforms['hand_r'] = handRWorld;
        if (handImg.complete) drawCommands.push({ ...handRWorld, z: handRLocalRig.zIndex ?? 1, img: handImg, ox: 0.5, oy: 0, name: 'hand_r' });

        // WEAPON R
        if (hasWeapon && sword1Img.complete) {
            const weaponLocal = parts['weapon_r'] || { x: 0, y: 15, zIndex: 6 };
            const weaponWorld = computeWorld(handRWorld, weaponLocal);
            worldTransforms['weapon_r'] = weaponWorld;
            drawCommands.push({ ...weaponWorld, z: weaponLocal.zIndex ?? 6, img: sword1Img, ox: 0.5, oy: 1.0, name: 'weapon_r' });
        }

        // ARM L (Front)
        const armLLocal = parts['arm_l'] || { x: -11, y: 0, zIndex: 8 };
        const armLParent = armRParent;
        const armLWorld = computeWorld(armLParent, armLLocal, armLSwing);
        worldTransforms['arm_l'] = armLWorld;
        if (armImg.complete) drawCommands.push({ ...armLWorld, z: armLLocal.zIndex ?? 8, img: armImg, ox: 0.5, oy: 0, name: 'arm_l' });

        // HAND L
        const handLLocalRig = parts['hand_l'] || { x: 0, y: 0, zIndex: 9 };
        const handLLocalComp = { ...handLLocalRig, y: handLLocalRig.y + (armHeight - 2) };
        const handLWorld = computeWorld(armLWorld, handLLocalComp);
        worldTransforms['hand_l'] = handLWorld;
        if (handImg.complete) drawCommands.push({ ...handLWorld, z: handLLocalRig.zIndex ?? 9, img: handImg, ox: 0.5, oy: 0, name: 'hand_l' });

        // LEGS
        const legRLocal = parts['leg_r'] || { x: 4, y: -45, zIndex: 2 };
        const legRWorld = computeWorld(rootFn, legRLocal, legRSwing);
        worldTransforms['leg_r'] = legRWorld;
        if (legsImg.complete) drawCommands.push({ ...legRWorld, z: legRLocal.zIndex ?? 2, img: legsImg, ox: 0.5, oy: 0, name: 'leg_r' });

        // FOOT R
        const footRLocal = parts['foot_r'] || { x: 2, y: -6, zIndex: 3 };
        const convertToLocal = (child: any, parent: any) => ({
            ...child,
            x: (child.x - parent.x),
            y: (child.y - parent.y)
        });
        const footRRelative = convertToLocal(footRLocal, legRLocal);
        const footRWorld = computeWorld(legRWorld, footRRelative);
        worldTransforms['foot_r'] = footRWorld;
        if (footImg.complete) drawCommands.push({ ...footRWorld, z: footRLocal.zIndex ?? 3, img: footImg, ox: 0.5, oy: 0.5, name: 'foot_r' });

        // LEG L
        const legLLocal = parts['leg_l'] || { x: -4, y: -45, zIndex: 4 };
        const legLWorld = computeWorld(rootFn, legLLocal, legLSwing);
        worldTransforms['leg_l'] = legLWorld;
        if (legsImg.complete) drawCommands.push({ ...legLWorld, z: legLLocal.zIndex ?? 4, img: legsImg, ox: 0.5, oy: 0, name: 'leg_l' });

        const footLLocal = parts['foot_l'] || { x: -8, y: -6, zIndex: 5 };
        const footLRelative = convertToLocal(footLLocal, legLLocal);
        const footLWorld = computeWorld(legLWorld, footLRelative);
        worldTransforms['foot_l'] = footLWorld;
        if (footImg.complete) drawCommands.push({ ...footLWorld, z: footLLocal.zIndex ?? 5, img: footImg, ox: 0.5, oy: 0.5, name: 'foot_l' });
    }

    // --- 3. RENDER PASS ---
    // Sort by Z
    drawCommands.sort((a, b) => a.z - b.z);

    for (const cmd of drawCommands) {
        if (!cmd.img) continue;
        if (partFilter && !partFilter(cmd.name)) continue;

        ctx.save();
        ctx.translate(cmd.x, cmd.y);
        ctx.rotate(cmd.rotation);
        ctx.scale(cmd.scale * cmd.scaleX, cmd.scale);
        // Draw centered on origin based on ox/oy (0-1)
        const dw = cmd.img.width;
        const dh = cmd.img.height;
        if (cmd.img.naturalWidth === 0) continue; // Skip broken/loading images
        ctx.drawImage(cmd.img, -dw * cmd.ox, -dh * cmd.oy);
        ctx.restore();
    }

    // Name Tag
    if (!isEditor && showName) {
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = isHovered || isSelected ? '#ffff00' : '#ffffff';
        // Check if name_tag part exists
        const nt = config.parts['name_tag'];
        if (nt) {
            // Apply root transform to it
            const ntw = computeWorld(rootFn, nt);
            ctx.fillText(ally.name, ntw.x, ntw.y);
        } else {
            ctx.fillText(ally.name, x, y - 85);
        }
    }

    if (isHovered || isSelected) {
        ctx.shadowBlur = 0;
    }

    return worldTransforms;
};
