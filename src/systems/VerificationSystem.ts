import { GameState, SpellType, Player, Enemy, Vector2 } from '../types';
import { fireSpell } from '../modules/spells/SpellSystem';

// Mock Callbacks
const mockCallbacks = {
    addFloatingText: () => { },
    createExplosion: () => { },
    createAreaEffect: () => { },
    createExplosionShrapnel: () => { },
    createImpactPuff: () => { },
    createVisualEffect: () => { },
    checkLevelUp: () => { },
    onEnemyDeath: () => { },
    onEnemyHit: () => { }
};

// Deterministic Mock Player
const createMockPlayer = (): Player => ({
    id: 'mock_player',
    pos: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 0.5,
    isDead: false,
    name: 'Tester',
    heroClass: 'MAGE',
    facingRight: true,
    visuals: { bodyType: 'average', skinColor: '#fff', hairColor: '#fff', shirtColor: '#fff', pantsColor: '#fff' },
    morph: 'NONE',
    hp: 100,
    maxHp: 100,
    shield: 0,
    maxShield: 0,
    shieldRegenTimer: 0,
    mana: 100,
    maxMana: 100,
    xp: 0,
    xpTally: 0,
    xpTimer: 0,
    xpGlowTimer: 0,
    level: 1,
    toNextLevel: 100,
    currentSpell: SpellType.FIRE_FIREBALL,
    knownSpells: [SpellType.FIRE_FIREBALL],
    hotbar: [SpellType.FIRE_FIREBALL],
    cooldowns: {},
    speed: 5,
    statPoints: 0,
    spellTalentPoints: 0,
    spellTalents: { FIRE: { ignition: 0, blastRadius: 0, multiFlare: 0, pyromania: 0 }, ICE: { deepFreeze: 0, iciclePierce: 0, shatter: 0, frostbite: 0 }, LIGHTNING: { overload: 0, highVoltage: 0, chainReaction: 0, staticShock: 0 }, EARTH: { tremor: 0, heavyBoulder: 0, landslide: 0, aftershock: 0 }, WIND: { galeForce: 0, zephyrSpeed: 0, tailwind: 0, tornadoSize: 0 } },
    baseStats: { vitality: 0, power: 0, haste: 0, swiftness: 0, shield: 0 },
    bombAmmo: 0,
    isMounted: false,
    coins: 0,
    potions: { health: 0, mana: 0, speed: 0 },
    potionKillCounter: 0,
    activeBuffs: { speedBoost: 0, rockAuraTimer: 0, righteousFire: false, stoneskin: 0, thorns: 0, deflection: 0, morphTimer: 0 },
    equipment: { HEAD: null, CHEST: null, LEGS: null, FEET: null, SHOULDERS: null, MAIN_HAND: null, OFF_HAND: null },
    equippedCards: {},
    cardInventory: [],
    inventory: [],
    rockAura: { rotation: 0, rocks: [] },
    roll: { isRolling: false, timer: 0, cooldown: 0 },
    casting: { isCasting: false, currentSpell: SpellType.FIRE_FIREBALL, timer: 0, duration: 0, targetPos: { x: 0, y: 0 }, hitTargets: [] },
    attack: { isAttacking: false, phase: 'IDLE' as any, weaponId: null, timer: 0, duration: 0, cooldown: 0, comboCount: 0, targetPos: { x: 0, y: 0 }, hitTargets: [], comboWindowOpen: false, inputBuffer: false },
    lockedTargetId: null
});

const createMockGameState = (): GameState => ({
    player: createMockPlayer(),
    enemies: [],
    allies: [],
    projectiles: [],
    loot: [],
    texts: [],
    visualEffects: [],
    trees: {},
    score: 0,
    gameOver: false,
    activeQuest: { id: 'q1', type: 'kill', description: 'Test', target: 10, current: 0, rewardXp: 0, rewardCoins: 0 },
    questsCompleted: 0,
    shopItems: [],
    shopResetTimer: 0,
    areaEffects: [],
    worldObjects: []
});

export const verifySpellSnapshot = (spellId: SpellType, expectedSnapshot: any) => {
    const state = createMockGameState();
    const target: Vector2 = { x: 5, y: 0 };

    // Fire Spell
    const plan = fireSpell(state, target, spellId, mockCallbacks as any);

    if (!plan) {
        console.error(`[Verification] Spell ${spellId} failed to create a CastPlan.`);
        return false;
    }

    // Capture Snapshot
    const snapshot = {
        kind: plan.kind,
        damageMult: plan.stats.damageMult,
        projectileCount: plan.stats.projectileCount || 1, // Default to 1 if undefined
        spreadDegrees: plan.stats.spreadDegrees || 0,
        flags: plan.flags
    };

    // Compare
    const cleanExpected = JSON.stringify(expectedSnapshot);
    const cleanActual = JSON.stringify(snapshot);

    if (cleanExpected === cleanActual) {
        console.log(`%c[Verification] PASSED for ${spellId}`, 'color: green');
        return true;
    } else {
        console.error(`[Verification] FAILED for ${spellId}`);
        console.error(`Expected:`, cleanExpected);
        console.error(`Actual:`, cleanActual);
        return false;
    }
};

export const runVerificationSuite = () => {
    console.group('Running Spell Verification Suite');

    // 1. Fireball Baseline
    verifySpellSnapshot(SpellType.FIRE_FIREBALL, {
        kind: 'PROJECTILE',
        damageMult: 1, // Assumes default plan logic doesn't mess with mults purely
        projectileCount: 1,
        spreadDegrees: 0,
        flags: []
    });

    // Add more baselines here as we migrate

    console.groupEnd();
};
