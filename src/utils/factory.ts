

import { Player, SpellType, Enemy, Vector2, Loot, PlayerVisuals } from '../types';
import {
    PLAYER_START_HP,
    PLAYER_START_MANA,
    PLAYER_START_SHIELD,
    PLAYER_BASE_SPEED,
    POTION_START_CHARGES,
    ZOMBIE_CONFIG,
    ANT_CONFIG,
    GOLEM_CONFIG,
    SPITTER_CONFIG,
    ENEMY_CASTER_CONFIG,
    ENEMY_BASE_SPEED,
    ENEMY_RADIUS,
    ELITE_CONFIG,
    BOSS_CONFIG,
    LOOT_LIFE,
    HEARTHSTONE_POS
} from '../constants';
import { WEAPON_REGISTRY } from '../data/WeaponRegistry';
import { SPELL_REGISTRY } from '../modules/spells/SpellRegistry';

export interface CharacterCreationOptions {
    name: string;
    visuals?: PlayerVisuals;
    tool?: 'axe' | 'shovel' | 'torch';
    perk?: 'fleet' | 'stout' | 'arcane';
    id?: string;
}

export const createInitialPlayer = (options: CharacterCreationOptions = { name: "Hero" }): Player => {
    // Defaults
    const name = options.name || "Hero";
    const id = options.id || `player_${Date.now()}`;
    const visuals = options.visuals || {
        bodyType: 'average',
        skinColor: '#c68642',
        hairColor: '#000000',
        shirtColor: '#4ade80',
        pantsColor: '#2563eb'
    };

    // Base Stats
    const baseStats = {
        vitality: 0,
        power: 2,
        haste: 0,
        swiftness: 0,
        shield: 0
    };

    // Apply Perk
    if (options.perk === 'fleet') {
        baseStats.swiftness += 1;
    } else if (options.perk === 'stout') {
        baseStats.vitality += 2;
    } else if (options.perk === 'arcane') {
        baseStats.power += 1;
    }

    // Initial Equipment based on Tool
    let weaponId = 'novice_sword'; // Default fallback
    let weaponIcon = '🗡️';

    if (options.tool === 'axe') {
        weaponId = 'novice_axe'; // We'll mock this if missing from registry
        weaponIcon = '🪓';
    } else if (options.tool === 'shovel') {
        weaponId = 'novice_shovel';
        weaponIcon = '⛏️';
    } else if (options.tool === 'torch') {
        weaponId = 'novice_torch';
        weaponIcon = '🔥';
    }

    const starterWeapon = {
        id: `start_wep_${Date.now()}`,
        name: options.tool ? options.tool.charAt(0).toUpperCase() + options.tool.slice(1) : "Sword",
        slot: 'MAIN_HAND' as const,
        rarity: 'common' as const,
        stats: { damage: options.tool === 'axe' ? 3 : 2 },
        icon: weaponIcon,
        weaponId: weaponId, // Used for spell lookup (usually grants SWIPE)
        weaponType: 'SWORD' as const, // Treat as sword for animation handling unless we add new anims
        w: 1,
        h: 3,
        visual: { theme: 'RUSTED' as const, primaryColor: '#888' }
    };

    // Unlock ALL Spells for testing the new content
    const allSpells = Object.keys(SPELL_REGISTRY) as SpellType[];

    return {
        id,
        name,
        heroClass: 'MAGE',
        facingRight: true, // Default facing
        visuals,
        pos: { ...HEARTHSTONE_POS },
        velocity: { x: 0, y: 0 },
        radius: 0.4,
        isDead: false,
        hp: PLAYER_START_HP + (baseStats.vitality * 10), // Apply initial vitality
        maxHp: PLAYER_START_HP + (baseStats.vitality * 10),
        shield: PLAYER_START_SHIELD,
        maxShield: PLAYER_START_SHIELD,
        shieldRegenTimer: 0,
        mana: PLAYER_START_MANA,
        maxMana: PLAYER_START_MANA,
        xp: 0,
        xpTally: 0,
        xpTimer: 0,
        xpGlowTimer: 0,
        level: 1,
        toNextLevel: 150, // Match (level * 100 * 1.5) formula
        currentSpell: SpellType.FIRE_FIREBALL, // Start with Fireball
        // UNLOCK ALL SPELLS FOR TESTING/MODDING
        knownSpells: [SpellType.FIRE_FIREBALL],
        spellPoints: 0, // Infinite points to test upgrades
        cooldowns: {}, // Initialize empty cooldown map
        hotbar: [
            SpellType.FIRE_FIREBALL,
            null,
            SpellType.LIGHTNING_LIGHTNING_BOLT,
            null,
            null,
            null,
            SpellType.EARTH_BOULDER_TOSS,
            null
        ],
        speed: PLAYER_BASE_SPEED,
        statPoints: 0,
        spellTalentPoints: 0,
        bombAmmo: 0,
        isMounted: false,
        coins: 0,
        magicDust: 0,
        spellUpgrades: {},
        spellExperience: {},
        spellTalents: {
            allocations: {} // New format
        },
        baseStats: baseStats,
        potions: {
            health: POTION_START_CHARGES,
            mana: POTION_START_CHARGES,
            speed: POTION_START_CHARGES
        },
        potionKillCounter: 0,
        activeBuffs: {
            speedBoost: 0,
            rockAuraTimer: 0,
            righteousFire: false,
            stoneskin: 0,
            thorns: 0,
            deflection: 0,
            morphTimer: 0
        },
        equipment: {
            HEAD: null,
            CHEST: null,
            LEGS: null,
            FEET: null,
            SHOULDERS: null,
            MAIN_HAND: null, // No starter weapon - must find in world
            OFF_HAND: null
        },
        // Card System Initialization
        equippedCards: {},
        cardInventory: [
            { instanceId: `card_start_1_${Date.now()}`, cardId: 'CARD_TWIN_SHOT' },
            { instanceId: `card_start_2_${Date.now()}`, cardId: 'CARD_PIERCE' },
            { instanceId: `card_start_3_${Date.now()}`, cardId: 'CARD_EXPANDED_RADIUS' },
            { instanceId: `card_start_4_${Date.now()}`, cardId: 'CARD_RICOCHET' },
            { instanceId: `card_start_5_${Date.now()}`, cardId: 'CARD_SPLIT' },
            { instanceId: `card_start_6_${Date.now()}`, cardId: 'CARD_NOVA' },
            { instanceId: `card_start_7_${Date.now()}`, cardId: 'CARD_VAMPIRISM' },
            { instanceId: `card_start_8_${Date.now()}`, cardId: 'CARD_COMBUSTION' },
            { instanceId: `card_start_9_${Date.now()}`, cardId: 'CARD_CHAIN_REACTION' },
            { instanceId: `card_start_10_${Date.now()}`, cardId: 'CARD_TRIPLE_FORK' },
            { instanceId: `card_start_11_${Date.now()}`, cardId: 'CARD_ORBITING_ORBS' },
            { instanceId: `card_start_12_${Date.now()}`, cardId: 'CARD_HOMING_DRIFT' },
            { instanceId: `card_start_13_${Date.now()}`, cardId: 'CARD_TUNNEL_SHOT' },
            { instanceId: `card_start_14_${Date.now()}`, cardId: 'CARD_BEAM_CHANNEL' },
            { instanceId: `card_start_15_${Date.now()}`, cardId: 'CARD_FOCUSED_BLAST' },
            { instanceId: `card_start_16_${Date.now()}`, cardId: 'CARD_RING_BURST' },
            { instanceId: `card_start_17_${Date.now()}`, cardId: 'CARD_CONE_SPREAD' },
            { instanceId: `card_start_18_${Date.now()}`, cardId: 'CARD_LINGERING_FIELD' },
            { instanceId: `card_start_19_${Date.now()}`, cardId: 'CARD_CLUSTER_BURST' },
            { instanceId: `card_start_20_${Date.now()}`, cardId: 'CARD_RAPID_FIRE' },
            { instanceId: `card_start_21_${Date.now()}`, cardId: 'CARD_HEAVY_CAST' },
            { instanceId: `card_start_22_${Date.now()}`, cardId: 'CARD_BURST_FIRE' },
            { instanceId: `card_start_23_${Date.now()}`, cardId: 'CARD_SPELL_ECHO' }
        ],
        inventory: [],
        rockAura: {
            rotation: 0,
            rocks: [
                { id: 1, angleOffset: 0, isDead: false, respawnTimer: 0 },
                { id: 2, angleOffset: (Math.PI * 2) / 3, isDead: false, respawnTimer: 0 },
                { id: 3, angleOffset: ((Math.PI * 2) / 3) * 2, isDead: false, respawnTimer: 0 }
            ]
        },
        roll: {
            isRolling: false,
            timer: 0,
            cooldown: 0
        },
        casting: {
            isCasting: false,
            currentSpell: SpellType.SWORD_SWIPE,
            timer: 0,
            duration: 0,
            targetPos: { x: 0, y: 0 },
            hitTargets: [],
            tickTimer: 0,
            startFrame: 0,
            endFrame: 0,
            trail: []
        },
        attack: {
            isAttacking: false,
            phase: 'IDLE' as any, // Cast to avoid circular dep if needed or import MeleeAttackPhase
            weaponId: null,
            timer: 0,
            duration: 0,
            cooldown: 0,
            comboCount: 0,
            targetPos: { x: 0, y: 0 },
            hitTargets: [],
            comboWindowOpen: false,
            inputBuffer: false
        },
        lockedTargetId: null,
        buffs: [],
        morph: 'NONE'
    };
};

