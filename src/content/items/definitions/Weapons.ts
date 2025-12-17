import { EquipmentItem } from '../../../types';

export const WEAPON_ITEMS: Record<string, EquipmentItem> = {
    // SWORDS
    'rusted_sword': {
        id: 'rusted_sword',
        name: 'Rusted Sword',
        slot: 'MAIN_HAND',
        rarity: 'common',
        visual: { theme: 'RUSTED', primaryColor: '#8b7355' },
        stats: { power: 1 },
        icon: '🗡️',
        weaponId: 'novice_sword', // Links to WEAPON_REGISTRY
        weaponLength: 35,
        weaponType: 'SWORD',
        w: 1,
        h: 2
    },
    'iron_sword': {
        id: 'iron_sword',
        name: 'Iron Sword',
        slot: 'MAIN_HAND',
        rarity: 'rare',
        visual: { theme: 'IRON', primaryColor: '#6b7280' },
        stats: { power: 4, vitality: 3 },
        icon: '⚔️',
        weaponId: 'novice_sword', // Links to WEAPON_REGISTRY
        weaponLength: 40,
        weaponType: 'SWORD',
        w: 1,
        h: 2
    },
    'highlord_blade': {
        id: 'highlord_blade',
        name: 'Highlord Blade',
        slot: 'MAIN_HAND',
        rarity: 'legendary',
        visual: { theme: 'HIGHLORD', primaryColor: '#fbbf24' },
        stats: { power: 16, vitality: 10 },
        icon: '⚔️',
        weaponId: 'novice_sword', // Links to WEAPON_REGISTRY
        weaponLength: 45,
        weaponType: 'SWORD',
        w: 1,
        h: 3
    },
    'necro_scythe': {
        id: 'necro_scythe',
        name: 'Necro Scythe',
        slot: 'MAIN_HAND',
        rarity: 'mythic',
        visual: { theme: 'NECRO', primaryColor: '#7c3aed' },
        stats: { power: 60, vitality: 40, swiftness: 2 },
        icon: '🗡️',
        weaponId: 'novice_sword', // Links to WEAPON_REGISTRY
        weaponLength: 50,
        weaponType: 'SWORD',
        w: 1,
        h: 3
    }
};
