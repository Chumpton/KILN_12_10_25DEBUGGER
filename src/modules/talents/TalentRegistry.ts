import { UnifiedModifier } from "../spells/modifiers";
import { SpellType } from "../../types";

export interface TalentDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    maxRank: number;

    // Requirements (Optional)
    prerequisites?: string[]; // IDs of other talents in the same spell's list
    requiredPointsInSpell?: number;

    // Effect per rank
    // multiplier: number (rank * value)
    grants: (rank: number) => Partial<UnifiedModifier>;
}

export const TALENT_REGISTRY: Record<string, TalentDefinition[]> = {
    [SpellType.FIRE_FIREBALL]: [
        {
            id: 'scattercast',
            name: 'Scattercast',
            description: 'Fireball splits into multiple projectiles. Each rank adds +1 projectile but reduces damage.',
            icon: '🔱',
            maxRank: 4,
            grants: (rank) => ({
                stats: {
                    projectileCount: rank,
                    damageMult: 1 - (rank * 0.15), // Penalties: -15%, -30%, -45%, -60%
                    spreadDegrees: 15
                },
                // Rank 4 logic (micro-stagger) would be in the behavior
                data: { staggerFire: rank === 4 }
            })
        },
        {
            id: 'scorched_path',
            name: 'Scorched Path',
            description: 'Fireball leaves a trail of fire on the ground as it travels.',
            icon: '🔥',
            maxRank: 3,
            grants: (rank) => ({
                flags: ['SPAWN_FIELD_ON_IMPACT'], // We can repurpose this or use a new flag for "TRAIL"
                data: {
                    trailWidth: 0.5 + (rank * 0.5),
                    trailDuration: 120 + (rank * 60),
                    trailFlare: rank === 3
                }
            })
        },
        {
            id: 'run_and_gun',
            name: 'Run & Gun',
            description: 'Fireball can be cast while moving. -12% damage and +20% cast time while moving.',
            icon: '🏃',
            maxRank: 1,
            grants: (rank) => ({
                flags: ['MOVE_SPEED_WHILE_CASTING'],
                data: { mobilityPenalty: true }
            })
        },
        {
            id: 'heartburst',
            name: 'Heartburst',
            description: 'On hit, Fireball erupts from the enemy into 6 embers dealing 30% damage.',
            icon: '💥',
            maxRank: 1,
            grants: (rank) => ({
                flags: ['EXPLODE_ON_DEATH'], // Or custom trigger
                data: { emberBurst: true, emberCount: 6, emberDamageMult: 0.3 }
            })
        },
        {
            id: 'delayed_detonation',
            name: 'Cooking the Shot',
            description: 'Fireball embeds briefly before exploding for massive damage.',
            icon: '⏲️',
            maxRank: 2,
            grants: (rank) => ({
                stats: {
                    damageMult: 1 + (rank * 0.225), // +25%, +45% (approx)
                    aoeRadiusMult: 1 + (rank * 0.2)
                },
                data: { detonationDelay: rank === 1 ? 15 : 24 } // 0.25s, 0.4s
            })
        },
        {
            id: 'thermal_drift',
            name: 'Thermal Drift',
            description: 'Fireballs curve toward burning enemies, prioritizing higher stacks.',
            icon: '🎯',
            maxRank: 2,
            grants: (rank) => ({
                stats: {
                    homingStrength: rank * 0.15
                },
                flags: ['HOMING'],
                data: { thermalTargeting: true }
            })
        },
        {
            id: 'glass_cannon',
            name: 'Overheat',
            description: 'Successive casts increase damage up to 40%. At max stacks, auto-crit but you take +10% damage.',
            icon: '🧪',
            maxRank: 1,
            grants: (rank) => ({
                data: { overheatEnabled: true }
            })
        },
        {
            id: 'living_fireball',
            name: 'Living Fireball',
            description: 'Mini-Keystone: Fireball becomes slow, massive, and oppressive. No Multiple Projectiles allowed.',
            icon: '🌋',
            maxRank: 1,
            grants: (rank) => ({
                stats: {
                    projectileSpeedMult: 0.65,
                    aoeRadiusMult: 1.7,
                    damageMult: 1.6
                },
                flags: ['SPAWN_FIELD_ON_IMPACT'], // Forces trail
                data: { isLivingFireball: true }
            })
        },
        // --- AFFIXES (Passive Chips) ---
        {
            id: 'affix_velocity',
            name: 'Velocity',
            description: '+5% Projectile Speed',
            icon: '⏩',
            maxRank: 5,
            grants: (rank) => ({ stats: { projectileSpeedMult: 1 + (rank * 0.05) } })
        },
        {
            id: 'affix_potency',
            name: 'Potency',
            description: '+5% Damage',
            icon: '💪',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.05) } })
        },
        {
            id: 'affix_expansion',
            name: 'Expansion',
            description: '+5% Area Radius',
            icon: '🔭',
            maxRank: 5,
            grants: (rank) => ({ stats: { aoeRadiusMult: 1 + (rank * 0.05) } })
        },
        {
            id: 'affix_efficiency',
            name: 'Efficiency',
            description: '-5% Mana Cost',
            icon: '📉',
            maxRank: 5,
            grants: (rank) => ({ stats: { manaCostMult: 1 - (rank * 0.05) } })
        },
        {
            id: 'affix_focus',
            name: 'Focus',
            description: '+5% Crit Chance',
            icon: '🎯',
            maxRank: 5,
            grants: (rank) => ({ stats: { critChanceFlat: rank * 0.05 } })
        }
    ],

    [SpellType.FIRE_DETONATE]: [
        {
            id: 'chain_explosion',
            name: 'Chain Reaction',
            description: 'Explosions have a 10% chance per rank to trigger another nearby detonation.',
            icon: '⛓️',
            maxRank: 5,
            grants: (rank) => ({ stats: { chainCount: rank } })
        },
        {
            id: 'volatile_fuel',
            name: 'Volatile Fuel',
            description: 'Increases detonation damage by 15% per rank.',
            icon: '⛽',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.15) } })
        },
        {
            id: 'soul_burn',
            name: 'Soul Burn',
            description: 'Detonation restores 2 mana per rank on hit.',
            icon: '👻',
            maxRank: 5,
            grants: (rank) => ({ stats: { manaOnHit: rank * 2 } })
        },
        {
            id: 'inferno_presence',
            name: 'Inferno Presence',
            description: 'Increases the radius of the detonation by 10% per rank.',
            icon: '⭕',
            maxRank: 5,
            grants: (rank) => ({ stats: { aoeRadiusMult: 1 + (rank * 0.1) } })
        },
        {
            id: 'pure_flame',
            name: 'Pure Flame',
            description: 'Detonation deals 25% more damage to Burning targets at Rank 5.',
            icon: '✨',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: rank === 5 ? 1.25 : 1 } })
        }
    ],

    [SpellType.ICE_FROST_PULSE]: [
        {
            id: 'arctic_wind',
            name: 'Arctic Wind',
            description: 'Increases pulse speed by 10% per rank.',
            icon: '🌬️',
            maxRank: 5,
            grants: (rank) => ({ stats: { projectileSpeedMult: 1 + (rank * 0.1) } })
        },
        {
            id: 'deep_chill',
            name: 'Deep Chill',
            description: 'Increases slow effect duration by 20% per rank.',
            icon: '🥶',
            maxRank: 5,
            grants: (rank) => ({ stats: { durationMult: 1 + (rank * 0.2) } })
        },
        {
            id: 'brittle_ice',
            name: 'Brittle Ice',
            description: 'Enemies hit take 5% more damage from all sources per rank.',
            icon: '🧊',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.05) } })
        },
        {
            id: 'frost_shards',
            name: 'Frost Shards',
            description: 'Fires 2 additional small pulses at Rank 5.',
            icon: '❄️',
            maxRank: 5,
            grants: (rank) => ({ stats: { projectileCount: rank === 5 ? 2 : 0 } })
        },
        {
            id: 'absolute_zero',
            name: 'Absolute Zero',
            description: '10% chance per rank to freeze enemies solid for 1 second.',
            icon: '🛑',
            maxRank: 5,
            grants: (rank) => ({ flags: rank === 5 ? ['FREEZE_ON_HIT'] : [] })
        }
    ],

    [SpellType.ARCANE_PORTAL]: [
        {
            id: 'stable_rift',
            name: 'Stable Rift',
            description: 'Increases portal duration by 2s per rank.',
            icon: '⏳',
            maxRank: 5,
            grants: (rank) => ({ stats: { durationMult: 1 + (rank * 0.2) } })
        },
        {
            id: 'mana_flow',
            name: 'Mana Flow',
            description: 'Reduces mana cost by 10% per rank.',
            icon: '🌀',
            maxRank: 5,
            grants: (rank) => ({ stats: { manaCostMult: 1 - (rank * 0.1) } })
        },
        {
            id: 'arcane_surge',
            name: 'Arcane Surge',
            description: 'Gain 10% movement speed for 3s after teleporting per rank.',
            icon: '🏃',
            maxRank: 5,
            grants: (rank) => ({ stats: { swiftnessFlat: rank * 0.1 } })
        },
        {
            id: 'phase_shift',
            name: 'Phase Shift',
            description: 'Become invulnerable for 0.1s per rank after teleporting.',
            icon: '✨',
            maxRank: 5,
            grants: (rank) => ({ stats: { shieldOnCast: rank * 10 } })
        },
        {
            id: 'quantum_leap',
            name: 'Quantum Leap',
            description: 'Allows a 3rd portal to be placed at Rank 5.',
            icon: '🔱',
            maxRank: 5,
            grants: (rank) => ({ stats: { projectileCount: rank === 5 ? 1 : 0 } })
        }
    ],

    [SpellType.LIGHTNING_ARC_LIGHTNING]: [
        {
            id: 'high_voltage',
            name: 'High Voltage',
            description: 'Increases chain damage by 15% per rank.',
            icon: '⚡',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.15) } })
        },
        {
            id: 'long_arc',
            name: 'Long Arc',
            description: 'Increases chain range by 20% per rank.',
            icon: '📏',
            maxRank: 5,
            grants: (rank) => ({ stats: { aoeRadiusMult: 1 + (rank * 0.2) } })
        },
        {
            id: 'forked_bolt',
            name: 'Forked Bolt',
            description: 'Adds +1 chain target per rank.',
            icon: '🔱',
            maxRank: 5,
            grants: (rank) => ({ stats: { chainCount: rank } })
        },
        {
            id: 'static_charge',
            name: 'Static Charge',
            description: '10% chance per rank to shock targets, increasing lightning damage taken.',
            icon: '🔋',
            maxRank: 5,
            grants: (rank) => ({ stats: { shockStacks: rank } })
        },
        {
            id: 'thunderclap',
            name: 'Thunderclap',
            description: 'Last hit of the chain explodes at Rank 5.',
            icon: '💥',
            maxRank: 5,
            grants: (rank) => ({ flags: rank === 5 ? ['SECONDARY_EXPLOSION'] : [] })
        }
    ],

    [SpellType.FROST_BREATH]: [
        {
            id: 'icy_blast',
            name: 'Icy Blast',
            description: 'Increases breath damage by 10% per rank.',
            icon: '🧊',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.1) } })
        },
        {
            id: 'wide_cone',
            name: 'Wide Breath',
            description: 'Increases the cone angle by 10 degrees per rank.',
            icon: '📣',
            maxRank: 5,
            grants: (rank) => ({ stats: { spreadDegrees: rank * 10 } })
        },
        {
            id: 'chilling_touch',
            name: 'Chilling Touch',
            description: 'Reduces enemy movement speed by an additional 5% per rank when hit.',
            icon: '✋',
            maxRank: 5,
            grants: (rank) => ({ stats: { chillStacks: rank } })
        },
        {
            id: 'endless_winter',
            name: 'Endless Winter',
            description: 'Reduces mana drain while channeling by 10% per rank.',
            icon: '❄️',
            maxRank: 5,
            grants: (rank) => ({ stats: { manaCostMult: 1 - (rank * 0.1) } })
        },
        {
            id: 'frost_nova_proc',
            name: 'Frostbite Peak',
            description: 'Rank 5: Reaching maximum channel duration triggers a Frost Nova.',
            icon: '❄️',
            maxRank: 5,
            grants: (rank) => ({ triggers: rank === 5 ? [{ when: 'ON_EXPIRE', effect: { type: 'SPAWN_FIELD', data: { type: 'FROZEN_NOVA' } } }] : [] })
        }
    ],

    [SpellType.FIRE_CIRCLE]: [
        {
            id: 'growing_flames',
            name: 'Growing Flames',
            description: 'Increases damage per tick by 10% per rank.',
            icon: '🔥',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.1) } })
        },
        {
            id: 'eternal_fire',
            name: 'Eternal Fire',
            description: 'Increases duration of the circle by 1s per rank.',
            icon: '⏳',
            maxRank: 5,
            grants: (rank) => ({ stats: { durationMult: 1 + (rank * 0.2) } })
        },
        {
            id: 'large_circle',
            name: 'Expanding Ring',
            description: 'Increases circle radius by 15% per rank.',
            icon: '⭕',
            maxRank: 5,
            grants: (rank) => ({ stats: { aoeRadiusMult: 1 + (rank * 0.15) } })
        },
        {
            id: 'sticky_burn',
            name: 'Sticky Burn',
            description: 'Enemies leaving the circle continue to burn for 1s per rank.',
            icon: '🍯',
            maxRank: 5,
            grants: (rank) => ({ stats: { burnStacks: rank } })
        },
        {
            id: 'conflagration',
            name: 'Conflagration',
            description: 'Rank 5: Circle explodes when it expires.',
            icon: '💥',
            maxRank: 5,
            grants: (rank) => ({ triggers: rank === 5 ? [{ when: 'ON_EXPIRE', effect: { type: 'DETONATE' } }] : [] })
        }
    ],

    [SpellType.EARTH_STONE_SHIELD]: [
        {
            id: 'hardened_rock',
            name: 'Hardened Rock',
            description: 'Increases shield HP (hits absorbed) by +1 per rank.',
            icon: '🛡️',
            maxRank: 5,
            grants: (rank) => ({ data: { extraHits: rank } })
        },
        {
            id: 'sharp_stones',
            name: 'Jagged Edges',
            description: 'Rocks deal 20% more damage on contact per rank.',
            icon: '🔪',
            maxRank: 5,
            grants: (rank) => ({ stats: { damageMult: 1 + (rank * 0.2) } })
        },
        {
            id: 'magnetic_pull',
            name: 'Magnetic Force',
            description: 'Increases orbit speed by 10% per rank.',
            icon: '🧲',
            maxRank: 5,
            grants: (rank) => ({ stats: { orbitSpeed: 0.05 * (1 + rank * 0.1) } })
        },
        {
            id: 'granite_skin',
            name: 'Granite Skin',
            description: 'Gain 2 armor per rank while Stone Shield is active.',
            icon: '🪨',
            maxRank: 5,
            grants: (rank) => ({ buffs: { stoneskin: { duration: 1000, armorFlat: rank * 2 } } })
        },
        {
            id: 'living_mountain',
            name: 'Living Mountain',
            description: 'Rank 5: Adds +1 additional rock.',
            icon: '⛰️',
            maxRank: 5,
            grants: (rank) => ({ stats: { projectileCount: rank === 5 ? 1 : 0 } })
        }
    ]
};
