// --- FIRE SPELLS (CONTINUED) ---

// [UPDATED] FLAME WAVE
[SpellType.FIRE_FLAME_WAVE]: {
    id: 'FIRE_FLAME_WAVE',
        name: 'Flame Wave',
            school: 'FIRE',
                archetype: 'ELEMENTAL_WAVE',
                    spellKey: 'FLAME_WAVE',
                        behaviorKey: 'FlameWaveBehavior',
                            behaviorFile: 'modules/spells/behaviors/FlameWave.ts',
                                hotbarType: 'ACTIVE',
                                    spellType: 'Wave',
                                        baseStats: {
        baseDamage: 80,
            damagePerLevel: 12,
                critChance: 0.05,
                    critMultiplier: 1.5,
                        projectileSpeed: 12,
                            projectileLifetime: 1.0,
                                aoeRadius: 2.0, // Wide
                                    beamWidth: 0,
                                        beamTickInterval: 0,
                                            duration: 0,
                                                manaCost: 25,
                                                    cooldown: 3.0,
                                                        castTime: 0.5,
                                                            channelDrainPerSecond: 0,
                                                                maxTargets: 10
    },
    geometry: {
        projectileCount: 3, // Wide arc
            projectileSpreadDegrees: 30,
                usesGravity: false,
                    arcHeight: 0,
                        aoeShape: 'cone',
                            lineLength: 0,
                                lineWidth: 0,
                                    orbitRadius: 0,
                                        orbitDuration: 0,
                                            homingStrength: 0,
                                                canRicochet: false,
                                                    maxRicochets: 0
    },
    targeting: {
        targetingMode: 'direction',
            requiresLineOfSight: true,
                canHitAllies: false,
                    canHitCaster: false,
                        maxPenetrations: 99, // Passes through
                            chainRange: 0,
                                chainMaxJumps: 0
    },
    status: {
        appliesBurn: true,
            appliesSlow: false,
                appliesFreeze: false,
                    appliesShock: false,
                        appliesPoison: false,
                            appliesRoot: false,
                                appliesBlind: false,
                                    appliesMark: false,
                                        statusIntensity: 1.0,
                                            executionThreshold: 0
    },
    resource: {
        usesMana: true,
            usesHealth: false,
                healthCostPercent: 0,
                    chargesMax: 1,
                        chargeRegenTime: 0,
                            tags: ['fire', 'wave', 'aoe']
    },
    talentFlags: {
        enableChargeCast: false,
            enableGapCloser: false,
                enableAftershock: true,
                    enableOrbiting: false,
                        enableDetonateOnKill: false,
                            enableConvertAoEToField: false,
                                enableChain: false,
                                    enablePierce: true,
                                        enableRicochet: false
    },
    socketConfig: {
        maxCardSlots: 3,
            allowedRows: [1, 2],
                allowedCardTypes: ['AoEModifier', 'Trigger'],
                    defaultCards: []
    },
    animation: {
        primaryColor: '#ff4400',
            secondaryColor: '#ffaa00',
                highlightColor: '#ffffff',
                    shadowColor: '#220000',
                        shapeLanguage: 'wave',
                            castPose: 'arm_swipe',
                                motionStyle: 'flow',
                                    particleTypes: ['fire'],
                                        trailStyle: 'flame',
                                            impactStyle: 'burn',
                                                screenShake: 'medium',
                                                    soundNotes: 'whoosh_deep',
                                                        vfxCastKey: '',
                                                            vfxImpactKey: '',
                                                                vfxAoeIndicatorKey: ''
    },
    visualLayers: [
        {
            assetKey: 'flame_wave_arc',
            blendMode: 'add',
            color: '#ff8800',
            scale: 1.5,
            opacity: 0.8,
            followCursor: false
        }
    ],
        particleEmitters: [],
            timing: {
        castWindupTime: 200,
            releaseTime: 0,
                screenShakeIntensity: 2
    },
    skeletalAnimation: {
        usesArms: true,
            usesTorso: true,
                boneMotionProfiles: {
            arms: { recoilAmount: 0, returnSpeed: 0.2, rotationOffset: 1.0 }, // Swipe
            torso: { rotationOffset: 0.5, returnSpeed: 0.1 }
        }
    },
    hitReaction: {
        flashColor: '#ffaa00',
            spawnVfxKey: 'EXP_FIRE_SMALL',
                screenShakeOnHit: 1
    },
    ui: {
        iconId: 'FLAME_WAVE',
            shortLabel: 'Wave',
                description: 'Send forth a wave of fire.',
                    lore: 'Surf\'s up.',
                        categoryLabel: 'Fire'
    },
    unlock: {
        requiredLevel: 4,
            requiresQuestId: '',
                requiresSpellId: 'FIRE_FIREBALL',
                    goldCost: 100,
                        trainerId: ''
    }
},

