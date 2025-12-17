import { BoneAnimation } from './types';

export interface AnimationRenderer {
    getAnimations(time: number, params?: any): Record<string, BoneAnimation>;
}
