/**
 * Gear Visuals - Procedural vector-based equipment rendering engine
 * Organized by Slot -> Theme -> Render Function
 */

import { VisualTheme } from '../../../types';
import { setMetallicGradient, drawRivet, drawStitching, applyGlowEffect, clearGlowEffect } from '../../../utils/graphics';

type GearRenderer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facingRight: boolean
) => void;

// ============================================================================
// HEAD RENDERERS
// ============================================================================

const HEAD_RUSTED: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Simple leather cap
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.arc(x, y - 60, 14, Math.PI, Math.PI * 2, false);
    ctx.fill();

    // Stitching detail
    drawStitching(ctx, x - 12, y - 60, x + 12, y - 60);

    ctx.restore();
};

const HEAD_IRON: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Metal helmet
    const gradient = setMetallicGradient(ctx, x - 15, y - 65, 30, 20, '#6b7280');
    ctx.fillStyle = gradient;

    // Helmet dome
    ctx.beginPath();
    ctx.arc(x, y - 60, 16, Math.PI, Math.PI * 2, false);
    ctx.fill();

    // Visor slit
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 10, y - 58, 20, 3);

    // Rivets
    drawRivet(ctx, x - 12, y - 62, 2);
    drawRivet(ctx, x + 12, y - 62, 2);

    ctx.restore();
};

const HEAD_HIGHLORD: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Large golden crown
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    // Crown base
    ctx.beginPath();
    ctx.arc(x, y - 60, 18, Math.PI, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    // Crown spikes
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 12, y - 60);
        ctx.lineTo(x + i * 12, y - 75);
        ctx.lineTo(x + i * 12 + 4, y - 68);
        ctx.lineTo(x + i * 12, y - 75);
        ctx.lineTo(x + i * 12 - 4, y - 68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // White trim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y - 60, 16, Math.PI, Math.PI * 2, false);
    ctx.stroke();

    ctx.restore();
};

const HEAD_NECRO: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Dark hood with glow
    applyGlowEffect(ctx, '#a855f7', 8);

    ctx.fillStyle = '#1f1b24';
    ctx.beginPath();
    ctx.arc(x, y - 60, 17, Math.PI, Math.PI * 2, false);
    ctx.fill();

    clearGlowEffect(ctx);

    // Floating skull ornament (offset from head)
    ctx.fillStyle = '#7c3aed';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    applyGlowEffect(ctx, '#a855f7', 6);
    ctx.fillText('💀', x, y - 75);
    clearGlowEffect(ctx);

    ctx.restore();
};

// ============================================================================
// SHOULDERS RENDERERS
// ============================================================================

const SHOULDERS_RUSTED: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    const shoulderX = facingRight ? x + 10 : x - 10;
    const shoulderY = y - 56;

    // Small leather pad
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.arc(shoulderX, shoulderY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Strap
    ctx.strokeStyle = '#6b5d52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY - 6);
    ctx.lineTo(shoulderX, shoulderY + 6);
    ctx.stroke();

    ctx.restore();
};

const SHOULDERS_IRON: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    const shoulderX = facingRight ? x + 12 : x - 12;
    const shoulderY = y - 56;

    // Spiked pauldron
    const gradient = setMetallicGradient(ctx, shoulderX - 8, shoulderY - 8, 16, 16, '#6b7280');
    ctx.fillStyle = gradient;

    // Main plate
    ctx.beginPath();
    ctx.arc(shoulderX, shoulderY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Spike
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY - 8);
    ctx.lineTo(shoulderX - 3, shoulderY - 4);
    ctx.lineTo(shoulderX + 3, shoulderY - 4);
    ctx.closePath();
    ctx.fill();

    // Rivets
    drawRivet(ctx, shoulderX - 5, shoulderY, 1.5);
    drawRivet(ctx, shoulderX + 5, shoulderY, 1.5);

    ctx.restore();
};

const SHOULDERS_HIGHLORD: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    const shoulderX = facingRight ? x + 14 : x - 14;
    const shoulderY = y - 56;
    const wingDir = facingRight ? 1 : -1;

    // Massive golden wings
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    // Wing shape (curved outward)
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.quadraticCurveTo(
        shoulderX + wingDir * 15,
        shoulderY - 10,
        shoulderX + wingDir * 20,
        shoulderY - 5
    );
    ctx.quadraticCurveTo(
        shoulderX + wingDir * 18,
        shoulderY + 5,
        shoulderX,
        shoulderY + 10
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // White trim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
};

