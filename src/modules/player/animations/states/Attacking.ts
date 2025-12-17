import { BoneAnimation } from '../types';
import { Player, MeleeAttackPhase } from '../../../../types';
import { getWalkingAnimations } from './Walking';
import { ANIMATION_LIBRARY } from '../../../../data/AnimationData';
import { getInterpolatedPose } from '../../../../utils/animationUtils';

export const getThrustAnimations = (stateTime: number, time: number, player?: Player, facingRight?: boolean, isMoving?: boolean): Record<string, BoneAnimation> => {
    // Legacy Thrust Logic (Keep for now or replace later)
    const duration = 250;
    const progress = Math.min(1, stateTime / duration);

    let aimAngle = 0;
    if (player?.casting.targetPos) {
        const dx = player.casting.targetPos.x - player.pos.x;
        const dy = player.casting.targetPos.y - player.pos.y;
        aimAngle = Math.atan2(dy, facingRight ? dx : -dx);
    }
    return {
        torso: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 },
        head: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 },
        arm_r: { rotation: aimAngle - Math.PI / 2, offsetX: 0, offsetY: 0, scale: 1 },
        weapon_r: { rotation: -0.72, offsetX: 0, offsetY: 0, scale: 1 },
        arm_l: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 },
        hand_r: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 },
        leg_l: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 },
        leg_r: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 }
    };
};

export const getAttackingAnimations = (stateTime: number, time: number, player?: Player, facingRight?: boolean, isMoving?: boolean): Record<string, BoneAnimation> => {
    // Default Legs/Torso Base from Walking if moving
    let legL = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
    let legR = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
    let torsoY = 0;

    if (isMoving) {
        const walkingBones = getWalkingAnimations(time);
        legL = walkingBones.leg_l;
        legR = walkingBones.leg_r;
        torsoY = walkingBones.torso.offsetY;
    }

    // Calculate aim angle towards target
    let aimAngle = 0;
    if (player?.attack.targetPos) {
        const dx = player.attack.targetPos.x - player.pos.x;
        const dy = player.attack.targetPos.y - player.pos.y;
        // Convert to screen-space angle for proper isometric aiming
        aimAngle = Math.atan2(dy, facingRight ? dx : -dx);
    }

    // Calculate swing progress based on attack phase
    let swingProgress = 0;
    const WINDUP_FRAMES = 5;
    const SWING_FRAMES = 9;

    if (player?.attack.phase === MeleeAttackPhase.WINDUP) {
        // During windup, pull back to -45°
        swingProgress = -(player.attack.timer / WINDUP_FRAMES) * 0.5; // 0 to -0.5
    } else if (player?.attack.phase === MeleeAttackPhase.SWING) {
        // During swing, arc from -45° to +45°
        const t = player.attack.timer / SWING_FRAMES;
        swingProgress = -0.5 + t * 1.0; // -0.5 to +0.5
    } else {
        // After swing, hold at +45°
        swingProgress = 0.5;
    }

    // Calculate current swing angle (-45° to +45° arc)
    const swingArc = Math.PI / 4; // 45 degrees
    const currentSwingAngle = aimAngle + (swingProgress * swingArc * 2);

    // Arm rotation points towards the swing angle
    // Subtract PI/2 because arm sprite points down by default
    const armRotation = currentSwingAngle - Math.PI / 2;

    // Extend arm slightly during swing for emphasis
    const armExtension = Math.abs(swingProgress) * 3; // 0-3 pixels

    // Weapon rotation relative to arm (aligned in same direction)
    // The weapon should point along the arm's direction
    const weaponRotation = 0; // Aligned with arm

    const bones: Record<string, BoneAnimation> = {
        torso: {
            rotation: swingProgress * 0.1, // Slight torso twist
            offsetX: 0,
            offsetY: torsoY,
            scale: 1
        },
        head: {
            rotation: -swingProgress * 0.05, // Counter-rotate head slightly
            offsetX: 0,
            offsetY: 0,
            scale: 1
        },
        arm_l: {
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            scale: 1
        },
        arm_r: {
            rotation: armRotation,
            offsetX: Math.cos(currentSwingAngle) * armExtension,
            offsetY: Math.sin(currentSwingAngle) * armExtension,
            scale: 1
        },
        hand_r: {
            rotation: 0, // Hand aligned with arm
            offsetX: 0,
            offsetY: 0,
            scale: 1
        },
        weapon_r: {
            rotation: weaponRotation, // Weapon aligned with arm
            offsetX: 0,
            offsetY: 0,
            scale: 1
        },
        leg_l: legL,
        leg_r: legR
    };

    return bones;
};
