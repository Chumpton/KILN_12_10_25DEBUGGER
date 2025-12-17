import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpellEditorSession } from '../../../../game/spells/editing/SpellEditorTypes';
import { SpellEditorController } from '../../../../game/spells/editing/SpellEditorController';
import { ANIMATION_LIBRARY } from '../../../../data/AnimationData';

interface TimelinePanelProps {
    session: SpellEditorSession;
    controller: SpellEditorController;
    selectedAnim: string;
    uiProgress: number;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (ms: number) => void;
    onCast: () => void;
}

const TIMELINE_TRACKS = [
    { label: 'Torso', bone: 'torso' },
    { label: 'Head', bone: 'head' },
    { label: 'Arm Up (R)', bone: 'arm_r' },
    { label: 'Hand (R)', bone: 'hand_r' },
    { label: 'Weapon', bone: 'weapon_r' },
    { label: 'Arm Up (L)', bone: 'arm_l' },
    { label: 'Hand (L)', bone: 'hand_l' },
    { label: 'IK Target', bone: 'ik_target_r' },
    { label: 'VFX Spawn', bone: 'vfx_point' },
    { label: 'Events', bone: 'events' },
];

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
    session,
    controller,
    selectedAnim,
    uiProgress,
    isPlaying,
    onPlay,
    onPause,
    onSeek,
    onCast
}) => {
    const [timelineZoom, setTimelineZoom] = useState(1.0);
    const [snapInterval, setSnapInterval] = useState(16.66);
    const rulerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Derived state
    const duration = ANIMATION_LIBRARY[selectedAnim]?.totalDuration || 1000;
    const pixelsPerMs = 0.5 * timelineZoom;
    const totalWidth = Math.max(800, duration * pixelsPerMs + 200);

    // Scrubbing Logic
    const [isScrubbing, setIsScrubbing] = useState(false);

    const msToPx = (ms: number) => ms * pixelsPerMs;
    const pxToMs = (px: number) => px / pixelsPerMs;

    const handleScrub = useCallback((clientX: number) => {
        if (!rulerRef.current) return;
        const rect = rulerRef.current.getBoundingClientRect();
        // Calculate offset including scroll
        // The ruler is inside contentRef which scrolls? No, ruler is sticky?
        // Wait, diff structure.
        // Let's assume ruler is fixed relative to viewport or inside scroll container.
        // The ruler is rendered inside contentRef's scrollable area
        // absolute position relative to contentRef?

        // Actually, let's use the event native offset if possible or client calc.
        // If ruler is width of content, clientX - rect.left gives X relative to start of timeline VISIBLE area.
        // If scrolled scrolLeft, we add it.
        const scrollLeft = contentRef.current?.scrollLeft || 0;
        const relX = clientX - rect.left + scrollLeft;

        const rawMs = pxToMs(relX);
        const ms = Math.max(0, Math.min(duration, rawMs));

        // Snap logic for seeking
        let seekTime = ms;
        if (snapInterval > 0) {
            seekTime = Math.round(ms / snapInterval) * snapInterval;
        }
        onSeek(seekTime);
    }, [pixelsPerMs, duration, snapInterval, onSeek]);

    useEffect(() => {
        if (isScrubbing) {
            const onMove = (e: MouseEvent) => {
                e.preventDefault();
                handleScrub(e.clientX);
            };
            const onUp = () => setIsScrubbing(false);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            return () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
        }
    }, [isScrubbing, handleScrub]);

    const handleRulerMouseDown = (e: React.MouseEvent) => {
        setIsScrubbing(true);
        handleScrub(e.clientX);
    };

    // Keyframe Interactions
    const handleTrackClick = (e: React.MouseEvent, bone: string) => {
        // Prevent if clicking existing keyframe
        const target = e.target as HTMLElement;
        if (target.classList.contains('keyframe-diamond')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const relX = e.clientX - rect.left; // This is relative to the track div
        // The track div is full width, so relX is correct absolute pose in timeline space?
        // Yes, if parent has width=totalWidth

        let rawMs = pxToMs(relX);

        // Snap
        if (snapInterval > 0) {
            rawMs = Math.round(rawMs / snapInterval) * snapInterval;
        }

        if (bone === 'events') {
            console.log('Event added');
        } else {
            controller.addKeyframe(selectedAnim, bone, rawMs);
        }

        onSeek(rawMs);
    };

    // Preset Handlers
    const applyPreset = (time: number) => {
        // Could update spell definition cast time here
        controller.setCastTime(time);
        // And reset zoom/scroll?
    };

    // Render Helpers
    const renderKeyframes = (trackBone: string) => {
        const anim = ANIMATION_LIBRARY[selectedAnim];
        if (!anim) return null;

        // Special handling for Events track
        if (trackBone === 'events') {
            if (!anim.events) return null;
            return anim.events.map((evt: any, i: number) => {
                const left = msToPx(evt.frame);
                return (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-purple-500 rounded-full border border-black cursor-pointer hover:bg-purple-300 z-10 shadow-sm"
                        style={{ left: left - 4, top: '50%', marginTop: -4 }}
                        title={`Event: ${evt.type || 'Unknown'} @ ${evt.frame}ms`}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            alert(`Edit Event: ${evt.type}`);
                        }}
                    />
                );
            });
        }

        if (!anim.keyframes) return null;

        return anim.keyframes
            .filter(kf => kf.bones[trackBone])
            .map((kf, i) => {
                const left = msToPx(kf.frame);
                return (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-cyan-400 rotate-45 border border-black cursor-pointer hover:bg-white hover:scale-150 transition-all z-10 keyframe-diamond shadow-sm"
                        style={{ left: left - 4, top: '50%', marginTop: -4 }}
                        title={`Frame: ${kf.frame}ms`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSeek(kf.frame);
                            controller.setSelectedPart(trackBone);
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            // alert(`Edit Keyframe: ${trackBone} @ ${kf.frame}`);
                        }}
                    />
                );
            });
    };

    return (
        <div className="h-72 bg-[#18181b] border-t border-[#3f3f46] flex flex-col shadow-xl z-20 select-none text-xs font-sans">
            {/* TOOLBAR */}
            <div className="flex items-center justify-between p-2 border-b border-[#27272a] bg-[#202025]">
                <div className="flex items-center gap-4">
                    {/* PLAYBACK */}
                    <div className="flex bg-[#3f3f46] rounded overflow-hidden border border-[#52525b]">
                        <button
                            onClick={() => isPlaying ? onPause() : onPlay()}
                            className={`w-12 py-1 font-bold ${isPlaying ? 'bg-yellow-900/50 text-yellow-500' : 'text-zinc-300 hover:bg-[#52525b]'}`}
                        >
                            {isPlaying ? '||' : '>'}
                        </button>
                        <button onClick={onCast} className="w-12 py-1 font-bold text-red-400 border-l border-[#52525b] hover:bg-red-900/30">CAST</button>
                        <button
                            onClick={() => controller.addKeyframe(selectedAnim, session.rig.selectedPart, Math.round(uiProgress))}
                            className="w-12 py-1 font-bold text-cyan-400 border-l border-[#52525b] hover:bg-cyan-900/30"
                            title="Keyframe Selected Bone"
                        >
                            KEY
                        </button>
                    </div>

                    {/* SNAP */}
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold text-[10px]">SNAP</span>
                        <select
                            value={snapInterval}
                            onChange={e => setSnapInterval(Number(e.target.value))}
                            className="bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-zinc-300 outline-none focus:border-cyan-500 text-[10px]"
                        >
                            <option value="0">Off</option>
                            <option value="16.66">16ms</option>
                            <option value="33.33">33ms</option>
                            <option value="50">50ms</option>
                            <option value="100">100ms</option>
                        </select>
                    </div>

                    {/* PRESETS */}
                    <div className="flex items-center gap-2 border-l border-[#3f3f46] pl-4">
                        <span className="text-zinc-500 font-bold text-[10px]">PRESETS</span>
                        <button onClick={() => applyPreset(300)} className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] rounded border border-[#3f3f46] text-[10px]">Fast</button>
                        <button onClick={() => applyPreset(800)} className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] rounded border border-[#3f3f46] text-[10px]">Heavy</button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-cyan-400 font-mono text-sm">{Math.round(uiProgress)}ms</div>
                    <input
                        type="range" min="0.1" max="2.0" step="0.1"
                        value={timelineZoom}
                        onChange={e => setTimelineZoom(Number(e.target.value))}
                        className="w-24 accent-zinc-500"
                    />
                </div>
            </div>

            {/* TIMELINE AREA */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* TRACK LABELS (Fixed Left) */}
                <div className="w-[120px] bg-[#202025] flex-shrink-0 border-r border-[#3f3f46] z-20 flex flex-col pt-6 shadow-md">
                    {TIMELINE_TRACKS.map(track => (
                        <div key={track.bone} className="h-8 border-b border-[#27272a] flex items-center px-3 text-zinc-400 hover:text-zinc-100 hover:bg-[#27272a] cursor-pointer text-[10px] uppercase font-bold tracking-wide transition-colors">
                            {track.label}
                        </div>
                    ))}
                </div>

                {/* SCROLLABLE CONTENT */}
                <div ref={contentRef} className="flex-1 overflow-x-auto relative bg-[#121215] custom-scrollbar">
                    <div style={{ width: totalWidth, height: '100%' }} className="relative">

                        {/* RULER */}
                        <div
                            ref={rulerRef}
                            className="h-6 bg-[#202025] border-b border-[#3f3f46] sticky top-0 z-10 cursor-col-resize select-none"
                            onMouseDown={handleRulerMouseDown}
                        >
                            {/* Ticks */}
                            {Array.from({ length: Math.ceil(duration / 100) + 1 }).map((_, i) => (
                                <div key={i} className="absolute bottom-0 border-l border-zinc-600 h-2 text-[9px] text-zinc-500 pl-1 pointer-events-none" style={{ left: msToPx(i * 100) }}>
                                    {i * 100}
                                </div>
                            ))}
                        </div>

                        {/* PLAYHEAD */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                            style={{ left: msToPx(uiProgress) }}
                        >
                            <div className="absolute -top-[1px] -left-[4px] border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500 filter drop-shadow"></div>
                        </div>

                        {/* TRACKS */}
                        <div className="flex flex-col">
                            {TIMELINE_TRACKS.map((track, idx) => (
                                <div
                                    key={track.bone}
                                    className={`h-8 border-b border-[#27272a] relative group hover:bg-[#27272a]/30 transition-colors ${idx % 2 === 0 ? 'bg-opacity-50 bg-[#202025]' : ''}`}
                                    onClick={(e) => handleTrackClick(e, track.bone)}
                                >
                                    {/* Grid Lines (Every 100ms) */}
                                    <div className="absolute inset-0 pointer-events-none opacity-10">
                                        {Array.from({ length: Math.ceil(duration / 100) }).map((_, i) => (
                                            <div key={i} className="absolute top-0 bottom-0 border-l border-white" style={{ left: msToPx(i * 100) }}></div>
                                        ))}
                                    </div>

                                    {/* Keyframes */}
                                    {renderKeyframes(track.bone)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
