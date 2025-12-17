import { BoneAnimation } from '../types';

export const getIdleAnimations = (time: number): Record<string, BoneAnimation> => {
    const breath = Math.sin(time / 500) * 1.5;
    const sway = Math.sin(time / 1000) * 0.02;
    const armSway = Math.sin(time / 800) * 0.05;

    return {
        torso: { rotation: sway, offsetX: 0, offsetY: breath, scale: 1 },
        head: { rotation: sway * 0.5, offsetX: 0, offsetY: 0, scale: 1 },
        arm_l: { rotation: armSway, offsetX: 0, offsetY: 0, scale: 1 },
        arm_r: { rotation: -armSway, offsetX: 0, offsetY: 0, scale: 1 },
        leg_l: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 },
        leg_r: { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 }
    };
};