const SHOULDERS_NECRO: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    const shoulderX = facingRight ? x + 12 : x - 12;
    const shoulderY = y - 56;

    // Floating dark plate with glow
    applyGlowEffect(ctx, '#a855f7', 10);

    ctx.fillStyle = '#1f1b24';
    ctx.beginPath();
    ctx.arc(shoulderX, shoulderY - 2, 10, 0, Math.PI * 2); // Offset upward (floating)
    ctx.fill();

    // Purple energy lines
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shoulderX - 6, shoulderY - 2);
    ctx.lineTo(shoulderX + 6, shoulderY - 2);
    ctx.moveTo(shoulderX, shoulderY - 8);
    ctx.lineTo(shoulderX, shoulderY + 4);
    ctx.stroke();

    clearGlowEffect(ctx);

    ctx.restore();
};

// ============================================================================
// CHEST RENDERERS
// ============================================================================

const CHEST_RUSTED: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Simple leather vest
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(x - 10, y - 60, 20, 24);

    // Stitching
    drawStitching(ctx, x - 10, y - 60, x + 10, y - 60);
    drawStitching(ctx, x - 10, y - 36, x + 10, y - 36);

    // Belt
    ctx.fillStyle = '#6b5d52';
    ctx.fillRect(x - 10, y - 40, 20, 3);

    ctx.restore();
};

const CHEST_IRON: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Metal breastplate
    const gradient = setMetallicGradient(ctx, x - 10, y - 60, 20, 24, '#6b7280');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 10, y - 60, 20, 24);

    // Plate segments
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 50);
    ctx.lineTo(x + 10, y - 50);
    ctx.moveTo(x - 10, y - 45);
    ctx.lineTo(x + 10, y - 45);
    ctx.stroke();

    // Rivets
    drawRivet(ctx, x - 8, y - 58, 2);
    drawRivet(ctx, x + 8, y - 58, 2);
    drawRivet(ctx, x - 8, y - 38, 2);
    drawRivet(ctx, x + 8, y - 38, 2);

    ctx.restore();
};

const CHEST_HIGHLORD: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Large golden plate
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    // Main plate (larger)
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 62, 24, 28, 4);
    ctx.fill();
    ctx.stroke();

    // White trim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Decorative gem
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y - 48, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

const CHEST_NECRO: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Dark plate
    ctx.fillStyle = '#1f1b24';
    ctx.fillRect(x - 10, y - 60, 20, 24);

    // Glowing ribcage effect
    applyGlowEffect(ctx, '#a855f7', 8);

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;

    // Ribs
    for (let i = 0; i < 4; i++) {
        const ribY = y - 58 + i * 5;
        ctx.beginPath();
        ctx.moveTo(x - 6, ribY);
        ctx.quadraticCurveTo(x, ribY + 2, x + 6, ribY);
        ctx.stroke();
    }

    clearGlowEffect(ctx);

    ctx.restore();
};

// ============================================================================
// LEGS RENDERERS
// ============================================================================

const LEGS_RUSTED: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Simple brown pants (drawn as thicker leg lines)
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 40);
    ctx.lineTo(x - 5, y - 10);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 40);
    ctx.lineTo(x + 5, y - 10);
    ctx.stroke();

    ctx.restore();
};

const LEGS_IRON: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Metal greaves
    const gradient = setMetallicGradient(ctx, x - 8, y - 40, 6, 30, '#6b7280');

    // Left leg
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 8, y - 40, 6, 30);
    drawRivet(ctx, x - 5, y - 35, 1.5);
    drawRivet(ctx, x - 5, y - 15, 1.5);

    // Right leg
    ctx.fillRect(x + 2, y - 40, 6, 30);
    drawRivet(ctx, x + 5, y - 35, 1.5);
    drawRivet(ctx, x + 5, y - 15, 1.5);

    ctx.restore();
};

const LEGS_HIGHLORD: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Golden leg plates (larger)
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    // Left leg
    ctx.beginPath();
    ctx.roundRect(x - 9, y - 40, 7, 32, 2);
    ctx.fill();
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.roundRect(x + 2, y - 40, 7, 32, 2);
    ctx.fill();
    ctx.stroke();

    // White trim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 9, y - 40, 7, 32, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x + 2, y - 40, 7, 32, 2);
    ctx.stroke();

    ctx.restore();
};