[SpellType.FIRE_CINDER_DASH]: {
    id: 'FIRE_CINDER_DASH',
        name: 'Cinder Dash',
            school: 'FIRE',
                archetype: 'DASH',
                    spellKey: 'CINDER_DASH',
                        behaviorKey: 'CinderDashBehavior',
                            behaviorFile: 'modules/spells/behaviors/CinderDash.ts',
                                hotbarType: 'DASH',
                                    spellType: 'Dash',
                                        baseStats: {
        baseDamage: 20,
            damagePerLevel: 5,
                critChance: 0,
                    critMultiplier: 1,
                        projectileSpeed: 0,
                            projectileLifetime: 0,
                                aoeRadius: 1.0,
                                    beamWidth: 0,
                                        beamTickInterval: 0,
                                            duration: 0.2,
                                                manaCost: 15,
                                                    cooldown: 4.0,
                                                        castTime: 0,
                                                            channelDrainPerSecond: 0,
                                                                maxTargets: 5
    },
    geometry: {
        projectileCount: 0,
            projectileSpreadDegrees: 0,
                usesGravity: false,
                    arcHeight: 0,
                        aoeShape: 'line',
                            lineLength: 8,
                                lineWidth: 1,
                                    orbitRadius: 0,
                                        orbitDuration: 0,
                                            homingStrength: 0,
                                                canRicochet: false,
                                                    maxRicochets: 0
    },
    targeting: {
        targetingMode: 'direction',
            requiresLineOfSight: false,
                canHitAllies: false,
                    canHitCaster: false,
                        maxPenetrations: 0,
                            chainRange: 0,
                                chainMaxJumps: 0
    },
    status: {
        appliesBurn: true,
            appliesSlow: false,
                appliesFreeze: false,
                    appliesShock: false,
                        appliesPoison: false,
                            appliesRoot: false,
                                appliesBlind: false,
                                    appliesMark: false,
                                        statusIntensity: 1.0,
                                            executionThreshold: 0
    },
    resource: {
        usesMana: true,
            usesHealth: false,
                healthCostPercent: 0,
                    chargesMax: 2,
                        chargeRegenTime: 8000,
                            tags: ['fire', 'movement']
    },
    talentFlags: {
        enableChargeCast: false,
            enableGapCloser: true,
                enableAftershock: false,
                    enableOrbiting: false,
                        enableDetonateOnKill: false,
                            enableConvertAoEToField: true, // Trail of fire
                                enableChain: false,
                                    enablePierce: false,
                                        enableRicochet: false
    },
    socketConfig: {
        maxCardSlots: 1,
            allowedRows: [3],
                allowedCardTypes: ['MovementModifier'],
                    defaultCards: []
    },
    animation: {
        primaryColor: '#ffaa00',
            secondaryColor: '#222222',
                highlightColor: '#ffff00',
                    shadowColor: '#000000',
                        shapeLanguage: 'streak',
                            castPose: 'run',
                                motionStyle: 'blur',
                                    particleTypes: ['embers'],
                                        trailStyle: 'burn',
                                            impactStyle: 'puff',
                                                screenShake: 'low',
                                                    soundNotes: 'whoosh_fast',
                                                        vfxCastKey: '',
                                                            vfxImpactKey: '',
                                                                vfxAoeIndicatorKey: ''
    },
    visualLayers: [],
        particleEmitters: [],
            timing: {
        castWindupTime: 0,
            releaseTime: 0,
                screenShakeIntensity: 1
    },
    movement: {
        locksMovement: true,
            movementMultiplier: 5.0,
                allowsRotation: false,
                    dashDistance: 8,
                        dashCurve: 'easeOut'
    },
    skeletalAnimation: {
        usesArms: true,
            usesTorso: true,
                boneMotionProfiles: {
            arms: { recoilAmount: 0, returnSpeed: 0.5, rotationOffset: 0.5 },
            torso: { rotationOffset: 0.5, returnSpeed: 0.2 } // Lean forward
        }
    },
    hitReaction: {
        flashColor: '#ffaa00',
            spawnVfxKey: 'EXP_FIRE_TINY',
                screenShakeOnHit: 0
    },
    ui: {
        iconId: 'CINDER_DASH',
            shortLabel: 'Dash',
                description: 'Dash forward, leaving a trail of ash.',
                    lore: 'Fast as fire.',
                        categoryLabel: 'Fire'
    },
    unlock: {
        requiredLevel: 3,
            requiresQuestId: '',
                requiresSpellId: '',
                    goldCost: 50,
                        trainerId: ''
    }
},

