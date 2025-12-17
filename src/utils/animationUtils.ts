import { AnimationKeyframe, BoneTransform, Player, Vector2 } from '../types';
import { toScreen, toWorld } from './isometric';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants';
import { ANIMATION_LIBRARY } from '../data/AnimationData';
import { ENTITY_RIGS } from '../data/EntityRigDefinitions';

export const DEFAULT_TRANSFORM: BoneTransform = { x: 0, y: 0, rotation: 0, scale: 1 };

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const getInterpolatedPose = (time: number, keyframes: AnimationKeyframe[], baseParts?: any): Record<string, BoneTransform> => {
    // Clamp time to valid range to prevent extrapolation
    const firstFrame = keyframes[0].frame;
    const lastFrame = keyframes[keyframes.length - 1].frame;
    const clampedTime = Math.max(firstFrame, Math.min(time, lastFrame));

    let prev = keyframes[0];
    let next = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
        if (clampedTime >= keyframes[i].frame && clampedTime <= keyframes[i + 1].frame) {
            prev = keyframes[i];
            next = keyframes[i + 1];
            break;
        }
    }

    const range = next.frame - prev.frame;
    const t = range === 0 ? 0 : (clampedTime - prev.frame) / range;

    const mergedParts: Record<string, BoneTransform> = {};
    if (baseParts) {
        Object.keys(baseParts).forEach(key => mergedParts[key] = { ...baseParts[key] });
    }

    const allKeys = new Set([...Object.keys(prev.bones), ...Object.keys(next.bones)]);

    allKeys.forEach(key => {
        const from = prev.bones[key] || DEFAULT_TRANSFORM;
        const to = next.bones[key] || DEFAULT_TRANSFORM;

        const ix = lerp(from.x || 0, to.x || 0, t);
        const iy = lerp(from.y || 0, to.y || 0, t);
        const ir = lerp(from.rotation || 0, to.rotation || 0, t);
        const isScale = lerp(from.scale ?? 1, to.scale ?? 1, t);

        const base = mergedParts[key] || DEFAULT_TRANSFORM;
        mergedParts[key] = {
            ...base,
            x: (base.x || 0) + ix,
            y: (base.y || 0) + iy,
            rotation: (base.rotation || 0) + ir,
            scale: (base.scale ?? 1) * isScale
        };
    });

    return mergedParts;
};

