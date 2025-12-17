import { Ally } from '../../../types';

export const renderGenericAlly = (
    ctx: CanvasRenderingContext2D,
    ally: Ally,
    x: number,
    y: number
) => {
    const time = Date.now();
    const bounce = Math.sin(time / 400) * 2;
    const scale = ally.scale || 1.0;

    // --- HOVER / SELECTION ---
    const isHovered = (ally as any).isHovered;
    const isSelected = (ally as any).isSelected;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();

    if (isHovered || isSelected) {
        ctx.shadowColor = 'rgba(255, 255, 0, 0.6)';
        ctx.shadowBlur = 15;
    }
    if (isHovered) {
        ctx.filter = 'drop-shadow(0 0 1px rgba(255, 255, 0, 1.0)) brightness(1.1)';
    }

    const skinColor = ally.colorScheme.skin;
    const shirtColor = ally.colorScheme.shirt;
    const pantsColor = ally.colorScheme.pants;

    const hipY = -28 + bounce;
    const shoulderY = -44 + bounce;
    const headY = -48 + bounce;

    // Legs
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, hipY); ctx.lineTo(-4, 0);
    ctx.moveTo(4, hipY); ctx.lineTo(4, 0);
    ctx.stroke();

    // Body
    ctx.strokeStyle = shirtColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, headY);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // Belt
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(0, hipY + 4);
    ctx.stroke();

    // Arms
    const shoulderL = { x: -9, y: shoulderY };
    const shoulderR = { x: 9, y: shoulderY };
    const handY = -24 + bounce + Math.sin(time / 500) * 2;
    const wristL = { x: -12, y: handY };
    const wristR = { x: 12, y: handY };

    // Left Arm
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(shoulderL.x, shoulderL.y);
    ctx.lineTo(wristL.x, wristL.y);
    ctx.stroke();
    // Sleeve L
    ctx.strokeStyle = shirtColor;
    ctx.beginPath();
    ctx.moveTo(shoulderL.x, shoulderL.y);
    ctx.lineTo(-10, shoulderY + 8);
    ctx.stroke();

    // Right Arm
    ctx.strokeStyle = skinColor;
    ctx.beginPath();
    ctx.moveTo(shoulderR.x, shoulderR.y);
    ctx.lineTo(wristR.x, wristR.y);
    ctx.stroke();
    // Sleeve R
    ctx.strokeStyle = shirtColor;
    ctx.beginPath();
    ctx.moveTo(shoulderR.x, shoulderR.y);
    ctx.lineTo(10, shoulderY + 8);
    ctx.stroke();

    // Head
    const headSize = 28;
    ctx.font = `${headSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(ally.headEmoji || '🙂', 0, headY);

    ctx.restore();
    ctx.restore();

    // Name Tag
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(ally.name, 1, headY - 39);
    ctx.fillStyle = isHovered || isSelected ? '#ffff00' : '#ffffff';
    ctx.fillText(ally.name, 0, headY - 40);
    ctx.restore();
};
