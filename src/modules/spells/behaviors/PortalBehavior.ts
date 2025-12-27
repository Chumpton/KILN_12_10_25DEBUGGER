import { GameState, Player, Vector2 } from '../../../types';
// Updated import
import { SpellCallbacks } from '../SpellBehavior';
import { BEHAVIOR_REGISTRY } from '../BehaviorRegistry';
import { SpellDefinition } from '../SpellRegistry';

export const PortalBehavior = {
    onCast: (state: GameState, config: SpellDefinition, player: Player, target: Vector2, callbacks: SpellCallbacks) => {
        const stamp = Date.now();
        const originId = `portal_origin_${stamp}`;
        const targetId = `portal_target_${stamp}`;

        // Duration in MS (GameLoop passes dt in ms to updateAreaEffects)
        const portalDuration = 12000;
        const portalRadius = 2.0;

        const makePortal = (id: string, pos: Vector2, linkedPortalId: string) => ({
            id,
            spellType: config.spellKey,
            pos: { x: pos.x, y: pos.y },
            radius: portalRadius,
            duration: portalDuration,
            damage: 0,
            ownerId: player.id,
            isDead: false,
            tickTimer: 0,
            tickInterval: 999999, // Disable ticking
            velocity: { x: 0, y: 0 },
            data: {
                subtype: 'PORTAL',
                linkedPortalId
            }
        });

        state.areaEffects.push(makePortal(originId, player.pos, targetId));
        state.areaEffects.push(makePortal(targetId, target, originId));

        callbacks.createVisualEffect('nova', player.pos, 30, { color: '#8b5cf6', radius: 2 });
        callbacks.createVisualEffect('nova', target, 30, { color: '#8b5cf6', radius: 2 });
    }
};
