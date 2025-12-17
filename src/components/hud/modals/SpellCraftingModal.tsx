import React, { useState, useMemo } from 'react';
import { Player, SpellType } from '../../../types';
import { CARD_REGISTRY } from '../../../modules/cards/CardRegistry';
import { CardDefinition, CardInstance, CardType } from '../../../modules/cards/types';
import { SPELL_REGISTRY } from '../../../modules/spells/SpellRegistry';

// --- VISUAL ASSETS ---
const ELEMENT_ICONS: Record<string, string> = {
    'FIRE': '/ui/icons/elements/fire.png',
    'ICE': '/ui/icons/elements/ice.png',
    'LIGHTNING': '/ui/icons/elements/lightning.png',
    'EARTH': '/ui/icons/elements/earth.png',
    'WIND': '/ui/icons/elements/ice.png', // Placeholder
    'ARCANE': '',
};

// Generate list from Registry to avoid drift
const SPELL_LIST = Object.values(SPELL_REGISTRY).map(config => ({
    id: config.id,
    name: config.name,
    school: config.school,
    type: config.spellType,
    icon: config.icon || ELEMENT_ICONS[config.school] || '',
    description: config.description
}));

interface SpellCraftingModalProps {
    player: Player;
    onEquipCard: (spell: SpellType, card: CardInstance) => void;
    onUnequipCard: (spell: SpellType, cardInstanceId: string) => void;
    onClose: () => void;
    isPaused: boolean;
}

// FIX 3 & 7: Robust Filter Mapping
const TYPE_MAP: Record<string, CardType[] | null> = {
    'ALL': null,
    'SHAPE': ['STAT_MOD', 'TRANSFORM'], // Mapping Geometry/Transforms
    'BEHAVIOR': ['FLAG', 'BUFF'],
    'TRIGGER': ['TRIGGER'],
    'HYBRID': ['HYBRID']
};

const MAX_SLOTS = 5;

