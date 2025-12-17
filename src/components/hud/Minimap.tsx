import React, { useEffect, useRef } from 'react';
import { Vector2 } from '../../types';

interface MinimapItem {
    id: string;
    pos: Vector2;
    type: 'enemy' | 'shop' | 'hearthstone' | 'quest';
    color: string;
}

export interface MinimapData {
    items: MinimapItem[];
}

interface MinimapProps {
    playerPos: Vector2;
    data: MinimapData;
}

const MINIMAP_RADIUS = 360; // World Units Radius to show
const CANVAS_SIZE = 144; // Size of the canvas (rendering area)

export const Minimap: React.FC<MinimapProps> = ({ playerPos, data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.save();
        // Center the view on the canvas (Local 64,64 is PlayerPos)
        const cx = CANVAS_SIZE / 2;
        const cy = CANVAS_SIZE / 2;

        // Clip to Circle
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 10, 0, Math.PI * 2); // -10 for padding inside border
        ctx.clip();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw Player (Center)
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player Direction (Arrow)? Optional.

        // Draw Items
        data.items.forEach(item => {
            // Delta from player
            const dx = item.pos.x - playerPos.x;
            const dy = item.pos.y - playerPos.y;

            // Scale to Minimap: 
            // World Radius = 500 => Canvas Radius = 64
            const scale = (cx - 10) / MINIMAP_RADIUS;

            const mx = cx + dx * scale;
            const my = cy + dy * scale;

            // Draw if within bounds
            const distFromCenter = Math.sqrt(Math.pow(mx - cx, 2) + Math.pow(my - cy, 2));
            if (distFromCenter < cx - 10) { // Keep inside circle
                ctx.fillStyle = item.color;
                ctx.beginPath();
                // Size based on type
                let size = 2;
                if (item.type === 'hearthstone') size = 4;
                if (item.type === 'shop') size = 3;

                ctx.arc(mx, my, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }, [playerPos, data]);

    return (
        <div style={{
            width: '160px',
            height: '160px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* CANVAS (Top Layer of map, below border) */}
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{
                    position: 'absolute',
                    zIndex: 1,
                    borderRadius: '50%'
                }}
            />

            {/* BORDER OVERLAY */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url(/ui/minimap_border.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                zIndex: 2,
                pointerEvents: 'none'
            }} />
        </div>
    );
};
