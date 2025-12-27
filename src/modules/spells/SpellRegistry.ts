
import { SpellType } from '../../types';

export interface SpellBaseStats {
    baseDamage: number;
    damagePerLevel: number;
    critChance: number;
    critMultiplier: number;
    projectileSpeed: number;
    projectileLifetime: number;
    aoeRadius: number;
    beamWidth: number;
    beamTickInterval: number;
    duration: number;
    manaCost: number;
    cooldown: number;
    castTime: number;
    channelDrainPerSecond: number;
    maxTargets: number;
}

export interface SpellGeometry {
    projectileCount: number;
    projectileSpreadDegrees: number;
    usesGravity: boolean;
    arcHeight: number;
    aoeShape: 'circle' | 'line' | 'cone' | 'rect';
    lineLength: number;
    lineWidth: number;
    orbitRadius: number;
    orbitDuration: number;
    homingStrength: number;
    canRicochet: boolean;
    maxRicochets: number;
}

export interface SpellTargeting {
    targetingMode: 'cursor' | 'direction' | 'selfCentered' | 'lockedTarget';
    requiresLineOfSight: boolean;
    canHitAllies: boolean;
    canHitCaster: boolean;
    maxPenetrations: number;
    chainRange: number;
    chainMaxJumps: number;
}

export interface SpellStatus {
    appliesBurn: boolean;
    appliesSlow: boolean;
    appliesFreeze: boolean;
    appliesShock: boolean;
    appliesPoison: boolean;
    appliesRoot: boolean;
    appliesBlind: boolean;
    appliesMark: boolean;
    statusIntensity: number;
    executionThreshold: number;
}

export interface SpellResource {
    usesMana: boolean;
    usesHealth: boolean;
    healthCostPercent: number;
    chargesMax: number;
    chargeRegenTime: number;
    tags: string[];
}

export interface SpellTalentFlags {
    enableChargeCast: boolean;
    enableGapCloser: boolean;
    enableAftershock: boolean;
    enableOrbiting: boolean;
    enableDetonateOnKill: boolean;
    enableConvertAoEToField: boolean;
    enableChain: boolean;
    enablePierce: boolean;
    enableRicochet: boolean;
}

export interface SpellSocketConfig {
    maxCardSlots: number;
    allowedRows: number[];
    allowedCardTypes: string[];
    defaultCards: string[];
}

export interface SpellAnimation {
    primaryColor: string;
    secondaryColor: string;
    highlightColor: string;
    shadowColor: string;
    shapeLanguage: string;
    castPose: string;
    motionStyle: string;
    particleTypes: string[];
    trailStyle: string;
    impactStyle: string;
    screenShake: string;
    soundNotes: string;
    vfxCastKey: string;
    vfxImpactKey: string;
    vfxAoeIndicatorKey: string;
}

export interface SpellUI {
    iconId: string;
    shortLabel: string;
    description: string;
    lore: string;
    categoryLabel: string;
}

export interface SpellUnlock {
    requiredLevel: number;
    requiresQuestId: string;
    requiresSpellId: string;
    goldCost: number;
    spellPointCost?: number;
    trainerId: string;
}

export interface SpellDefinition {
    id: string; // This should match SpellType
    name: string;
    school: 'FIRE' | 'ICE' | 'LIGHTNING' | 'EARTH' | 'WIND' | 'ARCANE' | 'NATURE' | 'PHYSICAL' | 'UTILITY' | 'WEAPON';
    archetype: string;
    spellKey: string;
    behaviorKey: string;
    behaviorFile: string;
    hotbarType: 'ACTIVE' | 'PASSIVE' | 'CHANNEL' | 'AURA' | 'DASH' | 'MELEE';
    spellType: 'Projectile' | 'AoE' | 'Field' | 'Beam' | 'Dash' | 'Melee' | 'Aura' | 'Totem' | 'Wave';
    baseStats: SpellBaseStats;
    geometry: SpellGeometry;
    targeting: SpellTargeting;
    status: SpellStatus;
    resource: SpellResource;
    talentFlags: SpellTalentFlags;
    socketConfig: SpellSocketConfig;
    animation: SpellAnimation;
    ui: SpellUI;
    unlock: SpellUnlock;
    data?: any;

