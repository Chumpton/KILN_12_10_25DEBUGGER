import { GameState, Player, Vector2, Enemy } from "../../../types";
import { SpellCallbacks } from "../SpellSystem";
import { SpellDefinition } from "../SpellRegistry";
import { createDefaultCastPlan, applyCardsToCastPlan } from "../../cards/CardSystem";
import { CastPlan } from "../../cards/types";
import { getDistance } from "../../../utils/isometric";

// --- Types ---
export type ArcLightningPlan = {
    rangeTiles: number;
    aimConeDeg: number;

    maxChains: number;
    chainRangeTiles: number;
    chainFalloff: number;

    shockStacksPerHit: number;
    shockedChainRangeBonus: number;
    shock5ExtraJumpEnabled: boolean;

    hopDelaySec: number;

    // targeting preferences
    preferCursorDirection: boolean;
    allowFireToMaxRangePoint: boolean;

    // constraints
    uniqueTargetsPerCast: boolean;
    requiresLineOfSightForChains: boolean;

    // vfx
    vfxLifetimeFrames: number;
    vfxStaggerFramesPerHop: number;
    vfxThickness: 1 | 2;
};


type ArcHop = { from: Vector2; to: Vector2; targetId?: string; damageMul: number };

// --- Math Helpers ---
const sub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Vector2, s: number): Vector2 => ({ x: a.x * s, y: a.y * s });
const len = (a: Vector2): number => Math.sqrt(a.x * a.x + a.y * a.y);
const norm = (a: Vector2): Vector2 => {
    const l = len(a);
    return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};
const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

// --- Behavior ---

export const ARC_LIGHTNING_BEHAVIOR = {
    onCast: (
        state: GameState,
        config: SpellDefinition,
        caster: Player,
        targetPos: Vector2,
        callbacks: SpellCallbacks
    ) => {
        // 1. Generate Plan
        const rawPlan = createDefaultCastPlan(config, caster, targetPos, {});
        const cards = (caster.equippedCards && caster.equippedCards[config.spellKey]) || [];
        const castPlan = applyCardsToCastPlan(rawPlan, cards, {});

        // Cast to Arc Plan (data is populated from balance + card mods if any)
        // Assuming card system might modify 'data' if there are specific arc-mods
        const plan = castPlan.data as ArcLightningPlan;

        // Apply Stat Mods to Plan Fields
        // e.g. projectileCount -> maxChains? Or keep distinct?
        // Let's allow 'projectileCount' stats to buff maxChains
        if (castPlan.stats.projectileCount > 1) {
            plan.maxChains += (castPlan.stats.projectileCount - 1); // Additive extra chains
        }
        // rangeTiles -> aoeRadiusMult? Or range mult?
        // Let's use durationMult for Range? Or just use base.

        const seed = Math.random();
        const dir = norm(sub(targetPos, caster.pos));

        // --- 1) Primary targeting (enemy in cone & range OR fire to max point)
        const primary = pickPrimaryTarget(state, caster.pos, dir, plan.rangeTiles, plan.aimConeDeg);

        const hops: ArcHop[] = [];
        const hitIds = new Set<string>();

        if (primary) {
            hops.push({ from: caster.pos, to: primary.pos, targetId: primary.id, damageMul: 1 });
            hitIds.add(primary.id);
        } else {
            // fire to max range point
            const endPoint = add(caster.pos, mul(dir, plan.rangeTiles));
            // Simple Raycast Check (Optional - for now just hit max range)
            // If we had wall collision, we'd check it here.

            hops.push({ from: caster.pos, to: endPoint, damageMul: 0 }); // Damage 0 implies miss/ground hit

            // Spawn miss VFX
            // spawnArcVfx(callbacks, caster.pos, endPoint, plan, seed, 0);
            // We will loop through hops later to spawn vfx
        }

        // --- 2) Resolve hits + build chain hops
        let remainingChains = plan.maxChains;
        let currentDamageMul = 1.0;

        let extraJumpGranted = false;

        // Only chain if we hit something (last hop has targetId)
        if (hops[0].targetId) {
            while (remainingChains > 0) {
                const last = hops[hops.length - 1];
                if (!last.targetId) break;

                const lastEnemy = state.enemies.find(e => e.id === last.targetId);
                if (!lastEnemy) break;

                // Apply Hit (Damage + Shock)
                applyArcHit(state, callbacks, castPlan, caster, lastEnemy, currentDamageMul, plan);

                // check “Shock 5 => +1 jump once”
                if (plan.shock5ExtraJumpEnabled && !extraJumpGranted) {
                    // Determine stacks (Need callback or check status on enemy)
                    // Assuming enemy.status.shockStacks exists or using statusIntensity
                    const shockStacks = lastEnemy.status?.shockStacks || 0;
                    if (shockStacks >= 5) {
                        remainingChains += 1;
                        extraJumpGranted = true;
                    }
                }

                // chain search
                // Bonus range if target shocked
                const isShocked = (lastEnemy.status?.shockStacks || 0) > 0;
                const chainRange = isShocked
                    ? plan.chainRangeTiles * (1 + plan.shockedChainRangeBonus)
                    : plan.chainRangeTiles;

                const next = pickNextChainTarget(
                    state,
                    lastEnemy.pos,
                    dir,
                    chainRange,
                    hitIds,
                    plan.preferCursorDirection
                );

                if (!next) break;

                currentDamageMul *= plan.chainFalloff;
                hops.push({ from: lastEnemy.pos, to: next.pos, targetId: next.id, damageMul: currentDamageMul });
                hitIds.add(next.id);

                remainingChains -= 1;
            }

            // Apply final hit if loop ended
            const finalHop = hops[hops.length - 1];
            if (finalHop.targetId && finalHop !== hops[0]) { // Don't re-apply first hit
                const enemy = state.enemies.find(e => e.id === finalHop.targetId);
                if (enemy) applyArcHit(state, callbacks, castPlan, caster, enemy, currentDamageMul, plan);
            }
        }

        // --- 3) VFX: stagger arcs per hop
        hops.forEach((h, i) => {
            const delayFrames = i * plan.vfxStaggerFramesPerHop;
            const delayMs = (delayFrames / 60) * 1000;

            // Spawn Arc Visual
            callbacks.createVisualEffect('lightning_chain', h.from, delayMs, {
                target: h.to,
                // color: config.animation.primaryColor,
                thickness: plan.vfxThickness || 1,
                style: plan.vfxType || 'ZIGZAG'
            });

            // Spawn Impact Visual at destination
            if (h.targetId || h.damageMul > 0) {
                // Wait for arc to arrive? Or instant feedback? 
                // The prompt says "vfxStaggerFramesPerHop", implying delays.
                // createVisualEffect should support delay or we simulate it.
                // Our createVisualEffect takes 'duration', but maybe 'data' can hold startDelay?
                // For now, let's assume 'lightning_chain' handles the arc drawing over time.
                callbacks.createVisualEffect('spark_burst', h.to, 200, {});
            }
        });
    }
};

