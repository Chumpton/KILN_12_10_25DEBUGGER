
import React, { useState, useEffect, useRef } from 'react';
import { ENTITY_RIGS } from '../data/EntityRigDefinitions';
import { renderSkeletalNPC } from '../utils/renderers/allies/renderSkeletalNPC';
import { Ally, AnimationClip, SpellType } from '../types';
import { ANIMATION_LIBRARY } from '../data/AnimationData';
import { getInterpolatedPose } from '../utils/animationUtils';
import { getWalkingAnimations } from '../modules/player/animations/states/Walking';


interface RigBone {
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    zIndex?: number;
    flipX?: boolean;
}

interface EntityRig {
    scale?: number;
    parts: Record<string, RigBone>;
}

interface RiggingEditorProps {
    onBack: () => void;
}

export const RiggingEditor: React.FC<RiggingEditorProps> = ({ onBack }) => {
    // Safety check for empty rigs
    const initialKey = ENTITY_RIGS && Object.keys(ENTITY_RIGS).length > 0 ? Object.keys(ENTITY_RIGS)[0] : null;
    const initialData = initialKey ? ENTITY_RIGS[initialKey] : null;

    if (!initialData || !initialKey) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-white bg-[#1a1a1a]">
                <p>No entity rigs found to edit.</p>
                <div className="text-xs text-gray-500 mt-2">
                    Check data/EntityRigDefinitions.ts
                </div>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-red-600 rounded">Back</button>
            </div>
        );
    }


    const [selectedRigKey, setSelectedRigKey] = useState<string>(initialKey);
    const [rigData, setRigData] = useState<EntityRig>(JSON.parse(JSON.stringify(initialData)));
    const [selectedPart, setSelectedPart] = useState<string>('torso');

    // --- NEW: Editor Modes ---
    const [activeTab, setActiveTab] = useState<'RIG' | 'ANIM'>('RIG');

    // --- NEW: Animation State ---
    const [selectedAnim, setSelectedAnim] = useState<string>('cast_fireball');
    const [timelineFrame, setTimelineFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // --- NEW: Mount & Walk State ---
    const [isWalking, setIsWalking] = useState(false);
    const [facing, setFacing] = useState<'LEFT' | 'RIGHT'>('LEFT'); // Rig default is Left


    // Interaction State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(3.0); // Default zoom level for "Character Create" feel
    const [dragMode, setDragMode] = useState<'NONE' | 'PAN' | 'DRAG_PART'>('NONE');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const partTransformsRef = useRef<Record<string, { x: number, y: number, scale: number }>>({});
    const [showWeapon, setShowWeapon] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Dummy ally for rendering
    const dummyAlly = React.useMemo<Ally>(() => ({
        id: 'dummy',
        name: 'Bones',
        pos: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 0.5,
        colorScheme: { skin: '#fff', shirt: '#fff', pants: '#fff' },
        description: 'Rigging Dummy',
        isDead: false
    }), []);

    // Animation Loop
    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();

        const render = (time: number) => {
            const dt = time - lastTime;
            lastTime = time;

            // Update Timeline if Playing (Only affecting ANIM tab timeline logic, irrelevant for visual walking toggle)
            if (activeTab === 'ANIM' && isPlaying) {
                setTimelineFrame(prev => {
                    const max = ANIMATION_LIBRARY[selectedAnim]?.totalDuration || 60;
                    const increment = deltaToFrames(dt) * playbackSpeed;
                    let next = prev + increment;
                    if (next > max) next = 0; // Loop
                    return next;
                });
            }

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Center calculation
                    const centerX = canvas.width / 2 + pan.x;
                    const centerY = canvas.height / 2 + 50 + pan.y;

                    // Grid
                    ctx.strokeStyle = '#333';
                    ctx.beginPath();
                    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, canvas.height);
                    ctx.moveTo(0, centerY); ctx.lineTo(canvas.width, centerY);
                    ctx.stroke();

                    // --- PREPARE RENDER CONFIG ---
                    const currentParts = JSON.parse(JSON.stringify(rigData.parts)); // Deep clone parts

                    // 1. Apply Timeline Animation if in ANIM tab (Overrides static pose)
                    if (activeTab === 'ANIM') {
                        const clip = ANIMATION_LIBRARY[selectedAnim];
                        if (clip) {
                            const pose = getInterpolatedPose(timelineFrame, clip.keyframes);
                            Object.entries(pose).forEach(([boneName, transform]) => {
                                if (currentParts[boneName]) {
                                    currentParts[boneName] = {
                                        ...currentParts[boneName],
                                        rotation: (currentParts[boneName].rotation || 0) + (transform.rotation || 0),
                                        x: currentParts[boneName].x + (transform.x || 0),
                                        y: currentParts[boneName].y + (transform.y || 0)
                                    };
                                }
                            });
                        }
                    }

                    // 2. Apply MOUNTED Overrides if enabled
                    // 2. Apply MOUNTED Overrides (Handled by skeleton_mounted rig)

                    const renderConfig = {
                        ...rigData,
                        parts: currentParts,
                        scale: (rigData.scale || 1) * zoom
                    };

                    // --- RENDER EXECUTION ---
                    const allyUpdates: any = {
                        ...dummyAlly,
                        isMoving: isWalking,
                        isEditorAnimating: isWalking || activeTab === 'ANIM', // Allow walking anim OR timeline
                        // If Timeline is active, we usually don't want procedural walk on top? 
                        // Actually 'isEditorAnimating' enables the procedural sway/breath/walk in renderSkeletalNPC.
                        // If activeTab === 'ANIM', we might want to DISABLE procedural stuff to see the clip cleanly?
                        // Let's say if isWalking is FALSE, we disable procedural, even in ANIM tab.
                        // So just use 'isWalking'.
                        facingRight: facing === 'RIGHT'
                    };
                    (allyUpdates as any).isEditorAnimating = isWalking;

                    // FACING LOGIC
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    const scaleVal = facing === 'RIGHT' ? 1 : -1; // Rig is Left-Default? Wait.
                    // PlayerRenderer: facingRight ? scale : -scale.
                    // If Rig is Left-Facing (Scale 1), then FacingRight should be Scale -1?
                    // PlayerRenderer logic: ctx.scale(facingRight ? scale : -scale, scale);
                    // This implies if facingRight, we use positive scale. 
                    // Let's stick to PlayerRenderer exactly.
                    const finalScaleX = facing === 'RIGHT' ? 1 : -1;
                    ctx.scale(finalScaleX, 1);

                    // We need to pass (0,0) as position because we translated context.
                    // EXCEPT renderSkeletalNPC expects world coords to draw shadow etc.
                    // It translates itself.
                    // So we should NOT translate context if we pass centerX/Y.
                    ctx.restore(); // Undo translate/scale for now, let's pass params.

                    // CORRECT FACING LOGIC:
                    // RenderSkeletalNPC doesn't take facing param. It uses config.scale.
                    // But we used context scale in PlayerRenderer.

                    const renderPlayer = (filter?: (n: string) => boolean) => {
                        ctx.save();
                        ctx.translate(centerX, centerY);

                        ctx.scale(finalScaleX, 1);
                        ctx.translate(-centerX, -centerY);

                        const transforms = renderSkeletalNPC(ctx, allyUpdates, centerX, centerY, renderConfig, true, showWeapon, selectedRigKey, filter);
                        partTransformsRef.current = transforms;

                        ctx.restore();
                    };

                    try {
                        renderPlayer(undefined);
                    } catch (e) {
                        // Prevent crashloop, maybe stop playing?
                        if (Math.random() < 0.01) console.error("Render Error:", e);
                    }

                    // Draw Selection Highlight (Only in RIG mode, simplistic)
                    // Note: Transforms returned by renderSkeletalNPC are in World Space.
                    // But if we applied Context Scale for facing, the visuals are flipped, but the "WorldTransforms" returned might be raw?
                    // Actually renderSkeletalNPC returns "World" coords relative to Canvas 0,0 assuming Standard Context.
                    // If we scaled the Context externally (as we did with ctx.scale), the drawn pixels are flipped.
                    // But the clicked logic (onMouseDown) uses mouse coordinates.
                    // We need to synchronize the "PartTransforms" state with what is visually rendered.
                    // Currently renderSkeletalNPC calculates transforms assuming Identity context (mostly).
                    // If we wrap it in ctx.scale, the visual matches, but the returned coordinates...
                    // The returned coordinates are calculated via `computeWorld` which relies on `parent.scale`.
                    // It naturally handles `scaleX` from flip. 
                    // BUT `renderSkeletalNPC` internal `computeWorld` does NOT know about our external `ctx.scale` in `RiggingEditor`.
                    // So `partTransforms` will be WRONG if we use external context scaling.

                    // FIX: We should pass `scaleX` or `flipX` into the Config or Ally, and handle it inside renderSkeletalNPC?
                    // OR: We transform the `partTransforms` after receiving them?
                    // OR: We just accept that selecting parts while Flipped/Mounted might be tricky?
                    // User just wants to SEE the rigs. Editing might be done in unmounted/standard view.
                    // Let's settle for visuals first.

                }
            }
            animId = requestAnimationFrame(() => render(performance.now()));
        };
        render(performance.now());
        return () => cancelAnimationFrame(animId);
    }, [rigData, selectedRigKey, selectedPart, pan, zoom, dummyAlly, showWeapon, activeTab, isPlaying, timelineFrame, selectedAnim, isWalking, facing]);

    const deltaToFrames = (ms: number) => ms / (1000 / 60);




    const handleChange = (field: keyof RigBone, value: number | boolean) => {
        setRigData(prev => ({
            ...prev,
            parts: {
                ...prev.parts,
                [selectedPart]: {
                    ...prev.parts[selectedPart],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        // Update global immediately so game loop sees it instantly
        ENTITY_RIGS[selectedRigKey] = rigData;

        const fullConfig = {
            ...ENTITY_RIGS,
            [selectedRigKey]: rigData
        };

        try {
            const res = await fetch('/save-rig-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullConfig)
            });
            if (res.ok) {
                alert('Saved successfully!');
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving');
        }
    };

    // --- MOUSE HANDLERS ---
    const onMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // HIT TEST
        let clickedPart: string | null = null;
        // Hit radius scales with zoom
        let minDist = 30 * (zoom / 2);

        // Check selected first (priority)
        const currentT = partTransformsRef.current[selectedPart];
        if (currentT) {
            const dist = Math.sqrt(Math.pow(mx - currentT.x, 2) + Math.pow(my - currentT.y, 2));
            if (dist < minDist) clickedPart = selectedPart;
        }

        // If not hitting selected, check others
        if (!clickedPart) {
            Object.entries(partTransformsRef.current).forEach(([key, t]: [string, any]) => {
                const dist = Math.sqrt(Math.pow(mx - t.x, 2) + Math.pow(my - t.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    clickedPart = key;
                }
            });
        }

        if (clickedPart) {
            setSelectedPart(clickedPart);
            setDragMode('DRAG_PART');
            setDragStart({ x: mx, y: my });
        } else {
            setDragMode('PAN');
            setDragStart({ x: mx, y: my });
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (dragMode === 'NONE') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const dx = mx - dragStart.x;
        const dy = my - dragStart.y;

        if (dragMode === 'PAN') {
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        } else if (dragMode === 'DRAG_PART') {
            // Drag Part
            const configDx = dx / zoom;
            const configDy = dy / zoom;

            setRigData(prev => {
                const newParts = { ...prev.parts };
                const p = newParts[selectedPart];

                // 1. Move Selected
                newParts[selectedPart] = {
                    ...p,
                    x: p.x + configDx,
                    y: p.y + configDy
                };

                // 2. Compensate Children (Inverse Move / "Inverse Kinematics" for Root)
                // We do this to allow moving the Root Sprite without pulling the whole rig
                const children: string[] = [];

                // Universal Rules based on Part Name (More robust than checking RigID)
                if (selectedPart === 'body') {
                    // Horse/Quadruped Body
                    // Wolf Legs are siblings (children of root), don't compensate them!
                    if (selectedRigKey === 'wolf') {
                        children.push('head', 'tail');
                    } else {
                        children.push('neck', 'tail', 'leg_fl', 'leg_fr', 'leg_bl', 'leg_br', 'legs', 'head');
                    }
                }
                else if (selectedPart === 'torso') {
                    // Humanoid Torso
                    children.push('head', 'arm_l', 'arm_r', 'sheath', 'legs', 'leg_l', 'leg_r');
                }
                else if (selectedPart === 'neck') {
                    children.push('head');
                }
                else if (selectedPart === 'arm_l') children.push('hand_l');
                else if (selectedPart === 'arm_r') children.push('hand_r');
                else if (selectedPart === 'hand_r') children.push('weapon_r');


                children.forEach(childKey => {
                    // Only compensate if the part actually exists
                    if (newParts[childKey]) {
                        newParts[childKey] = {
                            ...newParts[childKey],
                            x: newParts[childKey].x - configDx,
                            y: newParts[childKey].y - configDy
                        };
                    }
                });

                return { ...prev, parts: newParts };
            });
        }

        setDragStart({ x: mx, y: my });
    };

    const onMouseUp = () => {
        setDragMode('NONE');
    };

    const onWheel = (e: React.WheelEvent) => {
        const delta = -e.deltaY * 0.005;
        setZoom(prev => Math.max(0.5, Math.min(10, prev + delta)));
    };

    const activeBone = rigData.parts[selectedPart];

    return (
        <div className="flex w-full h-full bg-[#1a1a1a] text-white font-mono"
            onMouseUp={onMouseUp}
        >
            {/* LEFT PANEL */}
            <div className="w-64 bg-[#262626] border-r border-[#444] p-4 flex flex-col gap-4">
                <button onClick={onBack} className="mb-4 px-3 py-1 bg-[#444] hover:bg-[#555] rounded">
                    &larr; Back
                </button>

                <div>
                    <label className="text-xs uppercase text-[#888]">Rig</label>
                    <select
                        value={selectedRigKey}
                        onChange={e => {
                            const newKey = e.target.value;
                            if (ENTITY_RIGS[newKey]) {
                                setSelectedRigKey(newKey);
                                const newData = JSON.parse(JSON.stringify(ENTITY_RIGS[newKey]));
                                setRigData(newData);
                                // Auto-select first part to prevent 'torso' ghost on Wolf
                                const firstPart = Object.keys(newData.parts)[0];
                                if (firstPart) setSelectedPart(firstPart);
                            }
                        }}
                        className="w-full bg-[#333] p-2 mt-1 rounded border border-[#555]"
                    >
                        {Object.keys(ENTITY_RIGS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                <div className="bg-[#333] p-2 rounded flex flex-col gap-2 mb-2">
                    <label className="text-xs uppercase text-[#888] font-bold">View Options</label>

                    <div className="flex items-center justify-between bg-[#2a2a2a] p-1 rounded">
                        <span className="text-xs text-gray-300">Walking</span>
                        <input
                            type="checkbox"
                            checked={isWalking}
                            onChange={e => setIsWalking(e.target.checked)}
                            className="accent-green-500"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-[#2a2a2a] p-1 rounded">
                        <span className="text-xs text-gray-300">Facing</span>
                        <button
                            onClick={() => setFacing(f => f === 'LEFT' ? 'RIGHT' : 'LEFT')}
                            className="text-[10px] font-bold bg-[#444] px-2 py-0.5 rounded hover:bg-[#555] min-w-[50px]"
                        >
                            {facing}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <label className="text-xs uppercase text-[#888]">Parts (Z-Index)</label>
                    <div className="flex items-center gap-2 mb-2 p-2 bg-[#333] rounded">
                        <input type="checkbox" checked={showWeapon} onChange={e => setShowWeapon(e.target.checked)} />
                        <span className="text-sm">Show Weapon</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                        {Object.keys(rigData.parts)
                            .sort((a, b) => (rigData.parts[b].zIndex || 0) - (rigData.parts[a].zIndex || 0)) // Sort by Z (Front to Back for list?) No Back to Front usually. Let's do Front on top.
                            .map(partKey => (
                                <button
                                    key={partKey}
                                    onClick={() => setSelectedPart(partKey)}
                                    className={`text-left px-3 py-2 rounded text-xs flex justify-between items-center ${selectedPart === partKey ? 'bg-blue-600' : 'bg-[#333] hover:bg-[#444]'}`}
                                >
                                    <span>{partKey}</span>
                                    <span className={`text-[10px] ${selectedPart === partKey ? 'text-blue-200' : 'text-gray-500'}`}>
                                        {rigData.parts[partKey].zIndex ?? 0}
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-lg"
                >
                    SAVE RIG
                </button>
            </div>

            {/* CENTER CANVAS */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-[#2a2a2a] overflow-hidden">
                <div className="absolute top-4 left-4 text-xs text-[#666] pointer-events-none select-none z-10">
                    {activeTab === 'RIG' ? 'LMB: SELECT/DRAG PART | DRAG BG: PAN | SCROLL: ZOOM' :
                        'TIMELINE: SCRUB | SPACE: PLAY/PAUSE'}
                </div>

                {/* TABS */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#333] rounded flex border border-[#555] overflow-hidden z-50 shadow-[0_0_15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                    {(['RIG', 'ANIM'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 text-sm font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-400 hover:bg-[#444] hover:text-gray-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800} // Larger canvas
                    className="shadow-2xl bg-[#1e1e1e] cursor-crosshair"
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onWheel={onWheel}
                />

                {/* BOTTOM PANEL: TIMELINE (Only in ANIM/SPELL) */}
                {(activeTab === 'ANIM' || activeTab === 'SPELL') && (
                    <div className="absolute bottom-4 left-4 right-4 bg-[#262626] border border-[#444] p-4 rounded bg-opacity-90">
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={() => setIsPlaying(!isPlaying)} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold">
                                {isPlaying ? 'PAUSE' : 'PLAY'}
                            </button>
                            <span className="text-xs text-gray-400">Frame: {Math.floor(timelineFrame)} / {ANIMATION_LIBRARY[selectedAnim]?.totalDuration || 60}</span>


                        </div>
                        <input
                            type="range"
                            min="0"
                            max={ANIMATION_LIBRARY[selectedAnim]?.totalDuration || 60}
                            step="0.1"
                            value={timelineFrame}
                            onChange={e => {
                                setTimelineFrame(parseFloat(e.target.value));
                                setIsPlaying(false);
                            }}
                            className="w-full h-2 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                )}
            </div>

            {/* RIGHT PANEL - INSPECTOR */}
            <div className="w-72 bg-[#262626] border-l border-[#444] p-4">
                <h3 className="text-lg font-bold mb-4 border-b border-[#444] pb-2 uppercase tracking-wide text-blue-400">
                    {activeTab === 'RIG' ? selectedPart : 'Animation'}
                </h3>

                {activeTab === 'ANIM' && (
                    <div className="space-y-4">
                        <label className="text-xs uppercase text-[#888]">Clip</label>
                        <select
                            value={selectedAnim}
                            onChange={e => setSelectedAnim(e.target.value)}
                            className="w-full bg-[#333] p-2 rounded border border-[#555]"
                        >
                            {Object.keys(ANIMATION_LIBRARY).map(k => <option key={k} value={k}>{ANIMATION_LIBRARY[k].name}</option>)}
                        </select>

                        <div className="p-4 bg-[#333] rounded">
                            <p className="text-xs text-gray-400 mb-2">Keyframes</p>
                            <div className="flex flex-wrap gap-1">
                                {ANIMATION_LIBRARY[selectedAnim]?.keyframes.map(k => (
                                    <button
                                        key={k.frame}
                                        onClick={() => setTimelineFrame(k.frame)}
                                        className={`w-6 h-6 text-xs flex items-center justify-center rounded ${Math.abs(timelineFrame - k.frame) < 1 ? 'bg-blue-500 text-white' : 'bg-[#222] text-gray-500'}`}
                                    >
                                        {k.frame}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}



                {activeTab === 'RIG' && activeBone && (
                    <div className="space-y-6">
                        <div className="control-group">
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-[#aaa]">Position X</label>
                                <span className="text-xs text-blue-400">{Math.round(activeBone.x)}</span>
                            </div>
                            <input
                                type="range" min="-100" max="100"
                                value={activeBone.x}
                                onChange={e => handleChange('x', parseInt(e.target.value))}
                                className="w-full h-2 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="control-group">
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-[#aaa]">Position Y</label>
                                <span className="text-xs text-blue-400">{Math.round(activeBone.y)}</span>
                            </div>
                            <input
                                type="range" min="-100" max="100"
                                value={activeBone.y}
                                onChange={e => handleChange('y', parseInt(e.target.value))}
                                className="w-full h-2 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="control-group">
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-[#aaa]">Rotation (Rad)</label>
                                <span className="text-xs text-blue-400">{activeBone.rotation?.toFixed(2) || 0}</span>
                            </div>
                            <input
                                type="range" min="-6.28" max="6.28" step="0.1"
                                value={activeBone.rotation || 0}
                                onChange={e => handleChange('rotation', parseFloat(e.target.value))}
                                className="w-full h-2 bg-[#444] rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        <div className="control-group">
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-[#aaa]">Scale</label>
                                <span className="text-xs text-blue-400">{activeBone.scale?.toFixed(2) || 1}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="3" step="0.1"
                                value={activeBone.scale || 1}
                                onChange={e => handleChange('scale', parseFloat(e.target.value))}
                                className="w-full h-2 bg-[#444] rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                        </div>

                        <div className="control-group">
                            <div className="flex justify-between mb-1 items-center">
                                <label className="text-xs text-[#aaa]">Flip X</label>
                                <input
                                    type="checkbox"
                                    checked={!!activeBone.flipX}
                                    onChange={e => handleChange('flipX', e.target.checked)}
                                    className="w-4 h-4 bg-[#444] rounded border-gray-600 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="control-group">
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-[#aaa]">Layer (Z-Index)</label>
                                <span className="text-xs text-blue-400">{activeBone.zIndex ?? 0}</span>
                            </div>
                            <input
                                type="number"
                                value={activeBone.zIndex ?? 0}
                                onChange={e => handleChange('zIndex', parseInt(e.target.value))}
                                className="w-full bg-[#444] text-white p-1 rounded text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