export const createEnemy = (
    pos: Vector2,
    type: 'melee' | 'caster' | 'boss' | 'ant' | 'golem' | 'spitter' | 'dummy' | 'wolf',
    difficultyFactor: number,
    playerLevel: number,
    isElite: boolean = false
): Enemy => {
    let eHp = 10;
    let eMaxHp = 10;
    let eDmg = 5;
    let eSpeed = ENEMY_BASE_SPEED;
    let eRadius = ENEMY_RADIUS;
    let attackCooldown = 30;

    // PoE2 Style: Percentage-based scaling (25% more HP per level)
    const levelMultiplier = 1 + ((playerLevel - 1) * 0.25);

    // Base Stats per type
    switch (type) {
        case 'boss':
            const baseHpBoss = 60; // 30 -> 60
            eHp = baseHpBoss * levelMultiplier * BOSS_CONFIG.hpMultiplier;
            eDmg = (ZOMBIE_CONFIG.baseDamage + (playerLevel * ZOMBIE_CONFIG.damagePerLevel)) * BOSS_CONFIG.damageMultiplier;
            eSpeed = ENEMY_BASE_SPEED + (playerLevel * 0.1);
            eRadius = BOSS_CONFIG.radius;
            attackCooldown = 30;
            break;

        case 'golem':
            eHp = GOLEM_CONFIG.hp * 2 * levelMultiplier; // Doubled
            eDmg = GOLEM_CONFIG.damage + (playerLevel * 2);
            eSpeed = GOLEM_CONFIG.speed;
            eRadius = GOLEM_CONFIG.radius;
            attackCooldown = 50;
            break;

        case 'spitter':
            eHp = SPITTER_CONFIG.hp * 2 * levelMultiplier; // Doubled
            eDmg = SPITTER_CONFIG.damage + playerLevel;
            eSpeed = SPITTER_CONFIG.speed;
            eRadius = SPITTER_CONFIG.radius;
            attackCooldown = SPITTER_CONFIG.cooldown;
            break;

        case 'ant':
            eHp = ANT_CONFIG.hp * 2 * levelMultiplier; // Doubled
            eDmg = ANT_CONFIG.damage + Math.floor(playerLevel * 0.5);
            eSpeed = ANT_CONFIG.speed + (playerLevel * 0.1);
            eRadius = ANT_CONFIG.radius;
            attackCooldown = 30;
            break;

        case 'caster':
            eHp = ENEMY_CASTER_CONFIG.hp * 2 * levelMultiplier; // Doubled
            eDmg = ENEMY_CASTER_CONFIG.damage + playerLevel;
            eSpeed = ENEMY_CASTER_CONFIG.speed;
            eRadius = ENEMY_RADIUS;
            attackCooldown = 0;
            break;

        case 'dummy':
            eHp = 2000; // Testing Health
            eDmg = 0;
            eSpeed = 0;
            eRadius = ENEMY_RADIUS;
            attackCooldown = 60;
            break;

        case 'melee':
        default:
            const baseHp = 60; // 30 -> 60
            eHp = baseHp * levelMultiplier;
            eDmg = ZOMBIE_CONFIG.baseDamage + (playerLevel * ZOMBIE_CONFIG.damagePerLevel);
            eSpeed = ENEMY_BASE_SPEED + (playerLevel * 0.1);
            eRadius = ENEMY_RADIUS;
            attackCooldown = 30;
            break;
        case 'wolf':
            eHp = 60;
            eSpeed = 2.8;
            eDmg = 12;
            eRadius = 0.6;
            break;
    }

    // Apply Difficulty Scaling
    eHp *= difficultyFactor;
    eDmg *= difficultyFactor;

    // Apply Elite Modifiers
    if (isElite && type !== 'boss') {
        eHp *= ELITE_CONFIG.hpMultiplier;
        eDmg *= ELITE_CONFIG.damageMultiplier;
        eRadius *= 1.2;
    }

    eMaxHp = eHp;

    return {
        id: `enemy_${Date.now()}_${Math.random()}`,
        pos: { ...pos },
        velocity: { x: 0, y: 0 },
        radius: eRadius,
        facingRight: false,
        // Hitbox: ellipse that roughly covers the body. offsetY pulls center up a bit.
        hitbox: {
            rx: eRadius * 1.2,
            ry: eRadius * 1.8,
            offsetX: 0,
            offsetY: -0.6,
            rotation: 0
        },
        shockTimer: 0,
        isDead: false,
        hp: eHp,
        maxHp: eMaxHp,
        speed: eSpeed,
        damage: eDmg,
        isFrozen: false,
        freezeTimer: 0,
        type: type,
        isElite: isElite,
        attackCooldown: attackCooldown,
        stuckCheckTimer: 0,
        stuckCounter: 0,
        lastStuckPos: { ...pos },
        isPhasing: false,
        phaseTimer: 0,
        burnTimer: 0,
        burnDamage: 0,

        // Rewards
        xpValue: Math.floor(eHp * 2),
        coinValue: Math.floor(eHp * 0.5),

        // Attack State
        isAttacking: false,
        attackStartTime: 0,
        nextAttackTime: 0,
        didDamage: false,

        // AI State
        spawnPos: { ...pos },
        aiState: 'PATROL',
        patrolTarget: null,
        patrolTimer: 0,
        hitTimer: 0,
        enemyState: 'ALIVE',
        deathTimer: 0
    };
};