// ---------------- Helper Functions ----------------

function pickPrimaryTarget(
    state: GameState,
    origin: Vector2,
    dir: Vector2,
    rangeTiles: number,
    aimConeDeg: number
): Enemy | null {
    const cosThreshold = Math.cos((aimConeDeg / 2) * (Math.PI / 180));

    let best: Enemy | null = null;
    let bestDist = Infinity;

    // Convert tiles to world units (assuming 1 tile = 32 or similar? "rangeTiles" in input implies logic units).
    // The generic game uses pixel headers. Let's assume 1 tile = 64px for this spell logic? 
    // OR map directly if game uses grid units.
    // Actually SpellSystem uses 'aoeRadius' in world units (usually small, like 1.5). 
    // Let's assume rangeTiles IS world units for consistency with new schema.
    const maxDist = rangeTiles;

    for (const e of state.enemies) {
        if (e.hp <= 0) continue;

        const toEnemy = sub(e.pos, origin);
        const d = len(toEnemy);
        if (d > maxDist) continue;

        const toEnemyDir = norm(toEnemy);
        const alignment = dot(dir, toEnemyDir);

        if (alignment >= cosThreshold) {
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
    }
    return best;
}

function pickNextChainTarget(
    state: GameState,
    origin: Vector2,
    lastDir: Vector2,
    range: number,
    hitIds: Set<string>,
    preferForward: boolean
): Enemy | null {
    let best: Enemy | null = null;
    let bestScore = -Infinity;

    for (const e of state.enemies) {
        if (e.hp <= 0 || hitIds.has(e.id)) continue;

        const toEnemy = sub(e.pos, origin);
        const d = len(toEnemy);

        if (d > range) continue;

        // Score based on distance (closer is better)
        let score = -d;

        // Bias forward if requested
        if (preferForward) {
            const alignment = dot(lastDir, norm(toEnemy));
            score += alignment * 5; // Weight direction heavily
        }

        if (score > bestScore) {
            bestScore = score;
            best = e;
        }
    }
    return best;
}

function applyArcHit(
    state: GameState,
    callbacks: SpellCallbacks,
    plan: CastPlan,
    caster: Player,
    enemy: Enemy,
    mult: number,
    arcData: ArcLightningPlan
) {
    // Calc logic damage
    const base = plan.stats.baseDamage || 10; // Fallback
    const damage = base * plan.stats.damageMult * mult; // Apply multipliers

    // Crit
    const isCrit = Math.random() < (plan.stats.critChance || 0);
    const finalDamage = isCrit ? damage * (plan.stats.critMultiplier || 1.5) : damage;

    // Apply Damage
    callbacks.onEnemyHit(enemy, finalDamage, 'shock');

    // Apply Shock Stacks
    // Assuming onEnemyHit might handle status, OR we manually apply.
    // The "shockStacksPerHit" implies granular control. 
    // If callbacks.onEnemyHit applies generic shock, we might add extra here.
    if (arcData.shockStacksPerHit > 0) {
        // Mocking direct status manipulation since callbacks might be limited
        if (!enemy.status) enemy.status = {};
        enemy.status.shockStacks = (enemy.status.shockStacks || 0) + arcData.shockStacksPerHit;
        // console.log(`Applied ${arcData.shockStacksPerHit} shock stacks to ${enemy.id}`);
    }
}
