
import React, { useState, useRef, useEffect, useCallback } from 'react';

const GRID_SIZE = 32;
const CANVAS_SIZE = 512; // Display size (16x zoom)
const SCALE = CANVAS_SIZE / GRID_SIZE; // 16

type Tool = 'PENCIL' | 'ERASER' | 'PICKER' | 'FILL';

const PALETTE_PRESETS = [
    '#000000', '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764',
    '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86',
    '#333c57', '#ffffff', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c'
];

interface PixelEditorProps {
    onBack: () => void;
}

export const PixelEditor: React.FC<PixelEditorProps> = ({ onBack }) => {
    // Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null); // For grid/cursor

    // State
    const [pixels, setPixels] = useState<string[]>(Array(GRID_SIZE * GRID_SIZE).fill('')); // hex or empty
    const [history, setHistory] = useState<string[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [color, setColor] = useState('#000000');
    const [tool, setTool] = useState<Tool>('PENCIL');
    const [isDrawing, setIsDrawing] = useState(false);

    const [showGrid, setShowGrid] = useState(true);
    const [onionSkin, setOnionSkin] = useState<string | null>(null); // DataURL of pasted image
    const [onionOpacity, setOnionOpacity] = useState(0.5);

    // Save State
    const [filename, setFilename] = useState('new_asset');
    const [category, setCategory] = useState('weapons');
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

    // Item Metadata
    const [itemMeta, setItemMeta] = useState({
        displayName: '',
        rarity: 'common',
        damage: 1,
        defense: 1,
        slot: 'MAIN_HAND',
        description: ''
    });

    // --- HISTORY MANAGEMENT ---
    const addToHistory = (newPixels: string[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...newPixels]);
        if (newHistory.length > 20) newHistory.shift(); // Limit to 20 steps
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setPixels([...prev]);
            setHistoryIndex(historyIndex - 1);
        }
    };

    // --- DRAWING PIPELINE ---
    const redraw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

        // Draw Pixels
        pixels.forEach((px, i) => {
            if (px) {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                ctx.fillStyle = px;
                ctx.fillRect(x, y, 1, 1);
            }
        });
    }, [pixels]);

    useEffect(() => {
        redraw();
    }, [redraw]);

    // Initial History
    useEffect(() => {
        if (history.length === 0) {
            addToHistory(Array(GRID_SIZE * GRID_SIZE).fill(''));
        }
    }, []);

    // --- GRID OVERLAY ---
    useEffect(() => {
        const ctx = overlayRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        if (showGrid) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            // Vertical
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.moveTo(i * SCALE, 0);
                ctx.lineTo(i * SCALE, CANVAS_SIZE);
            }
            // Horizontal
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.moveTo(0, i * SCALE);
                ctx.lineTo(CANVAS_SIZE, i * SCALE);
            }
            ctx.stroke();
        }
    }, [showGrid]);

    // --- INTERACTION ---
    const getGridPos = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
        return { x, y };
    };

    const paint = (x: number, y: number) => {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
        const idx = y * GRID_SIZE + x;
        const newPixels = [...pixels];

        if (tool === 'PENCIL') {
            if (newPixels[idx] !== color) {
                newPixels[idx] = color;
                setPixels(newPixels);
            }
        } else if (tool === 'ERASER') {
            if (newPixels[idx] !== '') {
                newPixels[idx] = '';
                setPixels(newPixels);
            }
        } else if (tool === 'PICKER') {
            const picked = newPixels[idx];
            if (picked) {
                setColor(picked);
                setTool('PENCIL');
            }
        }
        // Fill not implemented yet for brevity, but easy to add BFS
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const pos = getGridPos(e);
        if (pos) paint(pos.x, pos.y);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawing) {
            const pos = getGridPos(e);
            if (pos) paint(pos.x, pos.y);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            addToHistory(pixels);
        }
    };

    // --- PASTE HANDLER ---
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // 1. Try Image
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (!blob) continue;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setOnionSkin(event.target?.result as string);
                    };
                    reader.readAsDataURL(blob);
                    return; // Prioritize image if found
                }
            }

            // 2. Try Text (JSON)
            const text = e.clipboardData?.getData('text/plain');
            if (text) {
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data) && data.length === GRID_SIZE * GRID_SIZE) {
                        // Validate content
                        const valid = data.every(p => typeof p === 'string');
                        if (valid) {
                            setPixels(data);
                            addToHistory(data);
                            console.log('Imported Pixel Data');
                        }
                    }
                } catch (err) {
                    // Not valid JSON, ignore
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [history, historyIndex]); // Add dependencies for history

    // --- SAVE HANDLER ---
    const handleSave = async () => {
        if (!canvasRef.current) return;
        setSaveStatus('SAVING');

        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const cleanName = filename.replace(/[^a-z0-9_-]/gi, '_');
            const pathRel = `public/assets/${category}/${cleanName}.png`;

            // 1. Save Image
            const res = await fetch('/save-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: pathRel,
                    image: dataUrl
                })
            });

            if (!res.ok) throw new Error('Failed to save image');

            // 2. Save Registry Entry if applicable
            let registryType = '';
            let registryItem: any = null;

            if (category === 'weapons') {
                registryType = 'weapons';
                registryItem = {
                    id: cleanName,
                    name: itemMeta.displayName || cleanName,
                    visual: pathRel, // Store path to sprite
                    rarity: itemMeta.rarity,
                    slot: itemMeta.slot,
                    stats: { damage: Number(itemMeta.damage) },
                    offset: { x: 16, y: 16 } // Center default
                };
            } else if (category === 'PlayerSprite/armor') {
                registryType = 'armor';
                registryItem = {
                    id: cleanName,
                    name: itemMeta.displayName || cleanName,
                    visual: { theme: 'CUSTOM', primaryColor: '#fff', path: pathRel },
                    rarity: itemMeta.rarity,
                    slot: itemMeta.slot,
                    stats: { shield: Number(itemMeta.defense) }
                };
            } else if (category === 'PlayerSprite/head') {
                registryType = 'heads';
                // For heads, we just save the path string
                registryItem = pathRel;
            }

            if (registryType && registryItem) {
                const regRes = await fetch('/save-registry-entry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: registryType,
                        item: registryItem
                    })
                });
                if (!regRes.ok) throw new Error('Failed to save registry entry');
            }

            setSaveStatus('SUCCESS');
            setTimeout(() => setSaveStatus('IDLE'), 2000);

        } catch (e) {
            console.error(e);
            setSaveStatus('ERROR');
        }
    };

    return (
        <div className="flex flex-col h-full text-white font-sans bg-[#1a1a1a]">
            {/* TOOLBAR HEADER */}
            <div className="flex items-center justify-between p-4 bg-[#262626] border-b border-[#404040]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-white font-bold">&larr; BACK</button>
                    <h1 className="text-xl font-bold tracking-wider text-[#fbbf24]">PIXEL FORGE</h1>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="bg-[#171717] border border-[#404040] px-2 py-1 rounded text-sm w-40"
                        placeholder="Filename"
                    />
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-[#171717] border border-[#404040] px-2 py-1 rounded text-sm"
                    >
                        <option value="weapons">Weapons</option>
                        <option value="PlayerSprite/armor">Armor</option>
                        <option value="PlayerSprite/body">Body Parts</option>
                        <option value="PlayerSprite/head">Heads</option>
                        <option value="ui">UI</option>
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'SAVING'}
                        className={`px-4 py-1 rounded font-bold text-sm transition-colors ${saveStatus === 'SUCCESS' ? 'bg-green-500 text-black' :
                            saveStatus === 'ERROR' ? 'bg-red-500 text-white' :
                                'bg-[#fbbf24] text-black hover:bg-[#fcd34d]'
                            }`}
                    >
                        {saveStatus === 'SAVING' ? 'SAVING...' : saveStatus === 'SUCCESS' ? 'SAVED!' : saveStatus === 'ERROR' ? 'ERROR' : 'SAVE PNG'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: PALETTE & TOOLS */}
                <div className="w-64 bg-[#202020] p-4 flex flex-col gap-6 border-r border-[#404040]">

                    {/* PALETTE */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Palette</h3>
                        <div className="grid grid-cols-6 gap-1 mb-4">
                            {PALETTE_PRESETS.map(c => (
                                <button
                                    key={c}
                                    style={{ backgroundColor: c }}
                                    className={`w-8 h-8 rounded-sm hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-white z-10' : ''}`}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-10 bg-transparent cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* TOOLS */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Tools</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <ToolBtn active={tool === 'PENCIL'} onClick={() => setTool('PENCIL')} icon="✏️" label="Pencil" />
                            <ToolBtn active={tool === 'ERASER'} onClick={() => setTool('ERASER')} icon="🧹" label="Eraser" />
                            <ToolBtn active={tool === 'PICKER'} onClick={() => setTool('PICKER')} icon="💉" label="Pick" />
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={undo}
                                className="w-full flex items-center justify-center gap-2 bg-[#333] hover:bg-[#444] p-2 rounded text-sm text-gray-300"
                            >
                                <span>↩️</span> UNDO
                            </button>
                        </div>
                    </div>

                    {/* ONION SKIN */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Reference</h3>
                        <div className="bg-[#111] p-3 rounded text-xs text-gray-500 text-center mb-2">
                            Paste (Ctrl+V) an image or JSON array.
                        </div>
                        {onionSkin && (
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-400">Opacity: {Math.round(onionOpacity * 100)}%</span>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={onionOpacity}
                                    onChange={(e) => setOnionOpacity(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <button onClick={() => setOnionSkin(null)} className="text-xs text-red-500 underline">Clear Ref</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER: CANVAS */}
                <div className="flex-1 bg-[#111] flex items-center justify-center relative overflow-auto p-8">
                    <div className="relative shadow-2xl border border-[#404040]" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
                        {/* 1. LAYER: CHECKERBOARD BG */}
                        <div className="absolute inset-0 z-0 opacity-20" style={{
                            backgroundImage: 'conic-gradient(#555 90deg, transparent 90deg 180deg, #555 180deg 270deg, transparent 270deg)',
                            backgroundSize: '32px 32px'
                        }} />

                        {/* 2. LAYER: ONION SKIN */}
                        {onionSkin && (
                            <img
                                src={onionSkin}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                                style={{ opacity: onionOpacity, imageRendering: 'pixelated' }}
                            />
                        )}

                        {/* 3. LAYER: DRAWING CANVAS (32x32) */}
                        <canvas
                            ref={canvasRef}
                            width={32}
                            height={32}
                            className="absolute inset-0 z-20 w-full h-full"
                            style={{ imageRendering: 'pixelated' }}
                        />

                        {/* 4. LAYER: INTERACTION / GRID OVERLAY (512x512) */}
                        <canvas
                            ref={overlayRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            className="absolute inset-0 z-30 w-full h-full cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    </div>
                </div>

                {/* RIGHT: METADATA */}
                {(category === 'weapons' || category === 'PlayerSprite/armor') && (
                    <div className="w-64 bg-[#202020] p-4 flex flex-col gap-4 border-l border-[#404040]">
                        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Item Stats</h3>

                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Display Name</label>
                            <input
                                className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-sm text-white"
                                value={itemMeta.displayName}
                                onChange={e => setItemMeta({ ...itemMeta, displayName: e.target.value })}
                                placeholder="E.g. Fire Sword"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Rarity</label>
                            <select
                                className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-sm text-white"
                                value={itemMeta.rarity}
                                onChange={e => setItemMeta({ ...itemMeta, rarity: e.target.value })}
                            >
                                <option value="common">Common</option>
                                <option value="rare">Rare</option>
                                <option value="legendary">Legendary</option>
                                <option value="mythic">Mythic</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Slot</label>
                            <select
                                className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-sm text-white"
                                value={itemMeta.slot}
                                onChange={e => setItemMeta({ ...itemMeta, slot: e.target.value })}
                            >
                                {category === 'weapons' ? (
                                    <>
                                        <option value="MAIN_HAND">Main Hand</option>
                                        <option value="OFF_HAND">Off Hand</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="HEAD">Head</option>
                                        <option value="CHEST">Chest</option>
                                        <option value="LEGS">Legs</option>
                                        <option value="FEET">Feet</option>
                                        <option value="SHOULDERS">Shoulders</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {category === 'weapons' ? (
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Damage</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-sm text-white"
                                    value={itemMeta.damage}
                                    onChange={e => setItemMeta({ ...itemMeta, damage: Number(e.target.value) })}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Defense (Shield)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-sm text-white"
                                    value={itemMeta.defense}
                                    onChange={e => setItemMeta({ ...itemMeta, defense: Number(e.target.value) })}
                                />
                            </div>
                        )}

                        <div className="bg-[#fbbf24] text-black text-xs p-2 rounded mt-auto">
                            <strong>Note:</strong> Saving will add this item to the {category} database.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 p-2 rounded text-sm transition-all ${active ? 'bg-[#3b82f6] text-white shadow-lg scale-105' : 'bg-[#333] text-gray-400 hover:bg-[#444]'
            }`}
    >
        <span>{icon}</span>
        <span>{label}</span>
    </button>
);
