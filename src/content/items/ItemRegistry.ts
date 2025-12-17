import { EquipmentItem } from '../../types';
import { ARMOR_ITEMS } from './definitions/Armor';
import { WEAPON_ITEMS } from './definitions/Weapons';

// Custom Items
import customWeapons from '../../data/registries/weapons.json';
import customArmor from '../../data/registries/armor.json';

const customItems: Record<string, EquipmentItem> = {};

(customWeapons as any[]).forEach(w => {
    customItems[w.id] = {
        id: w.id,
        name: w.name,
        slot: w.slot || 'MAIN_HAND',
        rarity: w.rarity,
        visual: { theme: 'RUSTED', primaryColor: '#fff' }, // Visual Override needed likely
        stats: w.stats || {},
        icon: w.visual, // Use sprite as icon
        weaponId: w.id,
        w: 1,
        h: 2
    };
});

(customArmor as any[]).forEach(a => {
    customItems[a.id] = {
        id: a.id,
        name: a.name,
        slot: a.slot || 'CHEST',
        rarity: a.rarity,
        visual: a.visual,
        stats: a.stats || {},
        icon: a.visual.path || '🛡️',
        w: 2,
        h: 2
    };
});

export const ITEM_REGISTRY: Record<string, EquipmentItem> = {
    ...ARMOR_ITEMS,
    ...WEAPON_ITEMS,
    ...customItems
};

// Helper to get item by ID safely
export const getItem = (id: string): EquipmentItem | undefined => {
    return ITEM_REGISTRY[id];
};

export const getAllItems = (): EquipmentItem[] => {
    return Object.values(ITEM_REGISTRY);
};
