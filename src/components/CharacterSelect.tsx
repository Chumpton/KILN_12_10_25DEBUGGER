
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Player, PlayerVisuals } from '../types';
import { createInitialPlayer, CharacterCreationOptions } from '../utils/factory';
import { renderCharacter } from '../modules/player/render/renderCharacter';
import { getSavedCharacters, saveCharacter, deleteCharacter } from '../utils/storage';
import availableHeads from '../data/registries/heads.json';

interface CharacterSelectProps {
    onEnterWorld: (player: Player) => void;
    onBack: () => void;
}

// --- DATA CONSTANTS ---
const BODY_TYPES: { id: 'slim' | 'average' | 'bulky', label: string, icon: string }[] = [
    { id: 'slim', label: 'Slim', icon: '🏃' },
    { id: 'average', label: 'Standard', icon: '🚶' },
    { id: 'bulky', label: 'Bulky', icon: '🏋️' }
];

const PALETTES = [
    { id: 'forest', name: 'Ranger', shirt: '#4ade80', pants: '#166534', highlight: '#4ade80' },
    { id: 'ocean', name: 'Marine', shirt: '#60a5fa', pants: '#1e3a8a', highlight: '#60a5fa' },
    { id: 'ember', name: 'Pyro', shirt: '#fb923c', pants: '#7c2d12', highlight: '#fb923c' },
    { id: 'void', name: 'Cultist', shirt: '#c084fc', pants: '#581c87', highlight: '#c084fc' },
    { id: 'royal', name: 'Noble', shirt: '#facc15', pants: '#b45309', highlight: '#facc15' },
    { id: 'monk', name: 'Monk', shirt: '#fdba74', pants: '#9a3412', highlight: '#fdba74' }
];

const TOOLS: { id: 'axe' | 'shovel' | 'torch', label: string, icon: string, desc: string }[] = [
    { id: 'axe', label: 'Wood Axe', icon: '🪓', desc: 'High Damage' },
    { id: 'shovel', label: 'Shovel', icon: '⛏️', desc: 'Balanced' },
    { id: 'torch', label: 'Torch', icon: '🔥', desc: 'Elemental' }
];

