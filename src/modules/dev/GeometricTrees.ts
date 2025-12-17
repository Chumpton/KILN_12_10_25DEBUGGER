// Geometric tree templates for world editor
// These can be rendered procedurally without needing PNG files

export interface GeometricTree {
    id: string;
    name: string;
    render: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => void;
}

export const GEOMETRIC_TREES: GeometricTree[] = [
    {
        id: 'pine_tree',
        name: 'Pine Tree',
        render: (ctx, x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Trunk
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-4, -10, 8, 20);

            // Foliage layers (triangles)
            ctx.fillStyle = '#2e7d32';

            // Bottom layer
            ctx.beginPath();
            ctx.moveTo(-20, -10);
            ctx.lineTo(0, -35);
            ctx.lineTo(20, -10);
            ctx.closePath();
            ctx.fill();

            // Middle layer
            ctx.beginPath();
            ctx.moveTo(-15, -25);
            ctx.lineTo(0, -50);
            ctx.lineTo(15, -25);
            ctx.closePath();
            ctx.fill();

            // Top layer
            ctx.beginPath();
            ctx.moveTo(-10, -40);
            ctx.lineTo(0, -60);
            ctx.lineTo(10, -40);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    },
    {
        id: 'round_tree',
        name: 'Round Tree',
        render: (ctx, x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Trunk
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(-3, -8, 6, 16);

            // Foliage (circles)
            ctx.fillStyle = '#388e3c';

            // Main canopy
            ctx.beginPath();
            ctx.arc(0, -25, 18, 0, Math.PI * 2);
            ctx.fill();

            // Left side
            ctx.beginPath();
            ctx.arc(-12, -20, 12, 0, Math.PI * 2);
            ctx.fill();

            // Right side
            ctx.beginPath();
            ctx.arc(12, -20, 12, 0, Math.PI * 2);
            ctx.fill();

            // Highlights
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(-5, -30, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        id: 'oak_tree',
        name: 'Oak Tree',
        render: (ctx, x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Trunk
            ctx.fillStyle = '#795548';
            ctx.fillRect(-5, -12, 10, 24);

            // Branches
            ctx.strokeStyle = '#6d4c41';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-5, -8);
            ctx.lineTo(-15, -18);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(5, -8);
            ctx.lineTo(15, -18);
            ctx.stroke();

            // Foliage clusters
            ctx.fillStyle = '#43a047';

            // Center
            ctx.beginPath();
            ctx.arc(0, -30, 15, 0, Math.PI * 2);
            ctx.fill();

            // Left
            ctx.beginPath();
            ctx.arc(-15, -25, 12, 0, Math.PI * 2);
            ctx.fill();

            // Right
            ctx.beginPath();
            ctx.arc(15, -25, 12, 0, Math.PI * 2);
            ctx.fill();

            // Top
            ctx.beginPath();
            ctx.arc(0, -42, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        id: 'willow_tree',
        name: 'Willow Tree',
        render: (ctx, x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Trunk
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(-4, -10, 8, 20);

            // Drooping branches
            ctx.strokeStyle = '#558b2f';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            for (let i = -3; i <= 3; i++) {
                const xOffset = i * 6;
                ctx.beginPath();
                ctx.moveTo(xOffset, -20);
                ctx.quadraticCurveTo(xOffset - 5, -5, xOffset - 8, 10);
                ctx.stroke();
            }

            // Canopy
            ctx.fillStyle = '#689f38';
            ctx.beginPath();
            ctx.ellipse(0, -25, 20, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        id: 'dead_tree',
        name: 'Dead Tree',
        render: (ctx, x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Trunk
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(-4, -15, 8, 30);

            // Bare branches
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            // Left branches
            ctx.beginPath();
            ctx.moveTo(-4, -10);
            ctx.lineTo(-12, -18);
            ctx.lineTo(-18, -15);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-4, -5);
            ctx.lineTo(-10, -8);
            ctx.stroke();

            // Right branches
            ctx.beginPath();
            ctx.moveTo(4, -12);
            ctx.lineTo(14, -20);
            ctx.lineTo(18, -22);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(4, -6);
            ctx.lineTo(12, -10);
            ctx.stroke();

            // Top branch
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(2, -25);
            ctx.stroke();

            ctx.restore();
        }
    },
    {
        id: 'palm_tree',
        name: 'Palm Tree',
        render: (ctx, x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Curved trunk
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.quadraticCurveTo(5, -10, 8, -30);
            ctx.stroke();

            // Palm fronds
            ctx.strokeStyle = '#558b2f';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#689f38';

            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const endX = 8 + Math.cos(angle) * 20;
                const endY = -30 + Math.sin(angle) * 20;

                ctx.beginPath();
                ctx.moveTo(8, -30);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Frond leaves
                for (let j = 0; j < 5; j++) {
                    const t = j / 5;
                    const px = 8 + (endX - 8) * t;
                    const py = -30 + (endY + 30) * t;
                    const perpX = -(endY + 30) / 20;
                    const perpY = (endX - 8) / 20;

                    ctx.fillStyle = j % 2 === 0 ? '#689f38' : '#7cb342';
                    ctx.beginPath();
                    ctx.ellipse(px, py, 3, 6, Math.atan2(endY + 30, endX - 8), 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }
];

// Helper function to render a geometric tree by ID
export const renderGeometricTree = (
    ctx: CanvasRenderingContext2D,
    treeId: string,
    x: number,
    y: number,
    scale: number = 1
) => {
    const tree = GEOMETRIC_TREES.find(t => t.id === treeId);
    if (tree) {
        tree.render(ctx, x, y, scale);
    }
};
