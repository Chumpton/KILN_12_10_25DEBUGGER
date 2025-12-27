import { SpellBehavior } from '../SpellBehavior';
import { GameState, Player, Enemy, SpellType, Vector2 } from '../../../types';
import { SpellDefinition } from '../SpellRegistry';
// Fixed Import
import { SpellCallbacks } from '../SpellBehavior';

const RANGE = 6; // Tiles
const CHAIN_RANGE = 4;
const MAX_CHAINS = 2; // Primary + 2 jumps = 3 targets total

export const ARC_BEAM_BEHAVIOR: SpellBehavior = {
    onCast: (state: GameState, spell: SpellDefinition, player: Player, target: Vector2, callbacks: SpellCallbacks) => {
        const timer = player.casting.timer;
        const tickRate = spell.baseStats.beamTickInterval || 100;
        const frameRate = 16;
        const vfxInterval = 60;
        const shouldRenderVfx = (timer % vfxInterval) < frameRate * 1.5;
        const shouldDealDamage = (timer % tickRate) < frameRate * 1.5;

        if (!shouldRenderVfx && !shouldDealDamage) return;

        // 1. Find Primary Target
        const cursor = player.casting.targetPos;
        if (!cursor) return;

        let primaryTarget: Enemy | null = null;
        let minDist = Infinity;

        state.enemies.forEach(e => {
            if (e.isDead) return;
            const distToPlayer = Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y);
            if (distToPlayer > RANGE) return;

            const distToCursor = Math.hypot(e.pos.x - cursor.x, e.pos.y - cursor.y);
            if (distToCursor < minDist && distToCursor < 3) {
                minDist = distToCursor;
                primaryTarget = e;
            }
        });

        // 2. Render Main Beam (Hit or Miss)
        if (shouldRenderVfx) {
            const sourcePos = { ...player.pos };
            if (spell.data?.originOffset) {
                sourcePos.x += spell.data.originOffset.x;
                sourcePos.y += spell.data.originOffset.y;
            } else {
                sourcePos.y -= 0.5;
            }

            let beamEnd = { ...cursor };
            if (primaryTarget) {
                beamEnd = primaryTarget.pos;
            } else {
                // Clamp cursor to max range
                const dx = cursor.x - player.pos.x;
                const dy = cursor.y - player.pos.y;
                const dist = Math.hypot(dx, dy);
                if (dist > RANGE) {
                    const angle = Math.atan2(dy, dx);
                    beamEnd = {
                        x: player.pos.x + Math.cos(angle) * RANGE,
                        y: player.pos.y + Math.sin(angle) * RANGE
                    };
                }
            }

            callbacks.createVisualEffect('lightning_chain', sourcePos, 100, {
                targetPos: beamEnd,
                sourcePos: sourcePos,
                color: '#FFFF00', // Yellow
                thickness: 1
            });
        }

        // If no target found, we are done (just showed the miss beam)
        if (!primaryTarget) return;

        // 3. Deal Damage
        if (shouldDealDamage) {
            const damage = spell.baseStats.baseDamage;
            callbacks.onEnemyHit(primaryTarget, damage);
            primaryTarget.shockTimer = 60;
        }

        // 4. Chain Logic
        let currentSource = primaryTarget;
        const hitList = new Set<string>([primaryTarget.id]);

        for (let i = 0; i < MAX_CHAINS; i++) {
            let nextTarget: Enemy | null = null;
            let nextDist = Infinity;

            state.enemies.forEach(e => {
                if (e.isDead || hitList.has(e.id)) return;
                const dist = Math.hypot(e.pos.x - currentSource.pos.x, e.pos.y - currentSource.pos.y);
                if (dist < CHAIN_RANGE && dist < nextDist) {
                    nextDist = dist;
                    nextTarget = e;
                }
            });

            if (!nextTarget) break;
            hitList.add(nextTarget.id);

            if (shouldDealDamage) {
                callbacks.onEnemyHit(nextTarget, spell.baseStats.baseDamage * 0.7);
                nextTarget.shockTimer = 60;
            }

            if (shouldRenderVfx) {
                callbacks.createVisualEffect('lightning_chain', currentSource.pos, 100, {
                    targetPos: nextTarget.pos,
                    sourcePos: currentSource.pos,
                    color: '#FFFF00',
                    thickness: 1
                });
            }

            currentSource = nextTarget;
        }
    }
};
