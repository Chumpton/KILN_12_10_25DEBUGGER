/**
 * renderFoliage.ts
 * Vector-based foliage rendering (grass, bushes, flowers) and ground details.
 */

export const renderFoliage = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    variant: string, // Originally emojis like '🌿', '🌾', '🌺'
    sway: number = 0
) => {
    ctx.save();

    // Map emoji to style
    if (variant === '🌿') {
        renderFern(ctx, x, y, sway);
    } else if (variant === '') {
        renderGrass(ctx, x, y, sway);
    } else if (variant === '' || variant === '') {
        renderFlower(ctx, x, y, variant, sway);
    } else if (variant === '☘️') {
        renderClover(ctx, x, y);
    } else if (variant === '') {
        renderStone(ctx, x, y);
    } else if (variant === '') {
        renderPuddle(ctx, x, y, sway);
    } else {
        // Generic bush fallback
        renderBush(ctx, x, y, sway);
    }

    ctx.restore();
};

const renderFern = (ctx: CanvasRenderingContext2D, x: number, y: number, sway: number) => {
    ctx.strokeStyle = '#16a34a'; // Green
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Three blades fan out
    for (let i = -1; i <= 1; i++) {
        // Sway affects outer blades more, inner less.
        // Base sway is applied to control point.
        const bladeSway = sway * 4 * (i === 0 ? 0.5 : 1.0);

        ctx.beginPath();
        ctx.moveTo(x, y);
        // Quadratic curve
        ctx.quadraticCurveTo(
            x + i * 5 + bladeSway,
            y - 5,
            x + i * 8 + bladeSway * 1.5,
            y - 8
        );
        ctx.stroke();
    }
};

const renderGrass = (ctx: CanvasRenderingContext2D, x: number, y: number, sway: number) => {
    ctx.strokeStyle = '#65a30d'; // Lime Green (Lush)
    ctx.lineWidth = 1;

    // Tuft
    for (let i = 0; i < 4; i++) {
        const offset = (i - 1.5) * 3;
        const height = 4 + Math.random() * 4;

        // Sway at tip
        const tipSway = sway * (3 + Math.random() * 2);

        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.quadraticCurveTo(
            x + offset + tipSway * 0.5,
            y - height * 0.5,
            x + offset + (Math.random() - 0.5) * 2 + tipSway,
            y - height
        );
        ctx.stroke();
    }
};

const renderFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, variant: string, sway: number) => {
    // Stem
    const stemSway = sway * 2;

    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + stemSway * 0.5, y - 4, x + stemSway, y - 8);
    ctx.stroke();

    const headX = x + stemSway;
    const headY = y - 8;

    // Petals
    const color = variant === '🌺' ? '#ec4899' : '#eab308'; // Pink or Yellow
    ctx.fillStyle = color;

    // Draw 5 petals
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const px = headX + Math.cos(angle) * 3;
        const py = headY + Math.sin(angle) * 3;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(headX, headY, 1.5, 0, Math.PI * 2);
    ctx.fill();
};

const renderBush = (ctx: CanvasRenderingContext2D, x: number, y: number, sway: number) => {
    ctx.fillStyle = '#15803d';

    // Low uneven blob - static or very slight breathe?
    // Let's just breathe/wobble slightly with sway
    const wobble = Math.sin(sway) * 0.5;

    ctx.beginPath();
    ctx.arc(x - 3 + wobble, y - 2, 4, 0, Math.PI * 2);
    ctx.arc(x + 3 - wobble, y - 3, 5, 0, Math.PI * 2);
    ctx.arc(x, y - 5 + wobble, 4, 0, Math.PI * 2);
    ctx.fill();
};

const renderClover = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#16a34a'; // Vibrant green

    // Draw 3-4 small clover leaves clustered
    const count = 3;
    for (let j = 0; j < 3; j++) {
        // Cluster offset
        const ox = (Math.random() - 0.5) * 6;
        const oy = (Math.random() - 0.5) * 4;

        const cx = x + ox;
        const cy = y + oy;

        // 3 leaves per clover
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const px = cx + Math.cos(angle) * 1.5;
            const py = cy + Math.sin(angle) * 1.5;
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

const renderStone = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#78716c'; // Stone Gray

    // Main stone
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.ellipse(x - 1, y - 2, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Small Pebble nearby
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.ellipse(x + 3, y, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
};

const renderPuddle = (ctx: CanvasRenderingContext2D, x: number, y: number, sway: number) => {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#3b82f6'; // Blueish reflection

    // Distort shape slightly with sway (simulating ripples?)
    // Or just a static puddle? Let's make it static but shiny.

    ctx.beginPath();
    // A somewhat irregular oval
    ctx.moveTo(x - 5, y);
    ctx.bezierCurveTo(x - 5, y - 3, x + 5, y - 3, x + 5, y);
    ctx.bezierCurveTo(x + 5, y + 3, x - 5, y + 3, x - 5, y);
    ctx.fill();

    // Reflection/Shine
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x - 2, y - 1, 3, 1, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
