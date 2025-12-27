
import React from 'react';
import { Player, SpellType } from '../../types';
import { SPELL_REGISTRY } from '../../modules/spells/SpellRegistry';
import { LEVEL_7_UNLOCK } from '../../constants';

// --- ICONS & ASSETS ---
const ELEMENT_ICONS: Record<string, string> = {
    'FIRE': '/ui/icons/elements/fire.png',
    'ICE': '/ui/icons/elements/ice.png',
    'LIGHTNING': '/ui/icons/elements/lightning.png',
    'EARTH': '/ui/icons/elements/earth.png',
    'WIND': '/ui/icons/elements/ice.png',
};

const EMOJI_MAP: Record<string, string> = {
    'FIRE': '🔥',
    'ICE': '❄️',
    'LIGHTNING': '⚡',
    'EARTH': '🪨',
    'WIND': '💨',
    'ARCANE': '🔮',
};

interface ActionDockProps {
    player: Player;
    hotbarSpells: (SpellType | null)[];
    draggedSpell: SpellType | null;
    dragOverHotbarIndex: number | null;
    draggedFromHotbarIndex: number | null;
    trashHover: boolean;
    setDraggedSpell: (spell: SpellType | null) => void;
    setDraggedFromHotbarIndex: (index: number | null) => void;
    setDragOverHotbarIndex: (index: number | null) => void;
    setHotbarSpells: (spells: (SpellType | null)[]) => void;
    onAssignHotbarSlot: (index: number, spell: SpellType | null) => void;
    onSelectSpell: (spell: SpellType) => void;
    setTrashHover: (hover: boolean) => void;

}

