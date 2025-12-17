import { AnimationClip, MeleeAttackPhase } from '../types';
import { DEFAULT_TRANSFORM } from '../utils/animationUtils';

export const ANIMATION_LIBRARY: Record<string, AnimationClip> = {
    'greatsword_slash': {
        id: 'greatsword_slash',
        name: 'Greatsword Slash',
        totalDuration: 14,
        phases: {
            [MeleeAttackPhase.WINDUP]: { duration: 5, startFrame: 0, color: '#3b82f6' },
            [MeleeAttackPhase.SWING]: { duration: 9, startFrame: 5, color: '#ef4444' }
        },
        keyframes: [
            // Start (Idle)
            { frame: 0, bones: {} },

            // End of Windup (Frame 5)
            {
                frame: 5,
                bones: {
                    torso: { ...DEFAULT_TRANSFORM, rotation: -0.4 },
                    arm_r: { ...DEFAULT_TRANSFORM, rotation: -2.0, x: 0, y: 0 },
                    weapon_r: { ...DEFAULT_TRANSFORM, rotation: 0.4 }
                }
            },

            // End of Swing (Frame 14) - Animation essentially ends here or holds for a moment?
            // User wanted to cut off the rest.
            // If totalDuration is 14, loop wraps 0-14.
            {
                frame: 14,
                bones: {
                    torso: { ...DEFAULT_TRANSFORM, rotation: 0.5 },
                    arm_r: { ...DEFAULT_TRANSFORM, rotation: 1.5, x: 0, y: 0 },
                    weapon_r: { ...DEFAULT_TRANSFORM, rotation: 0.4 }
                }
            }
        ],
        hitboxes: [
            { id: 'h1', bone: 'weapon_r', type: 'RECT', x: 0, y: -48, w: 16, h: 48, activeStart: 5, activeEnd: 14 }
        ],
        events: []
    },
    'clip_idle': {
        id: 'clip_idle',
        name: 'Idle Breather',
        totalDuration: 60,
        phases: {
            [MeleeAttackPhase.WINDUP]: { duration: 60, startFrame: 0, color: '#444' },
            [MeleeAttackPhase.SWING]: { duration: 0, startFrame: 60, color: '#444' },
            [MeleeAttackPhase.FOLLOW_THROUGH]: { duration: 0, startFrame: 60, color: '#444' },
            [MeleeAttackPhase.RECOVERY]: { duration: 0, startFrame: 60, color: '#444' }
        },
        keyframes: [
            { frame: 0, bones: { torso: { x: 0, y: 0, rotation: 0, scale: 1 } } },
            { frame: 30, bones: { torso: { x: 0, y: -2, rotation: 0, scale: 1 } } },
            { frame: 60, bones: { torso: { x: 0, y: 0, rotation: 0, scale: 1 } } }
        ],
        hitboxes: [],
        events: []
    },
    'cast_fireball': {
        id: 'cast_fireball',
        name: 'Cast Fireball',
        totalDuration: 60,
        phases: {
            [MeleeAttackPhase.WINDUP]: { duration: 20, startFrame: 0, color: '#3b82f6' },
            [MeleeAttackPhase.SWING]: { duration: 10, startFrame: 20, color: '#ef4444' }, // Casting point at frame 20
            [MeleeAttackPhase.RECOVERY]: { duration: 30, startFrame: 30, color: '#22c55e' }
        },
        keyframes: [
            // Start (Idle)
            { frame: 0, bones: { arm_l: { rotation: 0, x: 0, y: 0, scale: 1 }, torso: { rotation: 0, x: 0, y: 0, scale: 1 } } },

            // Windup - Slight crouch/anticipation
            { frame: 10, bones: { arm_l: { rotation: 0.2, x: 0, y: 1, scale: 1 }, torso: { rotation: 0.05, x: 0, y: 1, scale: 1 } } },

            // Cast Point (Frame 20) - Arm raised to aim
            // Rotation -1.5 radians is approx 90 degrees up/forward, aligning with "Aim at cursor" logic
            // The code overlays aimAngle, so we want the base pose to be "Neutral Aim" (Forward) or let the aimAngle take over.
            // If we set rotation to -1.5, and aimAngle adds to it? 
            // Previous code was: armLRotation = aimAngle - Math.PI/2. It OVERRODE rotation entirely.
            // So visual animation rotation here effectively sets the "Offset" if the override wasn't absolute.
            // But since I changed it to Absolute Override in Casting.ts, this rotation in the clip is IGNORED for the aiming arm during the cast frame.
            // However, for the Studio Preview, we want it to look good.
            { frame: 20, bones: { arm_l: { rotation: -1.5, x: 2, y: -2, scale: 1 }, torso: { rotation: -0.1, x: 2, y: 0, scale: 1 } } },

            // Hold/Follow through
            { frame: 30, bones: { arm_l: { rotation: -1.5, x: 2, y: -2, scale: 1 }, torso: { rotation: -0.1, x: 2, y: 0, scale: 1 } } },

            // Recovery
            { frame: 60, bones: { arm_l: { rotation: 0, x: 0, y: 0, scale: 1 }, torso: { rotation: 0, x: 0, y: 0, scale: 1 } } }
        ],
        hitboxes: [],
        events: []
    }
};
