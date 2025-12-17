
import { CardDefinition } from "./types";

export const CARD_REGISTRY: Record<string, CardDefinition> = {
    // --- ROW A: PROJECTILE PATH ---
    "CARD_TWIN_SHOT": {
        id: "CARD_TWIN_SHOT",
        name: "Twin Shot",
        description: "Fires 2 projectiles with reduced damage.",
        icon: "ui/icons/cards/twin_shot.png",
        tier: "COMMON",
        rarity: "COMMON",
        cost: 1,
        type: "STAT_MOD",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                projectileCount: 1, // Additive +1
                damageMult: -0.20   // Additive -20%
            }
        }
    },
    "CARD_PIERCE": {
        id: "CARD_PIERCE",
        name: "Pierce",
        description: "Passes through 2 enemies. No explosion on pass.",
        icon: "ui/icons/cards/pierce.png",
        tier: "UNCOMMON",
        rarity: "RARE",
        cost: 2,
        type: "HYBRID",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                pierceCount: 2,
            },
            flags: ['NO_EXPLOSION_ON_PASS']
        }
    },
    "CARD_TRIPLE_FORK": {
        id: "CARD_TRIPLE_FORK",
        name: "Triple Fork",
        description: "Fires 3 projectiles in a wide cone. Reduced damage and speed.",
        icon: "ui/icons/cards/triple_fork.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 3,
        type: "STAT_MOD",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                projectileCount: 2, // +2 = 3 Total
                damageMult: -0.35,
                projectileSpeedMult: -0.10,
                spreadDegrees: 45 // New!
            }
        }
    },
    "CARD_ORBITING_ORBS": {
        id: "CARD_ORBITING_ORBS",
        name: "Orbiting Orbs",
        description: "Projectiles orbit the caster before firing outward.",
        icon: "ui/icons/cards/orbit.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 4,
        type: "HYBRID",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                orbitRadius: 2.5,
                orbitSpeed: 0.1,
                projectileSpeedMult: -0.3
            },
            flags: ['ORBIT_CASTER']
        }
    },
    "CARD_HOMING_DRIFT": {
        id: "CARD_HOMING_DRIFT",
        name: "Homing Drift",
        description: "Projectiles lightly home in on enemies.",
        icon: "ui/icons/cards/homing.png",
        tier: "UNCOMMON",
        rarity: "RARE",
        cost: 2,
        type: "HYBRID",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                homingStrength: 0.05,
                damageMult: -0.20,
                projectileSpeedMult: -0.15
            },
            flags: ['HOMING']
        }
    },
    "CARD_TUNNEL_SHOT": {
        id: "CARD_TUNNEL_SHOT",
        name: "Tunnel Shot",
        description: "Massive projectiles that move slower.",
        icon: "ui/icons/cards/tunnel.png",
        tier: "RARE",
        rarity: "LEGENDARY",
        cost: 3,
        type: "STAT_MOD",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                projectileScale: 2.0,
                projectileSpeedMult: -0.20,
                manaCostMult: 0.10
            }
        }
    },
    "CARD_BEAM_CHANNEL": {
        id: "CARD_BEAM_CHANNEL",
        name: "Beam Channel",
        description: "Converts projectile into a channeled beam.",
        icon: "ui/icons/cards/beam.png",
        tier: "LEGENDARY",
        rarity: "MYTHIC",
        cost: 5,
        type: "FLAG",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            flags: ['BEAM', 'CONSUME_STATUS'] // imply channel drain?
        },
        tradeoffs: {
            stats: {
                durationMult: -0.5 // Beam ticks faster or lasts less? 
            }
        }
    },
    "CARD_SPLIT": {
        id: "CARD_SPLIT",
        name: "Split",
        description: "Splits on impact.",
        icon: "ui/icons/cards/split.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 3,
        type: "HYBRID",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: {
                splitCount: 2
            },
            flags: ['SPLIT_ON_IMPACT']
        }
    },
    "CARD_NOVA": {
        id: "CARD_NOVA",
        name: "Nova",
        description: "Explodes in area.",
        icon: "ui/icons/cards/nova.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 2,
        type: "HYBRID",
        requires: {
            kinds: ['PROJECTILE', 'AOE']
        },
        grants: {
            stats: {
                explosionRadiusFlat: 1.5,
            },
            flags: ['EXPLODE_ON_DEATH']
        }
    },
    "CARD_COMBUSTION": {
        id: "CARD_COMBUSTION",
        name: "Combustion",
        description: "Ignite ground on impact.",
        icon: "ui/icons/cards/combustion.png",
        tier: "UNCOMMON",
        rarity: "RARE",
        cost: 2,
        type: "FLAG",
        grants: {
            flags: ['SPAWN_FIELD_ON_IMPACT'],
            triggers: [{
                when: 'ON_HIT',
                effect: { type: 'SPAWN_FIELD', data: { fieldType: 'FIRE_ZONE', duration: 120 } }
            }]
        }
    },
    "CARD_CHAIN_REACTION": {
        id: "CARD_CHAIN_REACTION",
        name: "Chain Reaction",
        description: "Triggers secondary explosion.",
        icon: "ui/icons/cards/chain_reaction.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 3,
        type: "FLAG",
        requires: {
            kinds: ['AOE', 'PROJECTILE']
        },
        grants: {
            flags: ['SECONDARY_EXPLOSION'],
            triggers: [{
                when: 'ON_KILL', // or on hit? user spec said "delayed second blast"
                effect: { type: 'AFTERSHOCK', data: { delay: 15, damageMult: 0.5 } }
            }]
        }
    },
    "CARD_EXPANDED_RADIUS": {
        id: "CARD_EXPANDED_RADIUS",
        name: "Expanded Radius",
        description: "Increases explosion radius by 50%.",
        icon: "ui/icons/cards/expanded_radius.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 1,
        type: "STAT_MOD",
        requires: {
            kinds: ['AOE', 'PROJECTILE']
        },
        grants: {
            stats: {
                aoeRadiusMult: 0.50,
                damageMult: -0.20
            }
        }
    },

    // --- ROW B: EXPLOSION / AOE ---
    "CARD_FOCUSED_BLAST": {
        id: "CARD_FOCUSED_BLAST",
        name: "Focused Blast",
        description: "Explosion radius -30%, Damage +50%.",
        icon: "ui/icons/cards/focused_blast.png",
        tier: "UNCOMMON",
        rarity: "RARE",
        cost: 2,
        type: "STAT_MOD",
        requires: {
            kinds: ['AOE', 'PROJECTILE']
        },
        grants: {
            stats: {
                aoeRadiusMult: -0.30,
                damageMult: 0.50
            }
        }
    },
    "CARD_RING_BURST": {
        id: "CARD_RING_BURST",
        name: "Ring Burst",
        description: "Explosion is a ring. Inner area safe.",
        icon: "ui/icons/cards/ring_burst.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 2,
        type: "HYBRID",
        requires: {
            kinds: ['AOE']
        },
        grants: {
            flags: ['AOE_SHAPE_RING'],
            stats: {
                aoeRadiusMult: 0.25
            }
        }
    },
    "CARD_CONE_SPREAD": {
        id: "CARD_CONE_SPREAD",
        name: "Cone Spread",
        description: "Explosion directed in a cone.",
        icon: "ui/icons/cards/cone_spread.png",
        tier: "UNCOMMON",
        rarity: "RARE",
        cost: 1,
        type: "FLAG",
        requires: {
            kinds: ['AOE']
        },
        grants: {
            flags: ['AOE_SHAPE_CONE']
        }
    },
    "CARD_LINGERING_FIELD": {
        id: "CARD_LINGERING_FIELD",
        name: "Lingering Field",
        description: "Leaves a damaging field for 3s.",
        icon: "ui/icons/cards/lingering_field.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 3,
        type: "FLAG",
        grants: {
            flags: ['SPAWN_FIELD_ON_EXPLOSION']
        }
    },
    "CARD_CLUSTER_BURST": {
        id: "CARD_CLUSTER_BURST",
        name: "Cluster Burst",
        description: "Spawns 3 mini-bombs after explosion.",
        icon: "ui/icons/cards/cluster_burst.png",
        tier: "LEGENDARY",
        rarity: "MYTHIC",
        cost: 4,
        type: "FLAG",
        grants: {
            flags: ['CLUSTER_BOMBS']
        }
    },

    // --- ROW C: CAST METHOD ---
    "CARD_RAPID_FIRE": {
        id: "CARD_RAPID_FIRE",
        name: "Rapid Fire",
        description: "Rate of Fire +50%, Damage -30%.",
        icon: "ui/icons/cards/rapid_fire.png",
        tier: "UNCOMMON",
        rarity: "UNCOMMON",
        cost: 2,
        type: "STAT_MOD",
        grants: {
            stats: {
                cooldownMult: -0.5,
                damageMult: -0.3
            }
        }
    },
    "CARD_HEAVY_CAST": {
        id: "CARD_HEAVY_CAST",
        name: "Heavy Cast",
        description: "Damage +100%, Cast Time/CD +100%.",
        icon: "ui/icons/cards/heavy_cast.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 3,
        type: "STAT_MOD",
        grants: {
            stats: {
                damageMult: 1.0,
                castTimeMult: 1.0,
                cooldownMult: 1.0
            }
        }
    },
    "CARD_BURST_FIRE": {
        id: "CARD_BURST_FIRE",
        name: "Burst Fire",
        description: "Fires 3 shots in rapid succession.",
        icon: "ui/icons/cards/burst_fire.png",
        tier: "LEGENDARY",
        rarity: "LEGENDARY",
        cost: 4,
        type: "FLAG",
        grants: {
            flags: ['BURST_CAST', 'MULTI_CAST']
        }
    },
    "CARD_SPELL_ECHO": {
        id: "CARD_SPELL_ECHO",
        name: "Spell Echo",
        description: "Repeats cast after 0.5s.",
        icon: "ui/icons/cards/spell_echo.png",
        tier: "MYTHIC",
        rarity: "MYTHIC",
        cost: 5,
        type: "FLAG",
        grants: {
            flags: ['SPELL_ECHO']
        }
    },

    // --- ROW D: UTILITY & CONTROL ---
    "CARD_SIPHON_MANA": {
        id: "CARD_SIPHON_MANA",
        name: "Siphon Mana",
        description: "+1 Mana on Hit.",
        icon: "ui/icons/cards/siphon_mana.png",
        tier: "COMMON",
        rarity: "COMMON",
        cost: 2,
        type: "STAT_MOD",
        grants: {
            stats: { manaOnHit: 1 }
        }
    },
    "CARD_PIERCING_SHOT": {
        id: "CARD_PIERCING_SHOT",
        name: "Piercing Shot",
        description: "Projectiles pierce +1 enemy.",
        icon: "ui/icons/cards/piercing_shot.png",
        tier: "UNCOMMON",
        rarity: "UNCOMMON",
        cost: 3,
        type: "STAT_MOD",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: { pierceCount: 1 }
        }
    },
    "CARD_ESSENCE_SHIELD": {
        id: "CARD_ESSENCE_SHIELD",
        name: "Essence Shield",
        description: "Gain +5 Shield on cast.",
        icon: "ui/icons/cards/essence_shield.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 4,
        type: "STAT_MOD",
        grants: {
            stats: { shieldOnCast: 5 }
        }
    },
    "CARD_RICOCHET": {
        id: "CARD_RICOCHET",
        name: "Ricochet",
        description: "Projectiles bounce +1 time.",
        icon: "ui/icons/cards/ricochet.png",
        tier: "EPIC",
        rarity: "EPIC",
        cost: 4,
        type: "STAT_MOD",
        requires: {
            kinds: ['PROJECTILE']
        },
        grants: {
            stats: { bounceCount: 1 }
        }
    },
    "CARD_GRAVITY_BIND": {
        id: "CARD_GRAVITY_BIND",
        name: "Gravity Bind",
        description: "Pull enemies towards impacts.",
        icon: "ui/icons/cards/gravity_bind.png",
        tier: "LEGENDARY",
        rarity: "LEGENDARY",
        cost: 6,
        type: "STAT_MOD",
        grants: {
            stats: { gravityForce: 0.1 }
        }
    },

    // --- ROW E: DEFENSE & SURVIVABILITY ---
    "CARD_STONE_SKIN": {
        id: "CARD_STONE_SKIN",
        name: "Stone Skin",
        description: "Gain 3s of 50% Damage Reduction on cast.",
        icon: "ui/icons/cards/stone_skin.png",
        tier: "COMMON",
        rarity: "COMMON",
        cost: 3,
        type: "BUFF",
        grants: {
            buffs: {
                stoneskin: { duration: 3, armorMult: 0.5 } // 50% reduction? Need to verify armor math
            }
        }
    },
    "CARD_THORNS": {
        id: "CARD_THORNS",
        name: "Thorns",
        description: "Gain 5s of Thorns (Reflect Damage) on cast.",
        icon: "ui/icons/cards/thorns.png",
        tier: "UNCOMMON",
        rarity: "UNCOMMON",
        cost: 3,
        type: "BUFF",
        grants: {
            buffs: {
                thorns: { duration: 5, reflectMult: 0.5 }
            }
        }
    },
    "CARD_DEFLECTION": {
        id: "CARD_DEFLECTION",
        name: "Deflection",
        description: "Gain 3s of 50% Dodge Chance on cast.",
        icon: "ui/icons/cards/deflection.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 4,
        type: "BUFF",
        grants: {
            buffs: {
                deflection: { duration: 3, dodgeMult: 0.5 }
            }
        }
    },
    "CARD_VAMPIRISM": {
        id: "CARD_VAMPIRISM",
        name: "Vampirism",
        description: "Spell gains +10% Life Steal.",
        icon: "ui/icons/cards/vampirism.png",
        tier: "EPIC",
        rarity: "EPIC",
        cost: 5,
        type: "BUFF",
        grants: {
            buffs: {
                vampirism: { lifestealMult: 0.1 }
            }
        }
    },

    // --- ROW F: HIGH RISK / SPECIAL ---
    "CARD_BLOOD_MAGIC": {
        id: "CARD_BLOOD_MAGIC",
        name: "Blood Magic",
        description: "Spells cost Health instead of Mana.",
        icon: "ui/icons/cards/blood_magic.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 4,
        type: "FLAG",
        grants: {
            flags: ['COST_HP', 'REDUCE_MAX_HP'] // Use HP Cost flag
        }
    },
    "CARD_OVERLOAD": {
        id: "CARD_OVERLOAD",
        name: "Overload",
        description: "+50% Damage, but take 10 dmg on cast.",
        icon: "ui/icons/cards/overload.png",
        tier: "RARE",
        rarity: "RARE",
        cost: 3,
        type: "STAT_MOD",
        grants: {
            stats: {
                damageMult: 0.5,
                selfDamageOnCast: 10
            }
        }
    },
    "CARD_GLASS_CANNON": {
        id: "CARD_GLASS_CANNON",
        name: "Glass Cannon",
        description: "+100% Damage, -50% Max HP.",
        icon: "ui/icons/cards/glass_cannon.png",
        tier: "LEGENDARY",
        rarity: "MYTHIC",
        cost: 6,
        type: "HYBRID",
        grants: {
            stats: { damageMult: 1.0 },
            flags: ['REDUCE_MAX_HP'] // Handled as flag for now, or implicit? User spec said "REDUCE_MAX_HP (50%)"
        }
    },

    // --- ROW 3: TRANSFORMATIONS ---
    "CARD_WOLF_FORM": {
        id: "CARD_WOLF_FORM",
        name: "Wolf Form",
        description: "Transform into a Wolf. High Speed, Melee Only.",
        icon: "ui/icons/cards/wolf_form.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 5,
        type: "TRANSFORM",
        grants: {
            transform: {
                form: 'WOLF',
                moveset: 'MELEE_CLAW'
            }
        }
    },
    "CARD_BEAR_FORM": {
        id: "CARD_BEAR_FORM",
        name: "Bear Form",
        description: "Transform into a Bear. Tanky, Slow.",
        icon: "ui/icons/cards/bear_form.png",
        tier: "EPIC",
        rarity: "LEGENDARY",
        cost: 5,
        type: "TRANSFORM",
        grants: {
            transform: {
                form: 'BEAR',
                moveset: 'MELEE_SLAM'
            }
        }
    },
    "CARD_SHADOW_FORM": {
        id: "CARD_SHADOW_FORM",
        name: "Shadow Form",
        description: "Become Ethereal. Move through units.",
        icon: "ui/icons/cards/shadow_form.png",
        tier: "LEGENDARY",
        rarity: "MYTHIC",
        cost: 6,
        type: "TRANSFORM",
        grants: {
            transform: {
                form: 'SHADOW',
                moveset: 'SPELL_CASTER'
            }
        }
    }
};
