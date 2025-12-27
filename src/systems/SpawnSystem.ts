
import { GameState, Enemy, EquipmentItem, EquipmentSlot, Rarity, ShopItem, Loot, Vector2 } from '../types';
import { ENEMY_RADIUS, BOSS_CONFIG, COIN_VALUE_RANGE, LOOT_LIFE, LOOT_DROP_CHANCE, HEARTHSTONE_POS, SAFE_ZONE_RADIUS } from '../constants';
import { getDistance } from '../utils/isometric';
import { createEnemy } from '../utils/factory';

// Name Generation Tables
const ADJECTIVES: Record<string, string[]> = {
    RUSTED: ['Broken', 'Cracked', 'Old', 'Rusted', 'Tarnished', 'Weathered'],
    IRON: ['Sturdy', 'Heavy', 'Polished', 'Iron', 'Steel', 'Reinforced'],
    HIGHLORD: ['Gilded', 'Golden', 'Radiant', 'Royal', 'Highlord\'s', 'Ancient'],
    NECRO: ['Doomed', 'Cursed', 'Void', 'Ethereal', 'Necrotic', 'Soul']
};

const NOUNS: Record<string, string> = {
    HEAD: 'Helm', CHEST: 'Plate', LEGS: 'Greaves', FEET: 'Boots', SHOULDERS: 'Pauldrons', MAIN_HAND: 'Blade'
};

const SUFFIXES = [
    'of the Bear', 'of the Bull', 'of the Owl', 'of the Eagle', 'of Vitality', 'of Power', 'of Haste', 'of Swiftness'
];

const generateItemName = (rarity: Rarity, slot: EquipmentSlot, theme: import('../types').VisualTheme): string => {
    const adjList = ADJECTIVES[theme] || ADJECTIVES.RUSTED;
    const prefix = adjList[Math.floor(Math.random() * adjList.length)];
    const noun = NOUNS[slot] || 'Item';

    let name = `${prefix} ${noun}`;

    // 30% chance for a cool suffix
    if (Math.random() < 0.3 || rarity === 'legendary' || rarity === 'mythic') {
        const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
        name += ` ${suffix}`;
    }

    // Mythic/Legendary always get a Title Case feel or special name
    if (rarity === 'mythic') {
        name = `Mythical ${name}`;
    }

    return name;
};

export const generateEquipment = (level: number): EquipmentItem => {
    const slots: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'FEET', 'SHOULDERS', 'MAIN_HAND'];
    // Weighted slot selection (slightly less weapons)
    const slotRoll = Math.random();
    let slot: EquipmentSlot = 'CHEST';
    if (slotRoll < 0.2) slot = 'HEAD';
    else if (slotRoll < 0.4) slot = 'CHEST';
    else if (slotRoll < 0.6) slot = 'LEGS';
    else if (slotRoll < 0.75) slot = 'FEET';
    else if (slotRoll < 0.90) slot = 'SHOULDERS';
    else slot = 'MAIN_HAND'; // 10% Weapon

    const rand = Math.random();
    let rarity: Rarity = 'common';
    let theme: import('../types').VisualTheme = 'RUSTED';
    let statBudget = 1;

    // Rarity & Theme Logic
    // simple progression: low level = rusted/iron, high level = highlord/necro
    // But also chance for high tier at low level
    if (rand > 0.98) {
        rarity = 'mythic';
        statBudget = 5;
        theme = 'NECRO';
    } else if (rand > 0.90) {
        rarity = 'legendary';
        statBudget = 4;
        theme = 'HIGHLORD';
    } else if (rand > 0.75) {
        rarity = 'rare';
        statBudget = 3;
        theme = 'IRON';
    } else {
        rarity = 'common';
        statBudget = 1 + Math.floor(Math.random() * 2);
        theme = Math.random() > 0.5 ? 'RUSTED' : 'IRON';
    }

    // Override Theme by Level (bias towards better looking gear as you level)
    if (level >= 10 && theme === 'RUSTED') theme = 'IRON';
    if (level >= 20 && (theme === 'RUSTED' || theme === 'IRON')) theme = 'HIGHLORD';

    const item: EquipmentItem = {
        id: `equip_${Date.now()}_${Math.random()}`,
        name: `Unknown Item`,
        slot,
        rarity,
        visual: {
            theme: theme,
            primaryColor: '#ffffff' // Will be ignored by theme renderers mostly, but good fallback
        },
        stats: {},
        icon: '',
        w: 1,
        h: 1
    };

    // Dimensions & Icons
    switch (slot) {
        case 'HEAD':
            item.w = 1; item.h = 1;
            item.icon = { RUSTED: '🧢', IRON: '⛑️', HIGHLORD: '👑', NECRO: '🎩' }[theme];
            break;
        case 'CHEST':
            item.w = 2; item.h = 2;
            item.icon = { RUSTED: '🎽', IRON: '🛡️', HIGHLORD: '⚜️', NECRO: '🧥' }[theme];
            break;
        case 'LEGS':
            item.w = 2; item.h = 2;
            item.icon = { RUSTED: '👖', IRON: '🦿', HIGHLORD: '🦵', NECRO: '🩲' }[theme];
            break;
        case 'FEET':
            item.w = 1; item.h = 1;
            item.icon = { RUSTED: '👢', IRON: '🥾', HIGHLORD: '👞', NECRO: '🦶' }[theme];
            break;
        case 'SHOULDERS':
            item.w = 2; item.h = 1;
            item.icon = { RUSTED: '🧣', IRON: '🛡️', HIGHLORD: '🪽', NECRO: '🦇' }[theme];
            break;
        case 'MAIN_HAND':
            item.w = 1; item.h = 3; // Swords are tall
            item.icon = { RUSTED: '🗡️', IRON: '⚔️', HIGHLORD: '⚔️', NECRO: '🗡️' }[theme];
            item.weaponType = 'SWORD';
            item.weaponLength = 35 + (level * 2);
            if (item.weaponLength > 60) item.weaponLength = 60;
            break;
    }

    // Assign Stats (Power, Vitality, Haste, Swiftness)
    for (let i = 0; i < statBudget; i++) {
        const type = Math.random();
        const levelMult = Math.max(1, level);

        if (type < 0.4) {
            item.stats.vitality = (item.stats.vitality || 0) + Math.floor(1 + levelMult * 0.5);
        } else if (type < 0.7) {
            item.stats.power = (item.stats.power || 0) + Math.floor(1 + levelMult * 0.2);
            if (slot === 'MAIN_HAND') item.stats.power! += 2; // Bias power on weapons
        } else if (type < 0.85) {
            item.stats.haste = (item.stats.haste || 0) + 1;
        } else {
            item.stats.swiftness = (item.stats.swiftness || 0) + 1;
        }
    }

    item.name = generateItemName(rarity, slot, theme);

    return item;
};