export const calculateProceduralArm = (player: Player, mouseWorld: Vector2, overrideFacing?: boolean, spellDef?: any, animTime?: number) => {
    // 1. Determine Facing (Screen Space Logic)
    // Isometric: Right is (screenX > 0)
    let facingRight = (player as any).facingRight ?? false;

    if (overrideFacing !== undefined) {
        facingRight = overrideFacing;
    } else {
        const dx = mouseWorld.x - player.pos.x;
        const dy = mouseWorld.y - player.pos.y;
        // screenX = (x - y) * (W/2)
        const screenDx = (dx - dy);
        if (screenDx > 0.1) facingRight = true;
        else if (screenDx < -0.1) facingRight = false;
    }

    // 2. Define Shoulder Position (Screen Space)
    // Based on Rim: Torso Y -45, Arm Y -29 => -74px from Feet.
    // Shoulder X: +/- 14px.
    // Updated to match Visual Rig (Torso @ -45)
    // User Debugged Hand Origin: (10, -20) relative to feet.
    // If Shoulder is at -45, and Arm is ~25px long, pointing down gives -20.
    const shoulderScreenYOffset = -45;
    const shoulderScreenXOffset = facingRight ? -10 : 10;

    // Player Center Screen Pos
    const pScreen = toScreen(player.pos.x, player.pos.y);
    const mScreen = toScreen(mouseWorld.x, mouseWorld.y);

    const shoulderScreenPos = {
        x: pScreen.x + shoulderScreenXOffset,
        y: pScreen.y + shoulderScreenYOffset
    };

    // 3. Calculate Screen Aim Angle
    const sDx = mScreen.x - shoulderScreenPos.x;
    const sDy = mScreen.y - shoulderScreenPos.y;
    const screenAimAngle = Math.atan2(sDy, sDx);

    // 4. Convert Screen Angle to World Direction (for Projectiles)
    // We want the projectile to travel visually parallel to the screen vector.
    // Vector (cos, sin) in Screen -> ??? in World.
    const screenDir = { x: Math.cos(screenAimAngle), y: Math.sin(screenAimAngle) };
    const worldDirRaw = toWorld(screenDir.x, screenDir.y);
    // Normalize in World
    const wDist = Math.sqrt(worldDirRaw.x * worldDirRaw.x + worldDirRaw.y * worldDirRaw.y);
    // (Removed old aimDir declaration)


    // 3. Calculate Cast Punch/Offset
    let punch = 0;
    if (player.casting.isCasting) {
        const duration = player.casting.duration || 1;
        const progress = player.casting.timer / duration;
        // Simple ease-out punch
        if (progress < 0.3) {
            punch = (progress / 0.3) * 0.2;
        } else {
            punch = (1 - (progress - 0.3) / 0.7) * 0.2;
        }
    }

    // 4. Calculate Hand Position (World Estimate for projectile origin)
    const armLengthPixels = 20 + (punch * 32);
    // Project hand screen pos from shoulder screen pos
    const handScreenPos = {
        x: shoulderScreenPos.x + screenDir.x * armLengthPixels,
        y: shoulderScreenPos.y + screenDir.y * armLengthPixels
    };

    // Unproject Hand Screen -> Hand World
    // COMPENSATION FOR PROJECTILE LIFT:
    // The rendering system applies a visual lift (default 35px) to projectiles.
    // To ensure the projectile visually starts at the hand, we must spawn it at the "shadow" position
    // on the ground directly below the visual hand.
    // If we don't do this, the render lift is added ON TOP of the hand's visual height, making it float.
    const RENDER_LIFT = 35;
    const handScreenShadowY = handScreenPos.y + RENDER_LIFT;

    const handWorld = toWorld(handScreenPos.x, handScreenShadowY);

    // 5. Calculate World Aim Direction (Directly from Hand to Mouse)
    // This ensures the projectile actually travels towards the cursor in the world.
    const dx = mouseWorld.x - handWorld.x;
    const dy = mouseWorld.y - handWorld.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const aimDir = {
        x: dx / (dist || 1),
        y: dy / (dist || 1)
    };

    // --- DATA DRIVEN RECOIL & OFFSET ---
    // If spellDef has skeletal animation data, apply it here.
    let recoilX = 0;
    let recoilY = 0;
    let rotationOffset = 0;

    if (spellDef && spellDef.skeletalAnimation && spellDef.skeletalAnimation.boneMotionProfiles && animTime !== undefined) {
        // Calculate normalized time or frame based logic
        // For simple recoil: linear return
        const armProfile = spellDef.skeletalAnimation.boneMotionProfiles['arms'];
        if (armProfile && armProfile.recoilAmount) {
            const t = Math.max(0, animTime / (armProfile.returnSpeed ? 1000 * armProfile.returnSpeed : 200));
            // Simple impulse decay: e^-t or similar, or just linear
            // Let's use player.casting.timer logic if passed, but here we just have a "time"
            // Assuming animTime is "time since cast start"
            // Recoil peaks at 0, decays to 0.
            const decay = Math.max(0, 1 - (animTime / 150)); // Short sharp shock
            const amount = armProfile.recoilAmount * decay;

            // Recoil is opposite to aimDir
            recoilX = -aimDir.x * amount;
            recoilY = -aimDir.y * amount;

            if (armProfile.rotationOffset) {
                rotationOffset = armProfile.rotationOffset * decay;
            }
        }
    }

    const handWorldWithRecoil = {
        x: handWorld.x + recoilX,
        y: handWorld.y + recoilY
    };

    // Calculate the angle from the direction vector
    const aimAngle = Math.atan2(aimDir.y, aimDir.x);

    const projectileSpawnPos = {
        x: handWorldWithRecoil.x + aimDir.x * 0.2, // Small offset
        y: handWorldWithRecoil.y + aimDir.y * 0.2
    };

    return {
        shoulderPos: { x: player.pos.x, y: player.pos.y - 2 },
        aimAngle: Math.atan2(aimDir.y, aimDir.x) + rotationOffset,
        aimDir,
        handPos: handWorldWithRecoil,
        projectileSpawnPos,
        punch,
        screenAimAngle // Exposed for renderer if needed, but renderer computes it inline too.
    };
};

