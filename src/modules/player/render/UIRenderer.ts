import { Player } from '../../../types';
import { ENTITY_RIGS } from '../../../data/EntityRigDefinitions';

export interface UIRenderOptions {
    showHealthBar: boolean;
    showCastBar: boolean;
    showShieldBar: boolean;
}

export class UIRenderer {
    /**
     * Render all UI elements for the player
     */
    public static renderPlayerUI(
        ctx: CanvasRenderingContext2D,
        player: Player,
        x: number,
        y: number,
        facingRight: boolean,
        options: UIRenderOptions = { showHealthBar: true, showCastBar: true, showShieldBar: true }
    ): void {
        const rig = ENTITY_RIGS['skeleton_npc'];
        const s = rig?.scale || 1;

        // Calculate anchor positions
        const hpPart = rig?.parts?.['hp_bar'];
        let hpX = x;
        let hpY = y - 100;

        if (hpPart) {
            hpX = x + (hpPart.x * s * (!facingRight ? -1 : 1));
            hpY = y + (hpPart.y * s);
        }

        // Float HP Bar Higher if Mounted
        if (player.isMounted) {
            hpY -= 20;
        }

        // Health Bar
        if (options.showHealthBar) {
            this.renderHealthBar(ctx, player, hpX, hpY);
        }

        // Shield Bar
        if (options.showShieldBar && player.shield > 0) {
            this.renderShieldBar(ctx, player, hpX, hpY);
        }

        // Cast Bar
        if (options.showCastBar && player.casting.isCasting) {
            this.renderCastBar(ctx, player, x, y);
        }
    }

    private static renderHealthBar(
        ctx: CanvasRenderingContext2D,
        player: Player,
        x: number,
        y: number
    ): void {
        const barW = 50;
        const barH = 6;
        const barX = x - barW / 2;
        const barY = y;

        // Background (Empty)
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(barX, barY, barW, barH);

        // HP Fill
        const hpPct = Math.max(0, Math.min(1, player.hp / player.maxHp));
        if (hpPct > 0) {
            ctx.fillStyle = '#ef4444'; // Red
            ctx.fillRect(barX, barY, barW * hpPct, barH);
        }

        // Gold Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
    }

    private static renderShieldBar(
        ctx: CanvasRenderingContext2D,
        player: Player,
        x: number,
        y: number
    ): void {
        const barW = 50;
        const barH = 6;
        const barX = x - barW / 2;
        const barY = y - 9; // Stacked above

        // Background
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(barX, barY, barW, barH);

        const shieldPct = Math.min(1, player.shield / player.maxShield);
        if (shieldPct > 0) {
            ctx.fillStyle = '#06b6d4'; // Cyan
            ctx.fillRect(barX, barY, barW * shieldPct, barH);
        }

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
    }

    private static renderCastBar(
        ctx: CanvasRenderingContext2D,
        player: Player,
        x: number,
        y: number
    ): void {
        const castPct = Math.min(1, player.casting.timer / player.casting.duration);
        const castBarW = 40;
        const castBarH = 4;
        const castBarX = x - castBarW / 2;
        const castBarY = y + 10; // Below character's feet

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(castBarX, castBarY, castBarW, castBarH);

        // Progress fill (white, semi-transparent)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(castBarX, castBarY, castBarW * castPct, castBarH);

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(castBarX, castBarY, castBarW, castBarH);
    }

    /**
     * Render spell charge effect at hand position
     * @param armRotation The rotation of the arm bone in radians (0 = right, PI/2 = down, PI = left, -PI/2 = up)
     */
    public static renderSpellCharge(
        ctx: CanvasRenderingContext2D,
        handX: number,
        handY: number,
        chargePercent: number,
        armRotation: number,
        color: string = '#ffaa00'
    ): void {
        const size = 5 + (chargePercent * 10); // Grows from 5 to 15px

        // Render directly at the hand position (no offset)
        // The hand position already accounts for the arm's rotation and length
        const bx = handX;
        const by = handY;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;

        ctx.globalAlpha = 0.7 + chargePercent * 0.2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bx, by, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff'; // White core
        ctx.beginPath();
        ctx.arc(bx, by, size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
