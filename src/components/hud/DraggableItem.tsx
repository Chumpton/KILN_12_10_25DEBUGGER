
import React, { useEffect, useRef } from 'react';

interface DraggableItemProps {
    id: string;
    position: { x: number, y: number, scale: number };
    onMove: (id: string, dx: number, dy: number) => void;
    onScale: (id: string, delta: number) => void;
    isLocked: boolean;
    className?: string;
    children: React.ReactNode;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ id, position, onMove, onScale, isLocked, className, children }) => {
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLocked) return;
        isDragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        e.stopPropagation();
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (isLocked) return;
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        onScale(id, delta);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            startPos.current = { x: e.clientX, y: e.clientY };
            onMove(id, dx, dy);
        };
        const handleMouseUp = () => {
            isDragging.current = false;
        };
        if (!isLocked) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [id, onMove, isLocked]);

    return (
        <div 
            className={`${className} ${!isLocked ? 'ring-2 ring-yellow-400 cursor-move bg-black/20 hover:bg-black/40 pointer-events-auto' : 'pointer-events-none'}`}
            style={{ 
                position: 'absolute', 
                left: position.x, 
                top: position.y,
                transform: `scale(${position.scale})`,
                transformOrigin: 'top left',
                transition: isDragging.current ? 'none' : 'transform 0.1s' 
            }}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
        >
            <div className={!isLocked ? "pointer-events-none" : "pointer-events-auto"}>
                {children}
            </div>
            {!isLocked && <div className="absolute -top-4 left-0 text-[10px] bg-yellow-400 text-black px-1 font-bold whitespace-nowrap pointer-events-none">{id} (Scroll to Resize)</div>}
        </div>
    );
};
