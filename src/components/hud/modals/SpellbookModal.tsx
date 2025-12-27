
import React, { useState, useMemo } from 'react';
import { Player, SpellType } from '../../../types';
import { SPELL_REGISTRY } from '../../../modules/spells/SpellRegistry';

interface SpellbookModalProps {
    player: Player;
    onClose: () => void;
    setDraggedSpell: (spell: SpellType | null) => void;
    setDraggedFromHotbarIndex: (index: number | null) => void;
    setDragOverHotbarIndex: (index: number | null) => void;
    onClearHotbarSlot: (index: number) => void;
    onUnlockSpell: (spell: SpellType) => void;
    draggedFromHotbarIndex: number | null;
    isPaused: boolean;
    // Legacy props (can keep for compatibility or remove if unused in parent)
    onEquipCard?: any;
    onUnequipCard?: any;
}

const UNLOCK_COST = 500;

export const SpellbookModal: React.FC<SpellbookModalProps> = ({
    player, onClose, setDraggedSpell, onUnlockSpell, isPaused
}) => {
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    // 1. Get all valid spells
    const allSpells = useMemo(() => {
        return Object.values(SPELL_REGISTRY).filter(s => s && typeof s === 'object');
    }, []);

    // 2. Derive Categories
    const categories = useMemo(() => {
        const raw = new Set(allSpells.map(s => {
            // Handle both SCHOOL (registry) and ELEMENT (types) mismatch
            // Registry uses 'school' e.g. 'FIRE', 'ICE'
            return s.school ? s.school.toUpperCase() : 'UTILITY';
        }));
        const cats = Array.from(raw).sort() as string[];
        // Ensure standard order
        const PREFERRED = ['FIRE', 'ICE', 'LIGHTNING', 'EARTH', 'WIND', 'ARCANE', 'NATURE', 'PHYSICAL', 'WEAPON', 'UTILITY'];
        return ['ALL', ...cats.sort((a: string, b: string) => {
            const ia = PREFERRED.indexOf(a);
            const ib = PREFERRED.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        })];
    }, [allSpells]);

    // 3. Filter Spells
    const displayedSpells = useMemo(() => {
        let list = allSpells;
        if (activeCategory !== 'ALL') {
            list = list.filter(s => (s.school || 'UTILITY').toUpperCase() === activeCategory);
        }
        // Sort: Unlocked first, then by Level, then Name
        return list.sort((a, b) => {
            const aKnown = player.knownSpells?.includes(a.id as SpellType);
            const bKnown = player.knownSpells?.includes(b.id as SpellType);
            if (aKnown && !bKnown) return -1;
            if (!aKnown && bKnown) return 1;

            const aLvl = a.unlock?.requiredLevel || 1;
            const bLvl = b.unlock?.requiredLevel || 1;
            if (aLvl !== bLvl) return aLvl - bLvl;

            return a.name.localeCompare(b.name);
        });
    }, [allSpells, activeCategory, player.knownSpells]); // Use knownSpells!

    const EMOJI_MAP: Record<string, string> = {
        'ALL': '∞',
        'FIRE': '🔥',
        'ICE': '❄️',
        'LIGHTNING': '⚡',
        'EARTH': '🪨',
        'WIND': '💨',
        'ARCANE': '🔮',
        'NATURE': '🍃',
        'PHYSICAL': '💪',
        'WEAPON': '⚔️',
        'UTILITY': '✨'
    };

    return (
        <div className="pointer-events-auto z-40 flex shadow-2xl" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            {/* Main Window - Full Width */}
            <div className="relative flex flex-col bg-[#0c0a09] border-[3px] border-[#4a3f35] rounded-lg overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.9)] w-[1000px] h-[700px]">

                {/* --- HEADER --- */}
                <div className="bg-[#141210] border-b border-[#3d342b] p-4 flex items-center justify-between shrink-0 h-16 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none"></div>

                    <div className="flex items-center gap-4 z-10">
                        <div className="text-2xl text-[#d4b06c] filter drop-shadow-md">📖</div>
                        <div>
                            <h1 className="text-[#e5d5ac] text-xl font-bold tracking-widest uppercase">Grimoire</h1>
                            <div className="text-[#78716c] text-xs">Unlock and Manage Spells</div>
                        </div>
                    </div>

                    {/* Magic Dust Display */}
                    <div className="flex items-center gap-6 z-10">
                        <div className="bg-[#1c1917] px-4 py-2 rounded-lg border border-[#3d342b] flex items-center gap-3 shadow-inner">
                            <span className="text-[#a855f7] text-xs font-bold uppercase tracking-wider">Magic Dust</span>
                            <span className="text-2xl font-bold text-[#e5d5ac] filter drop-shadow-[0_0_5px_rgba(232,121,249,0.5)]">
                                {player.magicDust ?? 0}
                            </span>
                        </div>

                        {!isPaused && (
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900 to-black border border-red-700 hover:border-red-400 text-red-500 hover:text-red-200 hover:scale-110 transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)] flex items-center justify-center"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="flex flex-1 overflow-hidden">

                    {/* LEFT SIDEBAR: Categories */}
                    <div className="w-48 bg-[#110f0e] border-r border-[#292524] flex flex-col py-4 overflow-y-auto custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    w-full text-left px-5 py-3 text-sm font-bold tracking-wide transition-all flex items-center gap-3 border-l-4
                                    ${activeCategory === cat
                                        ? 'bg-[#1c1917] text-[#e5d5ac] border-[#d4b06c] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'
                                        : 'text-[#57534e] border-transparent hover:bg-[#1c1917] hover:text-[#a89068]'}
                                `}
                            >
                                <span className="text-lg opacity-80">{EMOJI_MAP[cat] || '📜'}</span>
                                <span>{cat === 'ALL' ? 'All Spells' : cat}</span>
                            </button>
                        ))}
                    </div>

                    {/* MAIN CONTENT: Spell Grid */}
                    <div className="flex-1 bg-[#1c1917] p-8 overflow-y-auto custom-scrollbar relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #d4b06c 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                        <div className="grid grid-cols-4 gap-6 relative z-10">
                            {displayedSpells.map(spell => {
                                const isUnlocked = (player.knownSpells || []).includes(spell.id as SpellType);
                                const isAffordable = (player.magicDust ?? 0) >= UNLOCK_COST;
                                const isActive = player.hotbar.includes(spell.id as SpellType);

                                return (
                                    <div
                                        key={spell.id}
                                        draggable={isUnlocked}
                                        onDragStart={(e) => {
                                            if (isUnlocked) {
                                                setDraggedSpell(spell.id as SpellType);
                                                e.dataTransfer.setData('text/plain', spell.id);
                                            }
                                        }}
                                        className={`
                                            relative bg-[#292524] rounded-xl border-2 flex flex-col group overflow-hidden transition-all duration-300
                                            ${isUnlocked
                                                ? 'border-[#44403c] hover:border-[#d4b06c] hover:shadow-[0_0_20px_rgba(212,176,108,0.15)] hover:-translate-y-1 cursor-grab active:cursor-grabbing'
                                                : 'border-[#1c1917] opacity-80'}
                                            ${isActive ? 'ring-2 ring-[#d4b06c] ring-offset-2 ring-offset-[#0c0a09]' : ''}
                                        `}
                                        style={{ height: '240px' }}
                                    >
                                        {/* Spell Icon / Visual */}
                                        <div className={`h-24 w-full bg-black/50 relative flex items-center justify-center overflow-hidden border-b border-[#3d342b]`}>
                                            <img
                                                src={spell.icon}
                                                className={`w-12 h-12 object-contain filter drop-shadow-lg transition-transform duration-500 group-hover:scale-110 ${!isUnlocked ? 'grayscale brightness-50' : ''}`}
                                                alt={spell.name}
                                            />
                                            {!isUnlocked && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                                    <span className="text-2xl">🔒</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Spell Info */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-[#e5d5ac] text-sm truncate pr-2">{spell.name}</div>
                                                <div className="text-[10px] text-[#78716c] uppercase tracking-wider font-bold">Lvl {spell.unlock?.requiredLevel || 1}</div>
                                            </div>

                                            <div className="text-[#a89068] text-[10px] leading-relaxed line-clamp-3 mb-4 flex-1">
                                                {spell.description}
                                            </div>

                                            {/* Action Button */}
                                            <div className="mt-auto">
                                                {isUnlocked ? (
                                                    <div className="w-full py-2 bg-[#1c1917] border border-[#3d342b] rounded text-[#78716c] text-xs font-bold text-center uppercase tracking-wide group-hover:bg-[#292524] group-hover:text-[#a89068] transition-colors">
                                                        {isActive ? 'Equipped' : 'Drag to Hotbar'}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (isAffordable) {
                                                                onUnlockSpell(spell.id as SpellType);
                                                                // Local refetch isn't needed as parent tracks state, but visual feedback is good
                                                            }
                                                        }}
                                                        disabled={!isAffordable}
                                                        className={`
                                                            w-full py-2 rounded text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all
                                                            ${isAffordable
                                                                ? 'bg-gradient-to-r from-[#d4b06c] to-[#a89068] text-black hover:brightness-110 hover:shadow-[0_0_10px_rgba(212,176,108,0.4)]'
                                                                : 'bg-[#292524] border border-[#3d342b] text-[#57534e] cursor-not-allowed'}
                                                        `}
                                                    >
                                                        {isAffordable ? (
                                                            <>
                                                                <span>Unlock</span>
                                                                <span className="bg-black/20 px-1.5 rounded text-[10px]">{UNLOCK_COST} Dust</span>
                                                            </>
                                                        ) : (
                                                            <span>Need {UNLOCK_COST} Dust</span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
