import React, { useRef, useEffect } from 'react';
import { TIMELINE_TRACKS } from './constants';

interface TimelinePanelProps {
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;

    currentTime: number; // ms
    totalDuration: number; // ms
    onSeek: (ms: number) => void;

    timelineZoom: number;
    setTimelineZoom: (z: number) => void;
    scrollX: number;
    setScrollX: (x: number) => void;

    events: any[]; // AnimationEvent
    onAddKeyframe?: (track: string, time: number) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
    isPlaying, onPlay, onPause, currentTime, totalDuration, onSeek,
    timelineZoom, setTimelineZoom, scrollX, setScrollX, events, onAddKeyframe
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Draw Timeline
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        const pixelsPerMs = 0.5 * timelineZoom;
        const trackHeight = 24;
        const headerHeight = 30;

        // Draw Header (Ticks)
        ctx.fillStyle = '#27272a';
        ctx.fillRect(0, 0, cvs.width, headerHeight);
        ctx.fillStyle = '#52525b';

        const startMs = scrollX / pixelsPerMs;
        const visibleMs = cvs.width / pixelsPerMs;

        for (let t = Math.floor(startMs / 100) * 100; t < startMs + visibleMs; t += 100) {
            const x = (t * pixelsPerMs) - scrollX;
            ctx.fillRect(x, headerHeight - 10, 1, 10);
            if (t % 500 === 0) {
                ctx.fillText(t + 'ms', x + 4, headerHeight - 12);
                ctx.fillRect(x, headerHeight - 15, 1, 15);
            }
        }

        // Draw Tracks
        TIMELINE_TRACKS.forEach((track, i) => {
            const y = headerHeight + (i * trackHeight);
            ctx.fillStyle = i % 2 === 0 ? '#18181b' : '#27272a';
            ctx.fillRect(0, y, cvs.width, trackHeight);

            // Grid lines
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(0, y + trackHeight - 1, cvs.width, 1);
        });

        // Draw Events (Keyframes)
        events.forEach(ev => {
            const x = (ev.time * pixelsPerMs) - scrollX;
            // Find track Y
            // Assuming events map to tracks? Currently SpellStudio implies bone tracks.
            // Simplified rendering for now.
        });

        // Playhead
        const playheadX = (currentTime * pixelsPerMs) - scrollX;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, cvs.height); ctx.stroke();

        // Playhead Top
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.moveTo(playheadX - 6, 0); ctx.lineTo(playheadX + 6, 0); ctx.lineTo(playheadX, 10); ctx.fill();

    }, [currentTime, timelineZoom, scrollX, events]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pixelsPerMs = 0.5 * timelineZoom;
        const ms = (x + scrollX) / pixelsPerMs;
        onSeek(Math.max(0, Math.min(ms, totalDuration)));
    };

    return (
        <div className="h-64 bg-[#18181b] border-t border-[#3f3f46] flex flex-col">
            <div className="h-10 border-b border-[#3f3f46] flex items-center px-4 justify-between bg-[#27272a]">
                <div className="flex items-center gap-2">
                    <button onClick={() => onSeek(0)} className="p-1 hover:bg-[#3f3f46] rounded text-[#a1a1aa]">⏮</button>
                    <button onClick={isPlaying ? onPause : onPlay} className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs">
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                    <button onClick={() => onSeek(currentTime + 16.6)} className="p-1 hover:bg-[#3f3f46] rounded text-[#a1a1aa]">⏭</button>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span>{currentTime.toFixed(0)} / {totalDuration} ms</span>
                    <div className="flex items-center gap-2">
                        <span>Zoom</span>
                        <input type="range" min="0.1" max="5" step="0.1" value={timelineZoom} onChange={e => setTimelineZoom(parseFloat(e.target.value))} className="w-20" />
                    </div>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden relative">
                {/* Track Labels */}
                <div className="w-32 bg-[#27272a] border-r border-[#3f3f46] pt-[30px] flex-shrink-0 z-10">
                    {TIMELINE_TRACKS.map(t => (
                        <div key={t.bone} className="h-[24px] flex items-center px-2 text-[10px] text-zinc-400 border-b border-[#3f3f46]/50 truncate">
                            {t.label}
                        </div>
                    ))}
                </div>
                {/* Timeline Canvas */}
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={300}
                    className="flex-1 cursor-pointer"
                    onMouseDown={handleMouseDown}
                // Add mouse move dragging for scrubbing logic if needed
                />
            </div>
        </div>
    );
};