[SpellType.FIRE_FLAME_WALL]: {
    id: 'FIRE_FLAME_WALL',
        name: 'Flame Wall',
            school: 'FIRE',
                archetype: 'FIELD',
                    spellKey: 'FLAME_WALL',
                        behaviorKey: 'FlameWallBehavior',
                            behaviorFile: 'modules/spells/behaviors/FlameWall.ts',
                                hotbarType: 'ACTIVE',
                                    spellType: 'Field',
                                        baseStats: {
        baseDamage: 15,
            damagePerLevel: 3,
                critChance: 0,
                    critMultiplier: 1,
                        projectileSpeed: 0,
                            projectileLifetime: 0,
                                aoeRadius: 4.0, // Length
                                    beamWidth: 0,
                                        beamTickInterval: 500,
                                            duration: 6.0,
                                                manaCost: 30,
                                                    cooldown: 12.0,
                                                        castTime: 0.8,
                                                            channelDrainPerSecond: 0,
                                                                maxTargets: 20
    },
    geometry: {
        projectileCount: 0,
            projectileSpreadDegrees: 0,
                usesGravity: false,
                    arcHeight: 0,
                        aoeShape: 'line',
                            lineLength: 8,
                                lineWidth: 1,
                                    orbitRadius: 0,
                                        orbitDuration: 0,
                                            homingStrength: 0,
                                                canRicochet: false,
                                                    maxRicochets: 0
    },
    targeting: {
        targetingMode: 'point',
            requiresLineOfSight: true,
                canHitAllies: false,
                    canHitCaster: false,
                        maxPenetrations: 0,
                            chainRange: 0,
                                chainMaxJumps: 0
    },
    status: {
        appliesBurn: true,
            appliesSlow: false,
                appliesFreeze: false,
                    appliesShock: false,
                        appliesPoison: false,
                            appliesRoot: false,
                                appliesBlind: false,
                                    appliesMark: false,
                                        statusIntensity: 1.0,
                                            executionThreshold: 0
    },
    resource: {
        usesMana: true,
            usesHealth: false,
                healthCostPercent: 0,
                    chargesMax: 1,
                        chargeRegenTime: 0,
                            tags: ['fire', 'field', 'wall']
    },
    talentFlags: {
        enableChargeCast: false,
            enableGapCloser: false,
                enableAftershock: false,
                    enableOrbiting: false,
                        enableDetonateOnKill: false,
                            enableConvertAoEToField: false,
                                enableChain: false,
                                    enablePierce: false,
                                        enableRicochet: false
    },
    socketConfig: {
        maxCardSlots: 2,
            allowedRows: [2, 3],
                allowedCardTypes: ['AoEModifier'],
                    defaultCards: []
    },
    animation: {
        primaryColor: '#ff2200',
            secondaryColor: '#441100',
                highlightColor: '#ffaa00',
                    shadowColor: '#110000',
                        shapeLanguage: 'wall',
                            castPose: 'channel_ground',
                                motionStyle: 'static',
                                    particleTypes: ['fire'],
                                        trailStyle: 'none',
                                            impactStyle: 'none',
                                                screenShake: 'low',
                                                    soundNotes: 'crackle',
                                                        vfxCastKey: '',
                                                            vfxImpactKey: '',
                                                                vfxAoeIndicatorKey: ''
    },
    visualLayers: [
        {
            assetKey: 'fx_wall_indicator',
            blendMode: 'add',
            color: '#ff4400',
            scale: 1.0,
            opacity: 0.5,
            renderLayer: 'ground',
            followCursor: true
        }
    ],
        particleEmitters: [],
            timing: {
        castWindupTime: 300,
            releaseTime: 600,
                screenShakeIntensity: 1
    },
    skeletalAnimation: {
        usesArms: true,
            usesTorso: true,
                boneMotionProfiles: {
            arms: { recoilAmount: 0, returnSpeed: 0.1, rotationOffset: 1.5 }, // Hands down
            torso: { rotationOffset: 0.2, returnSpeed: 0.1 }
        }
    },
    hitReaction: {
        flashColor: '#ff2200',
            spawnVfxKey: 'EXP_FIRE_TINY',
                screenShakeOnHit: 0
    },
    ui: {
        iconId: 'FLAME_WALL',
            shortLabel: 'Wall',
                description: 'Creates a wall of fire.',
                    lore: 'None shall pass.',
                        categoryLabel: 'Fire'
    },
    unlock: {
        requiredLevel: 6,
            requiresQuestId: '',
                requiresSpellId: '',
                    goldCost: 200,
                        trainerId: ''
    }
},

