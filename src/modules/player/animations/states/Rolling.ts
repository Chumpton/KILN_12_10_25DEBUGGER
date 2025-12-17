import { BoneAnimation } from '../types';
import { Player } from '../../../../types';

export const getRollingAnimations = (stateTime: number): Record<string, BoneAnimation> => {
    const rollRotation = stateTime / 100;
    const rollClumpRadius = 8;
    const createOrbitTransform = (index: number): BoneAnimation => {
        const angle = rollRotation + (index * Math.PI * 2 / 8);
        return {
            rotation: rollRotation * 2,
            offsetX: Math.cos(angle) * rollClumpRadius,
            offsetY: Math.sin(angle) * rollClumpRadius - 30,
            scale: 1
        };
    };

    return {
        torso: createOrbitTransform(0),
        head: createOrbitTransform(1),
        arm_l: createOrbitTransform(2),
        arm_r: createOrbitTransform(3),
        leg_l: createOrbitTransform(4),
        leg_r: createOrbitTransform(5)
    };
};
