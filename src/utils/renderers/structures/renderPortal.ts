import { toScreen } from '../../isometric';
import { GameState } from '../../../types';

export const renderPortal = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    cameraOffset: { x: number, y: number }
) => {
    const time = Date.now();

    // PORTAL CONFIG
    const CX = -36.6;
    const CY = -1.0;
    const SIZE_TILES = 7;

    // Ground Center
    const cS = toScreen(CX, CY);
    const xS = cS.x + cameraOffset.x;
    const yS = cS.y + cameraOffset.y;

    // Dimensions
    const RADIUS_Y = SIZE_TILES / 2;
    const lS = toScreen(CX, CY - RADIUS_Y);
    const rS = toScreen(CX, CY + RADIUS_Y);
    const dx = lS.x - rS.x;
    const dy = lS.y - rS.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Base Radius (Horizontal)
    const baseRadius = dist / 2;

    // Pulse Animation
    const pulse = Math.sin(time / 500) * 5;

    // Portal Dimensions
    const rX = baseRadius + pulse;
    const rY = (baseRadius * 1.2) + pulse;

    // Center Height: Float above ground
    const portalCenterY = yS - rY * 0.4;

    ctx.save();
    ctx.translate(xS, portalCenterY);

    // --- 5. Global Composite Operation 'lighter' ---
    ctx.globalCompositeOperation = 'lighter';

    // --- 2. Bloom (Shadow Blur) - Darker ---
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#4c1d95'; // Dark Violet

    // --- 1. Radial Gradient for Ring ---
    // Dark Palette: Transparent -> Deep Violet -> Transparent
    const gradRing = ctx.createRadialGradient(0, 0, rX * 0.7, 0, 0, rX * 1.1);
    gradRing.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
    gradRing.addColorStop(0.5, 'rgba(76, 29, 149, 0.9)'); // Violet-900 
    gradRing.addColorStop(0.8, 'rgba(109, 40, 217, 0.5)'); // Violet-700
    gradRing.addColorStop(1, 'rgba(76, 29, 149, 0)');

    ctx.fillStyle = gradRing;

    ctx.beginPath();
    ctx.ellipse(0, 0, rX + 10, rY + 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Inner Blue Field ---
    // Deep Abyssal Blue
    const gradBlue = ctx.createRadialGradient(0, 0, rX * 0.2, 0, 0, rX * 0.9);
    gradBlue.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
    gradBlue.addColorStop(0.6, 'rgba(30, 58, 138, 0.6)'); // Blue-900
    gradBlue.addColorStop(1, 'rgba(17, 24, 39, 0.9)'); // Grey-900 / Black edge

    ctx.fillStyle = gradBlue;
    ctx.beginPath();
    ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 4. Rotate Inner Shapes (Tunnel) ---
    // Violet Lines (No White)
    const numPolys = 5;
    ctx.strokeStyle = '#8b5cf6'; // Violet-500
    ctx.lineWidth = 3;

    ctx.shadowColor = '#312e81'; // Indigo-900 bloom
    ctx.shadowBlur = 15;

    for (let k = 0; k < numPolys; k++) {
        const pScale = 1.0 - (k * 0.18);
        const dir = k % 2 === 0 ? 1 : -1;
        const rotSpeed = (time / 2000) * (k + 1) * dir;

        ctx.save();
        ctx.rotate(rotSpeed);

        ctx.beginPath();
        const polySides = 8;

        const polyR = rX * pScale;
        const polyRy = rY * pScale;

        for (let j = 0; j <= polySides; j++) {
            const ang = (j / polySides) * Math.PI * 2;
            const px = Math.cos(ang) * polyR;
            const py = Math.sin(ang) * polyRy;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.globalAlpha = 0.7 - (k * 0.1);
        ctx.stroke();
        ctx.restore();
    }

    // Center Core (Void)
    ctx.fillStyle = '#1e1b4b'; // Indigo-950
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = '#4c1d95';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + Math.sin(time / 200) * 2, (10 + Math.sin(time / 200) * 2) * (rY / rX), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
