import { GameState, Vector2, SpellType, Enemy, Player } from '../../../types';
import { SpellCallbacks } from '../SpellBehavior';
import { SpellBehavior } from '../SpellBehavior';
import { SPELL_REGISTRY, SpellDefinition } from '../SpellRegistry'; // If needed for lookup
import { createDefaultCastPlan, applyCardsToCastPlan } from '../../cards/CardSystem';
import { CastPlan } from '../../cards/types';
import { getDistance } from '../../../utils/isometric';

// --- Types ---
export type ArcLightningPlan = {
    rangeTiles: number;
    aimConeDeg: number;

    maxChains: number;
    chainRangeTiles: number;
    chainFalloff: number;

    shockChance: number; // New param from balance? Or just always apply?
    damagePerSecond: number; // For channeling logic

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
        const rawPlan = createDefaultCastPlan(config, caster, targetPos, { playerLevel: caster.level, spellLevel: 1 });
        // Fallback for plan data if not populated
        if (!rawPlan.data) {
            rawPlan.data = {
                rangeTiles: 8,
                aimConeDeg: 45,
                maxChains: 2, // Default to 2 chains (3 targets total)
                chainRangeTiles: 5,
                chainFalloff: 0.8,
                includeShock: true,
                shockChance: 0.2
            };
        }

        const plan = rawPlan.data as any;

        // --- CHANNELING LOGIC ---
        const channelTimer = caster.casting.timer;
        if (channelTimer % 6 !== 0) return; // Tick every 6 frames (approx 10/sec)

        // Hand Glow VFX
        callbacks.createVisualEffect('particle', caster.pos, 300, {
            color: '#FFFF00',
            size: 1.5,
            velocity: { x: 0, y: -0.5 }
        });

        // 2. Targeting Logic
        // Use hand origin if available, otherwise feet (caster.pos)
        const origin = callbacks.getProjectileOrigin(caster) || caster.pos;
        const dir = norm(sub(targetPos, origin));

        // Pick Primary
        const primary = pickPrimaryTarget(state, origin, dir, plan.rangeTiles || 8, plan.aimConeDeg || 45);
        if (!primary) {
            // Miss Visual
            const missPos = add(origin, mul(dir, plan.rangeTiles || 8));
            callbacks.createVisualEffect('lightning_chain', origin, 200, {
                target: missPos,
                thickness: 1,
                color: '#FFFFA0'
            });
            return;
        }

        // Pick Chains
        const targets: Array<{ enemy: Enemy, hopFrom: Vector2 }> = [];
        targets.push({ enemy: primary, hopFrom: origin });

        let currentSource = primary;
        let chainsLeft = (plan.maxChains !== undefined ? plan.maxChains : 2); // Default to 2 additional chains

        // Add stats buffs to chains
        if (rawPlan.stats.projectileCount > 1) {
            chainsLeft += (rawPlan.stats.projectileCount - 1);
        }

        const hitIds = new Set<string>();
        hitIds.add(primary.id);

        while (chainsLeft > 0) {
            const lastDir = sub(currentSource.pos, targets[targets.length - 1].hopFrom); // Dir from prev source to current
            const next = pickNextChainTarget(state, currentSource.pos, norm(lastDir), plan.chainRangeTiles || 5, hitIds, false);
            if (!next) break;

            targets.push({ enemy: next, hopFrom: currentSource.pos });
            hitIds.add(next.id);
            currentSource = next;
            chainsLeft--;
        }

        // 3. Apply Damage & Effects
        targets.forEach((hop, index) => {
            const e = hop.enemy;

            // Damage Falloff
            const damageMult = Math.pow(plan.chainFalloff || 0.8, index);
            const baseDmg = config.baseStats.baseDamage || 5;
            const statsMult = rawPlan.stats.damageMult || 1;
            const finalDamage = Math.max(1, baseDmg * statsMult * damageMult);

            // Shock Application (Chance based)
            // Shock Application (Chance based)
            let didShock = false;
            // Balance: Increase probability if channeling longer? Or just always shock for satisfying feel + stacks.
            // User request: "giving them shock stacks".
            const shockChance = plan.shockChance ?? 1.0; // High chance by default for this spell
            if (config.status?.appliesShock && Math.random() < shockChance) {
                didShock = true;
            }

            callbacks.onEnemyHit(e, finalDamage, didShock ? 'shock' : undefined);

            // Visuals
            // Visuals
            // Thickness based on shock stacks? 
            // We need to read stacks. Assuming 'shockTimer' > 0 implies at least 1 stack.
            // If explicit stacks key exists on Enemy type, use it. Otherwise use generic shock state.
            // User Request: "the longer the ability is channeled the lightning gets thicker"
            const channelDurationSec = (caster.casting.timer / 60);
            const rampUp = Math.min(3, channelDurationSec); // Cap thickness boost at 3s
            const thickness = 1 + rampUp + Math.min(2, (e as any).shockStacks || 0); // Base + Channel Time + Stacks

            callbacks.createVisualEffect('lightning_chain', hop.hopFrom, 150, {
                target: e.pos,
                targetOffset: { x: 0, y: -40 },
                thickness: thickness,
                color: didShock ? '#FFFFAA' : '#FFD700'
            });
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
    arcData: ArcLightningPlan,
    config: SpellDefinition
) {
    // Calc logic damage
    // Use config.baseDamage as source of truth, Stats modifiers applied after
    let damage = config.baseStats.baseDamage * (plan.stats.damageMult || 1);

    // Crit Logic
    const critChance = (plan.stats.critChanceFlat || 0);
    const isCrit = Math.random() < critChance;
    if (isCrit) {
        damage *= (plan.stats.critMultFlat || 1.5);
        callbacks.addFloatingText('CRIT!', enemy.pos, '#FF0000');
    }
    callbacks.onEnemyHit(enemy, damage, 'shock');

    // Apply Shock Stacks
    // Assuming onEnemyHit might handle status, OR we manually apply.
    // The "shockStacksPerHit" implies granular control.
    // If callbacks.onEnemyHit applies generic shock, we might add extra here.
    if (arcData.shockStacksPerHit > 0) {
        // Apply Shock Stacks
        if (!enemy.status) enemy.status = {};

        // Accumulate stacks
        enemy.status.shockStacks = (enemy.status.shockStacks || 0) + 1;

        // Maybe refresh shock timer?
        // enemy.shockTimer = 120; // 2 seconds

        // Visual indicator (optional, using floating text or status icon)
        // callbacks.addFloatingText('⚡', enemy.pos, '#FFFF00');
    }
}