const LEGS_NECRO: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Dark floating leg plates
    applyGlowEffect(ctx, '#a855f7', 8);

    ctx.fillStyle = '#1f1b24';

    // Left leg (offset for floating effect)
    ctx.fillRect(x - 8, y - 42, 6, 30);

    // Right leg
    ctx.fillRect(x + 2, y - 42, 6, 30);

    // Purple energy
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 40);
    ctx.lineTo(x - 5, y - 12);
    ctx.moveTo(x + 5, y - 40);
    ctx.lineTo(x + 5, y - 12);
    ctx.stroke();

    clearGlowEffect(ctx);

    ctx.restore();
};

// ============================================================================
// FEET RENDERERS
// ============================================================================

const FEET_RUSTED: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Simple leather boots (small brown rectangles)
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(x - 7, y - 5, 5, 6);
    ctx.fillRect(x + 2, y - 5, 5, 6);

    ctx.restore();
};

const FEET_IRON: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Metal boots
    const gradient = setMetallicGradient(ctx, x - 7, y - 5, 5, 6, '#6b7280');
    ctx.fillStyle = gradient;

    ctx.fillRect(x - 7, y - 5, 5, 6);
    ctx.fillRect(x + 2, y - 5, 5, 6);

    // Toe caps
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(x - 7, y + 1, 5, 2);
    ctx.fillRect(x + 2, y + 1, 5, 2);

    ctx.restore();
};

const FEET_HIGHLORD: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Golden boots (larger)
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(x - 8, y - 6, 6, 7, 1);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(x + 2, y - 6, 6, 7, 1);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
};

const FEET_NECRO: GearRenderer = (ctx, x, y, facingRight) => {
    ctx.save();

    // Dark floating boots
    applyGlowEffect(ctx, '#a855f7', 6);

    ctx.fillStyle = '#1f1b24';
    ctx.fillRect(x - 7, y - 7, 5, 6); // Offset upward
    ctx.fillRect(x + 2, y - 7, 5, 6);

    clearGlowEffect(ctx);

    ctx.restore();
};

// ============================================================================
// MAIN_HAND & OFF_HAND (Placeholder - weapons handled separately)
// ============================================================================

const MAIN_HAND_DEFAULT: GearRenderer = (ctx, x, y, facingRight) => {
    // Weapons are handled by existing weapon rendering system
};

const OFF_HAND_DEFAULT: GearRenderer = (ctx, x, y, facingRight) => {
    // Shields/off-hand items can be added here
};

// ============================================================================
// EXPORT STRUCTURE
// ============================================================================

export const GEAR_VISUALS: Record<string, Record<VisualTheme, GearRenderer>> = {
    HEAD: {
        RUSTED: HEAD_RUSTED,
        IRON: HEAD_IRON,
        HIGHLORD: HEAD_HIGHLORD,
        NECRO: HEAD_NECRO
    },
    SHOULDERS: {
        RUSTED: SHOULDERS_RUSTED,
        IRON: SHOULDERS_IRON,
        HIGHLORD: SHOULDERS_HIGHLORD,
        NECRO: SHOULDERS_NECRO
    },
    CHEST: {
        RUSTED: CHEST_RUSTED,
        IRON: CHEST_IRON,
        HIGHLORD: CHEST_HIGHLORD,
        NECRO: CHEST_NECRO
    },
    LEGS: {
        RUSTED: LEGS_RUSTED,
        IRON: LEGS_IRON,
        HIGHLORD: LEGS_HIGHLORD,
        NECRO: LEGS_NECRO
    },
    FEET: {
        RUSTED: FEET_RUSTED,
        IRON: FEET_IRON,
        HIGHLORD: FEET_HIGHLORD,
        NECRO: FEET_NECRO
    },
    MAIN_HAND: {
        RUSTED: MAIN_HAND_DEFAULT,
        IRON: MAIN_HAND_DEFAULT,
        HIGHLORD: MAIN_HAND_DEFAULT,
        NECRO: MAIN_HAND_DEFAULT
    },
    OFF_HAND: {
        RUSTED: OFF_HAND_DEFAULT,
        IRON: OFF_HAND_DEFAULT,
        HIGHLORD: OFF_HAND_DEFAULT,
        NECRO: OFF_HAND_DEFAULT
    }
};
