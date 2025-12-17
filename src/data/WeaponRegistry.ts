
import { SpellType, Rarity } from '../types';

export interface WeaponDef {
    id: string;
    name: string;
    visual: string; // Emoji or sprite key
    rarity: Rarity;
    grantedSpellId: SpellType;
    offset: { x: number; y: number }; // Hand position offset
}

// Load custom weapons
import customWeapons from './registries/weapons.json';

const customMap: Record<string, WeaponDef> = {};
((customWeapons as any[]) || []).forEach(w => {
    // Determine spelling type mapping if needed, or default
    customMap[w.id] = {
        ...w,
        grantedSpellId: w.grantedSpellId ? (w.grantedSpellId as SpellType) : SpellType.SWORD_SWIPE,
        offset: w.offset || { x: 20, y: 10 }
    };
});

export const WEAPON_REGISTRY: Record<string, WeaponDef> = {
    'novice_sword': {
        id: 'novice_sword',
        name: 'Novice Sword',
        visual: '🗡️',
        rarity: 'common',
        grantedSpellId: SpellType.SWORD_SWIPE,
        offset: { x: 20, y: 10 }
    },
    ...customMap
};