    // --- DATA DRIVEN VISUALS (NEW) ---
    visualLayers?: SpellVisualLayer[];
    particleEmitters?: SpellParticleEmitter[];
    timing?: SpellTiming;
    skeletalAnimation?: SpellSkeletalAnimation;
    ik?: SpellIK;
    movement?: SpellMovement;
    hitReaction?: SpellHitReaction;
}

export interface SpellVisualLayer {
    id: string;
    sprite: string;
    blendMode: 'NORMAL' | 'ADDITIVE' | 'MULTIPLY';
    scaleCurve?: 'linear' | 'easeOut' | 'pulse' | 'constant';
    alphaCurve?: 'fade' | 'popFade' | 'constant';
    rotationBehavior?: 'none' | 'spin' | 'random' | 'wobble';
    tint?: string;
    pulseRate?: number;
}

export interface SpellParticleEmitter {
    id: string;
    sprite: string;
    emitOn: 'cast' | 'travel' | 'hit' | 'expire';
    spawnRate: number; // per second
    lifetime: number; // ms
    velocityRange: { min: number, max: number };
    gravity: number;
    drag: number;
    sizeCurve: { start: number, end: number };
    colorOverLife?: { start: string, end: string };
    randomRotation?: boolean;
}

export interface SpellTiming {
    castWindupTime: number; // ms
    releaseTime: number; // ms - when projectile spawns
    travelDuration?: number; // ms - for non-projectiles
    impactDelay?: number; // ms
    lingerTime?: number; // ms
    cooldownLockTime?: number; // ms
    screenShakeIntensity?: number;
    hitPauseFrames?: number;
}

export interface SpellSkeletalAnimation {
    usesTorso?: boolean;
    usesHead?: boolean;
    usesArms?: boolean;
    usesLegs?: boolean;
    spawnOffset?: { x: number, y: number };
    handGlowOffset?: number;
    boneMotionProfiles?: Record<string, BoneMotionProfile>;
}

export interface BoneMotionProfile {
    rotationOffset?: number;
    rotationCurve?: 'linear' | 'easeOut' | 'elastic';
    positionOffset?: { x: number, y: number };
    recoilAmount?: number;
    returnSpeed?: number;
}

export interface SpellIK {
    useIK: boolean;
    chain?: 'arm_right' | 'arm_left' | 'both';
    target: 'cursor' | 'enemy' | 'fixed';
    clampAngle?: number;
    smoothing?: number;
}

export interface SpellMovement {
    locksMovement: boolean;
    movementMultiplier: number;
    allowsRotation: boolean;
    dashDistance?: number;
    dashCurve?: 'linear' | 'easeIn' | 'easeOut';
}

export interface SpellHitReaction {
    flashColor?: string;
    flashDuration?: number;
    spawnVfxKey?: string;
    decal?: string;
    screenShakeOnHit?: number;
}


