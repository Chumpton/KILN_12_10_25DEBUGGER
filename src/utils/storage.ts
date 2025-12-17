import { Player } from '../types';

const STORAGE_KEY = 'kiln_characters_v3';

export const getSavedCharacters = (): Player[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const chars: Player[] = JSON.parse(raw);
        // Migration Patch: Ensure all characters have 'attack' state
        return chars.map(c => {
            if (!c.attack) {
                c.attack = {
                    isAttacking: false,
                    weaponId: null,
                    timer: 0,
                    duration: 0,
                    cooldown: 0,
                    comboCount: 0,
                    targetPos: { x: 0, y: 0 },
                    hitTargets: [],
                    phase: 'IDLE' as any, // default phase
                    comboWindowOpen: false,
                    inputBuffer: false
                };
            }
            // Migration: Prevent SWORD_SWIPE being the active spell now that it's Left Click
            if (c.currentSpell === 'SWORD_SWIPE') {
                c.currentSpell = 'FIRE' as any;
            }
            return c;
        });
    } catch (e) {
        return [];
    }
};

export const saveCharacter = (player: Player) => {
    const chars = getSavedCharacters();
    const index = chars.findIndex(c => c.id === player.id);
    if (index >= 0) {
        chars[index] = player;
    } else {
        chars.push(player);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
};

export const deleteCharacter = (id: string) => {
    const chars = getSavedCharacters().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
};
