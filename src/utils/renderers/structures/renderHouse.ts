import { toScreen } from '../../isometric';
import { TILE_WIDTH, TILE_HEIGHT } from '../../../constants';
import { GameState } from '../../../types';

// Constants (Internal to this file for now, or imported)
const H_CENTER_X = -19.8;
const H_CENTER_Y = -13.7;
const H_SIZE = 10;
const H_HALF = H_SIZE / 2;
const H_MIN_X = H_CENTER_X - H_HALF;
const H_MAX_X = H_CENTER_X + H_HALF;
const H_MIN_Y = H_CENTER_Y - H_HALF;
const H_MAX_Y = H_CENTER_Y + H_HALF;

// Pre-calc visual height
const WALL_HEIGHT = 250;
const ROOF_HEIGHT = 150;

// Colors
const COL_WALL_DARK = '#5D4037';
const COL_WALL_LIGHT = '#8D6E63';
const COL_ROOF_DARK = '#3E2723';
const COL_ROOF_LIGHT = '#5D4037';
const COL_FLOOR = '#757575';
const COL_WINDOW = '#81D4FA';
const COL_STROKE = '#000000';

export const renderHouseFloor = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    cameraOffset: { x: number, y: number }
) => {
    // 1. FLOOR (Always Opaque, Background Layer)

    // Points
    const top = toScreen(H_MIN_X, H_MIN_Y);
    const right = toScreen(H_MAX_X, H_MIN_Y);
    const bottom = toScreen(H_MAX_X, H_MAX_Y);
    const left = toScreen(H_MIN_X, H_MAX_Y);

    const tS = { x: top.x + cameraOffset.x, y: top.y + cameraOffset.y };
    const rS = { x: right.x + cameraOffset.x, y: right.y + cameraOffset.y };
    const bS = { x: bottom.x + cameraOffset.x, y: bottom.y + cameraOffset.y };
    const lS = { x: left.x + cameraOffset.x, y: left.y + cameraOffset.y };

    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COL_STROKE;
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = COL_FLOOR;
    ctx.beginPath();
    ctx.moveTo(tS.x, tS.y);
    ctx.lineTo(rS.x, rS.y);
    ctx.lineTo(bS.x, bS.y);
    ctx.lineTo(lS.x, lS.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

export const renderHouseStructure = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    cameraOffset: { x: number, y: number }
) => {
    // Check Player Inside
    const p = state.player.pos;
    const isInside = p.x >= H_MIN_X && p.x <= H_MAX_X && p.y >= H_MIN_Y && p.y <= H_MAX_Y;

    // Points
    const top = toScreen(H_MIN_X, H_MIN_Y);
    const right = toScreen(H_MAX_X, H_MIN_Y);
    const bottom = toScreen(H_MAX_X, H_MAX_Y);
    const left = toScreen(H_MIN_X, H_MAX_Y);
    const center = toScreen(H_CENTER_X, H_CENTER_Y); // Roof Apex logic needs center

    const tS = { x: top.x + cameraOffset.x, y: top.y + cameraOffset.y };
    const rS = { x: right.x + cameraOffset.x, y: right.y + cameraOffset.y };
    const bS = { x: bottom.x + cameraOffset.x, y: bottom.y + cameraOffset.y };
    const lS = { x: left.x + cameraOffset.x, y: left.y + cameraOffset.y };

    const apexS = {
        x: center.x + cameraOffset.x,
        y: center.y + cameraOffset.y - WALL_HEIGHT - ROOF_HEIGHT
    };

    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COL_STROKE;

    if (isInside) {
        ctx.globalAlpha = 0.3;
    }

    // --- WALLS ---

    // RIGHT WALL (SE Face): Bottom -> Right (Solid)
    ctx.fillStyle = COL_WALL_DARK;
    ctx.beginPath();
    ctx.moveTo(bS.x, bS.y);
    ctx.lineTo(rS.x, rS.y);
    ctx.lineTo(rS.x, rS.y - WALL_HEIGHT);
    ctx.lineTo(bS.x, bS.y - WALL_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // LEFT WALL (SW Face): Left -> Bottom (Contains Door & Windows)
    // We construct this wall carefully to leave a hole for the door.

    // Vectors for interpolation
    const wallVector = { x: bS.x - lS.x, y: bS.y - lS.y };
    const wallCenterX = lS.x + wallVector.x * 0.5;
    const wallCenterY = lS.y + wallVector.y * 0.5;

    const doorW = 50;
    const doorH = 100;
    // Calculate Door Base Points
    const wallLen = Math.sqrt(wallVector.x ** 2 + wallVector.y ** 2);
    const uX = wallVector.x / wallLen;
    const uY = wallVector.y / wallLen;

    const doorLBase = { x: wallCenterX - uX * (doorW / 2), y: wallCenterY - uY * (doorW / 2) };
    const doorRBase = { x: wallCenterX + uX * (doorW / 2), y: wallCenterY + uY * (doorW / 2) };
    const doorLTop = { x: doorLBase.x, y: doorLBase.y - doorH };
    const doorRTop = { x: doorRBase.x, y: doorRBase.y - doorH };

    ctx.fillStyle = COL_WALL_LIGHT;

    // Draw Wall in 3 parts (Left, Right, Top Lintel)

    // 1. Left Part: Wall Left Edge -> Door Left Edge
    ctx.beginPath();
    ctx.moveTo(lS.x, lS.y);
    ctx.lineTo(doorLBase.x, doorLBase.y);
    ctx.lineTo(doorLTop.x, doorLTop.y);
    ctx.lineTo(lS.x, lS.y - WALL_HEIGHT); // Actually we should go to DoorLTop Projected Up? No.
    // The wall is rectangular.
    // Left Wall Top-Left is (lS.x, lS.y - WALL_HEIGHT).
    // Door Top-Left is (doorLTop.x, doorLTop.y).
    // We need to define the vertical slice.
    // Let's draw: (LeftBase -> DoorLeftBase -> DoorLeftTop -> LeftTop)
    // But LeftTop is `lS - wallHeight`.
    // We need the point on the top edge corresponding to Door Left.
    // Top Edge Vector is same as Bottom Edge Vector.
    // Top Edge Point at Door Left X projection:
    // Actually, simple polygon:
    // LeftBase -> DoorLeftBase -> DoorLeftTop -> DoorLeftTopProjectedUp? No.
    // Let's just draw the whole wall as a polygon with a hole using even-odd rule or just multiple polys.
    // Multiple polys is safer.

    // Wall Top Left: lS + (0, -H)
    // Wall Top Right: bS + (0, -H)
    const wTL = { x: lS.x, y: lS.y - WALL_HEIGHT };
    const wTR = { x: bS.x, y: bS.y - WALL_HEIGHT };

    // Door Left projected to top edge:
    // We can just interpolate on top edge using same ratio.
    const halfLen = wallLen / 2;
    const doorHalfW = doorW / 2;
    // Ratio of Door Left from Wall Left: (halfLen - doorHalfW) / wallLen
    const ratioL = (halfLen - doorHalfW) / wallLen;
    const ratioR = (halfLen + doorHalfW) / wallLen;

    const wTopDoorL = { x: wTL.x + (wTR.x - wTL.x) * ratioL, y: wTL.y + (wTR.y - wTL.y) * ratioL };
    const wTopDoorR = { x: wTL.x + (wTR.x - wTL.x) * ratioR, y: wTL.y + (wTR.y - wTL.y) * ratioR };

    // Part A: Left of Door
    ctx.beginPath();
    ctx.moveTo(lS.x, lS.y);
    ctx.lineTo(doorLBase.x, doorLBase.y);
    ctx.lineTo(doorLTop.x, doorLTop.y);
    // Draw line up to top? No, Top of Door is lower than Wall Top.
    // So: ... -> DoorLeftTop -> WallTopAtDoorLeft -> WallTopLeft -> Loop
    ctx.lineTo(wTopDoorL.x, wTopDoorL.y);
    ctx.lineTo(wTL.x, wTL.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Part B: Right of Door
    ctx.beginPath();
    ctx.moveTo(doorRBase.x, doorRBase.y);
    ctx.lineTo(bS.x, bS.y);
    ctx.lineTo(wTR.x, wTR.y);
    ctx.lineTo(wTopDoorR.x, wTopDoorR.y);
    ctx.lineTo(doorRTop.x, doorRTop.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Part C: Lintel (Above Door)
    ctx.beginPath();
    ctx.moveTo(doorLTop.x, doorLTop.y);
    ctx.lineTo(doorRTop.x, doorRTop.y);
    ctx.lineTo(wTopDoorR.x, wTopDoorR.y);
    ctx.lineTo(wTopDoorL.x, wTopDoorL.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    // -- TORCH (Above Door) --
    const torchBaseX = wallCenterX;
    const torchBaseY = wallCenterY - doorH - 10;

    ctx.beginPath();
    ctx.moveTo(torchBaseX, torchBaseY);
    ctx.lineTo(torchBaseX, torchBaseY - 15);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Reset Style for text
    ctx.save();
    ctx.globalAlpha = isInside ? 0.3 : 1.0; // Keep torch transparent if wall is
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#FF9800'; // Ensure color is set
    ctx.fillText('🔥', torchBaseX, torchBaseY - 15);
    ctx.restore();
    ctx.lineWidth = 2; // Reset

    // -- WINDOWS --
    const winYOffset = -WALL_HEIGHT * 0.5;
    const winW = 30;
    const winH = 40;

    const drawWindow = (pct: number) => {
        const wx = lS.x + wallVector.x * pct;
        const wy = lS.y + wallVector.y * pct;
        const wL = { x: wx - uX * (winW / 2), y: wy - uY * (winW / 2) };
        const wR = { x: wx + uX * (winW / 2), y: wy + uY * (winW / 2) };

        ctx.fillStyle = COL_WINDOW;
        ctx.beginPath();
        ctx.moveTo(wL.x, wL.y + winYOffset);
        ctx.lineTo(wR.x, wR.y + winYOffset);
        ctx.lineTo(wR.x, wR.y + winYOffset - winH);
        ctx.lineTo(wL.x, wL.y + winYOffset - winH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        const midL = { x: wL.x, y: wL.y + winYOffset - winH / 2 };
        const midR = { x: wR.x, y: wR.y + winYOffset - winH / 2 };
        const midT = { x: (wL.x + wR.x) / 2, y: (wL.y + wR.y) / 2 + winYOffset - winH };
        const midB = { x: (wL.x + wR.x) / 2, y: (wL.y + wR.y) / 2 + winYOffset };

        ctx.moveTo(midL.x, midL.y); ctx.lineTo(midR.x, midR.y);
        ctx.moveTo(midT.x, midT.y); ctx.lineTo(midB.x, midB.y);
        ctx.stroke();
    };

    drawWindow(0.2);
    drawWindow(0.8);

    // --- ROOF ---
    // Front Face (Left Roof)
    ctx.fillStyle = COL_ROOF_LIGHT;
    ctx.beginPath();
    ctx.moveTo(wTL.x, wTL.y);
    ctx.lineTo(wTR.x, wTR.y);
    ctx.lineTo(apexS.x, apexS.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tiling Front
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    const strips = 6;
    for (let i = 1; i < strips; i++) {
        const pct = i / strips;
        const e1x = wTL.x + (apexS.x - wTL.x) * pct;
        const e1y = wTL.y + (apexS.y - wTL.y) * pct;
        const e2x = wTR.x + (apexS.x - wTR.x) * pct;
        const e2y = wTR.y + (apexS.y - wTR.y) * pct;
        ctx.beginPath();
        ctx.moveTo(e1x, e1y);
        ctx.lineTo(e2x, e2y);
        ctx.stroke();
    }
    ctx.restore();

    // Right Face (Right Roof) (bS - rS - apex)
    // Wall Top Left for this face is wTR (FrontRight)
    // Wall Top Right for this face is rS - H
    const wRR = { x: rS.x, y: rS.y - WALL_HEIGHT };

    ctx.fillStyle = COL_ROOF_DARK;
    ctx.beginPath();
    ctx.moveTo(wTR.x, wTR.y);
    ctx.lineTo(wRR.x, wRR.y);
    ctx.lineTo(apexS.x, apexS.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tiling Right
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < strips; i++) {
        const pct = i / strips;
        const e1x = wTR.x + (apexS.x - wTR.x) * pct;
        const e1y = wTR.y + (apexS.y - wTR.y) * pct;
        const e2x = wRR.x + (apexS.x - wRR.x) * pct;
        const e2y = wRR.y + (apexS.y - wRR.y) * pct;
        ctx.beginPath();
        ctx.moveTo(e1x, e1y);
        ctx.lineTo(e2x, e2y);
        ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
};
