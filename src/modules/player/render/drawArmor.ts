/**
 * drawArmor - Renders equipped armor pieces with rotation and theme styling
 */

import { EquipmentItem, VisualTheme } from '../../../types';

interface ArmorRenderParams {
    ctx: CanvasRenderingContext2D;
    armor: EquipmentItem;
}

export const drawHeadArmor = (ctx: CanvasRenderingContext2D, armor: EquipmentItem) => {
    const theme = armor.visual.theme;
    const baseColor = armor.visual.primaryColor;

    ctx.save();
    // Head context is typically centered at (0,0) of the head bone.
    // Head asset is approx 24x26ish. Center is roughly middle.

    switch (theme) {
        case 'RUSTED':
            drawLeatherCap(ctx, baseColor);
            break;
        case 'IRON':
            drawIronHelmet(ctx, baseColor);
            break;
        case 'HIGHLORD':
            drawHighlordCrown(ctx, baseColor);
            break;
        case 'NECRO':
            drawNecroHood(ctx, baseColor);
            break;
    }
    ctx.restore();
};

export const drawShoulderArmor = (ctx: CanvasRenderingContext2D, armor: EquipmentItem) => {
    const theme = armor.visual.theme;
    const baseColor = armor.visual.primaryColor;

    ctx.save();
    switch (theme) {
        case 'RUSTED':
            drawLeatherPads(ctx, baseColor);
            break;
        case 'IRON':
            drawIronPauldrons(ctx, baseColor);
            break;
        case 'HIGHLORD':
            drawHighlordWings(ctx, baseColor);
            break;
        case 'NECRO':
            drawNecroMantle(ctx, baseColor);
            break;
    }
    ctx.restore();
};

export const drawChestArmor = (ctx: CanvasRenderingContext2D, armor: EquipmentItem) => {
    // Drawn on top of Torso
    const theme = armor.visual.theme;
    const baseColor = armor.visual.primaryColor;

    ctx.save();
    switch (theme) {
        case 'RUSTED':
            drawLeatherVest(ctx, baseColor);
            break;
        case 'IRON':
            drawIronPlate(ctx, baseColor);
            break;
        case 'HIGHLORD':
            drawHighlordPlate(ctx, baseColor);
            break;
        case 'NECRO':
            drawNecroRobes(ctx, baseColor);
            break;
    }
    ctx.restore();
};


// --- IMPLEMENTATIONS ---

// HEAD
function drawLeatherCap(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    // Simple cap shape
    ctx.beginPath();
    ctx.arc(0, -5, 12, Math.PI, 0); // Top dome
    ctx.lineTo(12, 0);
    ctx.lineTo(-12, 0);
    ctx.fill();
    // Band
    ctx.fillStyle = '#654321';
    ctx.fillRect(-12, -2, 24, 4);
}

function drawIronHelmet(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // Full helm
    ctx.beginPath();
    ctx.moveTo(-10, 5); // Cheek guard L
    ctx.lineTo(-10, -10);
    ctx.quadraticCurveTo(0, -18, 10, -10);
    ctx.lineTo(10, 5); // Cheek guard R
    ctx.lineTo(6, 5);
    ctx.lineTo(6, -2); // Eye slit start
    ctx.lineTo(-6, -2);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rivets
    ctx.fillStyle = '#d1d5db';
    ctx.beginPath();
    ctx.arc(0, -12, 1, 0, Math.PI * 2);
    ctx.fill();
}

function drawHighlordCrown(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color; // Gold
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;

    // Crown spikes
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-4, -2);
    ctx.lineTo(0, -14); // Center spike
    ctx.lineTo(4, -2);
    ctx.lineTo(8, -10);
    ctx.lineTo(12, 0);
    ctx.lineTo(12, 4);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gem
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -4, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawNecroHood(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color; // Dark Purple

    // Hood shape covering head
    ctx.beginPath();
    ctx.moveTo(-13, 8);
    ctx.lineTo(-13, -10);
    ctx.quadraticCurveTo(0, -17, 13, -10);
    ctx.lineTo(13, 8);
    // Cowl/Neck opening
    ctx.quadraticCurveTo(0, 12, -13, 8);
    ctx.fill();

    // Deep shadow inside
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2); // Face hole
    ctx.fill();
}


// SHOULDERS
function drawLeatherPads(ctx: CanvasRenderingContext2D, color: string) {
    // Shoulder pad drawn at shoulder joint
    ctx.fillStyle = color;
    ctx.strokeStyle = '#3d2f1f';

    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI, 0); // Half circle top
    ctx.lineTo(8, 6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawIronPauldrons(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#1f2937';

    // Big rounded plate
    ctx.beginPath();
    ctx.arc(0, -2, 10, Math.PI, 0);
    ctx.lineTo(10, 8);
    ctx.quadraticCurveTo(0, 12, -10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ridge
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 8);
    ctx.stroke();
}

function drawHighlordWings(ctx: CanvasRenderingContext2D, color: string) {
    // Stylized wing-like pauldron
    ctx.fillStyle = color;
    ctx.strokeStyle = '#b45309';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, -12); // Wing tip up
    ctx.quadraticCurveTo(8, -14, 14, -4);
    ctx.lineTo(10, 6);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.stroke();
}

function drawNecroMantle(ctx: CanvasRenderingContext2D, color: string) {
    // Spiky dark mantle
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-12, -14); // Spike 1
    ctx.lineTo(-4, -6);
    ctx.lineTo(0, -12); // Spike 2
    ctx.lineTo(4, -6);
    ctx.lineTo(12, -14); // Spike 3
    ctx.lineTo(8, 0);
    ctx.fill();
}


// CHEST
function drawLeatherVest(ctx: CanvasRenderingContext2D, color: string) {
    // Draws over torso
    ctx.fillStyle = color;
    ctx.fillRect(-10, -35, 20, 30); // Main body

    // Straps
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(-10, -25, 20, 3);
    ctx.fillRect(-10, -15, 20, 3);
}

function drawIronPlate(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#374151';

    // Breastplate
    ctx.beginPath();
    ctx.moveTo(-11, -38); // Shoulder L
    ctx.lineTo(11, -38); // Shoulder R
    ctx.lineTo(9, -10); // Waist R
    ctx.lineTo(0, -5); // Codpiece point
    ctx.lineTo(-9, -10); // Waist L
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawHighlordPlate(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    // Same as iron but fancy
    ctx.beginPath();
    ctx.moveTo(-12, -39);
    ctx.lineTo(12, -39);
    ctx.lineTo(10, -8);
    ctx.lineTo(0, 0);
    ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.fill();

    // Gold Trim
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emblem
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -30, 6, 10);
}

function drawNecroRobes(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    // Robe covers more
    ctx.beginPath();
    ctx.moveTo(-11, -38);
    ctx.lineTo(11, -38);
    ctx.lineTo(14, 0);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    // Runes
    ctx.fillStyle = '#c4b5fd';
    ctx.font = '8px monospace';
    ctx.fillText('⚡', -3, -20);
}
