/**
 * drawWeapon - Renders equipped weapons with rotation and theme styling
 */

import { EquipmentItem } from '../../../types';

interface WeaponRenderParams {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    weapon: EquipmentItem;
    rotation: number;
    facingRight: boolean;
}

export const drawWeapon = ({ ctx, x, y, weapon, rotation, facingRight }: WeaponRenderParams) => {
    if (!weapon.weaponLength || weapon.weaponType !== 'SWORD') return;

    const length = weapon.weaponLength;
    const theme = weapon.visual?.theme;
    const baseColor = weapon.visual?.primaryColor || '#888';

    ctx.save();
    ctx.translate(x, y);

    const rotationRad = (rotation * Math.PI) / 180;
    ctx.rotate(rotationRad);

    switch (theme) {
        case 'RUSTED':
            drawRustedSword(ctx, length, baseColor);
            break;
        case 'IRON':
            drawIronSword(ctx, length, baseColor);
            break;
        case 'HIGHLORD':
            drawHighlordSword(ctx, length, baseColor);
            break;
        case 'NECRO':
            drawNecroSword(ctx, length, baseColor);
            break;
        default:
            drawRustedSword(ctx, length, baseColor);
    }

    ctx.restore();
};

function drawRustedSword(ctx: CanvasRenderingContext2D, length: number, color: string) {
    const bladeWidth = 6;

    ctx.fillStyle = color;
    ctx.strokeStyle = '#3d2f1f';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-bladeWidth / 2, -length * 0.15);
    ctx.lineTo(-bladeWidth / 2, -length * 0.85);
    ctx.lineTo(0, -length);
    ctx.lineTo(bladeWidth / 2, -length * 0.85);
    ctx.lineTo(bladeWidth / 2, -length * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.1);
    ctx.lineTo(0, -length * 0.9);
    ctx.stroke();

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-2, -length * 0.3, 1, 2);
    ctx.fillRect(1, -length * 0.5, 1, 2);
    ctx.fillRect(-1, -length * 0.7, 1, 1);

    ctx.fillStyle = '#654321';
    ctx.strokeStyle = '#3d2f1f';
    ctx.lineWidth = 1;
    ctx.fillRect(-10, -3, 20, 6);
    ctx.strokeRect(-10, -3, 20, 6);

    ctx.fillStyle = '#8b7355';
    ctx.fillRect(-3, 0, 6, 14);

    ctx.strokeStyle = '#6b5d4f';
    ctx.lineWidth = 1;
    for (let i = 2; i < 14; i += 3) {
        ctx.beginPath();
        ctx.moveTo(-3, i);
        ctx.lineTo(3, i);
        ctx.stroke();
    }

    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(0, 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d2f1f';
    ctx.stroke();
}

function drawIronSword(ctx: CanvasRenderingContext2D, length: number, color: string) {
    const gradient = ctx.createLinearGradient(-3, 0, 3, 0);
    gradient.addColorStop(0, '#4b5563');
    gradient.addColorStop(0.5, '#9ca3af');
    gradient.addColorStop(1, '#4b5563');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-3, -length * 0.85);
    ctx.lineTo(0, -length);
    ctx.lineTo(3, -length * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.fillRect(-8, -3, 16, 6);

    ctx.fillStyle = '#6b7280';
    ctx.fillRect(-2, 0, 4, 10);
}

function drawHighlordSword(ctx: CanvasRenderingContext2D, length: number, color: string) {
    const gradient = ctx.createLinearGradient(-4, 0, 4, 0);
    gradient.addColorStop(0, '#b45309');
    gradient.addColorStop(0.5, '#fbbf24');
    gradient.addColorStop(1, '#b45309');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, -length * 0.9);
    ctx.lineTo(0, -length);
    ctx.lineTo(4, -length * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(-2, -length + 5);
    ctx.moveTo(2, -5);
    ctx.lineTo(2, -length + 5);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-10, 0, 3, 0, Math.PI * 2);
    ctx.arc(10, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-10, -2, 20, 4);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(-3, 0, 6, 12);
}

function drawNecroSword(ctx: CanvasRenderingContext2D, length: number, color: string) {
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 8;

    const gradient = ctx.createLinearGradient(-4, 0, 4, 0);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(1, '#1e1b4b');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, -length * 0.85);
    ctx.lineTo(-3, -length);
    ctx.lineTo(3, -length);
    ctx.lineTo(5, -length * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const offset = -length * (0.3 + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(-4, offset);
        ctx.lineTo(4, offset);
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-10, -3, 20, 6);

    ctx.fillStyle = '#6d28d9';
    ctx.fillRect(-3, 0, 6, 12);
}
