
import { COLORS } from '../../../constants';
import { toScreen } from '../../../utils/isometric';

export const renderTree = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    variant: string,
    isBurning: boolean,
    sway: number
) => {
    // 🌲 or 🌳
    const isPine = variant === '🌲';

    const trunkColor = '#3e2723';
    const leafColor = isBurning ? '#d35400' : (isPine ? '#143820' : '#1e4d2b');
    const leafHighlight = isBurning ? '#e67e22' : (isPine ? '#1d4d2e' : '#2d6a4f');

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Dynamic Sway
    ctx.rotate(sway * 0.05);

    // Shadow base
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = trunkColor;
    ctx.fillRect(-2, -2, 4, 10);

    // Foliage
    ctx.translate(0, -8);
    // ctx.rotate(sway * 0.1); // More sway at top

    if (isPine) {
        // Pine Tree (Triangle Stack)
        const levels = 3;
        for (let i = 0; i < levels; i++) {
            const width = 12 - (i * 3);
            const height = 12;
            const yOffset = -i * 8;

            ctx.fillStyle = leafColor;
            ctx.beginPath();
            ctx.moveTo(-width, yOffset + 5);
            ctx.lineTo(0, yOffset - height);
            ctx.lineTo(width, yOffset + 5);
            ctx.fill();

            // Highlight (Left Side)
            ctx.fillStyle = leafHighlight;
            ctx.beginPath();
            ctx.moveTo(-width, yOffset + 5);
            ctx.lineTo(0, yOffset - height);
            ctx.lineTo(0, yOffset + 5);
            ctx.fill();
        }
    } else {
        // Deciduous (Circle Clusters)
        ctx.fillStyle = leafColor;
        ctx.beginPath();
        ctx.arc(0, -10, 8, 0, Math.PI * 2); // Top
        ctx.arc(-6, -2, 7, 0, Math.PI * 2); // Left
        ctx.arc(6, -2, 7, 0, Math.PI * 2); // Right
        ctx.fill();

        // Highlight
        ctx.fillStyle = leafHighlight;
        ctx.beginPath();
        ctx.arc(-2, -12, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Burning Effect
    if (isBurning) {
        ctx.fillStyle = 'rgba(255, 69, 0, 0.4)';
        // Simple pulsing glow
        const glow = (Math.sin(Date.now() / 100) + 1) * 0.5;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(-10, -30, 20, 40);
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
};
