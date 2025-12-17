export enum AnimationState {
    IDLE = 'IDLE',
    WALKING = 'WALKING',
    CASTING = 'CASTING',
    ROLLING = 'ROLLING',
    ATTACKING = 'ATTACKING'
}

export enum WeaponState {
    SHEATHED = 'SHEATHED',
    DRAWN = 'DRAWN',
    HIDDEN = 'HIDDEN'
}

export interface AnimationParams {
    time: number;
    isMoving: boolean;
    isCasting: boolean;
    isRolling: boolean;
    isAttacking: boolean;
}

export interface BoneAnimation {
    rotation: number;
    offsetX: number;
    offsetY: number;
    scale: number;
}

export interface FrameData {
    bones: Record<string, BoneAnimation>;
    weaponState: WeaponState;
}
