
import { EquipmentItem, Rarity, EquipmentSlot, PlayerBaseStats } from '../../types';
// import { EQUIPMENT_THEMES } from '../../constants';

// Suffix Definitions
const SUFFIXES = [
    { name: "of the Bear", stat: "vitality", min: 1, max: 3, weight: 10 },
    { name: "of the Eagle", stat: "swiftness", min: 1, max: 2, weight: 8 },
    { name: "of the Owl", stat: "power", min: 1, max: 3, weight: 8 },
    { name: "of the Whale", stat: "hp", min: 10, max: 30, weight: 10 },
    { name: "of the Tiger", stat: "damage", min: 1, max: 3, weight: 6 },
    { name: "of Haste", stat: "haste", min: 1, max: 2, weight: 6 },
    { name: "of Stone", stat: "shield", min: 5, max: 15, weight: 8 }
];

const WEAPON_TYPES = ['SWORD']; // Add Bow/Staff later
const SLOT_TYPES: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'FEET', 'SHOULDERS', 'MAIN_HAND'];

export const generateLootItem = (level: number, forceType?: 'weapon' | 'armor'): EquipmentItem => {
    // 1. Determine Slot/Type
    let slot: EquipmentSlot = 'MAIN_HAND';
    if (forceType === 'weapon') {
        slot = 'MAIN_HAND';
    } else if (forceType === 'armor') {
        const armors: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'FEET', 'SHOULDERS'];
        slot = armors[Math.floor(Math.random() * armors.length)];
    } else {
        // Random
        slot = SLOT_TYPES[Math.floor(Math.random() * SLOT_TYPES.length)];
    }

    // 2. Rarity Calculation
    const roll = Math.random();
    let rarity: Rarity = 'common';
    let affixCount = 0;

    if (roll < 0.05) { rarity = 'legendary'; affixCount = 3; }
    else if (roll < 0.20) { rarity = 'rare'; affixCount = 2; }
    else if (roll < 0.50) { rarity = 'common'; affixCount = 1; } // "Magic" in data but keep simple types for now
    else { rarity = 'common'; affixCount = 0; }

    // 3. Generate Name & Affixes
    let name = "";
    const stats: Partial<PlayerBaseStats> = {};

    // Base Name
    if (slot === 'MAIN_HAND') name = "Iron Sword";
    else if (slot === 'HEAD') name = "Leather Cap";
    else if (slot === 'CHEST') name = "Tunic";
    else if (slot === 'LEGS') name = "Trousers";
    else if (slot === 'FEET') name = "Boots";
    else if (slot === 'SHOULDERS') name = "Mantle";

    // Apply Suffixes
    for (let i = 0; i < affixCount; i++) {
        const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];

        // Prevent duplicate suffixes (simple check)
        if (name.includes(suffix.name)) {
            i--;
            continue;
        }

        // Apply Stat
        const statKey = suffix.stat as keyof PlayerBaseStats;
        const val = Math.floor(Math.random() * (suffix.max - suffix.min + 1)) + suffix.min;

        // Scale by Level
        const scaledVal = Math.floor(val * (1 + level * 0.1));

        stats[statKey] = (stats[statKey] || 0) + scaledVal;

        // Update Name (Only first suffix gets appended effectively in this simple version, or "of the Bear & Eagle")
        if (!name.includes("of")) {
            name += ` ${suffix.name}`;
        } else {
            // Dual suffix logic if needed, simplify for now
            // name += ` and ${suffix.name.replace("of ", "")}`; 
        }
    }

    // 4. Base Stats (Implicit)
    if (slot === 'MAIN_HAND') {
        stats.damage = (stats.damage || 0) + 5 + (level * 2);
    } else {
        stats.vitality = (stats.vitality || 0) + 1 + Math.floor(level * 0.5);
    }

    return {
        id: `item_${Date.now()}_${Math.random()}`,
        name: name,
        slot: slot,
        rarity: rarity,
        visual: {
            theme: 'RUSTED',
            primaryColor: '#ffffff'
        },
        stats: stats,
        icon: slot === 'MAIN_HAND' ? '🗡️' : '🛡️',
        w: 1,
        h: 1,
        weaponType: slot === 'MAIN_HAND' ? 'SWORD' : undefined
    };
};
