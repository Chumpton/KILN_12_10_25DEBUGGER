import { GameState, Vector2, SpellType, Player, MeleeAttackPhase } from '../types';
import { soundSystem } from './SoundSystem';
import { SpellCallbacks } from '../modules/spells/SpellSystem';
import { WEAPON_REGISTRY } from '../data/WeaponRegistry';
import { ANIMATION_LIBRARY } from '../data/AnimationData';

// Helper for Line Segment vs Point distance squared
const distToSegmentSquared = (p: Vector2, v: Vector2, w: Vector2) => {
    const l2 = (w.x - v.x) * (w.x - v.x) + (w.y - v.y) * (w.y - v.y);
    if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const finalX = v.x + t * (w.x - v.x);
    const finalY = v.y + t * (w.y - v.y);
    return (p.x - finalX) * (p.x - finalX) + (p.y - finalY) * (p.y - finalY);
};

export const performWeaponAttack = (
    state: GameState,
    targetPos: Vector2,
    callbacks: SpellCallbacks
) => {
    const { player } = state;

    // 1. Check Cooldowns / State
    if (player.attack.cooldown > 0 || player.attack.isAttacking || player.casting.isCasting) {
        return;
    }

    // 2. Identify Weapon
    const weaponItem = player.equipment.MAIN_HAND;
    if (!weaponItem || !weaponItem.weaponId) {
        return;
    }

    // 3. Start Attack State - WINDUP
    player.attack.isAttacking = true;
    player.attack.phase = MeleeAttackPhase.WINDUP;
    player.attack.weaponId = weaponItem.weaponId;
    player.attack.targetPos = { ...targetPos };
    player.attack.hitTargets = [];
    player.attack.timer = 0;

    // Disable any combo/buffer logic for "Swipe Once"
    player.attack.comboWindowOpen = false;
    player.attack.inputBuffer = false;
    player.attack.comboCount = 0;
};

export const updateWeaponSystem = (state: GameState, callbacks: SpellCallbacks, mouseWorld?: Vector2) => {
    const { player } = state;

    // Cooldown Decay
    if (player.attack.cooldown > 0) {
        player.attack.cooldown--;
    }

    // Attack State Machine
    if (player.attack.isAttacking) {
        player.attack.timer++;

        // FAILSAFE: Watchdog for stuck state
        if (player.attack.timer > 60) {
            console.warn('[WeaponSystem] Stuck in Attack State - Force Reset');
            player.attack.isAttacking = false;
            player.attack.phase = MeleeAttackPhase.IDLE;
            player.attack.timer = 0;
            return;
        }

        const phase = player.attack.phase;
        let phaseDuration = 0;

        // Speed Modifiers (Haste)
        const speedMult = 1 + (player.baseStats.haste * 0.05);

        // Frame Definitions from Animation Data!
        const animClip = ANIMATION_LIBRARY['greatsword_slash'];

        const baseWindup = animClip?.phases[MeleeAttackPhase.WINDUP]?.duration || 5;
        const baseSwing = animClip?.phases[MeleeAttackPhase.SWING]?.duration || 9;

        const F_WINDUP = Math.max(2, Math.floor(baseWindup / speedMult));
        const F_SWING = Math.max(3, Math.floor(baseSwing / speedMult));

        if (phase === MeleeAttackPhase.WINDUP) {
            phaseDuration = F_WINDUP;
            if (mouseWorld) player.attack.targetPos = { ...mouseWorld };

            if (player.attack.timer >= F_WINDUP) {
                // Transition to SWING
                player.attack.phase = MeleeAttackPhase.SWING;
                player.attack.timer = 0;
            }

        } else if (phase === MeleeAttackPhase.SWING) {
            phaseDuration = F_SWING;

            // Calculate Geometry
            const swingProgress = player.attack.timer / F_SWING;

            // Define Arc
            const SWIPE_ARC = Math.PI * 0.8;
            const aimAngle = Math.atan2(player.attack.targetPos.y - player.pos.y, player.attack.targetPos.x - player.pos.x);

            const startOffset = -SWIPE_ARC / 2;
            const endOffset = (SWIPE_ARC / 2) + (Math.PI / 8);

            const t = 1 - Math.pow(1 - swingProgress, 3);
            const currentAngle = aimAngle + startOffset + (endOffset - startOffset) * t;

            // Collision Check
            const handDist = 0.4;
            const swordLen = 2.0;

            const handPos = {
                x: player.pos.x + Math.cos(currentAngle) * handDist,
                y: player.pos.y + Math.sin(currentAngle) * handDist
            };
            const tipPos = {
                x: handPos.x + Math.cos(currentAngle) * swordLen,
                y: handPos.y + Math.sin(currentAngle) * swordLen
            };

            state.enemies.forEach(e => {
                if (e.isDead || e.isPhasing) return;
                if (player.attack.hitTargets.includes(e.id)) return;

                const distSq = (e.pos.x - player.pos.x) ** 2 + (e.pos.y - player.pos.y) ** 2;
                if (distSq > (swordLen + e.radius + 1) ** 2) return;

                if (distToSegmentSquared(e.pos, handPos, tipPos) <= (e.radius * e.radius)) {
                    // HIT
                    player.attack.hitTargets.push(e.id);

                    // Damage Logic
                    const weaponItem = player.equipment.MAIN_HAND;
                    const baseDmg = 5;
                    const weaponDmg = weaponItem?.stats.damage || 0;
                    const powerBonus = player.baseStats.power * 1;
                    const totalDmg = baseDmg + weaponDmg + powerBonus + (player.level * 1);

                    e.hp -= totalDmg;
                    callbacks.addFloatingText(`${Math.round(totalDmg)}`, e.pos, '#ffffff');

                    // FX
                    callbacks.createImpactPuff(e.pos, SpellType.FROST_BOLT);
                    soundSystem.playEnemyHit();

                    if (e.hp <= 0) {
                        e.isDead = true;
                        callbacks.onEnemyDeath(e);
                    }

                    // Knockback - Reduced to 0.2 for lighter feel
                    const kbAngle = Math.atan2(e.pos.y - player.pos.y, e.pos.x - player.pos.x);
                    const kbForce = 0.2; // WAS 1.0
                    e.velocity.x += Math.cos(kbAngle) * kbForce;
                    e.velocity.y += Math.sin(kbAngle) * kbForce;

                    if (player.attack.timer > 2) player.attack.timer -= 2;
                }
            });

            if (player.attack.timer >= F_SWING) {
                // END ATTACK IMMEDIATELY (Skip FollowThrough/Recovery)
                player.attack.isAttacking = false;
                player.attack.phase = MeleeAttackPhase.IDLE;

                // Set Cooldown - REDUCED to 5 frames (~0.08s) based on user feedback
                player.attack.cooldown = 5;
            }
        }
    }
};