export const solveTwoBoneIK = (rootX: number, rootY: number, targetX: number, targetY: number, len1: number, len2: number, flip: boolean = false): { angle1: number, angle2: number } | null => {
    // 1. Distance to target
    const dx = targetX - rootX;
    const dy = targetY - rootY;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    // 2. Cannot reach
    if (dist >= len1 + len2 - 0.01) {
        // Point straight at target
        const angle = Math.atan2(dy, dx);
        return { angle1: angle, angle2: 0 };
    }

    // 3. Law of Cosines
    // c^2 = a^2 + b^2 - 2ab cos(C)
    // angle2 (at elbow) corresponds to the angle opposite to the distance side... wait.
    // Let's standard: 
    // angle1 = triangle offset + direction to target
    // angle2 = elbow bend relative to upper arm

    // Cosine rule for angle "B" (at root, opposite to lower arm len2)
    // len2^2 = len1^2 + dist^2 - 2*len1*dist*cos(B)
    // cos(B) = (len1^2 + dist^2 - len2^2) / (2 * len1 * dist)
    const cosB = (len1 * len1 + distSq - len2 * len2) / (2 * len1 * dist);
    const angB = Math.acos(Math.max(-1, Math.min(1, cosB)));

    // Cosine rule for angle "C" (at elbow, opposite to dist - or rather, exterior angle 2)
    // dist^2 = len1^2 + len2^2 - 2*len1*len2*cos(180 - angle2)
    // cos(180 - angle2) = (len1^2 + len2^2 - dist^2) / (2 * len1 * len2)
    const cosC = (len1 * len1 + len2 * len2 - distSq) / (2 * len1 * len2);
    const angC = Math.acos(Math.max(-1, Math.min(1, cosC)));

    // Base angle to target
    const baseAngle = Math.atan2(dy, dx);

    // Result
    // Angle 1: root rotation (baseAngle +/- angB)
    // Angle 2: elbow bend (angC - usually relative to straight, so PI - angC?)
    // In our system, child rotation is additive.
    // If arm is straight, angle2 is 0. 
    // A standard "straight" 2-bone chain has elbow angle 0 when straight out.
    // The interior angle is angC. So the bend is PI - angC.

    // Flip determines if we bend "left" or "right" (up or down visually)
    const dir = flip ? 1 : -1;

    // HACK: Visual tween often expects +angle to be "down/cw". 
    // Let's try standard tri-solve.
    const a1 = baseAngle + (dir * angB);
    const a2 = dir * (Math.PI - angC); // The bend

    return { angle1: a1, angle2: a2 };
};

/**
 * Calculate pose for a given time in milliseconds.
 * Returns bone transforms for the given animation at the specified time.
 */
export const calculatePoseForTime = (timeMs: number, animationId: number | string): Record<string, BoneTransform> => {
    // Get base rig (skeleton_npc is the default for spell studio)
    const baseRig = ENTITY_RIGS['skeleton_npc'];
    if (!baseRig || !baseRig.parts) {
        return {};
    }

    // Get animation clip if animationId is provided and valid
    const animKey = typeof animationId === 'string' ? animationId : Object.keys(ANIMATION_LIBRARY)[animationId];
    const animClip = animKey ? ANIMATION_LIBRARY[animKey] : null;

    // If we have an animation, interpolate the pose
    if (animClip && animClip.keyframes && animClip.keyframes.length > 0) {
        return getInterpolatedPose(timeMs, animClip.keyframes, baseRig.parts);
    }

    // Otherwise return base rig parts
    return { ...baseRig.parts };
};
