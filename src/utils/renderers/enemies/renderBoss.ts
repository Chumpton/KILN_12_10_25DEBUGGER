

import { Enemy } from '../../../types';
import { toScreen } from '../../isometric';

export const renderBoss = (
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    x: number,
    y: number
) => {
    const time = Date.now();

    // --- CONFIG ---
    let animSpeed = 250;
    let scale = 2.0;
    const skinColor = '#e6e6e6';
    const shirtColor = '#a6a6a6';
    const pantsColor = '#737373';
    const headEmoji = '☠️';

    // Boss scale is already 2.0, elite adds 1.3 usually but Boss IS elite usually?
    if (enemy.isElite) scale *= 1.3;

    // --- ANIMATION STATE ---
    const bounce = Math.sin(time / animSpeed) * 2;
    const walkRange = 8;

    // --- SHADOW ---
    const shadowRadius = 32 * scale;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y, shadowRadius, shadowRadius / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- BODY CONTEXT ---
    ctx.save();

    // Glows (Optimized: No Blur)
    if (enemy.isElite) {
        // ctx.shadowColor = '#ffd700';
        // ctx.shadowBlur = 15;
    }
    if ((enemy as any).isHovered) {
        // ctx.shadowColor = 'rgba(220, 50, 50, 0.4)';
        // ctx.shadowBlur = 10;
        // Draw selection ring instead
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 50, 50, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 20 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Status Filters
    let filterString = '';
    if ((enemy as any).isHovered) filterString += 'drop-shadow(0 0 1px rgba(220, 50, 50, 0.5)) ';
    if (enemy.isFrozen) filterString += 'hue-rotate(180deg) brightness(1.5) ';
    if (filterString) ctx.filter = filterString;

    // Flip
    if (enemy.facingRight) {
        ctx.translate(x, y);
        ctx.scale(-1, 1);
        ctx.translate(-x, -y);
    }

    const shoulderY = y - (44 * scale) + bounce;
    const armWidth = 6 * scale;
    const sleeveWidth = 6 * scale;

    // --- ARM LOGIC ---
    const getArmState = (isFront: boolean) => {
        const zOffset = isFront ? (6 * scale) : -(6 * scale);
        const shoulder = { x: x + zOffset, y: shoulderY };
        const bicepLen = 14 * scale;
        const forearmLen = 13 * scale;
        const swayOffset = isFront ? 0 : 1000;
        let sway = Math.sin((time + swayOffset) / 400) * 0.2;
        let baseAngle = -Math.PI / 2 + 0.2;

        if (isFront && enemy.isAttacking) {
            const elapsed = Date.now() - enemy.attackStartTime;
            const duration = 300;
            const progress = Math.min(1, Math.max(0, elapsed / duration));
            if (progress < 0.2) {
                baseAngle = -Math.PI / 2 - (progress * 5 * 0.8);
                sway = 0;
            } else {
                const swingProgress = (progress - 0.2) / 0.8;
                baseAngle = (-Math.PI / 2 - 0.8) + (swingProgress * Math.PI * 1.5);
                sway = 0;
            }
        }

        const bicepAngle = baseAngle + sway;
        const forearmAngle = 0.3;
        const elbow = {
            x: shoulder.x + Math.sin(bicepAngle) * bicepLen,
            y: shoulder.y + Math.cos(bicepAngle) * bicepLen
        };
        const absoluteForearmAngle = bicepAngle + forearmAngle;
        const wrist = {
            x: elbow.x + Math.sin(absoluteForearmAngle) * forearmLen,
            y: elbow.y + Math.cos(absoluteForearmAngle) * forearmLen
        };
        return { shoulder, elbow, wrist, bicepAngle };
    };

    const drawArm = (isFront: boolean) => {
        const state = getArmState(isFront);
        ctx.strokeStyle = skinColor;
        ctx.lineWidth = armWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(state.shoulder.x, state.shoulder.y);
        ctx.lineTo(state.elbow.x, state.elbow.y);
        ctx.lineTo(state.wrist.x, state.wrist.y);
        ctx.stroke();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(state.elbow.x, state.elbow.y, armWidth / 2 + 1, 0, Math.PI * 2);
        ctx.fill();

        const sleeveEnd = {
            x: state.shoulder.x + (state.elbow.x - state.shoulder.x) * 0.2,
            y: state.shoulder.y + (state.elbow.y - state.shoulder.y) * 0.2
        };
        ctx.strokeStyle = shirtColor;
        ctx.lineWidth = sleeveWidth;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(state.shoulder.x, state.shoulder.y);
        ctx.lineTo(sleeveEnd.x, sleeveEnd.y);
        ctx.stroke();
    };

    const drawHand = (isFront: boolean) => {
        const state = getArmState(isFront);
        ctx.save();
        ctx.translate(state.wrist.x, state.wrist.y);
        if (isFront && enemy.isAttacking) {
            ctx.rotate(-state.bicepAngle + Math.PI);
        } else {
            ctx.rotate(-Math.PI / 2);
            ctx.rotate(bounce * 0.05);
        }
        
        if (!isFront && !enemy.facingRight) ctx.scale(-1, 1);
        if (!isFront && enemy.facingRight) ctx.scale(-1, 1);

        let handSize = 18 * scale;
        if (enemy.isAttacking && isFront) handSize *= 1.5;

        ctx.font = `${handSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.filter = 'grayscale(1) brightness(1.3) contrast(1.2)';

        let handEmoji = '✋';
        if (enemy.isAttacking && isFront) handEmoji = '🦞'; // Claw

        ctx.fillText(handEmoji, 0, 0);
        ctx.restore();
    };

    // --- DRAW ORDER ---
    drawArm(false);

    // Legs
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 6 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const hipY = y - (28 * scale) + bounce;
    const ankleBaseY = y;
    const leftLegSwing = Math.sin(time / animSpeed) * walkRange;
    const rightLegSwing = Math.sin((time / animSpeed) + Math.PI) * (walkRange * 0.5);

    const drawLeg = (hipX: number, swing: number, isDragging: boolean) => {
        const ankleX = hipX + (swing * scale);
        const liftMult = isDragging ? 0.5 : 2.0;
        const lift = Math.max(0, Math.sin(time / animSpeed + (swing === leftLegSwing ? 0 : Math.PI))) * liftMult * scale;
        const ankleY = ankleBaseY - lift;
        const kneeX = (hipX + ankleX) / 2 - (2 * scale);
        const kneeY = (hipY + ankleY) / 2;

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(ankleX, ankleY);
        ctx.stroke();

        ctx.fillStyle = pantsColor;
        ctx.beginPath(); ctx.arc(kneeX, kneeY, 4 * scale, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        const footSize = 12 * scale;
        ctx.font = `${footSize}px sans-serif`;
        ctx.translate(ankleX, ankleY);
        ctx.rotate(lift * 0.1);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.filter = 'grayscale(1) brightness(0.8)';
        ctx.fillText('🦶', 0, 0);
        ctx.restore();
    };

    drawLeg(x - (4 * scale), leftLegSwing, false);
    drawLeg(x + (4 * scale), rightLegSwing, true);

    // Body
    const shirtTopY = y - (48 * scale) + bounce;
    const shirtBottomY = y - (24 * scale) + bounce;
    ctx.strokeStyle = shirtColor;
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x, shirtTopY);
    ctx.lineTo(x, shirtBottomY);
    ctx.stroke();

    // Ribs
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 2 * scale;
    for (let i = 0; i < 3; i++) {
        const ribY = shirtTopY + (10 * scale) + (i * 6 * scale);
        ctx.beginPath();
        ctx.moveTo(x - 6 * scale, ribY);
        ctx.lineTo(x + 6 * scale, ribY);
        ctx.stroke();
    }

    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 14 * scale;
    ctx.beginPath();
    ctx.moveTo(x, shirtBottomY);
    ctx.lineTo(x, shirtBottomY + (4 * scale));
    ctx.stroke();

    drawArm(true);

    // Head
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const headSize = 32 * scale;
    ctx.font = `${headSize}px sans-serif`;
    ctx.fillText(headEmoji, x, y - (48 * scale) + bounce);

    drawHand(false);
    drawHand(true);

    ctx.restore();

    // --- HITBOX --- 
    if (enemy.hitbox) {
        const cx = enemy.pos.x + (enemy.hitbox.offsetX || 0);
        const cy = enemy.pos.y + (enemy.hitbox.offsetY || 0);
        const screenCenter = toScreen(cx, cy);
        const screenRxPt = toScreen(cx + enemy.hitbox.rx, cy);
        const screenRyPt = toScreen(cx, cy + enemy.hitbox.ry);
        const screenRx = Math.abs(screenRxPt.x - screenCenter.x);
        const screenRy = Math.abs(screenRyPt.y - screenCenter.y);

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.ellipse(screenCenter.x, screenCenter.y, Math.max(2, screenRx), Math.max(2, screenRy), enemy.hitbox.rotation || 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // --- UI BARS ---
    const barW = 100;
    const barH = 6;
    const barY = y - 150;
    const barX = x - barW / 2;
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = enemy.isElite ? '#fcd34d' : '#ef4444';
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    if (enemy.isElite) {
        ctx.font = '12px sans-serif';
        ctx.fillText('👑', x, barY - 2);
    }
    if (enemy.burnTimer > 0) {
        ctx.font = '16px sans-serif';
        ctx.fillText('🔥', x, barY - 5);
    }
};