const PERKS: { id: 'fleet' | 'stout' | 'arcane', label: string, desc: string, icon: string }[] = [
    { id: 'fleet', label: 'Fleet', desc: '+Speed', icon: '👢' },
    { id: 'stout', label: 'Stout', desc: '+Vitality', icon: '❤️' },
    { id: 'arcane', label: 'Arcane', desc: '+Power', icon: '🔮' }
];

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onEnterWorld, onBack }) => {
    // --- STATE ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [characters, setCharacters] = useState<Player[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mode, setMode] = useState<'SELECT' | 'CREATE'>('SELECT');

    // --- CREATION STATE ---
    const [createName, setCreateName] = useState('');
    const [createBody, setCreateBody] = useState<'slim' | 'average' | 'bulky'>('average');
    const [createPaletteIdx, setCreatePaletteIdx] = useState(0);
    const [createTool, setCreateTool] = useState<'axe' | 'shovel' | 'torch'>('axe');
    const [createPerk, setCreatePerk] = useState<'fleet' | 'stout' | 'arcane'>('fleet');
    const [createHead, setCreateHead] = useState<string | null>(null);

    // --- EDIT MODE STATE ---
    const [editMode, setEditMode] = useState(false);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    // Default Layout matching roughly the original centered look
    const defaultLayout = {
        rack: { x: -10, y: 11, scale: 1.25, rotation: 0 },
        header: { x: 44, y: -269, scale: 1, rotation: 0 },
        list: { x: -238, y: 1, scale: 1, rotation: 0 },
        preview: { x: 267, y: 69, scale: 1, rotation: 0 },
        controls: { x: -243, y: 177, scale: 0.875, rotation: 0 },
        "create-form": { x: -270, y: 20, scale: 1, rotation: 0 } // Position for the create form
    };

    const [uiLayout, setUiLayout] = useState(() => {
        try {
            const saved = localStorage.getItem('kiln_char_select_layout_v3');
            return saved ? { ...defaultLayout, ...JSON.parse(saved) } : defaultLayout;
        } catch (e) {
            return defaultLayout;
        }
    });

    // Mouse Interaction
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialLayoutRef = useRef(uiLayout);

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('kiln_char_select_layout_v3', JSON.stringify(uiLayout));
    }, [uiLayout]);

    // Handle Copy Config
    const handleLogConfig = () => {
        const configStr = JSON.stringify(uiLayout, null, 4);
        console.log("CURRENT CHAR SELECT LAYOUT:", configStr);
        navigator.clipboard.writeText(configStr).then(() => {
            alert("Config copied to clipboard!");
        }).catch(() => { });
    };

    // Toggle Edit Mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                setEditMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent, elementKey: string) => {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        setSelectedElement(elementKey);
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialLayoutRef.current = uiLayout;
    };

    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (editMode && isDragging && selectedElement) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;

                setUiLayout(prev => {
                    const currentKey = selectedElement as keyof typeof uiLayout;
                    if (!prev[currentKey]) return prev;

                    const start = initialLayoutRef.current[currentKey];
                    return {
                        ...prev,
                        [currentKey]: {
                            ...prev[currentKey],
                            x: start.x + dx,
                            y: start.y + dy
                        }
                    };
                });
            }
        };

        const handleWindowMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [editMode, isDragging, selectedElement]);

    const handleWheelScale = (e: React.WheelEvent, elementKey: string) => {
        if (!editMode) return;
        e.stopPropagation();

        setUiLayout(prev => {
            const k = elementKey as keyof typeof uiLayout;
            if (!prev[k]) return prev;

            // Shift key rotates, normal scroll scales
            if (e.shiftKey) {
                return {
                    ...prev,
                    [k]: { ...prev[k], rotation: prev[k].rotation + (e.deltaY * 0.05) }
                };
            } else {
                return {
                    ...prev,
                    [k]: { ...prev[k], scale: Math.max(0.1, prev[k].scale + (e.deltaY * -0.001)) }
                };
            }
        });
    };

    // Load characters
    useEffect(() => {
        const loaded = getSavedCharacters();
        setCharacters(loaded);
        if (loaded.length > 0) {
            setSelectedId(loaded[0].id);
        } else {
            setMode('CREATE');
        }
    }, []);

    // Helper: Preview Player Object
    const previewPlayer = useMemo(() => {
        if (mode === 'SELECT') {
            return characters.find(c => c.id === selectedId);
        } else {
            const pal = PALETTES[createPaletteIdx];
            const opts: CharacterCreationOptions = {
                name: createName || "Hero",
                visuals: {
                    bodyType: createBody,
                    skinColor: '#c68642',
                    hairColor: '#000000',
                    shirtColor: pal.shirt,
                    pantsColor: pal.pants,
                    head: createHead ? `/${createHead.replace(/^public\//, '')}` : undefined
                },
                tool: createTool,
                perk: createPerk,
                id: 'preview'
            };
            return createInitialPlayer(opts);
        }
    }, [mode, selectedId, characters, createName, createBody, createPaletteIdx, createTool, createPerk, createHead]);

    const handleCreateFinal = () => {
        if (!createName.trim()) {
            setCreateName("Hero"); // Default name
        }

        const pal = PALETTES[createPaletteIdx];
        const newChar = createInitialPlayer({
            name: createName.trim() || "Hero",
            visuals: {
                bodyType: createBody,
                skinColor: '#c68642',
                hairColor: '#000000',
                shirtColor: pal.shirt,
                pantsColor: pal.pants,
                head: createHead ? `/${createHead.replace(/^public\//, '')}` : undefined
            },
            tool: createTool,
            perk: createPerk,
            id: `char_${Date.now()}`
        });

        saveCharacter(newChar);
        setCharacters(getSavedCharacters());
        setSelectedId(newChar.id);
        setMode('SELECT');
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this character?")) return;

        deleteCharacter(id);
        const updated = getSavedCharacters();
        setCharacters(updated);
        if (updated.length > 0) setSelectedId(updated[0].id);
        else {
            setSelectedId(null);
            setMode('CREATE');
        }
    };

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rafId: number;

        const render = () => {
            // Resize logic
            const rect = canvas.getBoundingClientRect();
            if (canvas.width !== rect.width || canvas.height !== rect.height) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }

            // Clear canvas (Transparent to show panel background)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height - 100;

            // Draw Simple Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 10, 60, 15, 0, 0, Math.PI * 2);
            ctx.fill();

            if (previewPlayer) {
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.scale(3, 3); // Large scale for pixel look
                ctx.translate(-centerX, -centerY);

                // Render character centered
                renderCharacter(ctx, previewPlayer, centerX, centerY, null, true);

                // Reset for next frame
                ctx.restore();
            }

            rafId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(rafId);
    }, [previewPlayer]);

    // Helper to get style for an element
    const getStyle = (key: keyof typeof uiLayout) => {
        const layout = uiLayout[key] || defaultLayout[key as keyof typeof defaultLayout] || { x: 0, y: 0, scale: 1, rotation: 0 };
        return {
            position: 'absolute' as const,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${layout.x}px, ${layout.y}px) rotate(${layout.rotation}deg) scale(${layout.scale})`,
            cursor: editMode ? 'grab' : 'default',
            outline: editMode && selectedElement === key ? '2px solid yellow' : editMode ? '1px dashed rgba(255,255,255,0.3)' : 'none',
            zIndex: editMode && selectedElement === key ? 100 : undefined
        };
    };


    return (
        <div className="absolute inset-0 z-50 overflow-hidden pointer-events-auto font-sans" onWheel={(e) => editMode && e.stopPropagation()}>

            {/* Edit Mode Overlay */}
            {editMode && (
                <div className="absolute top-2 right-2 z-[200] flex gap-2">
                    <div className="bg-red-500 text-white px-2 py-1 font-bold animate-pulse">EDIT MODE (F1)</div>
                    <button onClick={handleLogConfig} className="bg-blue-600 text-white px-3 py-1 font-bold rounded border border-white/20">COPY CONFIG</button>
                    {(['rack', 'header', 'list', 'preview', 'controls', 'create-form'] as const).map(k => (
                        <div key={k} className="text-xs bg-black/50 text-white px-1 cursor-pointer" onMouseDown={(e) => handleMouseDown(e as any, k)}>Select {k}</div>
                    ))}
                </div>
            )}

            {/* 1. RACK BACKDROP */}
            <div
                style={{
                    ...getStyle('rack'),
                    width: '900px',
                    height: '550px',
                    backgroundImage: 'url("/assets/ui/Menu Rack.png")',
                    backgroundSize: '100% 100%',
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(20px 20px 0 rgba(0,0,0,0.5))'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'rack')}
                onWheel={(e) => handleWheelScale(e, 'rack')}
            />

            {/* 2. HEADER */}
            <div
                style={{
                    ...getStyle('header'),
                    width: '300px',
                    textAlign: 'left'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'header')}
                onWheel={(e) => handleWheelScale(e, 'header')}
            >
                <h2 className="text-6xl text-[#ffb74d] tracking-wider drop-shadow-[4px_4px_0_#000]" style={{ fontFamily: '"Jersey 25", sans-serif' }}>
                    {mode === 'SELECT' ? 'ROSTER' : 'CREATE'}
                </h2>
                <div className="h-1 bg-[#5d403750] w-full mt-2" />
            </div>

            {/* 3. CONTENT AREA (Swaps between List and Form) */}
            {mode === 'SELECT' ? (
                <div
                    style={{
                        ...getStyle('list'),
                        width: '320px',
                        height: '380px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        overflowY: 'auto',
                        paddingRight: '8px'
                    }}
                    className="custom-scrollbar"
                    onMouseDown={(e) => handleMouseDown(e, 'list')}
                    onWheel={(e) => handleWheelScale(e, 'list')}
                >
                    {characters.map(char => (
                        <div
                            key={char.id}
                            onClick={() => setSelectedId(char.id)}
                            className={`
                                relative p-4 rounded cursor-pointer transition-all group
                                ${selectedId === char.id ? 'translate-x-2 brightness-110' : 'hover:brightness-105'}
                            `}
                            style={{
                                backgroundImage: 'url("/assets/ui/Button1.png")',
                                backgroundSize: '100% 100%',
                                imageRendering: 'pixelated',
                                textShadow: '1px 1px 0 #3e2723'
                            }}
                        >
                            <div className="flex justify-between items-center text-[#ffcc80]">
                                <div>
                                    <div className={`text-xl font-bold font-sans drop-shadow-md`}>
                                        {char.name}
                                    </div>
                                    <div className="text-xs opacity-80 mt-1 uppercase tracking-wide">
                                        Lvl {char.level} • {char.visuals?.bodyType || 'Standard'}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, char.id)}
                                    className="w-6 h-6 flex items-center justify-center text-[#ffcc80] hover:text-red-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}

                    {characters.length === 0 && <div className="text-center text-[#795548] italic py-8">Empty Roster</div>}

                    <button
                        onClick={() => { setMode('CREATE'); setCreateName(''); }}
                        className="mt-2 w-full py-3 text-[#ffcc80] hover:brightness-110 active:translate-y-1 uppercase font-bold tracking-widest text-sm transition-all shadow-md"
                        style={{
                            backgroundImage: 'url("/assets/ui/Button1.png")',
                            backgroundSize: '100% 100%',
                            imageRendering: 'pixelated',
                            textShadow: '1px 1px 0 #3e2723'
                        }}
                    >
                        + Create New
                    </button>
                </div>
            ) : (
                <div
                    style={{
                        ...getStyle('create-form' as any), // Reuse list pos or separate? Separated in defaultLayout
                        width: '320px',
                        height: '420px',
                        overflowY: 'auto'
                    }}
                    className="custom-scrollbar flex flex-col gap-4"
                    onMouseDown={(e) => handleMouseDown(e, 'create-form')}
                    onWheel={(e) => handleWheelScale(e, 'create-form')}
                >
                    {/* CREATE NEW FORM CONTENT (Simplified for this view) */}
                    <section>
                        <label className="text-[#a1887f] text-[10px] font-bold uppercase mb-1 block">Name</label>
                        <input
                            type="text"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            className="w-full bg-[#1a1210] border border-[#5d4037] rounded p-2 text-[#ffcc80] font-bold focus:outline-none focus:border-[#ffb74d]"
                            placeholder="Hero Name"
                        />
                    </section>
                    <section>
                        <label className="text-[#a1887f] text-[10px] font-bold uppercase mb-1 block">Body & Palette</label>
                        <div className="flex gap-2 mb-2">
                            {BODY_TYPES.map(bt => (
                                <button key={bt.id} onClick={() => setCreateBody(bt.id)} className={`flex-1 p-2 rounded border-b-2 ${createBody === bt.id ? 'bg-[#558b2f] border-[#33691e] text-white' : 'bg-[#3e2723] border-[#271c19] text-[#795548]'}`}>
                                    <div className="text-lg">{bt.icon}</div>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                            {PALETTES.map((pal, idx) => (
                                <button
                                    key={pal.id}
                                    onClick={() => setCreatePaletteIdx(idx)}
                                    className={`h-6 rounded border ${createPaletteIdx === idx ? 'border-white scale-110' : 'border-black/20 opacity-70'}`}
                                    style={{ backgroundColor: pal.shirt }}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Compacted Tools/Perks for space */}
                    <section>
                        <label className="text-[#a1887f] text-[10px] font-bold uppercase mb-1 block">Starting Gear</label>
                        <div className="flex gap-2">
                            {TOOLS.map(t => (
                                <button key={t.id} onClick={() => setCreateTool(t.id as any)} className={`flex-1 p-2 rounded border-b-2 text-center ${createTool === t.id ? 'bg-[#ffb74d] text-[#3e2723]' : 'bg-[#3e2723] text-[#795548]'}`}>
                                    <div className="text-lg">{t.icon}</div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            )}


            {/* 4. PREVIEW AREA */}
            <div
                style={{
                    ...getStyle('preview'),
                    width: '400px',
                    height: '400px'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'preview')}
                onWheel={(e) => handleWheelScale(e, 'preview')}
            >
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* 5. FOOTER CONTROLS */}
            <div
                style={{
                    ...getStyle('controls'),
                    width: '320px',
                    display: 'flex',
                    gap: '10px'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'controls')}
                onWheel={(e) => handleWheelScale(e, 'controls')}
            >
                {mode === 'SELECT' ? (
                    <>
                        <button
                            onClick={onBack}
                            className="px-6 py-3 text-[#ffcc80] font-bold uppercase hover:brightness-110 active:translate-y-1 shadow-md flex-1"
                            style={{ backgroundImage: 'url("/assets/ui/Button1.png")', backgroundSize: '100% 100%', imageRendering: 'pixelated', textShadow: '1px 1px 0 #3e2723' }}
                        >Back</button>
                        <button
                            onClick={() => selectedId && onEnterWorld(characters.find(c => c.id === selectedId)!)}
                            disabled={!selectedId}
                            className="text-[#ffcc80] font-bold uppercase tracking-widest text-lg py-3 hover:brightness-110 active:translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-[2]"
                            style={{ backgroundImage: 'url("/assets/ui/Button1.png")', backgroundSize: '100% 100%', imageRendering: 'pixelated', textShadow: '2px 2px 0 #3e2723' }}
                        >Enter World</button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setMode('SELECT')}
                            className="px-6 py-3 text-[#ffcc80] font-bold uppercase hover:brightness-110 active:translate-y-1 shadow-md flex-1"
                            style={{ backgroundImage: 'url("/assets/ui/Button1.png")', backgroundSize: '100% 100%', imageRendering: 'pixelated', textShadow: '1px 1px 0 #3e2723' }}
                        >Cancel</button>
                        <button
                            onClick={handleCreateFinal}
                            className="text-[#ffcc80] font-bold uppercase tracking-widest text-lg py-3 hover:brightness-110 active:translate-y-1 shadow-md flex-[2]"
                            style={{ backgroundImage: 'url("/assets/ui/Button1.png")', backgroundSize: '100% 100%', imageRendering: 'pixelated', textShadow: '2px 2px 0 #3e2723' }}
                        >Start</button>
                    </>
                )}
            </div>
        </div>
    );
};

// Simple Stat Badge updated style
const StatBadge = ({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) => (
    <div className={`flex items-center gap-3 px-3 py-1 rounded border-b-2 shadow-sm ${color} min-w-[100px] justify-between`}>
        <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span>
        </div>
        <span className="text-lg font-bold font-sans">{value}</span>
    </div>
);
