import { BoneAnimation } from '../types';

export const getWalkingAnimations = (time: number): Record<string, BoneAnimation> => {
    const runSpeed = 120; // Faster steps for running feel
    const runAmplitude = 0.6;
    const breath = Math.sin(time / 400) * 1.0;
    const sway = Math.sin(time / 800) * 0.05;

    // Phase offsets for natural running (legs opposite, arms opposite to legs)
    const legLSwing = Math.sin(time / runSpeed) * runAmplitude;
    const legRSwing = Math.sin(time / runSpeed + Math.PI) * runAmplitude;

    // Arm swing is opposite to leg of same side usually in bipedal (Left Leg fwd, Right Arm fwd)
    const armLSwing = Math.sin(time / runSpeed + Math.PI) * runAmplitude;
    const armRSwing = Math.sin(time / runSpeed) * runAmplitude;

    // Bounce occurs twice per cycle
    const bounce = Math.abs(Math.sin(time / runSpeed)) * 3;

    return {
        torso: { rotation: sway + (legLSwing * 0.1), offsetX: 0, offsetY: breath - bounce, scale: 1 },
        head: { rotation: -sway, offsetX: 0, offsetY: 0, scale: 1 },
        arm_l: { rotation: armLSwing, offsetX: 0, offsetY: 0, scale: 1 },
        arm_r: { rotation: armRSwing, offsetX: 0, offsetY: 0, scale: 1 },
        leg_l: { rotation: legLSwing, offsetX: 0, offsetY: 0, scale: 1 },
        leg_r: { rotation: legRSwing, offsetX: 0, offsetY: 0, scale: 1 }
    };
};
