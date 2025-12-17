

import { Enemy } from '../../../types';

export const renderAnt = (
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    x: number,
    y: number
) => {
    const time = Date.now();
    const antBounce = Math.sin(time / 50) * 2; // Fast jittery bounce
    const shadowRadius = 8;

    ctx.save();
    if (enemy.isElite) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y, shadowRadius, shadowRadius / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Status filters
    let filterString = '';
    if (enemy.isFrozen) filterString += 'hue-rotate(180deg) brightness(1.5) ';
    if ((enemy as any).isHovered) filterString += 'drop-shadow(0 0 1px rgba(220, 50, 50, 0.5)) ';
    if (filterString) ctx.filter = filterString;

    // Facing flip
    if (enemy.facingRight) {
        ctx.translate(x, y);
        ctx.scale(-1, 1);
        ctx.translate(-x, -y);
    }

    const drawY = y - 10 + antBounce;

    // Red Circle Backing
    ctx.fillStyle = enemy.isElite ? '#fcd34d' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, drawY - 5, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText('🐜', x, drawY - 4);

    ctx.restore();

    // Health Bar (Tiny)
    const barW = 20;
    const barH = 4;
    const barY = y - 30;
    const barX = x - barW / 2;
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
};