[SpellType.FIRE_FLAMEBURST_PUNCH]: {
    id: 'FIRE_FLAMEBURST_PUNCH',
        name: 'Flameburst Punch',
            school: 'FIRE',
                archetype: 'MELEE',
                    spellKey: 'FLAMEBURST_PUNCH',
                        behaviorKey: 'MeleeBehavior', // Generic Melee
                            behaviorFile: 'modules/spells/behaviors/Melee.ts',
                                hotbarType: 'MELEE',
                                    spellType: 'Melee',
                                        baseStats: {
        baseDamage: 60,
            damagePerLevel: 8,
                critChance: 0.1,
                    critMultiplier: 2.0,
                        projectileSpeed: 0,
                            projectileLifetime: 0,
                                aoeRadius: 1.5, // Cone length
                                    beamWidth: 60, // Cone angle
                                        beamTickInterval: 0,
                                            duration: 0.3, // Swing time
                                                manaCost: 10,
                                                    cooldown: 1.0,
                                                        castTime: 0, // Instant melee
                                                            channelDrainPerSecond: 0,
                                                                maxTargets: 3
    },
    geometry: {
        projectileCount: 0,
            projectileSpreadDegrees: 0,
                usesGravity: false,
                    arcHeight: 0,
                        aoeShape: 'cone',
                            lineLength: 2,
                                lineWidth: 0,
                                    orbitRadius: 0,
                                        orbitDuration: 0,
                                            homingStrength: 0,
                                                canRicochet: false,
                                                    maxRicochets: 0
    },
    targeting: {
        targetingMode: 'direction',
            requiresLineOfSight: false,
                canHitAllies: false,
                    canHitCaster: false,
                        maxPenetrations: 99,
                            chainRange: 0,
                                chainMaxJumps: 0
    },
    status: {
        appliesBurn: true,
            appliesSlow: false,
                appliesFreeze: false,
                    appliesShock: false,
                        appliesPoison: false,
                            appliesRoot: false,
                                appliesBlind: false,
                                    appliesMark: false,
                                        statusIntensity: 1.0,
                                            executionThreshold: 0
    },
    resource: {
        usesMana: true,
            usesHealth: false,
                healthCostPercent: 0,
                    chargesMax: 1,
                        chargeRegenTime: 0,
                            tags: ['fire', 'melee']
    },
    talentFlags: {
        enableChargeCast: false,
            enableGapCloser: false,
                enableAftershock: true, // Explosive punch
                    enableOrbiting: false,
                        enableDetonateOnKill: true,
                            enableConvertAoEToField: false,
                                enableChain: false,
                                    enablePierce: false,
                                        enableRicochet: false
    },
    socketConfig: {
        maxCardSlots: 3,
            allowedRows: [1],
                allowedCardTypes: ['MeleeModifier', 'Trigger'],
                    defaultCards: []
    },
    animation: {
        primaryColor: '#ffaa00',
            secondaryColor: '#aa3300',
                highlightColor: '#ffff00',
                    shadowColor: '#220000',
                        shapeLanguage: 'punch',
                            castPose: 'punch_right',
                                motionStyle: 'snap',
                                    particleTypes: ['sparks', 'fire'],
                                        trailStyle: 'swipe',
                                            impactStyle: 'punch',
                                                screenShake: 'medium',
                                                    soundNotes: 'punch_fire',
                                                        vfxCastKey: '',
                                                            vfxImpactKey: '',
                                                                vfxAoeIndicatorKey: ''
    },
    visualLayers: [],
        particleEmitters: [],
            timing: {
        castWindupTime: 100,
            releaseTime: 0,
                screenShakeIntensity: 2
    },
    skeletalAnimation: {
        usesArms: true,
            usesTorso: true,
                boneMotionProfiles: {
            arms: { recoilAmount: -5, returnSpeed: 0.4, rotationOffset: 0 }, // Punch forward
            torso: { rotationOffset: 0.3, returnSpeed: 0.2 } // Twist
        }
    },
    hitReaction: {
        flashColor: '#ffaa00',
            spawnVfxKey: 'EXP_FIRE_SMALL',
                screenShakeOnHit: 5
    },
    ui: {
        iconId: 'FLAME_PUNCH',
            shortLabel: 'Punch',
                description: 'A fiery punch.',
                    lore: 'Pow.',
                        categoryLabel: 'Fire'
    },
    unlock: {
        requiredLevel: 0,
            requiresQuestId: '',
                requiresSpellId: '',
                    goldCost: 0,
                        trainerId: ''
    }
},

