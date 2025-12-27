


import React, { useState, useEffect } from 'react';
import { Player, SpellType, EquipmentItem, EquipmentSlot, Quest, SpellElement, ShopItem } from '../../types';
import { HEARTHSTONE_POS, SAFE_ZONE_RADIUS, RARITY_COLORS } from '../../constants';
import { getDistance } from '../../utils/isometric';

// Sub-components
import { DraggableItem } from './DraggableItem';
import { HealthOrb } from './HealthOrb';
import { ManaOrb } from './ManaOrb';
import { XPBar } from './XPBar';
import { QuestPanel } from './QuestPanel';
import { PotionBar } from './PotionBar';
import { ActionDock } from './ActionDock';
import { MenuRack } from './MenuRack';
import { ShopButton } from './ShopButton';
import { InventoryModal } from './modals/InventoryModal';
import { ShopModal } from './modals/ShopModal';
import { SpellStudioModal } from './modals/SpellStudioModal';
import { StatsModal } from './modals/StatsModal';
import { LevelCounter } from './LevelCounter';
import { Minimap } from './Minimap';
import { CardDebugOverlay } from '../../modules/dev/CardDebugOverlay';
import { BuffBar } from './BuffBar';

interface HUDProps {
    player: Player;
    score: number;
    gameOver: boolean;
    onRestart: () => void;
    onResume: () => void;
    onQuit: () => void;
    onUpgradeSpellPoints?: (points: number) => void;
    onUpgradeTalent: (spellId: string, talentId: string) => void;
    onUpgradeBaseStat: (stat: 'vitality' | 'power' | 'haste' | 'swiftness') => void;
    onUsePotion: (type: 'health' | 'mana' | 'speed') => void;
    onEquip: (item: EquipmentItem) => void;
    onUnequip: (slot: EquipmentSlot) => void;
    onBuyItem: (item: ShopItem) => void;
    onAssignHotbarSlot: (index: number, spell: SpellType | null) => void;
    onCastSpell: (spell: SpellType) => void;
    onSelectSpell: (spell: SpellType) => void;
    onToggleMount: () => void;
    onUnlockSpell: (spell: SpellType) => void;
    onUpgradeSpell?: (spell: SpellType) => void;
    onInjectDust?: (spell: SpellType, amount: number) => void;


    isPaused: boolean;
    activeQuest: Quest;
    shopItems: ShopItem[];
    shopResetTimer: number;
    gameStarted: boolean;
    minimapData?: any;
}