export const SPELL_REGISTRY: Record<string, SpellDefinition> = {
    "GRAVITY_WELL": {
        "id": "GRAVITY_WELL",
        "name": "Gravity Well",
        "school": "ARCANE",
        "archetype": "AREA_EFFECT",
        "spellKey": "GRAVITY_WELL",
        "behaviorKey": "GravityWellBehavior",
        "behaviorFile": "modules/spells/behaviors/GravityWellBehavior.ts",
        "hotbarType": "ACTIVE",
        "spellType": "AoE",
        "baseStats": {
            "baseDamage": 2,
            "damagePerLevel": 1,
            "critChance": 0,
            "critMultiplier": 1,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 5,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 3000,
            "manaCost": 25,
            "cooldown": 10,
            "castTime": 0.5,
            "channelDrainPerSecond": 0,
            "maxTargets": 10
        },
        "geometry": {
            "projectileCount": 0,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "cursor",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": true,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 0.3,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 10,
            "tags": []
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": true,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 2,
            "allowedRows": [
                1
            ],
            "allowedCardTypes": [
                "AoE",
                "Utility"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#8b5cf6",
            "secondaryColor": "#c4b5fd",
            "highlightColor": "#ffffff",
            "shadowColor": "#4c1d95",
            "shapeLanguage": "circle",
            "castPose": "cast_aoe",
            "motionStyle": "implode",
            "particleTypes": [
                "sparkle",
                "void"
            ],
            "trailStyle": "none",
            "impactStyle": "implode",
            "screenShake": "low",
            "soundNotes": "suction_loop",
            "vfxCastKey": "cast_arcane",
            "vfxImpactKey": "impact_void",
            "vfxAoeIndicatorKey": "area_void"
        },
        "ui": {
            "iconId": "gravity_well",
            "shortLabel": "Grav Well",
            "description": "Create a singularity that pulls enemies in.",
            "lore": "The fabric of space bends to your will.",
            "categoryLabel": "Control"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "data": {
            "scaleOverride": 1,
            "rotationOffset": 0,
            "originOffset": {
                "x": 0,
                "y": -0.5
            }
        },
        "skeletalAnimation": {
            "handGlowOffset": 20
        }
    },
    "FIRE_FIREBALL": {
        "id": "FIRE_FIREBALL",
        "name": "Fireball",
        "school": "FIRE",
        "archetype": "PROJECTILE_BASIC",
        "spellKey": "FIRE_FIREBALL",
        "behaviorKey": "FireballBehavior",
        "behaviorFile": "modules/spells/behaviors/Fireball.ts",
        "hotbarType": "ACTIVE",
        "spellType": "Projectile",
        "baseStats": {
            "baseDamage": 14,
            "damagePerLevel": 5,
            "critChance": 0.1,
            "critMultiplier": 2,
            "projectileSpeed": 12.5,
            "projectileLifetime": 3,
            "aoeRadius": 1.5,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 0,
            "manaCost": 10,
            "cooldown": 0.4,
            "castTime": 0.309,
            "channelDrainPerSecond": 0,
            "maxTargets": 1
        },
        "geometry": {
            "projectileCount": 1,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "direction",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": true,
            "appliesSlow": false,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 1,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "fire",
                "projectile"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": true,
            "enableOrbiting": false,
            "enableDetonateOnKill": true,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": true,
            "enableRicochet": true
        },
        "socketConfig": {
            "maxCardSlots": 3,
            "allowedRows": [
                1,
                2
            ],
            "allowedCardTypes": [
                "ProjectileModifier",
                "Trigger"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#FF4500",
            "secondaryColor": "#FFA500",
            "highlightColor": "#FFFFFF",
            "shadowColor": "#B8860B",
            "shapeLanguage": "zigzag",
            "castPose": "channel_raise",
            "motionStyle": "jitter",
            "particleTypes": [
                "spark"
            ],
            "trailStyle": "electric",
            "impactStyle": "flash",
            "screenShake": "low",
            "soundNotes": "buzz",
            "vfxCastKey": "CAST_LIGHTNING_BEAM",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "fireball_icon_01",
            "shortLabel": "Fireball",
            "description": "Launches a ball of fire that explodes on impact.",
            "lore": "Classic.",
            "categoryLabel": "Fire"
        },
        "unlock": {
            "requiredLevel": 0,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "visualLayers": [
            {
                "id": "core",
                "sprite": "vfx/fireball_core.png",
                "blendMode": "ADDITIVE",
                "scaleCurve": "pulse",
                "alphaCurve": "constant",
                "tint": "#ffb700",
                "rotationBehavior": "random"
            },
            {
                "id": "glow",
                "sprite": "vfx/glow_soft.png",
                "blendMode": "ADDITIVE",
                "scaleCurve": "constant",
                "tint": "#ff4500",
                "pulseRate": 0.2
            }
        ],
        "particleEmitters": [
            {
                "id": "trail_smoke",
                "sprite": "vfx/smoke_puff.png",
                "emitOn": "travel",
                "spawnRate": 30,
                "lifetime": 500,
                "velocityRange": {
                    "min": 0.2,
                    "max": 0.5
                },
                "gravity": -0.5,
                "drag": 0.95,
                "sizeCurve": {
                    "start": 0.5,
                    "end": 0
                },
                "colorOverLife": {
                    "start": "#555555",
                    "end": "#000000"
                },
                "randomRotation": true
            },
            {
                "id": "trail_sparks",
                "sprite": "vfx/pixel_dot.png",
                "emitOn": "travel",
                "spawnRate": 15,
                "lifetime": 300,
                "velocityRange": {
                    "min": 1,
                    "max": 2
                },
                "gravity": 0,
                "drag": 0.9,
                "sizeCurve": {
                    "start": 1,
                    "end": 0
                },
                "colorOverLife": {
                    "start": "#ffff00",
                    "end": "#ff0000"
                }
            }
        ],
        "timing": {
            "castWindupTime": 100,
            "releaseTime": 0,
            "screenShakeIntensity": 2
        },
        "skeletalAnimation": {
            "usesArms": true,
            "usesTorso": true,
            "boneMotionProfiles": {
                "arms": {
                    "recoilAmount": 8,
                    "returnSpeed": 0.15,
                    "rotationOffset": -0.2
                },
                "torso": {
                    "rotationOffset": -0.1,
                    "returnSpeed": 0.1
                }
            },
            "handGlowOffset": 20
        },
        "hitReaction": {
            "flashColor": "#ffffff",
            "flashDuration": 100,
            "spawnVfxKey": "EXP_FIRE_SMALL",
            "screenShakeOnHit": 5
        },
        "data": {
            "originOffset": {
                "x": 0,
                "y": -0.5
            },
            "scaleOverride": 1.25,
            "rotationOffset": 0,
            "homingStrength": 0.05,
            "trailWidth": 0,
            "emberOnKill": true
        },
        "movement": {
            "locksMovement": false,
            "movementMultiplier": 1,
            "allowsRotation": true
        }
    },
    "ICE_BLIZZARD": {
        "id": "ICE_BLIZZARD",
        "name": "Blizzard",
        "school": "ICE",
        "archetype": "AREA_EFFECT",
        "spellKey": "ICE_BLIZZARD",
        "behaviorKey": "BlizzardBehavior",
        "behaviorFile": "modules/spells/behaviors/BlizzardBehavior.ts",
        "hotbarType": "ACTIVE",
        "spellType": "AoE",
        "baseStats": {
            "baseDamage": 5,
            "damagePerLevel": 2,
            "critChance": 0.05,
            "critMultiplier": 1.5,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 3.5,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 6000,
            "manaCost": 35,
            "cooldown": 12,
            "castTime": 0.8,
            "channelDrainPerSecond": 0,
            "maxTargets": 20
        },
        "geometry": {
            "projectileCount": 0,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "cursor",
            "requiresLineOfSight": false,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": true,
            "appliesFreeze": true,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 0.4,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "ice",
                "aoe",
                "duration"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": true,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 2,
            "allowedRows": [
                1
            ],
            "allowedCardTypes": [
                "AoE",
                "Duration",
                "Utility"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#00BFFF",
            "secondaryColor": "#E0FFFF",
            "highlightColor": "#FFFFFF",
            "shadowColor": "#1E90FF",
            "shapeLanguage": "circle",
            "castPose": "cast_aoe",
            "motionStyle": "swirl",
            "particleTypes": [
                "snow",
                "fog"
            ],
            "trailStyle": "none",
            "impactStyle": "freeze",
            "screenShake": "low",
            "soundNotes": "wind_loop",
            "vfxCastKey": "cast_ice",
            "vfxImpactKey": "impact_ice",
            "vfxAoeIndicatorKey": "area_ice"
        },
        "ui": {
            "iconId": "blizzard_storm",
            "shortLabel": "Blizzard",
            "description": "Summons a massive ice storm that chills and slows enemies.",
            "lore": "Winter is coming.",
            "categoryLabel": "Ice"
        },
        "unlock": {
            "requiredLevel": 5,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        }
    },
    "FIRE_DETONATE": {
        "id": "FIRE_DETONATE",
        "name": "Detonate",
        "school": "FIRE",
        "archetype": "INSTANT_BURST",
        "spellKey": "FIRE_DETONATE",
        "behaviorKey": "DetonateBehavior",
        "behaviorFile": "modules/spells/behaviors/DetonateBehavior.ts",
        "hotbarType": "ACTIVE",
        "spellType": "Projectile",
        "baseStats": {
            "baseDamage": 100,
            "damagePerLevel": 15,
            "critChance": 0.2,
            "critMultiplier": 2.5,
            "projectileSpeed": 60,
            "projectileLifetime": 1,
            "aoeRadius": 2,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 0,
            "manaCost": 15,
            "cooldown": 4,
            "castTime": 0,
            "channelDrainPerSecond": 0,
            "maxTargets": 1
        },
        "geometry": {
            "projectileCount": 1,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 10,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "lockedTarget",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": false,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 0,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "fire",
                "burst",
                "finisher"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": true,
            "enableOrbiting": false,
            "enableDetonateOnKill": true,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 2,
            "allowedRows": [
                1
            ],
            "allowedCardTypes": [
                "Trigger"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#ff0000",
            "secondaryColor": "#ff4400",
            "highlightColor": "#ffff00",
            "shadowColor": "#440000",
            "shapeLanguage": "spike",
            "castPose": "cast_fireball",
            "motionStyle": "instant",
            "particleTypes": [
                "fire"
            ],
            "trailStyle": "none",
            "impactStyle": "explosion",
            "screenShake": "medium",
            "soundNotes": "snap",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/detonate_icon.png",
            "shortLabel": "Detonate",
            "description": "Consumes Burn from the target to deal massive damage.",
            "lore": "Combustion perfected.",
            "categoryLabel": "Fire Finisher"
        },
        "unlock": {
            "requiredLevel": 2,
            "requiresQuestId": "",
            "requiresSpellId": "FIRE_FIREBALL",
            "goldCost": 0,
            "trainerId": ""
        }
    },
    "ICE_FROST_PULSE": {
        "id": "ICE_FROST_PULSE",
        "name": "Frost Pulse",
        "school": "ICE",
        "archetype": "PROJECTILE_BASIC",
        "spellKey": "ICE_FROST_PULSE",
        "behaviorKey": "FrostPulseBehavior",
        "behaviorFile": "modules/spells/behaviors/FrostPulseBehavior.ts",
        "hotbarType": "ACTIVE",
        "spellType": "Projectile",
        "baseStats": {
            "baseDamage": 14,
            "damagePerLevel": 8,
            "critChance": 0.15,
            "critMultiplier": 2,
            "projectileSpeed": 0.4,
            "projectileLifetime": 3,
            "aoeRadius": 1.5,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 0,
            "manaCost": 12,
            "cooldown": 0,
            "castTime": 0.45,
            "channelDrainPerSecond": 0,
            "maxTargets": 1
        },
        "geometry": {
            "projectileCount": 1,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "direction",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 99,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": true,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 0.5,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "ice",
                "projectile",
                "slow"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": true,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 3,
            "allowedRows": [
                1,
                2
            ],
            "allowedCardTypes": [
                "ProjectileModifier",
                "Trigger"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#00bfff",
            "secondaryColor": "#ffffff",
            "highlightColor": "#e0ffff",
            "shadowColor": "#0088cc",
            "shapeLanguage": "arc",
            "castPose": "two_hand_cast",
            "motionStyle": "linear",
            "particleTypes": [
                "ice_sparkle"
            ],
            "trailStyle": "mist",
            "impactStyle": "shatter",
            "screenShake": "none",
            "soundNotes": "chill",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/frost_pulse_icon.png",
            "shortLabel": "Frost Pulse",
            "description": "Fires a slow moving wave of frost that chills enemies.",
            "lore": "Winter's breath.",
            "categoryLabel": "Ice Utility"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "visualLayers": [
            {
                "id": "arc",
                "sprite": "/vfx/frost_pulse_wave.png",
                "blendMode": "NORMAL",
                "scaleCurve": "constant",
                "alphaCurve": "constant",
                "rotationBehavior": "none",
                "tint": "#ffffff"
            }
        ],
        "data": {
            "scaleOverride": 0.1,
            "rotationOffset": 1.9198621771937625,
            "originOffset": {
                "x": 0,
                "y": -1.15
            }
        },
        "skeletalAnimation": {
            "handGlowOffset": 20
        }
    },
    "ARCANE_PORTAL": {
        "id": "ARCANE_PORTAL",
        "name": "Arcane Portals",
        "school": "ARCANE",
        "archetype": "UTILITY_AOE",
        "spellKey": "ARCANE_PORTAL",
        "spellType": "AoE",
        "behaviorKey": "PortalBehavior",
        "behaviorFile": "modules/spells/behaviors/PortalBehavior.ts",
        "hotbarType": "ACTIVE",
        "baseStats": {
            "baseDamage": 0,
            "damagePerLevel": 0,
            "critChance": 0,
            "critMultiplier": 1,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 1,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 12,
            "manaCost": 30,
            "cooldown": 6,
            "castTime": 0.5,
            "channelDrainPerSecond": 0,
            "maxTargets": 1
        },
        "targeting": {
            "targetingMode": "cursor",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "geometry": {
            "projectileCount": 0,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": false,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 0,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "arcane",
                "utility"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 1,
            "allowedRows": [
                1
            ],
            "allowedCardTypes": [
                "Trigger"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#8b5cf6",
            "secondaryColor": "#c084fc",
            "highlightColor": "#ffffff",
            "shadowColor": "#4c1d95",
            "shapeLanguage": "orb",
            "castPose": "arm_forward",
            "motionStyle": "linear",
            "particleTypes": [
                "spark"
            ],
            "trailStyle": "none",
            "impactStyle": "none",
            "screenShake": "none",
            "soundNotes": "warp",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/vfx/arcane_portal.png",
            "shortLabel": "Portal",
            "description": "Create linked portals to teleport instantly.",
            "lore": "Space is merely a suggestion.",
            "categoryLabel": "Arcane Utility"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "skeletalAnimation": {
            "boneMotionProfiles": {
                "arms": {
                    "recoilAmount": 0
                }
            },
            "handGlowOffset": 0,
            "spawnOffset": {
                "x": 0,
                "y": 0
            }
        }
    },
    "LIGHTNING_ARC": {
        "id": "LIGHTNING_ARC",
        "name": "Arc Lightning",
        "school": "LIGHTNING",
        "archetype": "CHANNEL_BEAM",
        "spellKey": "LIGHTNING_ARC",
        "behaviorKey": "ArcLightningBehavior",
        "behaviorFile": "modules/spells/behaviors/ArcLightningBehavior.ts",
        "hotbarType": "CHANNEL",
        "spellType": "Beam",
        "baseStats": {
            "baseDamage": 15,
            "damagePerLevel": 2,
            "critChance": 0.05,
            "critMultiplier": 1.5,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 0,
            "beamWidth": 5,
            "beamTickInterval": 100,
            "duration": 0,
            "manaCost": 15,
            "cooldown": 0,
            "castTime": 0,
            "channelDrainPerSecond": 15,
            "maxTargets": 3
        },
        "geometry": {
            "projectileCount": 0,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "line",
            "lineLength": 8,
            "lineWidth": 1,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 3
        },
        "targeting": {
            "targetingMode": "cursor",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 4,
            "chainMaxJumps": 3
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": false,
            "appliesFreeze": false,
            "appliesShock": true,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 1,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "lightning",
                "channel",
                "chain"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": false,
            "enableChain": true,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 3,
            "allowedRows": [
                1
            ],
            "allowedCardTypes": [
                "Trigger",
                "BeamModifier"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#FDE047",
            "secondaryColor": "#FFFFFF",
            "highlightColor": "#FEF08A",
            "shadowColor": "#CA8A04",
            "shapeLanguage": "zigzag",
            "castPose": "cast_high",
            "motionStyle": "jitter",
            "particleTypes": [
                "spark"
            ],
            "trailStyle": "electric",
            "impactStyle": "spark_burst",
            "screenShake": "none",
            "soundNotes": "electric_hum",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/lightning_arc_icon.png",
            "shortLabel": "Arc Beam",
            "description": "Chains lightning between enemies.",
            "lore": "Ride the lightning.",
            "categoryLabel": "Lightning"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "visualLayers": [],
        "skeletalAnimation": {
            "handGlowOffset": 0
        },
        "data": {
            "coneAngleDeg": 60,
            "channelDurationFrames": 180,
            "tickEveryFrames": 6
        }
    },
    "FROST_BREATH": {
        "id": "FROST_BREATH",
        "name": "Frost Breath",
        "school": "ICE",
        "archetype": "CHANNEL_CONE",
        "spellKey": "FROST_BREATH",
        "behaviorKey": "FrostBreathBehavior",
        "behaviorFile": "modules/spells/behaviors/FrostBreath.ts",
        "hotbarType": "CHANNEL",
        "spellType": "AoE",
        "baseStats": {
            "baseDamage": 2,
            "damagePerLevel": 1,
            "critChance": 0.05,
            "critMultiplier": 1.5,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 8,
            "beamWidth": 0,
            "beamTickInterval": 0.12,
            "duration": 180,
            "manaCost": 8,
            "cooldown": 6,
            "castTime": 0,
            "channelDrainPerSecond": 8,
            "maxTargets": 20
        },
        "geometry": {
            "projectileCount": 0,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "cone",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "direction",
            "requiresLineOfSight": false,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": true,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 1,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 0,
            "chargeRegenTime": 0,
            "tags": [
                "COLD",
                "CONTROL",
                "AOE_TICK",
                "DOT"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 3,
            "allowedRows": [
                1,
                2,
                3
            ],
            "allowedCardTypes": [
                "ANY"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#BFF8FF",
            "secondaryColor": "#63D7FF",
            "highlightColor": "#EAFBFF",
            "shadowColor": "#1E7BFF",
            "shapeLanguage": "cone",
            "castPose": "twohands",
            "motionStyle": "channelling",
            "particleTypes": [
                "frost_mist",
                "snow_specks"
            ],
            "trailStyle": "none",
            "impactStyle": "freeze",
            "screenShake": "none",
            "soundNotes": "soft_hiss",
            "vfxCastKey": "frost_breath_cast",
            "vfxImpactKey": "frost_breath_hit",
            "vfxAoeIndicatorKey": "frost_cone"
        },
        "ui": {
            "iconId": "frost_breath_icon",
            "shortLabel": "Frost Breath",
            "description": "Channel a cone of freezing air that Chills enemies. Chilled enemies freeze solid at 5 stacks.",
            "lore": "The north wind in the palm of your hand.",
            "categoryLabel": "Ice"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": "none"
        },
        "data": {
            "coneAngleDeg": 65,
            "originOffset": {
                "x": 0.5,
                "y": -0.2
            }
        }
    },
    "FIRE_CIRCLE": {
        "id": "FIRE_CIRCLE",
        "name": "Fire Circle",
        "school": "FIRE",
        "archetype": "AOE_GROUND",
        "spellKey": "FIRE_CIRCLE",
        "behaviorKey": "FireCircleBehavior",
        "behaviorFile": "modules/spells/behaviors/FireCircleBehavior.ts",
        "hotbarType": "ACTIVE",
        "spellType": "AoE",
        "baseStats": {
            "baseDamage": 5,
            "damagePerLevel": 1,
            "critChance": 0.05,
            "critMultiplier": 1.5,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 5,
            "duration": 6000,
            "manaCost": 20,
            "cooldown": 8,
            "castTime": 0,
            "maxTargets": 99,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "channelDrainPerSecond": 0
        },
        "geometry": {
            "projectileCount": 0,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 0,
            "orbitDuration": 0,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "cursor",
            "requiresLineOfSight": true,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": true,
            "appliesSlow": false,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 1,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "fire",
                "aoe",
                "ground"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": false,
            "enableDetonateOnKill": false,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 3,
            "allowedRows": [
                1
            ],
            "allowedCardTypes": [
                "Trigger",
                "AreaModifier"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#EF4444",
            "secondaryColor": "#F97316",
            "highlightColor": "#FEF08A",
            "shadowColor": "#7F1D1D",
            "shapeLanguage": "circle",
            "castPose": "cast_low",
            "motionStyle": "impact",
            "particleTypes": [
                "ember"
            ],
            "trailStyle": "none",
            "impactStyle": "burn",
            "screenShake": "medium",
            "soundNotes": "fire_ignition",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/fire_circle_icon.png",
            "shortLabel": "Ring of Fire",
            "description": "Creates a ring of fire that burns enemies. Detonates at 5 stacks.",
            "lore": "Burn, baby, burn.",
            "categoryLabel": "Fire"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "visualLayers": [],
        "skeletalAnimation": {
            "handGlowOffset": 20
        },
        "data": {
            "scaleOverride": 1,
            "rotationOffset": 0,
            "originOffset": {
                "x": 0,
                "y": -1.15
            }
        }
    },
    "EARTH_STONE_SHIELD": {
        "id": "EARTH_STONE_SHIELD",
        "name": "Stone Shield",
        "school": "EARTH",
        "archetype": "BUFF",
        "spellKey": "EARTH_STONE_SHIELD",
        "behaviorKey": "StoneShieldBehavior",
        "behaviorFile": "modules/spells/behaviors/StoneShieldBehavior.ts",
        "hotbarType": "ACTIVE",
        "spellType": "Projectile",
        "baseStats": {
            "baseDamage": 10,
            "damagePerLevel": 2,
            "critChance": 0,
            "critMultiplier": 1,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 0,
            "duration": 15000,
            "manaCost": 30,
            "cooldown": 12,
            "castTime": 0,
            "maxTargets": 3,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "channelDrainPerSecond": 0
        },
        "geometry": {
            "projectileCount": 3,
            "projectileSpreadDegrees": 360,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "circle",
            "lineLength": 0,
            "lineWidth": 0,
            "orbitRadius": 2.5,
            "orbitDuration": 3000,
            "homingStrength": 0,
            "canRicochet": false,
            "maxRicochets": 0
        },
        "targeting": {
            "targetingMode": "selfCentered",
            "requiresLineOfSight": false,
            "canHitAllies": false,
            "canHitCaster": false,
            "maxPenetrations": 0,
            "chainRange": 0,
            "chainMaxJumps": 0
        },
        "status": {
            "appliesBurn": false,
            "appliesSlow": false,
            "appliesFreeze": false,
            "appliesShock": false,
            "appliesPoison": false,
            "appliesRoot": false,
            "appliesBlind": false,
            "appliesMark": false,
            "statusIntensity": 0,
            "executionThreshold": 0
        },
        "resource": {
            "usesMana": true,
            "usesHealth": false,
            "healthCostPercent": 0,
            "chargesMax": 1,
            "chargeRegenTime": 0,
            "tags": [
                "earth",
                "defense",
                "orbit"
            ]
        },
        "talentFlags": {
            "enableChargeCast": false,
            "enableGapCloser": false,
            "enableAftershock": false,
            "enableOrbiting": true,
            "enableDetonateOnKill": true,
            "enableConvertAoEToField": false,
            "enableChain": false,
            "enablePierce": false,
            "enableRicochet": false
        },
        "socketConfig": {
            "maxCardSlots": 3,
            "allowedRows": [
                2
            ],
            "allowedCardTypes": [
                "Duration",
                "Defense"
            ],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#78716c",
            "secondaryColor": "#57534e",
            "highlightColor": "#a8a29e",
            "shadowColor": "#292524",
            "shapeLanguage": "block",
            "castPose": "guard",
            "motionStyle": "solid",
            "particleTypes": [
                "dust",
                "pebbles"
            ],
            "trailStyle": "none",
            "impactStyle": "crumble",
            "screenShake": "small",
            "soundNotes": "earth_rumble",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/stone_shield_icon.png",
            "shortLabel": "Stone Shield",
            "description": "Summon 3 orbiting stones that damage enemies and absorb hits.",
            "lore": "The mountain does not bow.",
            "categoryLabel": "Earth"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "visualLayers": [],
        "skeletalAnimation": {
            "handGlowOffset": 0
        },
        "data": {
            "orbitSpeed": 2
        }
    }
};