export const ActionDock: React.FC<ActionDockProps> = ({
    player, hotbarSpells, draggedSpell, dragOverHotbarIndex, draggedFromHotbarIndex, trashHover,
    setDraggedSpell, setDraggedFromHotbarIndex, setDragOverHotbarIndex, setHotbarSpells, onAssignHotbarSlot, onSelectSpell,
    setTrashHover
}) => {
    const [pressedSlot, setPressedSlot] = React.useState<number | null>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const map = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'];
            if (map.includes(key)) {
                const idx = map.indexOf(key);
                setPressedSlot(idx);

                // Actual Selection Logic
                const spell = hotbarSpells[idx];
                if (spell && typeof onSelectSpell === 'function') {
                    onSelectSpell(spell);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const map = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'];
            const idx = map.indexOf(e.key.toLowerCase());
            if (idx !== -1) {
                setPressedSlot(prev => prev === idx ? null : prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [hotbarSpells, onSelectSpell]); // Added dependencies to ensure access to latest hotbarSpells



    // Weapon Icon for LMB
    const weaponIcon = player.equipment.MAIN_HAND?.icon || '👊';

    // Current Spell Icon for RMB
    const currentSpellConfig = SPELL_REGISTRY[player.currentSpell];
    const currentSpellIcon = (currentSpellConfig as any)?.emoji || '✨';
    const currentSpellColor = (currentSpellConfig as any)?.color || '#3b82f6';

    return (
        <div className="flex flex-col items-start gap-1">

            {/* Main Action Bar Row */}
            <div className="flex items-end gap-3 pointer-events-auto">

                {/* Vertical Stack for Mouse Controls */}
                <div className="flex flex-col gap-2">


                    {/* RMB: Current Spell */}
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl shadow-lg relative ring-2 ring-black bg-black/80 ${currentSpellConfig ? 'border-blue-500' : 'border-gray-700'}`}>
                            {/* Render Icon or Emoji */}
                            {(currentSpellConfig as any)?.ui?.iconId?.includes('/') ? (
                                <img src={(currentSpellConfig as any).ui.iconId} alt="RMB" className="w-10 h-10 object-contain drop-shadow-md transform hover:scale-110 transition-transform" />
                            ) : (
                                <div className="drop-shadow-md transform hover:scale-110 transition-transform cursor-default">{currentSpellIcon}</div>
                            )}
                            <div className="absolute -bottom-3 bg-gray-800 text-gray-300 text-[10px] px-2 rounded-full border border-gray-600 font-bold tracking-widest">RMB</div>
                        </div>
                    </div>

                    {/* LMB: Weapon Attack */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-500 bg-black/80 flex items-center justify-center text-3xl shadow-lg relative ring-2 ring-black">
                            <div className="drop-shadow-md transform hover:scale-110 transition-transform cursor-default">{weaponIcon}</div>
                            <div className="absolute -bottom-3 bg-gray-800 text-gray-300 text-[10px] px-2 rounded-full border border-gray-600 font-bold tracking-widest">LMB</div>
                        </div>
                    </div>
                </div>

                {/* Spell Grid */}
                <div className="relative">

                    {/* The Grid Itself */}
                    <div className="relative p-3">
                        <img
                            src="/assets/ui/action_rack_frame.png"
                            className="absolute inset-0 w-full h-full text-transparent object-fill pointer-events-none z-0 scale-[1.05]"
                            alt="Action Rack"
                        />
                        <div className="relative z-10 grid grid-cols-5 gap-3">
                            {/* Row 1 */}
                            {hotbarSpells.slice(0, 5).map((spell, index) => {
                                const keys = ['Q', 'W', 'E', 'R', 'T'];
                                const config = spell ? SPELL_REGISTRY[spell] : null;
                                // Fix Accessor: ui.iconId
                                const iconId = config?.ui?.iconId;
                                const school = config?.school;
                                const iconPath = iconId?.includes('/') ? iconId : (school ? ELEMENT_ICONS[school] : null);
                                // Fallback emoji logic
                                const emoji = iconId && !iconId.includes('/') ? (EMOJI_MAP[iconId] || EMOJI_MAP[school] || null) : (EMOJI_MAP[school] || null);

                                return (
                                    <div
                                        key={index}
                                        draggable={!!spell}
                                        onDragStart={(e) => {
                                            try { e.dataTransfer?.setData('text/plain', String(index)); e.dataTransfer!.effectAllowed = 'move'; } catch (err) { }
                                            if (spell) { setDraggedSpell(spell); setDraggedFromHotbarIndex(index); }
                                        }}
                                        onDragEnd={() => { setDraggedSpell(null); setDraggedFromHotbarIndex(null); setDragOverHotbarIndex(null); }}
                                        className={`flex flex-col items-center group cursor-pointer relative ${draggedSpell && dragOverHotbarIndex === index ? 'ring-2 ring-yellow-400' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverHotbarIndex(index); }}
                                        onDragLeave={() => setDragOverHotbarIndex(null)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            let newSpells = [...hotbarSpells];
                                            if (draggedFromHotbarIndex !== null) {
                                                const src = draggedFromHotbarIndex;
                                                newSpells[src] = hotbarSpells[index];
                                                newSpells[index] = draggedSpell;
                                            } else if (draggedSpell) {
                                                newSpells[index] = draggedSpell;
                                            }
                                            setHotbarSpells(newSpells);
                                            newSpells.forEach((s, i) => onAssignHotbarSlot(i, s));

                                            setDraggedSpell(null);
                                            setDraggedFromHotbarIndex(null);
                                            setDragOverHotbarIndex(null);
                                        }}
                                        onClick={() => {
                                            if (spell && player.knownSpells.includes(spell as SpellType)) {
                                                onSelectSpell(spell as SpellType);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`w-14 h-14 rounded border-2 flex items-center justify-center text-3xl transition-all relative overflow-hidden ${!spell || !player.knownSpells.includes(spell as SpellType) ? 'bg-gray-900 border-gray-700 opacity-50' : player.currentSpell === spell ? 'shadow-[0_0_15px_rgba(255,255,255,0.6)] border-white ring-2 ring-white scale-105 z-10' : 'border-gray-800 bg-black/60 opacity-60 hover:opacity-100 hover:border-gray-500'} ${pressedSlot === index ? 'ring-4 ring-yellow-400 brightness-150 scale-90' : ''}`}
                                        >
                                            {iconPath ? (
                                                <img src={iconPath} alt={config?.name} className="w-full h-full object-cover p-1" />
                                            ) : (
                                                emoji
                                            )}
                                        </div>
                                        <div className="absolute top-1 left-1 text-[10px] text-gray-500 font-mono">{keys[index]}</div>

                                        {/* Cooldown Overlay */}
                                        {spell && player.cooldowns?.[spell] > 0 && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded">
                                                <div
                                                    className="absolute inset-0 bg-black/50 origin-center animate-spin-slow"
                                                    style={{
                                                        clipPath: `conic-gradient(transparent ${360 * (1 - (player.cooldowns[spell] / (SPELL_REGISTRY[spell].baseStats.cooldown * 1000 || 1)))}deg, rgba(0,0,0,0.8) 0deg)`
                                                    }}
                                                />
                                                <span className="relative z-60 text-white font-bold text-sm drop-shadow-md">
                                                    {Math.ceil(player.cooldowns[spell] / 1000)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {/* Row 2 */}
                            {hotbarSpells.slice(5, 8).map((spell, baseIndex) => {
                                const index = baseIndex + 5;
                                const keys = ['Y', 'U', 'I'];
                                const config = spell ? SPELL_REGISTRY[spell] : null;

                                // Fix Accessor: ui.iconId
                                const iconId = config?.ui?.iconId;
                                const school = config?.school;
                                const iconPath = iconId?.includes('/') ? iconId : (school ? ELEMENT_ICONS[school] : null);
                                // Fallback emoji logic
                                const emoji = iconId && !iconId.includes('/') ? (EMOJI_MAP[iconId] || EMOJI_MAP[school] || null) : (EMOJI_MAP[school] || null);

                                return (
                                    <div
                                        key={index}
                                        draggable={!!spell}
                                        onDragStart={(e) => {
                                            try { e.dataTransfer?.setData('text/plain', String(index)); e.dataTransfer!.effectAllowed = 'move'; } catch (err) { }
                                            if (spell) { setDraggedSpell(spell); setDraggedFromHotbarIndex(index); }
                                        }}
                                        onDragEnd={() => { setDraggedSpell(null); setDraggedFromHotbarIndex(null); setDragOverHotbarIndex(null); }}
                                        className={`flex flex-col items-center group cursor-pointer relative ${draggedSpell && dragOverHotbarIndex === index ? 'ring-2 ring-yellow-400' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverHotbarIndex(index); }}
                                        onDragLeave={() => setDragOverHotbarIndex(null)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            let newSpells = [...hotbarSpells];
                                            if (draggedFromHotbarIndex !== null) {
                                                const src = draggedFromHotbarIndex;
                                                newSpells[src] = hotbarSpells[index];
                                                newSpells[index] = draggedSpell;
                                            } else if (draggedSpell) {
                                                newSpells[index] = draggedSpell;
                                            }
                                            setHotbarSpells(newSpells);
                                            newSpells.forEach((s, i) => onAssignHotbarSlot(i, s));

                                            setDraggedSpell(null);
                                            setDraggedFromHotbarIndex(null);
                                            setDragOverHotbarIndex(null);
                                        }}
                                        onClick={() => {
                                            if (spell && player.knownSpells.includes(spell as SpellType)) {
                                                onSelectSpell(spell as SpellType);
                                            }
                                        }}
                                    >
                                        <div className={`relative w-14 h-14 rounded overflow-hidden transition-all ${pressedSlot === index ? 'scale-90 brightness-125 ring-4 ring-yellow-400 z-50' : 'hover:scale-105'} ${!spell ? 'opacity-50' : ''}`}>

                                            {/* Layer 1: Background */}
                                            <div className="absolute inset-0 bg-gray-900/90 border-2 border-gray-700 pointer-events-none" />

                                            {/* Layer 2: Icon */}
                                            <div className="absolute inset-0 flex items-center justify-center z-10 p-1">
                                                {iconPath ? (
                                                    <img src={iconPath} alt={config?.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-3xl">{emoji || ''}</span>
                                                )}
                                            </div>

                                            {/* Layer 3: Selection / Active Overlay */}
                                            {player.currentSpell === spell && spell && (
                                                <div className="absolute inset-0 z-20 border-2 border-white bg-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] animate-pulse" />
                                            )}

                                            {/* Pressed Feedback Overlay */}
                                            {pressedSlot === index && (
                                                <div className="absolute inset-0 z-30 bg-yellow-400/30 mix-blend-overlay" />
                                            )}
                                        </div>

                                        {/* Hotkey Label (Outside the box or Overlaid?) - Keeping user request "number below" in mind, but this is hotkey letters QWER... */}
                                        {/* Standard look: small label in corner */}
                                        <div className="absolute top-0 left-0 z-40 bg-black/80 text-gray-300 text-[10px] px-1 rounded-br border-b border-r border-gray-700 font-mono leading-none pt-0.5 pointer-events-none">
                                            {keys[baseIndex]}
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Mount/Special slot */}
                            <div className="flex flex-col items-center group cursor-pointer relative">
                                <div className={`w-14 h-14 rounded border-2 flex items-center justify-center text-3xl transition-all relative overflow-hidden ${player.isMounted ? 'border-green-600 bg-green-950 shadow-inner' : 'border-gray-800 bg-black/60 opacity-60 hover:opacity-100 hover:border-gray-500'}`}>
                                    {player.level >= LEVEL_7_UNLOCK ? (player.isMounted ? '🏇' : '🐎') : '🔒'}
                                </div>
                                <div className="absolute top-1 left-1 text-[10px] text-gray-500 font-mono">O</div>
                            </div>

                            {/* Trash drop area */}
                            {(draggedSpell || draggedFromHotbarIndex !== null) && (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setTrashHover(true); }}
                                    onDragLeave={() => setTrashHover(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedFromHotbarIndex !== null) {
                                            const newSpells = [...hotbarSpells];
                                            newSpells[draggedFromHotbarIndex] = null;
                                            setHotbarSpells(newSpells);
                                            onAssignHotbarSlot(draggedFromHotbarIndex, null);
                                        }
                                        setDraggedSpell(null);
                                        setDraggedFromHotbarIndex(null);
                                        setDragOverHotbarIndex(null);
                                        setTrashHover(false);
                                    }}
                                    className={`absolute -bottom-12 right-2 w-12 h-12 rounded-md flex items-center justify-center text-xl text-white cursor-pointer transition-all ${trashHover ? 'bg-red-600 scale-110' : 'bg-red-700'}`}
                                    style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}
                                    aria-hidden
                                >
                                    <span role="img" aria-label="trash">{trashHover ? '🗑️' : '🗑'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};