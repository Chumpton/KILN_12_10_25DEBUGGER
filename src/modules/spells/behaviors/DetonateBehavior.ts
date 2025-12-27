
import { SpellBehavior } from '../SpellBehavior';
import { GameState, SpellType } from '../../../types';
import { calculateSpellDamage } from '../../../utils/combat';
import { soundSystem } from '../../../systems/SoundSystem';
import { SpellCallbacks } from '../SpellBehavior';

export const DETONATE_BEHAVIOR: SpellBehavior = {
    onCast: (state: GameState, spell: any, player: any, targetPos: any, callbacks: SpellCallbacks) => {
        const damage = calculateSpellDamage(state.player, SpellType.FIRE_DETONATE);
        let hitCount = 0;

        // Global Detonate: Affect all burning enemies currently tracked
        for (const e of state.enemies) {
            if (e.isDead || e.isPhasing) continue;

            if (e.burnTimer > 0) {
                hitCount++;

                const burnBonus = (e.burnDamage || 0) * 5;
                const totalDamage = damage + burnBonus;

                e.hp -= totalDamage;

                // Remove Burn
                e.burnTimer = 0;
                e.burnDamage = 0;

                callbacks.addFloatingText(`${Math.round(totalDamage)}!`, e.pos, '#ff4500');
                callbacks.createImpactPuff(e.pos, SpellType.FIRE_DETONATE);
                callbacks.createExplosion(e.pos, 2.5, 0, '#ff4500', undefined, 0.4); // Big visual boom

                // Visual Icon Flip
                if (callbacks.createVisualEffect) {
                    callbacks.createVisualEffect('sprite', e.pos, 600, {
                        spriteUrl: '/ui/icons/elements/detonate_icon.png',
                        size: 2.5,
                        animateFlip: true,
                        color: '#ffffff'
                    });
                }

                soundSystem.playEnemyHit();

                // Optional Knockback
                const kDx = e.pos.x - player.pos.x;
                const kDy = e.pos.y - player.pos.y;
                const kDist = Math.sqrt(kDx * kDx + kDy * kDy);
                if (kDist > 0) {
                    const force = 0.025; // Reduced by 80%
                    e.velocity.x += (kDx / kDist) * force;
                    e.velocity.y += (kDy / kDist) * force;
                }

                if (e.hp <= 0 && e.enemyState !== 'DYING') {
                    e.enemyState = 'DYING';
                    e.deathTimer = 30;
                    callbacks.onEnemyDeath(e);
                }
            }
        }

        if (hitCount === 0) {
            callbacks.addFloatingText("No Burning Targets", player.pos, '#888');
            // Refund Cooldown
            if (player.cooldowns) {
                player.cooldowns[SpellType.FIRE_DETONATE] = 0;
            }
        }
    }
};
