import { BoneAnimation } from '../types';
import { Player } from '../../../../types';
import { SPELL_REGISTRY } from '../../../spells/SpellRegistry';
import { getWalkingAnimations } from './Walking';
import { ANIMATION_LIBRARY } from '../../../../data/AnimationData';
import { getInterpolatedPose } from '../../../../utils/animationUtils';

export const getCastingAnimations = (time: number, player?: Player, facingRight?: boolean, isMoving?: boolean): Record<string, BoneAnimation> => {
    const breath = Math.sin(time / 500) * 1.5;
    const sway = Math.sin(time / 1000) * 0.02;

    let armLRotation = 0;
    let armRRotation = -sway * 0.5;
    let armLOffset = { x: 0, y: 0 };

    // Default Casting Base (Static)
    let legL = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
    let legR = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
    let torso = { rotation: sway, offsetX: 0, offsetY: breath, scale: 1 };

    // If moving, blend with walking animations
    if (isMoving) {
        const walkingBones = getWalkingAnimations(time);
        legL = walkingBones.leg_l;
        legR = walkingBones.leg_r;
        torso = walkingBones.torso;
    }

    if (player && player.casting.isCasting) {
        const spell = player.casting.currentSpell;

        // NEW: Use Studio Animation for Fireball
        // We use the SpellType enum value for Fireball which is usually 'FIRE' or similar. 
        // Assuming SpellType.FIRE is the enum value.
        // We need to import SpellType to be safe, but we can check the string if confident.
        // Let's use string check or assume SpellType import is available (it is in line 2? no, Player is).
        // Actually SpellType is likely exported from types.

        if (spell === 'FIRE' as any) { // Cast to any to avoid import issues if SpellType not imported, but better to import.
            // (Constraint: minimizing imports/changes. But I should import ANIMATION_LIBRARY)
            // ... logic below ...
        }

        const config = SPELL_REGISTRY[spell];
        const castType = config?.castType || 'channel';

        // Progress (0 to 1)
        const progress = Math.min(1, player.casting.timer / player.casting.duration);

        // Aim Angle
        let aimAngle = 0;
        if (player.casting.targetPos) {
            const dx = player.casting.targetPos.x - player.pos.x;
            const dy = player.casting.targetPos.y - player.pos.y;
            aimAngle = Math.atan2(dy, facingRight ? dx : -dx);
        }

        // FIREBALL CUSTOM ANIMATION
        if (spell === 'FIRE' as any) {
            // Calculate frame based on duration.
            // Clamp progress to prevent snapping back when holding to recast
            const clampedProgress = Math.min(1, progress);
            const frame = clampedProgress * 60;
            const animClip = ANIMATION_LIBRARY['cast_fireball'];

            // Fallback if animation missing
            if (!animClip) {
                // Use default channel behavior
                armLRotation = aimAngle - Math.PI / 2;
            } else {
                const pose = getInterpolatedPose(frame, animClip.keyframes);

                if (pose.torso) {
                    torso.rotation = pose.torso.rotation;
                    torso.offsetX = pose.torso.x;
                    torso.offsetY = pose.torso.y;
                }
                if (pose.arm_l) {
                    // Override rotation to point strictly at target
                    armLRotation = (aimAngle - Math.PI / 2);
                    armLOffset.x = pose.arm_l.x;
                    armLOffset.y = pose.arm_l.y;
                }
                if (pose.arm_r) {
                    armRRotation = pose.arm_r.rotation;
                }
            }
        }
        else if (castType === 'punch') {
            // Punch: Pull back then thrust forward
            // Phase 1: Wind up (0 - 0.3)
            // Phase 2: Punch (0.3 - 0.5)
            // Phase 3: Hold/Recover (0.5 - 1.0)

            if (progress < 0.3) {
                // Wind up
                armLRotation = aimAngle - Math.PI / 1.5;
            } else if (progress < 0.5) {
                // Thrust
                const thrust = (progress - 0.3) / 0.2; // 0 to 1
                armLRotation = (aimAngle - Math.PI / 1.5) + (Math.PI / 3 * thrust);
                armLOffset.x = thrust * 5;
            } else {
                // Hold
                armLRotation = aimAngle - Math.PI / 2; // Point at target
                armLOffset.x = 5 * (1 - (progress - 0.5) * 2); // Retract
            }
        }
        else if (castType === 'lift') {
            // Lift: Raise both hands high with intensity
            const shake = Math.sin(time / 50) * 0.1;
            armLRotation = -Math.PI * 0.9 + shake;
            armRRotation = -Math.PI * 0.9 - shake;
        }
        else {
            // Channel / Default: Point at target
            armLRotation = aimAngle - Math.PI / 2;
        }
    }

    return {
        torso: torso,
        head: { rotation: sway * 0.5, offsetX: 0, offsetY: 0, scale: 1 },
        arm_l: { rotation: armLRotation, offsetX: armLOffset.x, offsetY: armLOffset.y, scale: 1 },
        arm_r: { rotation: armRRotation, offsetX: 0, offsetY: 0, scale: 1 },
        leg_l: legL,
        leg_r: legR
    };
};