export const generateShopItems = (level: number): ShopItem[] => {
    const items: ShopItem[] = [];
    for (let i = 0; i < 12; i++) {
        const equip = generateEquipment(level);
        const rarityMult = { common: 1, rare: 2.5, legendary: 5, mythic: 10 }[equip.rarity];
        const price = Math.floor(100 * level * rarityMult * (0.8 + Math.random() * 0.4));
        items.push({
            ...equip,
            price
        });
    }
    return items;
};

export const spawnEnemy = (state: GameState, difficultyFactor: number, callbacks: { addFloatingText: (t: string, p: Vector2, c: string) => void }) => {
    // Level-based Spawning Cap: 5 + (Level - 1)
    const currentCap = 5 + (state.player.level - 1);
    const hardCap = 100; // Performance hard limit
    const finalCap = Math.min(currentCap, hardCap);

    if (state.enemies.length >= finalCap) return;

    // Try to find a valid spawn position outside the safe zone
    let spawnX = 0;
    let spawnY = 0;
    let validSpawn = false;
    let attempts = 0;

    const angle = Math.random() * Math.PI * 2;
    const distance = 28;

    spawnX = state.player.pos.x + Math.cos(angle) * distance;
    spawnY = state.player.pos.y + Math.sin(angle) * distance;

    validSpawn = true;

    if (!validSpawn) return; // Skip spawn frame if no valid pos found

    const spawnBoss = state.bossSpawnPending;
    let type: Enemy['type'] = 'melee';
    let isElite = false;

    if (spawnBoss) {
        type = 'boss';
        state.bossSpawnPending = false;
        callbacks.addFloatingText("BOSS SPAWNED!", { x: spawnX, y: spawnY }, '#ff0000');
    } else {
        // WEIGHTED SPAWN TABLE
        // 5% Elite
        if (Math.random() < 0.05) {
            isElite = true;
            // Elites can be any base type (handled below)
        }

        const roll = Math.random();

        if (roll < 0.50) {
            // 50% Default/Ant
            // Split between Melee and Ant if level > 2
            if (state.player.level >= 2 && Math.random() > 0.7) {
                type = 'ant';
            } else {
                type = 'melee';
            }
        } else if (roll < 0.80) {
            // 30% Spitter
            type = 'spitter';
        } else {
            // 15% Golem + remaining 5% from Elite calculation implies base type distribution
            // Let's adhere to "15% Chance: Golem"
            type = 'golem';
        }
    }

    const enemy = createEnemy(
        { x: spawnX, y: spawnY },
        type,
        difficultyFactor,
        state.player.level,
        isElite
    );

    state.enemies.push(enemy);
};

export const spawnLoot = (state: GameState, pos: Vector2, isBoss: boolean = false) => {
    const coinCount = Math.floor(Math.random() * 3) + 1 + (isBoss ? BOSS_CONFIG.coinMultiplier : 0);
    for (let i = 0; i < coinCount; i++) {
        const scatter = {
            x: pos.x + (Math.random() - 0.5) * 1.5,
            y: pos.y + (Math.random() - 0.5) * 1.5
        };
        const val = Math.floor(Math.random() * (COIN_VALUE_RANGE.max - COIN_VALUE_RANGE.min + 1)) + COIN_VALUE_RANGE.min;
        state.loot.push({
            id: `coin_${Date.now()}_${i}`,
            pos: scatter,
            velocity: { x: 0, y: 0 },
            radius: 0.2,
            isDead: false,
            type: 'coin',
            life: LOOT_LIFE,
            value: val
        });
    }

    const rand = Math.random();
    let type: Loot['type'] = 'bomb';
    let data: EquipmentItem | undefined = undefined;

    // Adjusted logic: No potions from loot
    if (rand < 0.3 || isBoss) {
        type = 'equipment';
        data = generateEquipment(state.player.level);
        if (isBoss) {
            // Guarantee at least epic
            data.rarity = Math.random() > 0.5 ? 'legendary' : 'rare';
            data.name = `BOSS ${data.slot}`;
        }
    } else {
        type = 'bomb';
    }

    if (Math.random() < LOOT_DROP_CHANCE || isBoss) {
        state.loot.push({
            id: `loot_${Date.now()}_${Math.random()}`,
            pos: { ...pos },
            velocity: { x: 0, y: 0 },
            radius: 0.3,
            isDead: false,
            type: type,
            life: LOOT_LIFE,
            data: data
        });
    }
};