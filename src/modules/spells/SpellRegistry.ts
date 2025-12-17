
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
    aoeShape: 'circle' | 'line' | 'cone' | 'rect'; // Added cone/rect for safety
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
    school: 'FIRE' | 'ICE' | 'LIGHTNING' | 'EARTH' | 'WIND' | 'ARCANE' | 'NATURE' | 'PHYSICAL' | 'UTILITY' | 'WEAPON'; // Updated to broader string or union
    archetype: string;
    spellKey: string;
    behaviorKey: string;
    behaviorFile: string;
    hotbarType: 'ACTIVE' | 'PASSIVE' | 'CHANNEL' | 'AURA' | 'DASH' | 'MELEE'; // inferred
    spellType: 'Projectile' | 'AoE' | 'Field' | 'Beam' | 'Dash' | 'Melee' | 'Aura' | 'Totem' | 'Wave'; // inferred
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
    spawnOffset?: { x: number, y: number }; // [NEW] Manual offset for projectile spawn
    handGlowOffset?: number; // Distance from wrist pivot to glow center (VFX anchor)
    boneMotionProfiles?: Record<string, BoneMotionProfile>; // e.g. "arms", "torso"
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
            "projectileSpeed": 15,
            "projectileLifetime": 3,
            "aoeRadius": 1.5,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 0,
            "manaCost": 10,
            "cooldown": 0.5,
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
            "primaryColor": "#FFFF00",
            "secondaryColor": "#FFD700",
            "highlightColor": "#FFFFFF",
            "shadowColor": "#B8860B",
            "shapeLanguage": "zigzag",
            "castPose": "channel_forward",
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
                "y": -1.15
            },
            "scaleOverride": 1,
            "rotationOffset": 0
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
            "castTime": 0.7,
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
            "rotationOffset": 2.5307274153917776,
            "originOffset": {
                "x": 0,
                "y": -1.15
            }
        },
        "skeletalAnimation": {
            "handGlowOffset": 20
        }
    },
    "LIGHTNING_ARC_BEAM": {
        "id": "LIGHTNING_ARC_BEAM",
        "name": "Lightning Arc",
        "school": "LIGHTNING",
        "archetype": "CHANNEL_BEAM",
        "spellKey": "LIGHTNING_ARC_BEAM",
        "behaviorKey": "ArcBehavior",
        "behaviorFile": "modules/spells/behaviors/ArcBehavior.ts",
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
            "primaryColor": "#FFD700",
            "secondaryColor": "#FFFFFF",
            "highlightColor": "#FFFFE0",
            "shadowColor": "#DAA520",
            "shapeLanguage": "jagged",
            "castPose": "two_hand_channel",
            "motionStyle": "jitter",
            "particleTypes": [
                "spark"
            ],
            "trailStyle": "electric",
            "impactStyle": "spark_burst",
            "screenShake": "low",
            "soundNotes": "bzzzt",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/lightning_arc_icon.png",
            "shortLabel": "Arc",
            "description": "Channels a beam of lightning that chains between enemies.",
            "lore": "Unlimited power.",
            "categoryLabel": "Lightning Channel"
        },
        "unlock": {
            "requiredLevel": 1,
            "requiresQuestId": "",
            "requiresSpellId": "",
            "goldCost": 0,
            "trainerId": ""
        },
        "visualLayers": []
    },
    "ARCANE_PORTAL": {
        "id": "ARCANE_PORTAL",
        "name": "Arcane Portals",
        "school": "ARCANE",
        "element": "ARCANE",
        "spellKey": "ARCANE_PORTAL",
        "tags": [
            "UTILITY",
            "TELEPORT"
        ],
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
        "behavior": {
            "type": "MELEE",
            "canCrit": false,
            "pierceCount": 0,
            "chainCount": 0,
            "explodeOnHit": false
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
        "balance": {},
        "vfx": [],
        "sfx": {},
        "hitboxes": [],
        "icon": "/vfx/arcane_portal.png",
        "behaviorKey": "PORTAL_BEHAVIOR",
        "skeletalAnimation": {
            "castAnimation": "cast_spell",
            "boneMotionProfiles": {
                "arms": {
                    "recoilAmount": 0
                }
            },
            "handGlowColor": "#8b5cf6",
            "spawnOffset": {
                "x": 0,
                "y": 0
            }
        }
    },
    "LIGHTNING_ARC_LIGHTNING": {
        "id": "LIGHTNING_ARC_LIGHTNING",
        "name": "Arc Lightning",
        "school": "LIGHTNING",
        "spellKey": "LIGHTNING_ARC_LIGHTNING",
        "spellType": "PROJECTILE",
        "behaviorKey": "ArcLightningBehavior",
        "behaviorFile": "modules/spells/behaviors/ArcLightningBehavior.ts",
        "hotbarType": "ACTIVE",

        "baseStats": {
            "baseDamage": 12,
            "damagePerLevel": 2,
            "critChance": 0.05,
            "critMultiplier": 1.5,
            "projectileSpeed": 0,
            "projectileLifetime": 0,
            "aoeRadius": 0,
            "beamWidth": 0,
            "beamTickInterval": 0,
            "duration": 0,
            "manaCost": 10,
            "cooldown": 0,
            "castTime": 0,
            "channelDrainPerSecond": 0,
            "maxTargets": 3
        },

        "balance": {
            "rangeTiles": 10,
            "maxChains": 3,
            "chainRangeTiles": 4.75,
            "chainFalloff": 0.75,
            "aimConeDeg": 30,
            "shockStacksPerHit": 1,
            "shockStacksPerHit_ArcFocused": 2,
            "shockedChainRangeBonus": 0.15,
            "shock5ExtraJumpEnabled": true,
            "hopDelaySec": 0.045,
            "vfxTotalLifetimeFrames": 8,
            "vfxStaggerFramesPerHop": 2,
            "vfxType": "ARC_LIGHTNING",
            "style": "PIXEL_ZIGZAG",
            "colorProfile": "YELLOW_WHITE_CORE",
            "thickness": 1,
            "bendsMin": 2,
            "bendsMax": 4,
            "branchChance": 0.25
        },

        "geometry": {
            "projectileCount": 1,
            "projectileSpreadDegrees": 0,
            "usesGravity": false,
            "arcHeight": 0,
            "aoeShape": "line",
            "lineLength": 10,
            "lineWidth": 1,
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
            "chainRange": 4.75,
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
            "tags": ["LIGHTNING", "CHAIN", "SHOCK", "HITSCAN"]
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
            "allowedRows": [1],
            "allowedCardTypes": ["STAT_MOD", "TRIGGER"],
            "defaultCards": []
        },
        "animation": {
            "primaryColor": "#FDE047",
            "secondaryColor": "#FFFFFF",
            "highlightColor": "#FEF08A",
            "shadowColor": "#CA8A04",
            "shapeLanguage": "zigzag",
            "castPose": "snap",
            "motionStyle": "instant",
            "particleTypes": ["spark"],
            "trailStyle": "electric",
            "impactStyle": "spark_burst",
            "screenShake": "low",
            "soundNotes": "crack",
            "vfxCastKey": "",
            "vfxImpactKey": "",
            "vfxAoeIndicatorKey": ""
        },
        "ui": {
            "iconId": "/ui/icons/elements/lightning_arc_icon.png",
            "shortLabel": "Arc Lightning",
            "description": "Chains lightning between enemies.",
            "lore": "Ride the lightning.",
            "categoryLabel": "Lightning"
        },
        "visualLayers": []
    }
}