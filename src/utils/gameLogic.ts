import { GameState, Enemy, Player } from '../types';
import { SpellCallbacks } from '../modules/spells/SpellSystem';
import { spawnLoot } from '../systems/SpawnSystem';
import { createXpOrb } from './factory';
import { KILLS_PER_CHARGE, POTION_MAX_CHARGES } from '../constants';

export const handleEnemyDeath = (state: GameState, e: Enemy, callbacks: SpellCallbacks) => {
    state.score += 10;
    // XP
    state.player.xp += (e.type === 'boss' ? 200 : (e.type === 'golem' ? 30 : 20));

    // XP Orb Spawning
    const xpValue = (e.type === 'boss' ? 200 : (e.type === 'golem' ? 30 : 20));
    state.loot.push(createXpOrb(e.pos.x, e.pos.y, xpValue));

    // Quest
    if (state.activeQuest.type === 'kill') {
        state.activeQuest.current++;
    }

    // Potion Recharge Logic
    state.player.potionKillCounter++;
    if (state.player.potionKillCounter >= KILLS_PER_CHARGE) {
        state.player.potionKillCounter = 0;
        let recharged = false;
        if (state.player.potions.health < POTION_MAX_CHARGES) { state.player.potions.health++; recharged = true; }
        if (state.player.potions.mana < POTION_MAX_CHARGES) { state.player.potions.mana++; recharged = true; }
        if (state.player.potions.speed < POTION_MAX_CHARGES) { state.player.potions.speed++; recharged = true; }

        if (recharged) callbacks.addFloatingText("Flasks Recharged!", state.player.pos, '#00ff00');
    }

    // Reset Lock
    if (state.player.lockedTargetId === e.id) {
        state.player.lockedTargetId = null;
    }

    spawnLoot(state, e.pos, e.type === 'boss');
    callbacks.checkLevelUp(state.player);
};
