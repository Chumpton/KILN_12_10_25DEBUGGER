import { GameState } from '../types';

export const cleanDeadEntities = (state: GameState) => {
    state.enemies = state.enemies.filter(e => !e.isDead);
    state.projectiles = state.projectiles.filter(p => !p.isDead);
    state.loot = state.loot.filter(l => !l.isDead);
    state.visualEffects = state.visualEffects.filter(v => { v.life--; return v.life > 0; });
    state.texts.forEach(t => { t.life--; t.pos.y += t.velocity.y; });
    state.texts = state.texts.filter(t => t.life > 0);
};
