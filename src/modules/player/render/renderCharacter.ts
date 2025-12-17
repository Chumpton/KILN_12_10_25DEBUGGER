import { Player, Vector2 } from '../../../types';
import { playerRenderer } from './PlayerRenderer';

/**
 * Main entry point for rendering the player character
 * 
 * This function now delegates to the new modular PlayerRenderer system
 * which handles:
 * - Animation state management
 * - Skeletal rendering with proper bone transforms
 * - UI overlays (health, cast bars, etc.)
 * - Spell effects (charge animations, etc.)
 * 
 * The new system is designed to be extensible for:
 * - Equipment/armor rendering
 * - Weapon animations
 * - Additional spell effects
 * - Custom visual effects
 */
export const renderCharacter = (
    ctx: CanvasRenderingContext2D,
    player: Player,
    x: number,
    y: number,
    moveTarget: Vector2 | null,
    hideUI: boolean = false,
    forcedFacing?: boolean,
    isWorldEditorActive?: boolean
) => {
    playerRenderer.render(ctx, player, x, y, moveTarget, hideUI, forcedFacing, isWorldEditorActive);
};
