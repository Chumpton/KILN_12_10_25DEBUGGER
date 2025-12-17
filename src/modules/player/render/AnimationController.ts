import { Player, SpellType } from '../../../types';
import { getIdleAnimations } from '../animations/states/Idle';
import { getWalkingAnimations } from '../animations/states/Walking';
import { getCastingAnimations } from '../animations/states/Casting';
import { getRollingAnimations } from '../animations/states/Rolling';
import { getThrustAnimations, getAttackingAnimations } from '../animations/states/Attacking';
import { AnimationState, WeaponState, FrameData, BoneAnimation } from '../animations/types';

export { AnimationState, WeaponState };

export class AnimationController {
    private currentState: AnimationState = AnimationState.IDLE;
    private stateTime: number = 0;
    private lastTime: number = 0;

    public updateState(player: Player, isMoving: boolean): AnimationState {
        const time = Date.now();
        const newState = this.determineState(player, isMoving);

        if (newState !== this.currentState) {
            this.currentState = newState;
            this.stateTime = 0;
            this.lastTime = time;
        } else {
            this.stateTime += time - this.lastTime;
            this.lastTime = time;
        }

        return this.currentState;
    }

    private determineState(player: Player, isMoving: boolean): AnimationState {
        // Priority order: Rolling > Attack > Casting > Walking > Idle
        if ((player as any).roll?.isRolling) {
            return AnimationState.ROLLING;
        }

        // NEW: Weapon Attack System State
        if (player.attack.isAttacking) {
            return AnimationState.ATTACKING;
        }

        if (player.casting.isCasting) {
            // For spells that look like attacks (Special Abilites)
            if (player.casting.currentSpell === SpellType.SWORD_SWIPE || player.casting.currentSpell === SpellType.PIERCING_THRUST) {
                return AnimationState.ATTACKING;
            }
            return AnimationState.CASTING;
        }
        if (isMoving) {
            return AnimationState.WALKING;
        }
        return AnimationState.IDLE;
    }

    public getAnimations(state: AnimationState, time: number, player?: Player, facingRight?: boolean): FrameData {
        let bones: Record<string, BoneAnimation> = {};
        let weaponState = WeaponState.HIDDEN;

        const isMoving = player && (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.y) > 0.1);
        const hasWeapon = player?.equipment?.MAIN_HAND != null;

        switch (state) {
            // ... (Idle/Walking unchanged)
            case AnimationState.IDLE:
                bones = getIdleAnimations(time);
                weaponState = hasWeapon ? WeaponState.DRAWN : WeaponState.HIDDEN;
                break;
            case AnimationState.WALKING:
                bones = getWalkingAnimations(time);
                weaponState = hasWeapon ? WeaponState.DRAWN : WeaponState.HIDDEN;
                break;
            case AnimationState.CASTING:
                bones = getCastingAnimations(time, player, facingRight, isMoving);
                weaponState = hasWeapon ? WeaponState.SHEATHED : WeaponState.HIDDEN;
                break;
            case AnimationState.ATTACKING:
                // Check if it's a Weapon System attack OR a Spell System attack
                if (player?.attack.isAttacking) {
                    // Use generic attacking animations for now, parameterized by weapon type ideally
                    // We need to pass a specific timer for smoothness
                    const attackProgress = player.attack.timer;
                    // For now, reuse getAttackingAnimations but we need to reset stateTime logic or pass valid time
                    // Actually AnimationController maintains stateTime.
                    bones = getAttackingAnimations(this.stateTime, time, player, facingRight, isMoving);
                    weaponState = hasWeapon ? WeaponState.DRAWN : WeaponState.HIDDEN;
                }
                else if ((player as any).casting?.currentSpell === SpellType.PIERCING_THRUST) {
                    bones = getThrustAnimations(this.stateTime, time, player, facingRight, isMoving);
                    weaponState = hasWeapon ? WeaponState.DRAWN : WeaponState.HIDDEN;
                } else {
                    bones = getAttackingAnimations(this.stateTime, time, player, facingRight, isMoving);
                    weaponState = hasWeapon ? WeaponState.DRAWN : WeaponState.HIDDEN;
                }
                break;
            case AnimationState.ROLLING:
                bones = getRollingAnimations(time);
                weaponState = WeaponState.HIDDEN;
                break;
            default:
                bones = {};
        }

        return { bones, weaponState };
    }

    public getCurrentState(): AnimationState {
        return this.currentState;
    }

    public getStateTime(): number {
        return this.stateTime;
    }
}
