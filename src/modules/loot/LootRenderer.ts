
import { Camera } from '../../engine/graphics/Camera';
import { Loot } from '../../types';
import { LOOT_PHYSICS, RARITY_COLORS } from '../../constants';
import { toScreen } from '../../utils/isometric';

export const LootRenderer = {
    render: (ctx: CanvasRenderingContext2D, camera: Camera, lootItems: Loot[], mouseScreen: { x: number, y: number }, showLabels: boolean) => {
        const sortedLoot = [...lootItems].filter(i => !i.isDead && i.renderPos).sort((a, b) => a.renderPos.y - b.renderPos.y);

        // 1. Render Beams (Behind items) for Legendary/Set
        sortedLoot.forEach(item => {
            if (item.rarity === 'legendary' || item.rarity === 'set' || item.rarity === 'mythic') {
                renderBeam(ctx, camera, item);
            }
        });

        // 2. Render Shadows & Sprites
        sortedLoot.forEach(item => {
            renderItemShadow(ctx, camera, item);
            renderItemSprite(ctx, camera, item);
        });

        // 3. Render Labels (Top Layer)
        sortedLoot.forEach(item => {
            const s = camera.toScreen(item.renderPos.x, item.renderPos.y);
            const spriteY = s.y - (item.physics.z * 32);

            const dx = Math.abs(mouseScreen.x - s.x);
            const dy = Math.abs(mouseScreen.y - spriteY);

            const isHovered = dx < 20 && dy < 20;

            if (showLabels || isHovered || item.rarity === 'legendary' || item.rarity === 'set') {
                renderLabel(ctx, camera, item, isHovered);
            }
        });
    }
};

const renderBeam = (ctx: CanvasRenderingContext2D, camera: Camera, item: Loot) => {
    const s = camera.toScreen(item.renderPos.x, item.renderPos.y);
    const color = RARITY_COLORS[item.rarity];

    ctx.save();
    ctx.globalAlpha = 0.3;
    const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y - 150);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(s.x - 10, s.y - 150, 20, 150);

    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 15, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
};

const renderItemShadow = (ctx: CanvasRenderingContext2D, camera: Camera, item: Loot) => {
    const s = camera.toScreen(item.renderPos.x, item.renderPos.y);
    const scale = Math.max(0.5, 1 - item.physics.z / 2);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.translate(s.x, s.y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const renderItemSprite = (ctx: CanvasRenderingContext2D, camera: Camera, item: Loot) => {
    const s = camera.toScreen(item.renderPos.x, item.renderPos.y);
    const lift = item.physics.z * 32;
    const drawY = s.y - lift;

    ctx.save();
    ctx.translate(s.x, drawY);

    // TRAIL EFFECT (If moving fast / vacuuming)
    // We can infer vacuuming if velocity is high or if we add a flag.
    // Let's use a simple velocity check for now or the item's custom props if accessible.
    // Casting item to any to access custom runtime props from LootSystem
    const runtimeItem = item as any;
    if (runtimeItem.vacuumTime > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = item.type === 'coin' ? '#fcd34d' : '#a855f7';
        // Draw a few circles trailing behind? 
        // Or just a line? Line is cleaner for "Comet".

        // We need velocity direction.
        // We don't have normalized velocity easily here without calc.
        // But we can just draw a "glow" that stretches?

        // Simple Trail: Draw slightly smaller circles at previous positions? 
        // We don't track history.
        // Fallback: Directional Blur / Stretch.

        // Let's draw a "tail" assumes moving towards player?
        // Actually, just a simple glow behind is enough for "Comet" if we can't get vector.
        // But we DO have velocity in physics logic, let's assume it's stored in physics.velocity?
        // Logic overrides physics velocity during vacuum...
        // Let's rely on the "Glow" being the trail.

        ctx.shadowColor = item.type === 'coin' ? '#fbbf24' : '#d8b4fe';
        ctx.shadowBlur = 20;
        ctx.restore();
    }

    if (item.type === 'coin') {
        // More visible coin
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2); // Slightly larger
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();

    } else if (item.type === 'xp_orb') {
        // Glowing Orb (larger for visibility)
        ctx.fillStyle = '#d8b4fe'; // Light Purple to match tally
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = '#d8b4fe';
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

    } else if (item.type === 'equipment') {
        const color = RARITY_COLORS[item.rarity];
        ctx.fillStyle = color;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-6, -6, 12, 12);

    } else if (item.type === 'potion') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(4, 0);
        ctx.lineTo(4, 6);
        ctx.bezierCurveTo(4, 8, -4, 8, -4, 6);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

const renderLabel = (ctx: CanvasRenderingContext2D, camera: Camera, item: Loot, isHovered: boolean) => {
    if (item.type === 'coin' || item.type === 'xp_orb') return;

    const s = camera.toScreen(item.renderPos.x, item.renderPos.y);
    const lift = item.physics.z * 32;
    const drawY = s.y - lift - 20;

    const name = item.data?.name || item.type.toUpperCase();
    const color = RARITY_COLORS[item.rarity];

    ctx.save();
    ctx.translate(s.x, drawY);

    ctx.font = "bold 12px sans-serif";
    const textMetrics = ctx.measureText(name);
    const w = textMetrics.width + 12;
    const h = 20;

    ctx.fillStyle = isHovered ? 'rgba(20, 20, 20, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 0, 0);

    ctx.restore();
};
