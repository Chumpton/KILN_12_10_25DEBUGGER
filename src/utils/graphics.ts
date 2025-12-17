


/**
 * Graphics utility functions for rendering equipment with metallic and decorative effects
 */

/**
 * Creates a metallic gradient (dark → light → dark) for simulating metal shine
 * @param ctx Canvas rendering context
 * @param x X position
 * @param y Y position
 * @param w Width
 * @param h Height
 * @param baseColor Base color for the metal (e.g., '#888888' for iron)
 * @returns CanvasGradient
 */
export const setMetallicGradient = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    baseColor: string
): CanvasGradient => {
    const gradient = ctx.createLinearGradient(x, y, x + w, y);

    // Parse base color to create darker/lighter variants
    // For simplicity, using opacity variations
    gradient.addColorStop(0, `${baseColor}cc`); // Darker edge
    gradient.addColorStop(0.5, `${baseColor}ff`); // Bright center
    gradient.addColorStop(1, `${baseColor}cc`); // Darker edge

    return gradient;
};

/**
 * Draws a small rivet/bolt detail for armor
 * @param ctx Canvas rendering context
 * @param x X position
 * @param y Y position
 * @param size Rivet diameter
 */
export const drawRivet = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number = 3
): void => {
    ctx.save();

    // Outer circle (dark)
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle (highlight)
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

/**
 * Draws a leather stitching pattern between two points
 * @param ctx Canvas rendering context
 * @param x1 Start X
 * @param y1 Start Y
 * @param x2 End X
 * @param y2 End Y
 */
export const drawStitching = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): void => {
    ctx.save();

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const stitchCount = Math.floor(length / 4); // Stitch every 4 pixels

    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (let i = 0; i <= stitchCount; i++) {
        const t = i / stitchCount;
        const x = x1 + dx * t;
        const y = y1 + dy * t;

        // Draw small perpendicular line
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const stitchLen = 2;

        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * stitchLen, y - Math.sin(angle) * stitchLen);
        ctx.lineTo(x + Math.cos(angle) * stitchLen, y + Math.sin(angle) * stitchLen);
        ctx.stroke();
    }

    ctx.restore();
};

/**
 * Applies a glow effect to subsequent drawing operations
 * @param ctx Canvas rendering context
 * @param color Glow color
 * @param blur Blur radius
 */
export const applyGlowEffect = (
    ctx: CanvasRenderingContext2D,
    color: string,
    blur: number = 10
): void => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

/**
 * Clears any active glow/shadow effects
 * @param ctx Canvas rendering context
 */
export const clearGlowEffect = (ctx: CanvasRenderingContext2D): void => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

export const drawCone = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, arc: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -arc/2, arc/2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
};

// --- PIXEL ART HELPERS ---

export const drawPixelSprite = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    grid: number[][], 
    palette: string[],
    pixelSize: number = 4
) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Center the sprite
    const h = grid.length;
    const w = grid[0].length;
    const offsetX = -(w * pixelSize) / 2;
    const offsetY = -(h * pixelSize) / 2;

    for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
            const colorIdx = grid[row][col];
            if (colorIdx > 0 && palette[colorIdx]) {
                ctx.fillStyle = palette[colorIdx];
                ctx.fillRect(offsetX + col * pixelSize, offsetY + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    ctx.restore();
};

export const drawPixelCircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    pixelSize: number = 4
) => {
    // Bresenham-like circle filling for pixel look
    // Not strictly Bresenham, just blocky filling
    
    const rPixels = Math.floor(radius / pixelSize);
    
    ctx.fillStyle = color;
    
    for (let dy = -rPixels; dy <= rPixels; dy++) {
        for (let dx = -rPixels; dx <= rPixels; dx++) {
            if (dx*dx + dy*dy <= rPixels*rPixels) {
                ctx.fillRect(x + dx * pixelSize, y + dy * pixelSize, pixelSize, pixelSize);
            }
        }
    }
};

export const drawPixelExplosion = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    radius: number,
    pixelSize: number = 4
) => {
    const count = 10;
    ctx.fillStyle = color;
    for(let i=0; i<count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const size = pixelSize + Math.random() * pixelSize;
        ctx.fillRect(x + Math.cos(theta)*r, y + Math.sin(theta)*r, size, size);
    }
};
