import { EquipmentItem } from '../../../types';

export const ARMOR_ITEMS: Record<string, EquipmentItem> = {
    // HEAD
    'leather_cap': {
        id: 'leather_cap',
        name: 'Leather Cap',
        slot: 'HEAD',
        rarity: 'common',
        visual: { theme: 'RUSTED', primaryColor: '#8b7355' },
        stats: { vitality: 1 },
        icon: '🧢',
        w: 1,
        h: 1
    },
    'iron_helmet': {
        id: 'iron_helmet',
        name: 'Iron Helmet',
        slot: 'HEAD',
        rarity: 'rare',
        visual: { theme: 'IRON', primaryColor: '#6b7280' },
        stats: { vitality: 5 },
        icon: '⛑️',
        w: 1,
        h: 1
    },
    'highlord_crown': {
        id: 'highlord_crown',
        name: 'Highlord Crown',
        slot: 'HEAD',
        rarity: 'legendary',
        visual: { theme: 'HIGHLORD', primaryColor: '#fbbf24' },
        stats: { vitality: 20, power: 2 },
        icon: '👑',
        w: 1,
        h: 1
    },
    'necro_hood': {
        id: 'necro_hood',
        name: 'Necromancer Hood',
        slot: 'HEAD',
        rarity: 'mythic',
        visual: { theme: 'NECRO', primaryColor: '#7c3aed' },
        stats: { vitality: 100, power: 10 },
        icon: '🎩',
        w: 1,
        h: 1
    },

    // SHOULDERS
    'leather_pads': {
        id: 'leather_pads',
        name: 'Leather Shoulder Pads',
        slot: 'SHOULDERS',
        rarity: 'common',
        visual: { theme: 'RUSTED', primaryColor: '#8b7355' },
        stats: { vitality: 1 },
        icon: '🎽',
        w: 2,
        h: 1
    },
    'iron_pauldrons': {
        id: 'iron_pauldrons',
        name: 'Iron Pauldrons',
        slot: 'SHOULDERS',
        rarity: 'rare',
        visual: { theme: 'IRON', primaryColor: '#6b7280' },
        stats: { vitality: 4 },
        icon: '🛡️',
        w: 2,
        h: 1
    },
    'highlord_wings': {
        id: 'highlord_wings',
        name: 'Highlord Wings',
        slot: 'SHOULDERS',
        rarity: 'legendary',
        visual: { theme: 'HIGHLORD', primaryColor: '#fbbf24' },
        stats: { vitality: 16, swiftness: 1 },
        icon: '🪽',
        w: 2,
        h: 1
    },
    'necro_mantle': {
        id: 'necro_mantle',
        name: 'Necro Mantle',
        slot: 'SHOULDERS',
        rarity: 'mythic',
        visual: { theme: 'NECRO', primaryColor: '#7c3aed' },
        stats: { vitality: 80, swiftness: 2, power: 6 },
        icon: '🦇',
        w: 2,
        h: 1
    },

    // CHEST
    'leather_vest': {
        id: 'leather_vest',
        name: 'Leather Vest',
        slot: 'CHEST',
        rarity: 'common',
        visual: { theme: 'RUSTED', primaryColor: '#8b7355' },
        stats: { vitality: 2 },
        icon: '🦺',
        w: 2,
        h: 2
    },
    'iron_breastplate': {
        id: 'iron_breastplate',
        name: 'Iron Breastplate',
        slot: 'CHEST',
        rarity: 'rare',
        visual: { theme: 'IRON', primaryColor: '#6b7280' },
        stats: { vitality: 10 },
        icon: '🛡️',
        w: 2,
        h: 2
    },
    'highlord_plate': {
        id: 'highlord_plate',
        name: 'Highlord Plate',
        slot: 'CHEST',
        rarity: 'legendary',
        visual: { theme: 'HIGHLORD', primaryColor: '#fbbf24' },
        stats: { vitality: 40, power: 4 },
        icon: '⚜️',
        w: 2,
        h: 2
    },
    'necro_robes': {
        id: 'necro_robes',
        name: 'Necro Robes',
        slot: 'CHEST',
        rarity: 'mythic',
        visual: { theme: 'NECRO', primaryColor: '#7c3aed' },
        stats: { vitality: 160, power: 20 },
        icon: '🧥',
        w: 2,
        h: 2
    },

    // LEGS
    'leather_pants': {
        id: 'leather_pants',
        name: 'Leather Pants',
        slot: 'LEGS',
        rarity: 'common',
        visual: { theme: 'RUSTED', primaryColor: '#8b7355' },
        stats: { vitality: 1 },
        icon: '👖',
        w: 2,
        h: 2
    },
    'iron_greaves': {
        id: 'iron_greaves',
        name: 'Iron Greaves',
        slot: 'LEGS',
        rarity: 'rare',
        visual: { theme: 'IRON', primaryColor: '#6b7280' },
        stats: { vitality: 6 },
        icon: '🦿',
        w: 2,
        h: 2
    },
    'highlord_legplates': {
        id: 'highlord_legplates',
        name: 'Highlord Legplates',
        slot: 'LEGS',
        rarity: 'legendary',
        visual: { theme: 'HIGHLORD', primaryColor: '#fbbf24' },
        stats: { vitality: 24, swiftness: 1 },
        icon: '🦵',
        w: 2,
        h: 2
    },
    'necro_leggings': {
        id: 'necro_leggings',
        name: 'Necro Leggings',
        slot: 'LEGS',
        rarity: 'mythic',
        visual: { theme: 'NECRO', primaryColor: '#7c3aed' },
        stats: { vitality: 120, swiftness: 3, power: 8 },
        icon: '🩲',
        w: 2,
        h: 2
    },

    // FEET
    'leather_boots': {
        id: 'leather_boots',
        name: 'Leather Boots',
        slot: 'FEET',
        rarity: 'common',
        visual: { theme: 'RUSTED', primaryColor: '#8b7355' },
        stats: { vitality: 1, swiftness: 1 },
        icon: '👢',
        w: 1,
        h: 1
    },
    'iron_boots': {
        id: 'iron_boots',
        name: 'Iron Boots',
        slot: 'FEET',
        rarity: 'rare',
        visual: { theme: 'IRON', primaryColor: '#6b7280' },
        stats: { vitality: 4, swiftness: 1 },
        icon: '🥾',
        w: 1,
        h: 1
    },
    'highlord_sabatons': {
        id: 'highlord_sabatons',
        name: 'Highlord Sabatons',
        slot: 'FEET',
        rarity: 'legendary',
        visual: { theme: 'HIGHLORD', primaryColor: '#fbbf24' },
        stats: { vitality: 16, swiftness: 2 },
        icon: '👞',
        w: 1,
        h: 1
    },
    'necro_treads': {
        id: 'necro_treads',
        name: 'Necro Treads',
        slot: 'FEET',
        rarity: 'mythic',
        visual: { theme: 'NECRO', primaryColor: '#7c3aed' },
        stats: { vitality: 80, swiftness: 4, power: 4 },
        icon: '🦶',
        w: 1,
        h: 1
    }
};