export const SpellCraftingModal: React.FC<SpellCraftingModalProps> = ({ player, onClose, onEquipCard, onUnequipCard }) => {
    const [selectedSpellId, setSelectedSpellId] = useState<string>('fireball');
    const [filter, setFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

    // Ensure selected spell exists in registry
    const selectedSpell = useMemo(() => SPELL_LIST.find(s => s.id === selectedSpellId) || SPELL_LIST[0], [selectedSpellId]);

    // Derived State: Currently Equipped Cards
    const equippedCards = useMemo(() => {
        return (player.equippedCards && player.equippedCards[selectedSpellId as SpellType]) || [];
    }, [player.equippedCards, selectedSpellId]);

    // Library Cards
    const libraryCards = useMemo(() => {
        const allowed = TYPE_MAP[filter];
        return Object.values(CARD_REGISTRY)
            .filter(def => {
                if (allowed && !allowed.includes(def.type)) return false;
                if (searchTerm && !def.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => {
                const rarityOrder = { MYTHIC: 0, LEGENDARY: 1, EPIC: 2, RARE: 3, UNCOMMON: 4, COMMON: 5 };
                if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                return a.name.localeCompare(b.name);
            });
    }, [filter, searchTerm]);

    // Handlers
    const handleDrop = (cardId: string, slotIndex: number) => {
        // FIX 4 & 5: Slot Specific Equipping & Max Guard
        const existingAtSlot = equippedCards.find(c => c.gridX === slotIndex);
        if (existingAtSlot) {
            onUnequipCard(selectedSpellId as SpellType, existingAtSlot.instanceId);
        } else if (equippedCards.length >= MAX_SLOTS && !existingAtSlot) {
            // Check overall limit if not replacing
            return;
        }

        const newInstance: CardInstance = {
            instanceId: `inst_${cardId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            cardId: cardId,
            gridX: slotIndex
        };
        onEquipCard(selectedSpellId as SpellType, newInstance);
        setDraggedCardId(null);
    };

    const handleRemove = (instanceId: string) => {
        onUnequipCard(selectedSpellId as SpellType, instanceId);
    };

    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        e.dataTransfer.setData('cardId', cardId);
        setDraggedCardId(cardId);
    };

    const handleDragEnd = () => {
        setDraggedCardId(null);
    }

    return (
        <div className="pointer-events-auto z-40 fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md font-sans select-none">
            <div className="w-[1200px] h-[800px] bg-[#0c0a09] border border-[#44403c] rounded-xl flex shadow-2xl overflow-hidden relative text-[#e7e5e4]">

                {/* === LEFT COLUMN: SPELL & LOADOUT (40%) === */}
                <div className="w-[40%] bg-[#1c1917] border-r border-[#44403c] flex flex-col relative">

                    {/* Header: Spell Selector */}
                    <div className="p-6 border-b border-[#44403c] bg-[#14120f]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-[#d4b06c] font-black uppercase tracking-widest text-lg">Spell Crafting</h2>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {SPELL_LIST.map(spell => (
                                <button
                                    key={spell.id}
                                    onClick={() => setSelectedSpellId(spell.id)}
                                    className={`
                                        flex-shrink-0 w-12 h-12 rounded border-2 transition-all flex items-center justify-center relative group
                                        ${selectedSpellId === spell.id
                                            ? 'border-[#d4b06c] bg-[#292524] shadow-[0_0_15px_rgba(212,176,108,0.2)]'
                                            : 'border-[#44403c] bg-[#0f0e0d] hover:border-[#78716c]'}
                                    `}
                                >
                                    {spell.icon ? <img src={spell.icon} className="w-8 h-8 object-contain" alt={spell.name} /> : <span className="text-xl">?</span>}
                                    {/* Tooltip */}
                                    <div className="absolute top-14 bg-black px-3 py-1 text-xs font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity border border-[#44403c] shadow-xl">
                                        {spell.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Spell Visualization */}
                    <div className="p-8 flex flex-col items-center flex-1 overflow-y-auto bg-[url('/assets/ui/noise.png')] opacity-95 relative">
                        {/* FIX 6: Animated Spell Identity */}
                        <div className="relative mb-6 group">
                            <div className="w-32 h-32 rounded-full border-4 border-[#d4b06c]/30 flex items-center justify-center bg-[#0c0a09] shadow-[0_0_40px_rgba(212,176,108,0.05)] relative z-10">
                                {selectedSpell.icon ? <img src={selectedSpell.icon} className="w-20 h-20 object-contain drop-shadow-md" alt={selectedSpell.name} /> : <div className="text-4xl text-[#44403c]">?</div>}
                            </div>
                            {/* Pulse Animation */}
                            <div className="absolute inset-0 rounded-full border border-[#d4b06c]/20 animate-[ping_3s_ease-in-out_infinite]" />
                            <div className="absolute inset-[-10px] rounded-full border border-[#d4b06c]/10 animate-[pulse_4s_ease-in-out_infinite]" />
                        </div>

                        <h1 className="text-3xl font-black text-[#e5d5ac] uppercase tracking-wider mb-1 drop-shadow-lg">{selectedSpell.name}</h1>
                        <div className="text-[#a89068] text-xs font-bold uppercase tracking-widest mb-8">{selectedSpell.type} • {selectedSpell.school}</div>

                        {/* Slot Container */}
                        <div className="w-full flex flex-col gap-3">
                            <div className="flex justify-between items-end mb-2 px-1">
                                <div className="text-[#78716c] text-[10px] font-bold uppercase tracking-wider">Modifications</div>
                                {/* FIX 5: Power Bar */}
                                <div className="flex gap-1">
                                    {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${i < equippedCards.length ? 'bg-[#d4b06c] shadow-[0_0_5px_#d4b06c]' : 'bg-[#292524]'}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Slots */}
                            {Array.from({ length: MAX_SLOTS }).map((_, idx) => {
                                // Prefer gridX, fallback to index for robustness if not yet migrated
                                const card = equippedCards.find(c => c.gridX === idx) || (equippedCards[idx]?.gridX === undefined ? equippedCards[idx] : undefined);

                                return (
                                    <EquippedSlot
                                        key={idx}
                                        card={card}
                                        index={idx}
                                        onRemove={handleRemove}
                                        onDrop={(cid) => handleDrop(cid, idx)}
                                        isDragging={!!draggedCardId}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-4 bg-[#14120f] border-t border-[#44403c] text-[10px] text-[#57534e] text-center font-mono">
                        MODIFICATIONS ALTER MANA COST & CAST TIME
                    </div>
                </div>

                {/* === RIGHT COLUMN: REGISTRY (60%) === */}
                <div className="w-[60%] bg-[#0c0a09] flex flex-col relative">

                    {/* Header / Filter */}
                    <div className="h-16 border-b border-[#44403c] flex items-center px-6 gap-4 bg-[#14120f]">
                        <div className="text-[#a89068] font-bold text-sm uppercase tracking-widest mr-4">Registry</div>

                        {/* Search */}
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="SEARCH..."
                            className="bg-[#1c1917] border border-[#292524] rounded px-3 py-1.5 text-xs text-[#e7e5e4] focus:border-[#d4b06c] focus:outline-none w-48 font-mono placeholder-[#44403c]"
                        />

                        {/* FIX 7: Expanded Filters */}
                        <div className="flex gap-1 ml-auto">
                            <FilterBtn label="ALL" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                            <FilterBtn label="SHAPE" active={filter === 'SHAPE'} onClick={() => setFilter('SHAPE')} />
                            <FilterBtn label="BEHAVIOR" active={filter === 'BEHAVIOR'} onClick={() => setFilter('BEHAVIOR')} />
                            <FilterBtn label="TRIGGER" active={filter === 'TRIGGER'} onClick={() => setFilter('TRIGGER')} />
                        </div>
                        <button onClick={onClose} className="ml-6 text-[#78716c] hover:text-white uppercase font-bold text-xs tracking-widest">CLOSE</button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0f0e0d] relative">
                        {/* FIX 3: Section Headers could go here if we grouped, but purely sticking to Grid for now per prompt preference for 'Dividers'. 
                             Since filtering flattens logic, we'll keep grid but clean it up. 
                         */}

                        <div className="grid grid-cols-4 gap-3 content-start">
                            {libraryCards.map(def => (
                                <LibraryCard key={def.id} def={def} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                            ))}
                        </div>

                        {libraryCards.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#44403c] pointer-events-none">
                                <div className="text-4xl mb-4 opacity-50">FILTER_EMPTY</div>
                                <div className="text-xs uppercase tracking-widest">No matching cards found</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const FilterBtn = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-colors tracking-wider ${active
                ? 'bg-[#d4b06c] text-black border-[#d4b06c]'
                : 'bg-transparent text-[#78716c] border-[#292524] hover:border-[#57534e] hover:text-[#a8a29e]'
            }`}
    >
        {label}
    </button>
);

const LibraryCard = ({ def, onDragStart, onDragEnd }: { def: CardDefinition, onDragStart: (e: React.DragEvent, id: string) => void, onDragEnd: () => void }) => {
    // Rarity Colors
    const rarityInfo: Record<string, string> = {
        MYTHIC: '#ef4444',
        LEGENDARY: '#fbbf24',
        EPIC: '#a855f7',
        RARE: '#3b82f6',
        UNCOMMON: '#22c55e',
        COMMON: '#a8a29e'
    };
    const color = rarityInfo[def.rarity] || '#a8a29e';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, def.id)}
            onDragEnd={onDragEnd}
            className="group bg-[#1c1917] border border-[#292524] hover:border-[#57534e] rounded-[4px] relative cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform overflow-hidden aspect-[4/5] shadow-lg"
            style={{ borderColor: `color-mix(in srgb, ${color} 20%, #292524)` }}
        >
            {/* FIX 1: Dark Overlay for Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 pointer-events-none z-10" />

            {/* Background Image (Abstract/Icon) */}
            <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity z-0 flex items-center justify-center overflow-hidden">
                {/* FIX 2: No Filename Bleed - Pure decorative background */}
                <div className="text-[60px] opacity-10 blur-sm grayscale group-hover:grayscale-0 transition-all font-black select-none" style={{ color: color }}>
                    {def.icon || '✦'}
                </div>
            </div>

            {/* Content Plane */}
            <div className="relative z-20 h-full flex flex-col p-3">
                {/* Header */}
                <div className="flex justify-between items-start mb-auto">
                    {/* Tiny rarity indicator */}
                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]" style={{ backgroundColor: color }} />
                </div>

                {/* Body */}
                <div className="mt-auto">
                    <div className="text-[#e7e5e4] font-black text-xs uppercase tracking-tight leading-tight mb-1 drop-shadow-md">
                        {def.name}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-2 opacity-80" style={{ color: color }}>
                        {def.type.replace('_', ' ')}
                    </div>

                    {/* Description - Clamped */}
                    <div className="text-[10px] text-[#a8a29e] leading-snug line-clamp-2 min-h-[2.5em] font-medium opacity-90 border-t border-white/10 pt-1">
                        {def.description}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EquippedSlotProps {
    card?: CardInstance;
    index: number;
    onRemove: (id: string) => void;
    onDrop: (id: string) => void;
    isDragging: boolean;
}

const EquippedSlot: React.FC<EquippedSlotProps> = ({ card, index, onRemove, onDrop, isDragging }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovered(true);
    };
    const handleDragLeave = () => setIsHovered(false);

    const handleDropEvent = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovered(false);
        const cardId = e.dataTransfer.getData('cardId');
        if (cardId) onDrop(cardId);
    };

    const def = card ? CARD_REGISTRY[card.cardId] : null;

    // FIX 4: Slot Affordance & Index Glyphs
    const ROMAN = ['I', 'II', 'III', 'IV', 'V'][index];

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropEvent}
            className={`
                h-16 relative rounded border flex items-center px-2 gap-3 transition-all duration-200
                ${card
                    ? 'bg-[#1c1917] border-[#d4b06c]/50 shadow-md'
                    : isHovered
                        ? 'bg-[#d4b06c]/10 border-[#d4b06c] shadow-[0_0_12px_rgba(212,176,108,0.35)]'
                        : isDragging
                            ? 'bg-[#d4b06c]/5 border-[#d4b06c]/30 border-dashed animate-pulse'
                            : 'bg-[#0f0e0d] border-[#292524] border-dashed hover:border-[#57534e]'}
            `}
        >
            {/* Slot Index Glyph */}
            <div className="absolute top-1 right-2 text-[9px] font-black text-[#292524] pointer-events-none select-none">
                {ROMAN}
            </div>

            {card && def ? (
                <>
                    {/* Icon Box */}
                    <div className="w-12 h-12 bg-[#0c0a09] rounded border border-[#292524] flex items-center justify-center text-xl text-[#d4b06c] shrink-0 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#d4b06c]/10 to-transparent" />
                        <span className="relative z-10 drop-shadow">{def.icon || '★'}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <div className="text-[#e5d5ac] font-bold text-xs truncate uppercase tracking-tight">{def.name}</div>
                        <div className="text-[#78716c] text-[9px] uppercase font-bold tracking-wider">{def.type.replace('_', ' ')}</div>
                    </div>

                    {/* Controls */}
                    <button
                        onClick={() => onRemove(card.instanceId)}
                        className="w-6 h-6 flex items-center justify-center text-[#44403c] hover:text-red-400 font-bold transition-colors"
                        title="Unequip"
                    >
                        ✕
                    </button>
                </>
            ) : (
                <div className={`w-full text-center text-[10px] font-bold uppercase tracking-widest pointer-events-none transition-colors ${isHovered ? 'text-[#d4b06c]' : 'text-[#44403c]'}`}>
                    {isHovered ? 'EQUIP' : 'OPEN SLOT'}
                </div>
            )}
        </div>
    );
};