export const createAlly = (pos: Vector2, name: string): import('../types').Ally => {
    return {
        id: `ally_${Date.now()}_${Math.random()}`,
        pos: { ...pos },
        velocity: { x: 0, y: 0 },
        radius: 0.5,
        isDead: false,
        name: name,
        headEmoji: '😎',
        scale: 1.2,
        colorScheme: {
            skin: '#eecfa1',
            shirt: '#1f2937', // Dark Grey/Black Suit
            pants: '#111827'  // Black Pants
        },
        description: "A friendly face in these dark times. Looking sharp."
    };
};

export const createXpOrb = (x: number, y: number, value: number): Loot => {
    // Add small scatter
    const scatterX = (Math.random() - 0.5) * 1.5;
    const scatterY = (Math.random() - 0.5) * 1.5;

    return {
        id: `xp_${Date.now()}_${Math.random()}`,
        pos: { x, y }, // Start exactly at enemy pos
        velocity: { x: 0, y: 0 },
        radius: 0.15, // Small physics radius
        isDead: false,
        type: 'xp_orb',
        life: LOOT_LIFE * 2, // Longer life than normal loot
        value: value,
        rarity: 'common',
        labelVisible: false,
        physics: {
            velocity: { x: 0, y: 0 },
            z: 0.5,
            vz: 0,
            isGrounded: false
        },
        renderPos: { x, y },
        xpProps: {
            state: 'DROPPING',
            timer: 0,
            velocity: { x: 0, y: 0 },
            targetGround: { x: x + scatterX, y: y + scatterY }, // Target the scattered position
            startPos: { x, y },
            vacuumSpeed: 0
        }
    };
};