[SpellType.FIRE_HEAT_BLOOM_AURA]: {
    id: 'FIRE_HEAT_BLOOM_AURA',
        name: 'Heat Bloom',
            school: 'FIRE',
                archetype: 'AURA',
                    spellKey: 'HEAT_BLOOM_AURA',
                        behaviorKey: 'HeatBloomBehavior',
                            behaviorFile: 'modules/spells/behaviors/HeatBloom.ts',
                                hotbarType: 'AURA',
                                    spellType: 'Aura',
                                        baseStats: {
        baseDamage: 5,
            damagePerLevel: 1,
                critChance: 0,
                    critMultiplier: 1,
                        projectileSpeed: 0,
                            projectileLifetime: 0,
                                aoeRadius: 4.0,
                                    beamWidth: 0,
                                        beamTickInterval: 1000, // 1 sec tick
                                            duration: -1, // Permanent
                                                manaCost: 0, // Reserve
                                                    cooldown: 1.0,
                                                        castTime: 0,
                                                            channelDrainPerSecond: 0,
                                                                maxTargets: 99
    },
    geometry: {
        projectileCount: 0,
            projectileSpreadDegrees: 0,
                usesGravity: false,
                    arcHeight: 0,
                        aoeShape: 'circle',
                            lineLength: 0,
                                lineWidth: 0,
                                    orbitRadius: 0,
                                        orbitDuration: 0,
                                            homingStrength: 0,
                                                canRicochet: false,
                                                    maxRicochets: 0
    },
    targeting: {
        targetingMode: 'selfCentered',
            requiresLineOfSight: false,
                canHitAllies: false,
                    canHitCaster: false,
                        maxPenetrations: 99,
                            chainRange: 0,
                                chainMaxJumps: 0
    },
    status: {
        appliesBurn: true,
            appliesSlow: false,
                appliesFreeze: false,
                    appliesShock: false,
                        appliesPoison: false,
                            appliesRoot: false,
                                appliesBlind: false,
                                    appliesMark: false,
                                        statusIntensity: 1.0,
                                            executionThreshold: 0
    },
    resource: {
        usesMana: true,
            usesHealth: false,
                healthCostPercent: 0,
                    chargesMax: 1,
                        chargeRegenTime: 0,
                            tags: ['fire', 'aura']
    },
    talentFlags: {
        enableChargeCast: false,
            enableGapCloser: false,
                enableAftershock: false,
                    enableOrbiting: false,
                        enableDetonateOnKill: false,
                            enableConvertAoEToField: false,
                                enableChain: false,
                                    enablePierce: false,
                                        enableRicochet: false
    },
    socketConfig: {
        maxCardSlots: 1,
            allowedRows: [4],
                allowedCardTypes: ['AuraModifier'],
                    defaultCards: []
    },
    animation: {
        primaryColor: '#ff5500',
            secondaryColor: '#aa2200',
                highlightColor: '#ffaa00',
                    shadowColor: '#110000',
                        shapeLanguage: 'haze',
                            castPose: 'power_up',
                                motionStyle: 'shimmer',
                                    particleTypes: ['heat_haze'],
                                        trailStyle: 'none',
                                            impactStyle: 'none',
                                                screenShake: 'none',
                                                    soundNotes: 'hum_heat',
                                                        vfxCastKey: '',
                                                            vfxImpactKey: '',
                                                                vfxAoeIndicatorKey: ''
    },
    visualLayers: [],
        particleEmitters: [],
            timing: {
        castWindupTime: 0,
            releaseTime: 0,
                screenShakeIntensity: 0
    },
    skeletalAnimation: {
        usesArms: false,
            usesTorso: false
    },
    hitReaction: {
        flashColor: '#ff5500',
            spawnVfxKey: 'EXP_FIRE_TINY',
                screenShakeOnHit: 0
    },
    ui: {
        iconId: 'HEAT_BLOOM',
            shortLabel: 'Heat',
                description: 'Radiate intense heat, burning nearby enemies.',
                    lore: 'Too hot.',
                        categoryLabel: 'Fire'
    },
    unlock: {
        requiredLevel: 8,
            requiresQuestId: '',
                requiresSpellId: '',
                    goldCost: 400,
                        trainerId: ''
    }
},

