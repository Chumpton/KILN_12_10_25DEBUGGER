import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CharacterSelect } from './CharacterSelect';
import { RiggingEditor } from './RiggingEditor';
import { Player } from '../types';
import { PixelEditor } from './tools/PixelEditor';
import { SpellStudio } from './SpellStudio';


interface MainMenuProps {
    onStartGame: (player: Player) => void;
}

// Simple Pixel Cloud SVG
const PixelCloud = ({ className, style, opacity = 0.9, scale = 1 }: { className?: string, style?: React.CSSProperties, opacity?: number, scale?: number }) => (
    <svg viewBox="0 0 64 24" className={className} style={{ ...style, transform: `scale(${scale})` }} shapeRendering="crispEdges">
        <rect x="16" y="0" width="32" height="8" fill="white" fillOpacity={opacity} />
        <rect x="8" y="8" width="48" height="8" fill="white" fillOpacity={opacity} />
        <rect x="0" y="16" width="64" height="8" fill="white" fillOpacity={opacity} />
    </svg>
);

// --- SUB COMPONENTS ---

interface MenuButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    primary?: boolean;
    variant?: 'default' | 'danger';
    icon?: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick, children, primary, variant = 'default', icon }) => {
    // Arco Style: Just text, white with shadow, scaling on hover
    const baseStyle = "group relative flex items-center justify-start gap-4 text-5xl font-bold tracking-[0.1em] uppercase transition-all duration-100 ease-out hover:scale-105 active:scale-95 outline-none";

    // Text Colors
    const textStyle = "text-white drop-shadow-[4px_4px_0_#000] hover:text-[#fbbf24] hover:drop-shadow-[4px_4px_0_#78350f]";

    return (
        <button onClick={onClick} className={`${baseStyle} ${textStyle}`}>
            {/* Simple Block Indicator on Hover */}
            <span className="w-0 h-8 bg-white transition-all duration-200 group-hover:w-4 mr-0 group-hover:mr-2"></span>

            <span>{children}</span>
        </button>
    );
};

const ControlRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-[#ffffff10] pb-1">
        <span className="text-[#a1887f] font-bold text-sm">{label}</span>
        <span className="text-[#d7ccc8] text-sm">{value}</span>
    </div>
);