export const HUD: React.FC<HUDProps> = ({
    player, score, gameOver, onRestart, onResume, onQuit, onUpgradeTalent, onUpgradeBaseStat, onUsePotion,
    onEquip, onUnequip, onBuyItem, onAssignHotbarSlot, onCastSpell, onSelectSpell, onToggleMount, onUnlockSpell, onUpgradeSpell, onInjectDust, isPaused, activeQuest,
    shopItems, shopResetTimer, gameStarted, minimapData
}) => {
    // Visibility States
    const [showSpells, setShowSpells] = useState(false);
    const [showSpellbook, setShowSpellbook] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Pause Menu Navigation
    const [pauseTab, setPauseTab] = useState<'MAIN' | 'CONTROLS' | 'SETTINGS'>('MAIN');

    // Tooltip State
    const [hoveredItem, setHoveredItem] = useState<{ item: EquipmentItem | ShopItem, x: number, y: number } | null>(null);

    // Drag-and-drop for spells
    const [draggedSpell, setDraggedSpell] = useState<SpellType | null>(null);
    const [dragOverHotbarIndex, setDragOverHotbarIndex] = useState<number | null>(null);
    const [draggedFromHotbarIndex, setDraggedFromHotbarIndex] = useState<number | null>(null);
    const [trashHover, setTrashHover] = useState(false);

    // Positions for draggable items (with Persistence)
    const [positions, setPositions] = useState<{ [key: string]: { x: number, y: number, scale: number } }>(() => {
        const defaults = {
            healthOrb: { x: 20, y: window.innerHeight - 180, scale: 1.35 },
            potionBar: { x: 160, y: window.innerHeight - 280, scale: 1.0 },
            manaOrb: { x: window.innerWidth - 180, y: window.innerHeight - 180, scale: 1.35 },
            actionDock: { x: window.innerWidth - 450, y: window.innerHeight - 200, scale: 0.9 },
            menuRack: { x: window.innerWidth - 450, y: window.innerHeight - 260, scale: 1 },
            xpBar: { x: 260, y: window.innerHeight - 45, scale: 1 },
            quest: { x: 30, y: 30, scale: 1 },
            hearthstone: { x: window.innerWidth - 130, y: window.innerHeight - 240, scale: 1 },
            shopButton: { x: window.innerWidth - 440, y: window.innerHeight - 220, scale: 1 },
            levelCounter: { x: (window.innerWidth / 2) + 240, y: window.innerHeight - 95, scale: 1 },
            coords: { x: 10, y: 10, scale: 1 },
            // Modals
            inventory: { x: 40, y: 200, scale: 1 },
            spellbook: { x: 40, y: 240, scale: 1 },
            stats: { x: 40, y: 200, scale: 1 },
            talents: { x: 40, y: 200, scale: 1 },
            shop: { x: 40, y: 200, scale: 1 }
        };
        try {
            const saved = localStorage.getItem('hud_layout');
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error("Error loading HUD layout", e);
        }
        return defaults;
    });

    // Reset pause tab when pausing
    useEffect(() => {
        if (isPaused) setPauseTab('MAIN');
    }, [isPaused]);

    // Save layout to localStorage on change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('hud_layout', JSON.stringify(positions));
        }, 1000);
        return () => clearTimeout(timer);
    }, [positions]);

    const toggleWindow = (window: 'spells' | 'stats' | 'inventory' | 'shop' | 'spellbook') => {
        // 'spells' and 'spellbook' now both open the Studio
        const targetStudio = window === 'spells' || window === 'spellbook';
        const isStudioOpen = showSpells || showSpellbook;

        const isOpen =
            (targetStudio && isStudioOpen) ||
            (window === 'stats' && showStats) ||
            (window === 'inventory' && showInventory) ||
            (window === 'shop' && showShop);

        setShowSpells(false);
        setShowSpellbook(false);
        setShowStats(false);
        setShowInventory(false);
        setShowShop(false);

        if (!isOpen) {
            switch (window) {
                case 'spells':
                case 'spellbook': setShowSpells(true); break;
                case 'stats': setShowStats(true); break;
                case 'inventory': setShowInventory(true); break;
                case 'shop': setShowShop(true); break;
            }
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'm') {
                setIsEditMode(prev => !prev);
            }
            if (e.key === 'Escape') {
                if (showSpells || showStats || showInventory || showSpellbook || showShop) {
                    setShowSpells(false);
                    setShowStats(false);
                    setShowInventory(false);
                    setShowSpellbook(false);
                    setShowShop(false);
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [showSpells, showStats, showInventory, showSpellbook, showShop]);

    const handleMove = (id: string, dx: number, dy: number) => {
        setPositions(prev => ({
            ...prev,
            [id]: { ...prev[id], x: prev[id].x + dx, y: prev[id].y + dy }
        }));
    };

    const handleScale = (id: string, delta: number) => {
        setPositions(prev => ({
            ...prev,
            [id]: { ...prev[id], scale: Math.max(0.5, Math.min(2.0, prev[id].scale + delta)) }
        }));
    };

    const handleResetLayout = () => {
        if (confirm("Reset HUD layout to defaults?")) {
            localStorage.removeItem('hud_layout');
            window.location.reload();
        }
    };

    if (!gameStarted) return null;



    // Button Components for Pause Menu
    const PauseButton = ({ onClick, children, variant = 'default' }: { onClick: () => void, children: React.ReactNode, variant?: 'default' | 'danger' | 'secondary' }) => (
        <button
            onClick={onClick}
            className={`
                w-full py-3 rounded-xl text-lg font-bold uppercase tracking-wider shadow-md transition-all duration-100 ease-out 
                active:scale-[0.98] active:translate-y-1 border-b-4
                ${variant === 'default' ? 'bg-[#558b2f] border-[#33691e] text-white hover:bg-[#689f38]' : ''}
                ${variant === 'secondary' ? 'bg-[#3e2723] border-[#271c19] text-[#d7ccc8] hover:bg-[#4e342e]' : ''}
                ${variant === 'danger' ? 'bg-[#271c19] border-[#1a1210] text-red-400 hover:bg-[#3e2723] hover:text-red-300' : ''}
            `}
        >
            {children}
        </button>
    );

    const PauseRow = ({ label, value }: { label: string, value: string }) => (
        <div className="flex justify-between items-center border-b border-[#ffffff10] pb-2 last:border-0">
            <span className="text-[#a1887f] font-bold text-sm">{label}</span>
            <span className="text-[#d7ccc8] text-sm">{value}</span>
        </div>
    );

    return (
        <div className={`absolute inset-0 z-10 overflow-hidden ${isPaused ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <CardDebugOverlay />
            <BuffBar player={player} />

            {isEditMode && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 font-bold z-50 animate-pulse border-2 border-white pointer-events-auto text-center shadow-lg rounded">
                    <div>UI UNLOCKED - DRAG TO MOVE - SCROLL TO RESIZE</div>
                    <div className="text-sm font-normal">PRESS M TO LOCK</div>
                    <div
                        className="text-xs font-normal mt-1 cursor-pointer underline hover:text-yellow-200"
                        onClick={handleResetLayout}
                    >
                        RESET LAYOUT
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showShop && (
                <DraggableItem id="shop" position={positions.shop} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                    <ShopModal
                        shopItems={shopItems}
                        player={player}
                        onBuyItem={onBuyItem}
                        onClose={() => setShowShop(false)}
                        shopResetTimer={shopResetTimer}
                        setHoveredItem={setHoveredItem}
                        isPaused={isPaused}
                    />
                </DraggableItem>
            )}

            {(showSpells || showSpellbook) && (
                <SpellStudioModal
                    player={player}
                    onClose={() => { setShowSpells(false); setShowSpellbook(false); }}
                    onUpgradeTalent={onUpgradeTalent}
                    onUpgradeSpell={onUpgradeSpell}
                    onInjectDust={onInjectDust}
                    onAssignHotbarSlot={onAssignHotbarSlot}
                    isPaused={isPaused}
                />
            )}

            {showStats && (
                <DraggableItem id="stats" position={positions.stats} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                    <StatsModal
                        player={player}
                        onUpgradeBaseStat={onUpgradeBaseStat}
                        onClose={() => setShowStats(false)}
                        isPaused={isPaused}
                    />
                </DraggableItem>
            )}

            {showInventory && (
                <DraggableItem id="inventory" position={positions.inventory} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                    <InventoryModal
                        player={player}
                        onEquip={onEquip}
                        onUnequip={onUnequip}
                        onClose={() => setShowInventory(false)}
                        setHoveredItem={setHoveredItem}
                        isPaused={isPaused}
                    />
                </DraggableItem>
            )}

            {/* TOOLTIP */}
            {hoveredItem && (
                <div
                    className="fixed pointer-events-none z-[60] bg-black border border-gray-600 p-2 rounded w-48 shadow-xl"
                    style={{ left: hoveredItem.x + 15, top: hoveredItem.y + 15 }}
                >
                    <div className="font-bold text-sm mb-1" style={{ color: RARITY_COLORS[hoveredItem.item.rarity] }}>{hoveredItem.item.name}</div>
                    <div className="text-[10px] text-gray-400">
                        {Object.entries(hoveredItem.item.stats).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <span className="capitalize">{k}:</span>
                                <span className="text-white">+{k === 'speed' ? Math.round((v as number) * 100) + '%' : (v as number)}</span>
                            </div>
                        ))}
                        {'price' in hoveredItem.item && (
                            <div className="text-yellow-400 font-bold mt-1 flex gap-1">
                                Price: <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-300"></div>
                                {(hoveredItem.item as ShopItem).price}
                            </div>
                        )}
                        <div className="text-green-500 mt-1 italic">
                            {'price' in hoveredItem.item ? 'Click to Buy' : 'Click to Equip/Unequip'}
                        </div>
                    </div>
                </div>
            )}

            {/* WIDGETS */}
            <DraggableItem id="quest" position={positions.quest} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <QuestPanel activeQuest={activeQuest} />
            </DraggableItem>

            <DraggableItem id="healthOrb" position={positions.healthOrb} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <HealthOrb player={player} />
            </DraggableItem>

            <DraggableItem id="levelCounter" position={positions.levelCounter} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <LevelCounter level={player.level} />
            </DraggableItem>

            <DraggableItem id="potionBar" position={positions.potionBar} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <PotionBar player={player} onUsePotion={onUsePotion} />
            </DraggableItem>

            <DraggableItem id="manaOrb" position={positions.manaOrb} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <ManaOrb player={player} />
            </DraggableItem>

            <DraggableItem id="hearthstone" position={positions.hearthstone} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <div
                    onClick={() => onCastSpell(SpellType.HEARTHSTONE)}
                    className="cursor-pointer hover:scale-110 transition-transform pointer-events-auto relative group"
                    title="Hearthstone"
                >
                    <img src="ui/hud_home.png" className="w-14 h-14 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] pixelated" alt="Home" />
                    <div className="absolute -bottom-6 text-[10px] text-cyan-300 bg-black/80 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap left-1/2 transform -translate-x-1/2">Return Home</div>
                </div>
            </DraggableItem>

            <DraggableItem id="shopButton" position={positions.shopButton} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <ShopButton coins={player.coins} onClick={() => toggleWindow('shop')} />
            </DraggableItem>

            <DraggableItem id="menuRack" position={positions.menuRack} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <MenuRack player={player} toggleWindow={toggleWindow} onToggleMount={onToggleMount} />
            </DraggableItem>

            <DraggableItem id="actionDock" position={positions.actionDock} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <ActionDock
                    player={player}
                    hotbarSpells={player.hotbar || []} // Use player hotbar source of truth
                    draggedSpell={draggedSpell}
                    dragOverHotbarIndex={dragOverHotbarIndex}
                    draggedFromHotbarIndex={draggedFromHotbarIndex}
                    trashHover={trashHover}
                    setDraggedSpell={setDraggedSpell}
                    setDraggedFromHotbarIndex={setDraggedFromHotbarIndex}
                    setDragOverHotbarIndex={setDragOverHotbarIndex}
                    setHotbarSpells={() => { }} // No-op, we strictly assume App/GameCanvas manages state
                    onAssignHotbarSlot={onAssignHotbarSlot}
                    onSelectSpell={onSelectSpell}
                    setTrashHover={setTrashHover}
                />
            </DraggableItem>

            <DraggableItem id="xpBar" position={positions.xpBar} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <XPBar player={player} />
            </DraggableItem>

            <DraggableItem id="coords" position={positions.coords} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                <div className="text-white text-xs font-bold tracking-wider drop-shadow-md" style={{ fontFamily: "'Rubik', sans-serif" }}>
                    X: {player.pos.x.toFixed(1)} Y: {player.pos.y.toFixed(1)}
                </div>
            </DraggableItem>

            {minimapData && (
                <DraggableItem id="minimap" position={positions.minimap || { x: window.innerWidth - 180, y: 30, scale: 1 }} onMove={handleMove} onScale={handleScale} isLocked={!isEditMode}>
                    <Minimap playerPos={player.pos} data={minimapData} />
                </DraggableItem>
            )}

            {/* Game Over Modal */}
            {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center pointer-events-auto z-[100]">
                    <div className="bg-neutral-800 p-8 rounded-lg border-2 border-red-900 text-center max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                        <h2 className="text-6xl mb-4">💀</h2>
                        <h1 className="text-4xl font-black text-red-600 mb-4 tracking-widest uppercase">YOU DIED</h1>
                        <p className="text-gray-300 mb-8 text-lg">
                            Survived until level <span className="text-white font-bold">{player.level}</span><br />
                        </p>
                        <button
                            onClick={onRestart}
                            className="px-8 py-4 bg-red-800 hover:bg-red-700 text-white font-bold rounded shadow-lg transition-all transform hover:scale-105 uppercase tracking-widest border border-red-600"
                        >
                            Resurrect
                        </button>
                    </div>
                </div>
            )}

            {/* PAUSE MENU - Rendered LAST to ensure top Z-index visual stacking */}
            {isPaused && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
                    {/* Menu Card */}
                    <div className="bg-[#4e342e] border-[6px] border-[#7cb342] rounded-3xl p-8 w-[400px] shadow-2xl flex flex-col items-center gap-4 relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Title */}
                        <div className="absolute -top-12 text-6xl font-bold text-[#d7ccc8] tracking-widest drop-shadow-[2px_2px_0px_#271c19]" style={{ fontFamily: '"Cabin Sketch", cursive' }}>
                            {pauseTab === 'MAIN' ? 'PAUSED' : (pauseTab === 'CONTROLS' ? 'GUIDE' : 'OPTIONS')}
                        </div>

                        {pauseTab === 'MAIN' && (
                            <div className="w-full flex flex-col gap-3 mt-4">
                                <PauseButton onClick={onResume}>Resume</PauseButton>
                                <PauseButton onClick={() => setPauseTab('CONTROLS')} variant="secondary">Controls</PauseButton>
                                <PauseButton onClick={() => setPauseTab('SETTINGS')} variant="secondary">Settings</PauseButton>
                                <div className="h-px bg-[#ffffff10] my-1"></div>
                                <PauseButton onClick={() => { setIsEditMode(!isEditMode); onResume(); }} variant="secondary">
                                    {isEditMode ? 'Lock UI' : 'Unlock UI'}
                                </PauseButton>
                                <PauseButton onClick={onQuit} variant="danger">Save & Quit</PauseButton>
                            </div>
                        )}

                        {pauseTab === 'CONTROLS' && (
                            <div className="w-full mt-4">
                                <div className="bg-[#3e2723]/50 rounded-xl border border-[#7cb342]/30 p-4 flex flex-col gap-3 mb-4 shadow-inner">
                                    <PauseRow label="Movement" value="LMB" />
                                    <PauseRow label="Interact" value="LMB" />
                                    <PauseRow label="Force Attack" value="Shift + Click" />
                                    <PauseRow label="Cast Spell" value="RMB / Q-I" />
                                    <PauseRow label="Potions" value="1, 2, 3" />
                                    <PauseRow label="Dodge Roll" value="G" />
                                    <PauseRow label="Mount" value="O" />
                                </div>
                                <PauseButton onClick={() => setPauseTab('MAIN')} variant="secondary">Back</PauseButton>
                            </div>
                        )}

                        {pauseTab === 'SETTINGS' && (
                            <div className="w-full mt-4">
                                <div className="bg-[#3e2723]/50 rounded-xl border border-[#7cb342]/30 p-6 flex flex-col gap-6 mb-4 shadow-inner">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-xs text-[#a1887f] uppercase tracking-wider font-bold">
                                            <span>Master Volume</span>
                                            <span>70%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[#271c19] rounded-full overflow-hidden border border-[#5d4037]">
                                            <div className="h-full bg-[#7cb342] rounded-full" style={{ width: `70%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-xs text-[#a1887f] uppercase tracking-wider font-bold">
                                            <span>Music</span>
                                            <span>40%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[#271c19] rounded-full overflow-hidden border border-[#5d4037]">
                                            <div className="h-full bg-[#7cb342] rounded-full" style={{ width: `40%` }}></div>
                                        </div>
                                    </div>
                                    <div className="text-center text-xs text-[#8d6e63] mt-2 italic">
                                        (Audio controls visual only)
                                    </div>
                                </div>
                                <PauseButton onClick={() => setPauseTab('MAIN')} variant="secondary">Back</PauseButton>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