[SpellType.FIRE_MOLTEN_ORB]: {
    id: 'FIRE_MOLTEN_ORB',
        name: 'Molten Orb',
            school: 'FIRE',
                archetype: 'PROJECTILE_BOUNCE',
                    spellKey: 'MOLTEN_ORB',
                        behaviorKey: 'GenericBehavior', // Placeholder or specific bounce behavior
                            behaviorFile: 'modules/spells/behaviors/GenericSpell.ts',
                                hotbarType: 'ACTIVE',
                                    spellType: 'Projectile',
                                        baseStats: {
        baseDamage: 50,
            damagePerLevel: 6,
                critChance: 0.1,
                    critMultiplier: 1.8,
                        projectileSpeed: 10,
                            projectileLifetime: 4.0,
                                aoeRadius: 1.0,
                                    beamWidth: 0,
                                        beamTickInterval: 0,
                                            duration: 0,
                                                manaCost: 15,
                                                    cooldown: 0,
                                                        castTime: 0.2,
                                                            channelDrainPerSecond: 0,
                                                                maxTargets: 5
    },
    geometry: {
        projectileCount: 1,
            projectileSpreadDegrees: 0,
                usesGravity: true, // Arcs and bounces
                    arcHeight: 2.0,
                        aoeShape: 'circle',
                            lineLength: 0,
                                lineWidth: 0,
                                    orbitRadius: 0,
                                        orbitDuration: 0,
                                            homingStrength: 0,
                                                canRicochet: true,
                                                    maxRicochets: 3
    },
    targeting: {
        targetingMode: 'direction',
            requiresLineOfSight: true,
                canHitAllies: false,
                    canHitCaster: false,
                        maxPenetrations: 0,
                            chainRange: 0,
                                chainMaxJumps: 0
    },
    status: {
        appliesBurn: true,
            appliesSlow: true, // Molten sticky
                appliesFreeze: false,
                    appliesShock: false,
                        appliesPoison: false,
                            appliesRoot: false,
                                appliesBlind: false,
                                    appliesMark: false,
                                        statusIntensity: 0.5,
                                            executionThreshold: 0
    },
    resource: {
        usesMana: true,
            usesHealth: false,
                healthCostPercent: 0,
                    chargesMax: 1,
                        chargeRegenTime: 0,
                            tags: ['fire', 'projectile', 'earth']
    },
    talentFlags: {
        enableChargeCast: false,
            enableGapCloser: false,
                enableAftershock: true,
                    enableOrbiting: false,
                        enableDetonateOnKill: false,
                            enableConvertAoEToField: true, // Pool of lava
                                enableChain: false,
                                    enablePierce: false,
                                        enableRicochet: true
    },
    socketConfig: {
        maxCardSlots: 3,
            allowedRows: [1, 2],
                allowedCardTypes: ['ProjectileModifier'],
                    defaultCards: []
    },
    animation: {
        primaryColor: '#ff2200',
            secondaryColor: '#330000',
                highlightColor: '#ffaa00',
                    shadowColor: '#110000',
                        shapeLanguage: 'rock',
                            castPose: 'lob',
                                motionStyle: 'heavy',
                                    particleTypes: ['lava', 'smoke'],
                                        trailStyle: 'drip',
                                            impactStyle: 'splat',
                                                screenShake: 'medium',
                                                    soundNotes: 'gloop',
                                                        vfxCastKey: '',
                                                            vfxImpactKey: '',
                                                                vfxAoeIndicatorKey: ''
    },
    visualLayers: [
        {
            assetKey: 'lava_rock',
            blendMode: 'normal',
            color: '#ffffff',
            scale: 1.2,
            opacity: 1.0,
            followCursor: false,
            rotationBehavior: 'spin'
        }
    ],
        particleEmitters: [],
            timing: {
        castWindupTime: 300,
            releaseTime: 0,
                screenShakeIntensity: 2
    },
    skeletalAnimation: {
        usesArms: true,
            usesTorso: true,
                boneMotionProfiles: {
            arms: { recoilAmount: 0, returnSpeed: 0.1, rotationOffset: 0.5 }, // Underhand throw
            torso: { rotationOffset: 0.2, returnSpeed: 0.1 }
        }
    },
    hitReaction: {
        flashColor: '#ff2200',
            spawnVfxKey: 'EXP_LAVA_SMALL',
                screenShakeOnHit: 3
    },
    ui: {
        iconId: 'MOLTEN_ORB',
            shortLabel: 'Orb',
                description: 'Throw a bouncing ball of lava.',
                    lore: 'Hot potato.',
                        categoryLabel: 'Fire'
    },
    unlock: {
        requiredLevel: 5,
            requiresQuestId: '',
                requiresSpellId: '',
                    goldCost: 150,
                        trainerId: ''
    }
},