const VolumeSlider: React.FC<{ label: string, value: number }> = ({ label, value }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-[#a1887f] uppercase tracking-wider font-bold">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="w-full h-2 bg-[#271c19] rounded-full overflow-hidden border border-[#5d4037]">
            <div className="h-full bg-[#7cb342] rounded-full" style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
    const [view, setView] = useState<'MAIN' | 'CONTROLS' | 'MENU' | 'CHAR_SELECT' | 'RIGGING_MENU' | 'BONE_RIGGER' | 'PIXEL_EDITOR' | 'SPELL_STUDIO'>('MAIN');
    const [isStarting, setIsStarting] = useState(false);
    const [mounted, setMounted] = useState(false);
    // --- EDIT MODE STATE ---
    const [editMode, setEditMode] = useState(false);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    // Load initial layout from LocalStorage if available, else default
    const defaultLayout = {
        vine: { x: 0, y: 0, scale: 1.125, rotation: 0 },
        rack: { x: -43, y: -10, scale: 0.875, rotation: 0 },
        logo: { x: -536, y: 259, scale: 1.125, rotation: 0 },
        menu: { x: 84, y: 87, scale: 0.875, rotation: -2 },
        sun: { x: 10, y: 5, scale: 1, rotation: 0 }
    };

    const [uiLayout, setUiLayout] = useState(() => {
        try {
            const saved = localStorage.getItem('kiln_main_menu_layout_v3');
            return saved ? { ...defaultLayout, ...JSON.parse(saved) } : defaultLayout;
        } catch (e) {
            return defaultLayout;
        }
    });

    // Persist to LocalStorage on change
    useEffect(() => {
        localStorage.setItem('kiln_main_menu_layout_v3', JSON.stringify(uiLayout));
    }, [uiLayout]);

    const handleLogConfig = () => {
        const configStr = JSON.stringify(uiLayout, null, 4);
        console.log("CURRENT UI LAYOUT:", configStr);
        navigator.clipboard.writeText(configStr).then(() => {
            alert("Config copied to clipboard! Paste it to the AI assistant to save permanently.");
        }).catch(() => {
            alert("Check the browser console for the config JSON!");
        });
    };

    const [cloudAtlas, setCloudAtlas] = useState<string | null>(null);

    // Sun Dragging State
    const [sunPos, setSunPos] = useState({ x: 10, y: 5 }); // % coordinates
    const [isDraggingSun, setIsDraggingSun] = useState(false);
    const sunPosRef = useRef(sunPos);

    // Mouse Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialLayoutRef = useRef(uiLayout);

    // Sync sunPos with layout if in edit mode (optional, but requested for sun)
    // Actually, let's keep sunPos separate for parallax logic for now to avoid breaking changes,
    // but update it if uiLayout.sun changes? Or vice versa?
    // Let's stick to the requested "objects" (Vine, Rack, Logo, Menu) being the primary use case for this edit mode.

    useEffect(() => {
        sunPosRef.current = sunPos;
    }, [sunPos]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                setEditMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleMouseDown = (e: React.MouseEvent, elementKey: string) => {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        setSelectedElement(elementKey);
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialLayoutRef.current = uiLayout;
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
        if (editMode && isDragging && selectedElement) {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y; // Invert Y for screen coords? No, standard.

            // Note: rack/vine are strictly pixel based absolute positions from bottom/left or top/left.
            // Let's standardize on top/left relative to screen for simplicity, or keep their anchors.
            // Existing anchors:
            // Vine: Top-Left
            // Rack: Bottom-Left
            // Menu: Bottom-Left
            // Logo: Was flex, now needs to be absolute for full edit control? 
            // Or we just add offsets to their existing anchors. Let's do offsets/deltas.

            setUiLayout(prev => ({
                ...prev,
                [selectedElement]: {
                    ...prev[selectedElement as keyof typeof uiLayout],
                    x: initialLayoutRef.current[selectedElement as keyof typeof uiLayout].x + dx, // This logic assumes 'x' is always 'left' or 'right' offset depending on CSS
                    y: initialLayoutRef.current[selectedElement as keyof typeof uiLayout].y - dy // Inverting Y because typically we drag UP to increase y (bottom anchor) or DOWN (top anchor)? 
                    // Wait, standard mouse interaction:
                    // If anchor is Bottom, moving mouse UP (decreasing clientY) means increasing Bottom offset.
                    // dy = current - start. If dragged up, dy is negative. We want bottom offset to increase. So -dy.
                    // If anchor is Top, moving mouse DOWN (increasing clientY) means increasing Top offset.
                    // Let's refine based on anchor later.
                }
            }));

            // Simplified: Just add dx/dy directly and handle direction in the render logic or here.
            // Let's update state blindly here as "delta" and apply it correctly in style.
            setUiLayout(prev => {
                const current = prev[selectedElement as keyof typeof uiLayout];
                const start = initialLayoutRef.current[selectedElement as keyof typeof uiLayout];

                // Determine direction multipliers based on element
                let xMult = 1;
                let yMult = 1;

                if (selectedElement === 'rack' || selectedElement === 'menu') {
                    // Bottom-Left anchor. 
                    // Y is 'bottom'. Mouse Up (negative dy) -> Increase Bottom.
                    yMult = -1;
                } else {
                    // Top-Left anchor (Vine, Logo).
                    // Y is 'top'. Mouse Down (positive dy) -> Increase Top.
                    yMult = 1;
                }

                return {
                    ...prev,
                    [selectedElement]: {
                        ...current,
                        x: start.x + (dx * xMult), // X is always Left anchor for now?
                        y: start.y + (dy * yMult)
                    }
                };
            });
        }
    };

    const handleWindowMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (editMode) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [editMode, isDragging, selectedElement]);

    const handleWheelScale = (e: React.WheelEvent, elementKey: string) => {
        if (!editMode) return;
        // If shift, rotate?
        if (e.shiftKey) {
            setUiLayout(prev => ({
                ...prev,
                [elementKey]: {
                    ...prev[elementKey as keyof typeof uiLayout],
                    rotation: prev[elementKey as keyof typeof uiLayout].rotation + (e.deltaY * 0.05)
                }
            }));
        } else {
            setUiLayout(prev => ({
                ...prev,
                [elementKey]: {
                    ...prev[elementKey as keyof typeof uiLayout],
                    scale: Math.max(0.1, prev[elementKey as keyof typeof uiLayout].scale + (e.deltaY * -0.001))
                }
            }));
        }
    };

    useEffect(() => {
        setMounted(true);

        const img = new Image();
        img.src = '/assets/ui/cloud_atlas.png';
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const cvs = document.createElement('canvas');
                cvs.width = img.width;
                cvs.height = img.height;
                const ctx = cvs.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
                const data = imgData.data;

                const rBg = data[0];
                const gBg = data[1];
                const bBg = data[2];

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    if (Math.abs(r - rBg) < 10 && Math.abs(g - gBg) < 10 && Math.abs(b - bBg) < 10) {
                        data[i + 3] = 0;
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                setCloudAtlas(cvs.toDataURL());
            } catch (e) {
                console.error("Failed to process cloud atlas:", e);
                setCloudAtlas('/assets/ui/cloud_atlas.png');
            }
        };
    }, []);

    const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        size: Math.random() * 4 + 2 + 'px',
        animationDuration: 15 + Math.random() * 30 + 's',
        animationDelay: -(Math.random() * 20) + 's',
        opacity: Math.random() * 0.5 + 0.2
    })), []);

    const handlePlay = () => {
        setView('CHAR_SELECT');
    };

    const handleEnterWorld = (player: Player) => {
        setIsStarting(true);
        setTimeout(() => {
            onStartGame(player);
        }, 1000);
    };

    const handleQuit = () => {
        window.location.reload();
    };

    const SpriteCloud = ({ className, style, scale = 1, flip = false }: { className?: string, style?: React.CSSProperties, scale?: number, flip?: boolean }) => {
        if (!cloudAtlas) return null;
        return (
            <div
                className={className}
                style={{
                    ...style,
                    transform: `scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
                    backgroundImage: `url(${cloudAtlas})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    width: '128px',
                    height: '64px',
                    imageRendering: 'pixelated'
                }}
            />
        );
    };

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${isStarting ? 'scale-150 opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ fontFamily: '"Cabin Sketch", cursive' }}>

            <style>
                {`
                    @keyframes floatCloud {
                        from { transform: translateX(-120vw) scale(var(--scale)) var(--flip); }
                        to { transform: translateX(120vw) scale(var(--scale)) var(--flip); }
                    }
                    @keyframes panelEnter {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes floatPollen {
                        0% { transform: translate(0, 0); opacity: 0; }
                        20% { opacity: 0.8; }
                        80% { opacity: 0.8; }
                        100% { transform: translate(100px, 50px); opacity: 0; }
                    }
                    @keyframes subtleSway {
                        0%, 100% { transform: rotate(-0.5deg) translateY(0px); }
                        50% { transform: rotate(0.5deg) translateY(4px); }
                    }
                    @keyframes sunRotate {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes titlePulse {
                        0%, 100% { transform: scale(1); filter: drop-shadow(8px 8px 0 #000); }
                        50% { transform: scale(1.05); filter: drop-shadow(12px 12px 0 #000); }
                    }
                    .edit-outline:hover {
                        outline: 2px dashed yellow;
                        cursor: grab;
                    }
                    .edit-selected {
                        outline: 2px solid cyan;
                        cursor: grabbing;
                    }
                `}
            </style>

            {/* --- BACKGROUND LAYER: Atmospheric Gradient --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#4fa8ff] via-[#3b82f6] to-[#1e40af] z-0"></div>

            {/* --- SUN (Deep Background) --- */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div
                    onMouseDown={() => setIsDraggingSun(true)}
                    className="absolute w-64 h-64 opacity-90 pointer-events-auto cursor-move hover:scale-105 transition-transform"
                    style={{
                        top: `${sunPos.y}%`,
                        left: `${sunPos.x}%`,
                        backgroundImage: 'url(/assets/ui/sun.png)',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(0 0 40px rgba(253, 224, 71, 0.6))',
                        animation: 'sunRotate 120s linear infinite'
                    }}
                />
            </div>

            {/* --- PARALLAX CLOUDS (Mid Background) --- */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Back Layer (Slow, Small) */}
                <div className="absolute inset-0 opacity-60">
                    <SpriteCloud className="absolute top-[5%]" style={{ left: '-10%', animation: 'floatCloud 120s linear infinite', '--scale': 0.4, '--flip': 'scaleX(1)' } as any} />
                    <SpriteCloud className="absolute top-[10%]" style={{ left: '15%', animation: 'floatCloud 110s linear infinite', animationDelay: '-20s', '--scale': 0.5, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[25%]" style={{ left: '40%', animation: 'floatCloud 130s linear infinite', animationDelay: '-50s', '--scale': 0.6, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[8%]" style={{ left: '80%', animation: 'floatCloud 115s linear infinite', animationDelay: '-10s', '--scale': 0.45, '--flip': 'scaleX(1)' } as any} />
                    <SpriteCloud className="absolute top-[40%]" style={{ left: '-5%', animation: 'floatCloud 125s linear infinite', animationDelay: '-80s', '--scale': 0.55, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[60%]" style={{ left: '55%', animation: 'floatCloud 140s linear infinite', animationDelay: '-30s', '--scale': 0.6, '--flip': 'scaleX(1)' } as any} />
                </div>

                {/* Mid Layer (Medium) */}
                <div className="absolute inset-0 opacity-80">
                    <SpriteCloud className="absolute top-[15%]" style={{ left: '5%', animation: 'floatCloud 80s linear infinite', animationDelay: '-10s', '--scale': 0.8, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[20%]" style={{ left: '45%', animation: 'floatCloud 90s linear infinite', animationDelay: '-60s', '--scale': 0.85, '--flip': 'scaleX(1)' } as any} />
                    <SpriteCloud className="absolute top-[40%]" style={{ left: '80%', animation: 'floatCloud 85s linear infinite', animationDelay: '-35s', '--scale': 0.9, '--flip': 'scaleX(1)' } as any} />
                    <SpriteCloud className="absolute top-[55%]" style={{ left: '-15%', animation: 'floatCloud 95s linear infinite', animationDelay: '-20s', '--scale': 0.75, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[45%]" style={{ left: '25%', animation: 'floatCloud 75s linear infinite', animationDelay: '-5s', '--scale': 0.8, '--flip': 'scaleX(1)' } as any} />
                </div>

                {/* Front Layer (Fast, Large) */}
                <div className="absolute inset-0 opacity-100">
                    <SpriteCloud className="absolute top-[2%]" style={{ left: '10%', animation: 'floatCloud 45s linear infinite', animationDelay: '-5s', '--scale': 1.2, '--flip': 'scaleX(1)' } as any} />
                    <SpriteCloud className="absolute top-[35%]" style={{ left: '60%', animation: 'floatCloud 50s linear infinite', animationDelay: '-25s', '--scale': 1.4, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[55%]" style={{ left: '30%', animation: 'floatCloud 55s linear infinite', animationDelay: '-20s', '--scale': 1.5, '--flip': 'scaleX(-1)' } as any} flip />
                    <SpriteCloud className="absolute top-[30%]" style={{ left: '90%', animation: 'floatCloud 42s linear infinite', animationDelay: '-15s', '--scale': 1.3, '--flip': 'scaleX(1)' } as any} />
                    <SpriteCloud className="absolute top-[65%]" style={{ left: '-10%', animation: 'floatCloud 48s linear infinite', animationDelay: '-8s', '--scale': 1.6, '--flip': 'scaleX(1)' } as any} />
                </div>
            </div>

            {/* --- FOREGROUND: Custom BG Image --- */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/assets/ui/BG.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated'
                    }}
                />
            </div>

            {/* --- POLLEN PARTICLES --- */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute rounded-full bg-[#fefce8] blur-[1px]"
                        style={{
                            left: p.left,
                            top: p.top,
                            width: p.size,
                            height: p.size,
                            opacity: p.opacity,
                            animation: `floatPollen ${p.animationDuration} linear infinite`,
                            animationDelay: p.animationDelay
                        }}
                    />
                ))}
            </div>


            {/* =========================================
                UI OVERLAYS
               ========================================= */}

            {editMode && (
                <div className="absolute top-2 right-2 z-[100] flex gap-2">
                    <div className="bg-red-500 text-white px-2 py-1 font-bold animate-pulse">EDIT MODE (F1 to Toggle)</div>
                    <button
                        onClick={handleLogConfig}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 font-bold rounded shadow-lg border border-white/20"
                    >
                        COPY CONFIG
                    </button>
                </div>
            )}

            {/* 1. MAIN MENU UI */}
            {(view === 'MAIN' || view === 'CONTROLS' || view === 'MENU' || view === 'RIGGING_MENU') && (
                <>
                    {/* DECORATIVE CORNER VINE */}
                    <div
                        className={`absolute z-20 ${editMode ? 'pointer-events-auto edit-outline' : 'pointer-events-none'} ${selectedElement === 'vine' ? 'edit-selected' : ''}`}
                        style={{
                            top: `${uiLayout.vine.y}px`,
                            left: `${uiLayout.vine.x}px`,
                            transform: `scale(${uiLayout.vine.scale}) rotate(${uiLayout.vine.rotation}deg)`,
                            transformOrigin: 'top left'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'vine')}
                        onWheel={(e) => handleWheelScale(e, 'vine')}
                    >
                        <img src="/assets/ui/corner_vine.png" className="w-[740px] h-auto" style={{ imageRendering: 'pixelated' }} />
                    </div>

                    {/* MENU RACK (Bottom Left) */}
                    <div
                        className={`absolute z-20 ${editMode ? 'pointer-events-auto edit-outline' : 'pointer-events-none'} ${selectedElement === 'rack' ? 'edit-selected' : ''}`}
                        style={{
                            bottom: `${uiLayout.rack.y}px`,
                            left: `${uiLayout.rack.x}px`,
                            transform: `scale(${uiLayout.rack.scale}) rotate(${uiLayout.rack.rotation}deg)`,
                            transformOrigin: 'bottom left'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'rack')}
                        onWheel={(e) => handleWheelScale(e, 'rack')}
                    >
                        <img
                            src="/assets/ui/Menu Rack.png"
                            className="w-[800px] h-auto"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>

                    <div className="absolute inset-0 z-20 pointer-events-none animate-in fade-in duration-500">
                        {/* --- HEADER: Title --- */}
                        <div
                            className={`absolute top-16 left-1/2 -translate-x-1/2 transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'} ${editMode ? 'pointer-events-auto edit-outline' : 'pointer-events-none'} ${selectedElement === 'logo' ? 'edit-selected' : ''}`}
                            style={{
                                top: `${uiLayout.logo.y}px`,
                                // Left is handled by flex/absolute centering usually, but for edit mode we might want offsets. 
                                // Let's keep it centered but allow X/Y offsets.
                                marginLeft: `${uiLayout.logo.x}px`,
                                transform: `translate(-50%, 0) scale(${uiLayout.logo.scale}) rotate(${uiLayout.logo.rotation}deg)`,
                                transformOrigin: 'center'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'logo')}
                            onWheel={(e) => handleWheelScale(e, 'logo')}
                        >
                            <img
                                src="/assets/ui/Kiln Logo.png"
                                alt="KILN"
                                className="w-[600px] h-auto"
                                style={{ imageRendering: 'pixelated', animation: 'titlePulse 5s ease-in-out infinite' }}
                            />
                        </div>

                        {/* --- MENU ACTIONS (Aligned with Rack) --- */}
                        <div
                            className={`absolute flex flex-col items-start gap-4 pointer-events-auto transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'} ${editMode ? 'edit-outline' : ''} ${selectedElement === 'menu' ? 'edit-selected' : ''}`}
                            style={{
                                bottom: `${uiLayout.menu.y}px`,
                                left: `${uiLayout.menu.x}px`,
                                transform: `scale(${uiLayout.menu.scale}) rotate(${uiLayout.menu.rotation}deg)`,
                                transformOrigin: 'bottom left'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'menu')}
                            onWheel={(e) => handleWheelScale(e, 'menu')}
                        >

                            {view === 'MAIN' && (
                                <>
                                    <MenuButton onClick={handlePlay} icon="">NEW GAME</MenuButton>
                                    <MenuButton onClick={() => setView('RIGGING_MENU')} icon="">WORKSHOP</MenuButton>
                                    <MenuButton onClick={() => setView('CONTROLS')} icon="">CONTROLS</MenuButton>
                                    <MenuButton onClick={() => setView('MENU')} icon="">SETTINGS</MenuButton>
                                    <MenuButton onClick={handleQuit} icon="">EXIT</MenuButton>
                                </>
                            )}

                            {view === 'RIGGING_MENU' && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-black/50 p-8 rounded-xl border border-white/20 theme-text-shadow">
                                    <h2 className="text-4xl text-white mb-6">WORKSHOP</h2>
                                    <div className="flex flex-col gap-4 mb-8">
                                        <MenuButton onClick={() => setView('BONE_RIGGER')} icon="">BONE RIGGER</MenuButton>
                                        <MenuButton onClick={() => setView('SPELL_STUDIO')} icon="">SPELL STUDIO</MenuButton>
                                        <MenuButton onClick={() => setView('PIXEL_EDITOR')} icon="">PIXEL FORGE</MenuButton>


                                    </div>
                                    <MenuButton onClick={() => setView('MAIN')} icon="">BACK</MenuButton>
                                </div>
                            )}

                            {view === 'CONTROLS' && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-black/50 p-8 rounded-xl border border-white/20 theme-text-shadow">
                                    <h2 className="text-4xl text-white mb-6">FIELD GUIDE</h2>
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xl text-gray-200 mb-8 font-sans font-bold">
                                        <ControlRow label="LMB" value="Dig / Move" />
                                        <ControlRow label="Shift" value="Force Stand" />
                                        <ControlRow label="RMB" value="Cast Spell" />
                                        <ControlRow label="Q - I" value="Tools" />
                                        <ControlRow label="1 - 3" value="Flasks" />
                                        <ControlRow label="G" value="Tumble" />
                                    </div>
                                    <MenuButton onClick={() => setView('MAIN')} icon="">BACK</MenuButton>
                                </div>
                            )}

                            {view === 'MENU' && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-black/50 p-8 rounded-xl border border-white/20 w-[400px]">
                                    <h2 className="text-4xl text-white mb-6 theme-text-shadow">OPTIONS</h2>
                                    <div className="space-y-6 mb-8 font-sans">
                                        <VolumeSlider label="Master" value={70} />
                                        <VolumeSlider label="Effects" value={100} />
                                        <VolumeSlider label="Music" value={40} />
                                    </div>
                                    <MenuButton onClick={() => setView('MAIN')} icon="">BACK</MenuButton>
                                </div>
                            )}
                        </div>

                        {/* --- FOOTER --- */}
                        <div className="absolute bottom-4 right-4 text-right">
                            <div className="text-xs text-white/50 font-mono">
                                Build v0.3.5-live<br />Earth Engine
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 2. CHARACTER SELECT UI */}
            {view === 'CHAR_SELECT' && (
                <div className="absolute inset-0 z-30 animate-in fade-in duration-500">
                    <CharacterSelect onEnterWorld={handleEnterWorld} onBack={() => setView('MAIN')} />
                </div>
            )}

            {/* 3. RIGGING EDITOR UI */}
            {view === 'BONE_RIGGER' && (
                <div className="absolute inset-0 z-30 bg-[#1a1a1a] animate-in fade-in duration-500">
                    <RiggingEditor onBack={() => setView('RIGGING_MENU')} />
                </div>
            )}

            {/* 4. PIXEL EDITOR UI */}
            {view === 'PIXEL_EDITOR' && (
                <div className="absolute inset-0 z-30 bg-[#1a1a1a] animate-in fade-in duration-500">
                    <PixelEditor onBack={() => setView('RIGGING_MENU')} />
                </div>
            )}

            {/* 5. SPELL STUDIO UI */}
            {view === 'SPELL_STUDIO' && (
                <div className="absolute inset-0 z-30 bg-[#1a1a1a] animate-in fade-in duration-500">
                    <SpellStudio onBack={() => setView('RIGGING_MENU')} />
                </div>
            )}



        </div>
    );
};