// Stubbing remaining Fire spells to be safe, pointing to Generic Behavior
[SpellType.FIRE_INFERNO_BEAM]: { id: 'FIRE_INFERNO_BEAM', name: 'Inferno Beam', school: 'FIRE', archetype: 'BEAM', spellKey: 'INFERNO_BEAM', behaviorKey: 'GenericBehavior', behaviorFile: '', hotbarType: 'CHANNEL', spellType: 'Beam', baseStats: { baseDamage: 5, damagePerLevel: 1, critChance: 0, critMultiplier: 1, projectileSpeed: 0, projectileLifetime: 0, aoeRadius: 1, beamWidth: 10, beamTickInterval: 100, duration: 3, manaCost: 5, cooldown: 5, castTime: 0, channelDrainPerSecond: 10, maxTargets: 5 }, geometry: { projectileCount: 0, projectileSpreadDegrees: 0, usesGravity: false, arcHeight: 0, aoeShape: 'line', lineLength: 10, lineWidth: 1, orbitRadius: 0, orbitDuration: 0, homingStrength: 0, canRicochet: false, maxRicochets: 0 }, targeting: { targetingMode: 'direction', requiresLineOfSight: true, canHitAllies: false, canHitCaster: false, maxPenetrations: 0, chainRange: 0, chainMaxJumps: 0 }, status: { appliesBurn: true, appliesSlow: false, appliesFreeze: false, appliesShock: false, appliesPoison: false, appliesRoot: false, appliesBlind: false, appliesMark: false, statusIntensity: 1, executionThreshold: 0 }, resource: { usesMana: true, usesHealth: false, healthCostPercent: 0, chargesMax: 1, chargeRegenTime: 0, tags: ['fire', 'channel'] }, talentFlags: { enableChargeCast: false, enableGapCloser: false, enableAftershock: false, enableOrbiting: false, enableDetonateOnKill: false, enableConvertAoEToField: false, enableChain: false, enablePierce: true, enableRicochet: false }, socketConfig: { maxCardSlots: 3, allowedRows: [1], allowedCardTypes: [], defaultCards: [] }, animation: { primaryColor: '#ff0000', secondaryColor: '#aa0000', highlightColor: '#ffff00', shadowColor: '#000000', shapeLanguage: 'beam', castPose: 'beam', motionStyle: 'constant', particleTypes: [], trailStyle: 'beam', impactStyle: 'burn', screenShake: 'low', soundNotes: 'beam_hum', vfxCastKey: '', vfxImpactKey: '', vfxAoeIndicatorKey: '' }, ui: { iconId: 'INFERNO_BEAM', shortLabel: 'Beam', description: 'Channel a beam of fire.', lore: '', categoryLabel: 'Fire' }, unlock: { requiredLevel: 10, requiresQuestId: '', requiresSpellId: '', goldCost: 0, trainerId: '' } },
[SpellType.FIRE_LAVA_LASH]: { id: 'FIRE_LAVA_LASH', name: 'Lava Lash', school: 'FIRE', archetype: 'MELEE', spellKey: 'LAVA_LASH', behaviorKey: 'MeleeBehavior', behaviorFile: '', hotbarType: 'MELEE', spellType: 'Melee', baseStats: { baseDamage: 40, damagePerLevel: 5, critChance: 0.1, critMultiplier: 1.5, projectileSpeed: 0, projectileLifetime: 0, aoeRadius: 2, beamWidth: 45, beamTickInterval: 0, duration: 0.4, manaCost: 10, cooldown: 2, castTime: 0, channelDrainPerSecond: 0, maxTargets: 3 }, geometry: { projectileCount: 0, projectileSpreadDegrees: 0, usesGravity: false, arcHeight: 0, aoeShape: 'cone', lineLength: 3, lineWidth: 0, orbitRadius: 0, orbitDuration: 0, homingStrength: 0, canRicochet: false, maxRicochets: 0 }, targeting: { targetingMode: 'direction', requiresLineOfSight: false, canHitAllies: false, canHitCaster: false, maxPenetrations: 0, chainRange: 0, chainMaxJumps: 0 }, status: { appliesBurn: true, appliesSlow: false, appliesFreeze: false, appliesShock: false, appliesPoison: false, appliesRoot: false, appliesBlind: false, appliesMark: false, statusIntensity: 1, executionThreshold: 0 }, resource: { usesMana: true, usesHealth: false, healthCostPercent: 0, chargesMax: 1, chargeRegenTime: 0, tags: ['fire', 'melee'] }, talentFlags: { enableChargeCast: false, enableGapCloser: false, enableAftershock: false, enableOrbiting: false, enableDetonateOnKill: false, enableConvertAoEToField: false, enableChain: false, enablePierce: false, enableRicochet: false }, socketConfig: { maxCardSlots: 3, allowedRows: [1], allowedCardTypes: [], defaultCards: [] }, animation: { primaryColor: '#ff0000', secondaryColor: '#aa0000', highlightColor: '#ffff00', shadowColor: '#000000', shapeLanguage: 'whip', castPose: 'swing', motionStyle: 'snap', particleTypes: [], trailStyle: 'whip', impactStyle: 'slash', screenShake: 'low', soundNotes: 'whip_crack', vfxCastKey: '', vfxImpactKey: '', vfxAoeIndicatorKey: '' }, ui: { iconId: 'LAVA_LASH', shortLabel: 'Lash', description: 'Strike with a whip of lava.', lore: '', categoryLabel: 'Fire' }, unlock: { requiredLevel: 6, requiresQuestId: '', requiresSpellId: '', goldCost: 0, trainerId: '' } },
[SpellType.FIRE_FLAMEBURST]: { id: 'FIRE_FLAMEBURST', name: 'Flameburst', school: 'FIRE', archetype: 'AOE', spellKey: 'FLAMEBURST', behaviorKey: 'GenericBehavior', behaviorFile: '', hotbarType: 'ACTIVE', spellType: 'AoE', baseStats: { baseDamage: 100, damagePerLevel: 10, critChance: 0.2, critMultiplier: 2, projectileSpeed: 0, projectileLifetime: 0, aoeRadius: 3, beamWidth: 0, beamTickInterval: 0, duration: 0, manaCost: 30, cooldown: 10, castTime: 1, channelDrainPerSecond: 0, maxTargets: 10 }, geometry: { projectileCount: 0, projectileSpreadDegrees: 0, usesGravity: false, arcHeight: 0, aoeShape: 'circle', lineLength: 0, lineWidth: 0, orbitRadius: 0, orbitDuration: 0, homingStrength: 0, canRicochet: false, maxRicochets: 0 }, targeting: { targetingMode: 'point', requiresLineOfSight: true, canHitAllies: false, canHitCaster: false, maxPenetrations: 0, chainRange: 0, chainMaxJumps: 0 }, status: { appliesBurn: true, appliesSlow: false, appliesFreeze: false, appliesShock: false, appliesPoison: false, appliesRoot: false, appliesBlind: false, appliesMark: false, statusIntensity: 1, executionThreshold: 0 }, resource: { usesMana: true, usesHealth: false, healthCostPercent: 0, chargesMax: 1, chargeRegenTime: 0, tags: ['fire', 'aoe'] }, talentFlags: { enableChargeCast: true, enableGapCloser: false, enableAftershock: true, enableOrbiting: false, enableDetonateOnKill: false, enableConvertAoEToField: false, enableChain: false, enablePierce: false, enableRicochet: false }, socketConfig: { maxCardSlots: 3, allowedRows: [2], allowedCardTypes: [], defaultCards: [] }, animation: { primaryColor: '#ff0000', secondaryColor: '#aa0000', highlightColor: '#ffff00', shadowColor: '#000000', shapeLanguage: 'explosion', castPose: 'channel', motionStyle: 'explode', particleTypes: [], trailStyle: 'none', impactStyle: 'boom', screenShake: 'high', soundNotes: 'boom_big', vfxCastKey: '', vfxImpactKey: '', vfxAoeIndicatorKey: '' }, ui: { iconId: 'FLAMEBURST', shortLabel: 'Burst', description: 'A massive explosion of fire.', lore: '', categoryLabel: 'Fire' }, unlock: { requiredLevel: 12, requiresQuestId: '', requiresSpellId: '', goldCost: 0, trainerId: '' } },
