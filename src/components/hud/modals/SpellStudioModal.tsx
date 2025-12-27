import React, { useState, useMemo } from 'react';
import { Player, SpellType } from '../../../types';
import { SPELL_REGISTRY } from '../../../modules/spells/SpellRegistry';
import { TALENT_REGISTRY, TalentDefinition } from '../../../modules/talents/TalentRegistry';

interface SpellStudioModalProps {
    player: Player;
    onClose: () => void;
    onUpgradeTalent: (spellId: string, talentId: string) => void;
    onAssignHotbarSlot: (index: number, spell: SpellType | null) => void;
    isPaused: boolean;
    onUpgradeSpell?: (spell: SpellType) => void;
    onInjectDust?: (spell: SpellType, amount: number) => void;
}

const SPELL_EMOJIS: Record<string, string> = {
    'FIRE_FIREBALL': '☄️',
    'FIRE_DETONATE': '💥',
    'ICE_FROST_PULSE': '❄️',
    'ARCANE_PORTAL': '🌀',
    'LIGHTNING_ARC_LIGHTNING': '⚡',
    'FROST_BREATH': '🌬️',
    'FIRE_CIRCLE': '⭕',
    'EARTH_STONE_SHIELD': '🛡️',
    'ROCK_AURA': '🪨',
    'ARCANE_EXPLOSION': '✨',
    'TELEPORT': '📍',
    'BOMB': '💣'
};

const ELEMENT_COLORS: Record<string, string> = {
    'FIRE': '#ff4d4d',
    'ICE': '#4da6ff',
    'EARTH': '#a68b6a',
    'LIGHTNING': '#ffdb4d',
    'ARCANE': '#c04dff',
    'UTILITY': '#94a3b8'
};

// --- DATA: PATH MAPPING (Heuristic based on User Plan) ---
// We map existing talent IDs to "Paths" based on their row index from the previous TALENT_COORDS
// Row 0 = Path 1, Row 1 = Path 2, Row 2 = Path 3, etc.
const PATH_NAMES: Record<string, string[]> = {
    'FIRE_FIREBALL': ['PROJECTILE PATH', 'AREA PATH', 'BURN PATH', 'MASTERY PATH'],
    'FIRE_DETONATE': ['CHAIN PATH', 'FUEL PATH', 'INFERNO PATH'],
    'ICE_FROST_PULSE': ['CHILL PATH', 'FREEZE PATH', 'SHATTER PATH'],
    'default': ['PRIMARY PATH', 'SECONDARY PATH', 'UTILITY PATH']
};

const TALENT_COORDS: Record<string, { r: number, c: number, connectsTo?: string[] }> = {
    // REUSING COORDS strictly for grouping into paths
    'scattercast': { r: 0, c: 1 },
    'scorched_path': { r: 1, c: 0 },
    'run_and_gun': { r: 0, c: 2 }, // Moved to row 0
    'heartburst': { r: 0, c: 3 }, // Moved to row 0
    'delayed_detonation': { r: 1, c: 1 },
    'glass_cannon': { r: 1, c: 2 },
    'thermal_drift': { r: 2, c: 0 },
    'living_fireball': { r: 2, c: 1 },

    // Fallbacks will be auto-assigned
};

const UP_TICKS_REGISTRY: Record<string, { id: string, name: string, maxRank: number, icon: string, color: string }[]> = {
    'FIRE_FIREBALL': [
        { id: 'uptick:damage', name: 'Hit Damage', maxRank: 12, icon: '🔴', color: '#ef4444' },
        { id: 'uptick:cast_speed', name: 'Cast Speed', maxRank: 10, icon: '🟡', color: '#facc15' },
        { id: 'uptick:proj_speed', name: 'Projectile Speed', maxRank: 10, icon: '🔵', color: '#3b82f6' },
        { id: 'uptick:burn_potency', name: 'Burn Potency', maxRank: 8, icon: '🟣', color: '#a855f7' },
    ]
};

export const SpellStudioModal: React.FC<SpellStudioModalProps> = ({
    player, onClose, onUpgradeTalent, onAssignHotbarSlot, isPaused, onUpgradeSpell, onInjectDust
}) => {
    const [selectedSpellId, setSelectedSpellId] = useState<string>(player.knownSpells[0] || 'FIRE_FIREBALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredTalentId, setHoveredTalentId] = useState<string | null>(null);
    const [showAdvancedStats, setShowAdvancedStats] = useState(false);

    // MOCK RESOURCE
    const magicDust = 124;

    // 1. Sidebar Spells
    const allSpells = useMemo(() => {
        return Object.values(SPELL_REGISTRY)
            .filter(s => !!s)
            .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const selectedSpell = useMemo(() => SPELL_REGISTRY[selectedSpellId] || allSpells[0], [selectedSpellId, allSpells]);
    const isKnown = (id: string) => player.knownSpells.includes(id as SpellType);

    // 2. Talents & Paths
    const talents = useMemo(() => TALENT_REGISTRY[selectedSpellId] || [], [selectedSpellId]);
    const currentRank = (tid: string) => player.spellTalents?.allocations?.[`${selectedSpellId}:${tid}`] || 0;

    const talentPaths = useMemo(() => {
        const paths: TalentDefinition[][] = [[], [], [], []];
        talents.forEach((t, i) => {
            // Use explicit row if defined, else modulo
            let row = TALENT_COORDS[t.id]?.r ?? Math.floor(i / 3);
            if (row > 3) row = 3;
            if (!paths[row]) paths[row] = [];
            paths[row].push(t);
        });
        return paths.filter(p => p.length > 0);
    }, [talents]);

    const pathNames = PATH_NAMES[selectedSpellId] || PATH_NAMES['default'];

    // 3. UI Helpers
    const points = player.spellTalentPoints || 0;
    const hoveredTalent = useMemo(() => talents.find(t => t.id === hoveredTalentId), [talents, hoveredTalentId]);

    const spellLevel = 6; // Mock level
    const unlockNext = 7;

    return (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-sans animate-in fade-in duration-200">
            {/* MAIN WINDOW FRAME */}
            <div className="flex bg-[#120f0d] border border-[#3d332b] rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.8)] w-[1100px] h-[700px] relative overflow-hidden text-[#e7e5e4]">

                {/* === COLUMN 1: SPELL LIST (Sidebar) === */}
                <div className="w-[240px] bg-[#0c0a09] border-r border-[#3d332b] flex flex-col shrink-0">
                    <div className="h-14 flex items-center px-4 border-b border-[#3d332b] bg-[#1a1614]">
                        <h2 className="text-[#a89068] font-black uppercase tracking-widest text-xs">Spell Mastery</h2>
                    </div>

                    {/* Search */}
                    <div className="p-2 border-b border-[#3d332b]/50">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="SEARCH SPELLS..."
                            className="w-full bg-[#1a1614] border border-[#3d332b] rounded px-3 py-1.5 text-[10px] text-[#e5d5ac] placeholder:text-[#57534e] focus:border-[#ffd100] focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {allSpells.map(spell => {
                            const selected = selectedSpellId === spell.id;
                            const known = isKnown(spell.id);

                            // Mock Level badge per spell
                            const mockLvl = known ? 6 : 0;

                            return (
                                <button
                                    key={spell.id}
                                    onClick={() => setSelectedSpellId(spell.id)}
                                    className={`
                                        w-full flex items-center gap-3 p-2 rounded transition-all relative group
                                        ${selected ? 'bg-[#292524] border border-[#ffd100]/30' : 'hover:bg-[#1c1917] border border-transparent'}
                                        ${!known ? 'opacity-40 grayscale' : ''}
                                    `}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center text-xl bg-black rounded border border-[#3d332b] shadow-inner">
                                        {SPELL_EMOJIS[spell.id] || '🔮'}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className={`text-xs font-bold truncate leading-none mb-1 ${selected ? 'text-[#ffd100]' : 'text-[#a89068] group-hover:text-[#e5d5ac]'}`}>
                                            {spell.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-mono text-[#57534e]">
                                            {known ? <span className="text-[#a89068]">LV {mockLvl}</span> : <span>LOCKED</span>}
                                        </div>
                                    </div>
                                    {selected && <div className="w-1 h-full absolute right-0 top-0 bg-[#ffd100] rounded-l" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* === COLUMN 2: CENTER WORKSHOP === */}
                <div className="flex-1 flex flex-col relative bg-[#14120f]">

                    {/* --- TOP BAR: RESOURCE & CONTEXT --- */}
                    <div className="h-14 flex items-center justify-between px-6 border-b border-[#3d332b] bg-[#1a1614] shrink-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[#57534e] font-black uppercase tracking-widest text-[10px]">Magic Dust</span>
                                <span className="text-[#ffd100] font-black text-lg tabular-nums drop-shadow-md">{magicDust}</span>
                            </div>
                            <div className="h-4 w-px bg-[#3d332b]" />
                            {/* Breadcrumb / Context */}
                            <span className="text-[#a89068] text-xs font-bold uppercase tracking-wide">
                                {selectedSpell.school} Workshop
                            </span>
                        </div>
                        <button onClick={onClose} className="text-[#57534e] hover:text-[#e5d5ac] font-bold text-xs uppercase tracking-widest transition-colors">
                            Close
                        </button>
                    </div>

                    {/* --- MAIN SCROLL AREA --- */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 py-8">

                        {/* 1. CORE NODE (Top Center) */}
                        <div className="flex flex-col items-center mb-12">
                            <div className="relative group cursor-pointer" onClick={() => setShowAdvancedStats(!showAdvancedStats)}>
                                {/* Orbit Rings */}
                                <div className="absolute inset-[-20px] rounded-full border border-[#ffd100]/10 animate-[spin_10s_linear_infinite]" />
                                <div className="absolute inset-[-10px] rounded-full border border-[#ffd100]/20 animate-[spin_6s_linear_infinite_reverse]" />

                                {/* Center Icon */}
                                <div className="w-24 h-24 rounded-full bg-black border-4 border-[#ffd100] shadow-[0_0_50px_rgba(255,209,0,0.15)] flex items-center justify-center text-5xl relative z-10 transition-transform group-hover:scale-105">
                                    {SPELL_EMOJIS[selectedSpell.id] || '🔮'}
                                </div>

                                {/* Level Badge */}
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#ffd100] text-black text-xs font-black px-2 py-0.5 rounded shadow-lg z-20 whitespace-nowrap">
                                    LV {spellLevel}
                                </div>
                            </div>

                            {/* Core Stats Summary */}
                            <div className="flex gap-6 mt-6">
                                <div className="text-center">
                                    <div className="text-[#57534e] text-[9px] font-bold uppercase tracking-wider">Damage</div>
                                    <div className="text-[#e5d5ac] font-mono font-bold text-sm">145-180</div>
                                </div>
                                <div className="w-px h-8 bg-[#292524]" />
                                <div className="text-center">
                                    <div className="text-[#57534e] text-[9px] font-bold uppercase tracking-wider">Cooldown</div>
                                    <div className="text-[#e5d5ac] font-mono font-bold text-sm">3.5s</div>
                                </div>
                                <div className="w-px h-8 bg-[#292524]" />
                                <div className="text-center">
                                    <div className="text-[#57534e] text-[9px] font-bold uppercase tracking-wider">Radius</div>
                                    <div className="text-[#e5d5ac] font-mono font-bold text-sm">4m</div>
                                </div>
                            </div>

                            {/* Level Up Button */}
                            <button className="mt-6 flex items-center gap-2 bg-[#292524] hover:bg-[#3d332b] border border-[#3d332b] hover:border-[#ffd100] px-4 py-2 rounded-full transition-all group">
                                <span className="text-[#a89068] text-[10px] font-bold uppercase tracking-widest group-hover:text-[#ffd100]">Level Up Spell</span>
                                <span className="text-[#57534e] text-[10px]">•</span>
                                <span className="text-[#ffd100] font-bold text-xs">{50 * spellLevel} Dust</span>
                            </button>
                        </div>

                        {/* 2. MODIFIER PATHS */}
                        <div className="flex flex-col gap-10">
                            {talentPaths.map((pathNodes, pathIdx) => (
                                <div key={pathIdx} className="relative">
                                    {/* Path Label */}
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full pr-4 text-right hidden lg:block">
                                        <div className="text-[#57534e] font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            {pathNames[pathIdx] || `Path ${pathIdx + 1}`}
                                        </div>
                                    </div>

                                    {/* PATH LINE BACKGROUND */}
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#292524] -z-10 rounded-full" />

                                    {/* NODES ROW */}
                                    <div className="flex justify-center gap-12">
                                        {pathNodes.map((talent, tierIdx) => {
                                            const rank = currentRank(talent.id);
                                            const max = talent.maxRank;
                                            const canUpgrade = isKnown(selectedSpellId) && magicDust > 0 && rank < max;
                                            //                                            const isMaxed = rank >= max; // unused

                                            return (
                                                <div key={talent.id} className="relative group">
                                                    {/* Node Button */}
                                                    <button
                                                        onMouseEnter={() => setHoveredTalentId(talent.id)}
                                                        onMouseLeave={() => setHoveredTalentId(null)}
                                                        onClick={() => canUpgrade && onUpgradeTalent(selectedSpellId, talent.id)}
                                                        className={`
                                                            w-16 h-16 rounded-xl border-2 transition-all duration-300 relative flex items-center justify-center p-1
                                                            ${rank > 0
                                                                ? 'bg-[#0c0a09] border-[#ffd100] shadow-[0_0_20px_rgba(255,209,0,0.15)] scale-105'
                                                                : 'bg-[#1a1614] border-[#3d332b] hover:border-[#a89068]'}
                                                        `}
                                                    >
                                                        <div className={`text-2xl transition-all ${rank > 0 ? 'grayscale-0' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                                            {talent.icon}
                                                        </div>

                                                        {/* Tier Dots (Simple visual representation of rank) */}
                                                        <div className="absolute -bottom-3 flex gap-0.5">
                                                            {Array.from({ length: max }).map((_, i) => (
                                                                <div key={i} className={`w-1.5 h-1.5 rounded-full border border-black ${i < rank ? 'bg-[#ffd100]' : 'bg-[#3d332b]'}`} />
                                                            ))}
                                                        </div>
                                                    </button>

                                                    {/* Node Label (Below) */}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 text-center w-32 pointer-events-none">
                                                        <div className={`text-[10px] font-bold uppercase tracking-tight leading-tight mb-1 ${rank > 0 ? 'text-[#e5d5ac]' : 'text-[#78716c]'}`}>
                                                            {talent.name}
                                                        </div>
                                                        {rank > 0 && <div className="text-[#ffd100] text-[8px] font-black uppercase">Active</div>}
                                                    </div>

                                                    {/* HOVER TOOLTIP */}
                                                    {hoveredTalentId === talent.id && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-3 bg-[#0c0a09] border border-[#ffd100]/30 rounded shadow-2xl z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                                                            <div className="text-[#e5d5ac] font-bold text-xs uppercase mb-1">{talent.name}</div>
                                                            <div className="text-[#a89068] text-[10px] leading-relaxed">{talent.description}</div>
                                                            {canUpgrade && (
                                                                <div className="mt-2 text-[#ffd100] text-[9px] font-black uppercase tracking-wider flex justify-between">
                                                                    <span>Upgrade</span>
                                                                    <span>25 Dust</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- BOTTOM: LIVE PREVIEW --- */}
                    <div className="h-16 px-6 border-t border-[#3d332b] bg-[#1a1614] flex items-center justify-between shrink-0 z-30">
                        <div className="flex flex-col">
                            <div className="text-[#57534e] font-black text-[9px] uppercase tracking-widest mb-1">Live Preview</div>
                            <div className="text-[#e5d5ac] text-xs font-medium flex items-center gap-2">
                                <span>• Fires 3 projectiles</span>
                                <span>• Leaves burning ground</span>
                                <span>• Explodes on impact</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-transparent hover:bg-white/5 text-[#78716c] hover:text-[#e7e5e4] border border-transparent hover:border-[#3d332b] rounded text-[10px] font-bold uppercase tracking-widest transition-all">
                                Refund All
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-[#ffd100] hover:bg-[#e6bb00] text-black border border-[#ffd100] rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#ffd100]/10 transition-all hover:scale-105"
                            >
                                Confirm Build
                            </button>
                        </div>
                    </div>

                    {/* --- DRAWER: ADVANCED STATS (Mastery Knobs from User Plan) --- */}
                    <div className={`absolute top-14 bottom-16 right-0 w-64 bg-[#0c0a09]/95 backdrop-blur border-l border-[#3d332b] transition-transform duration-300 transform ${showAdvancedStats ? 'translate-x-0' : 'translate-x-full'} z-40 flex flex-col`}>
                        <div className="p-4 border-b border-[#3d332b] flex justify-between items-center">
                            <h3 className="text-[#a89068] font-black uppercase tracking-widest text-xs">Advanced Stats</h3>
                            <button onClick={() => setShowAdvancedStats(false)} className="text-[#57534e] hover:text-white">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="text-[#57534e] text-[9px] leading-tight mb-4">
                                These stats scale globally with Spell Level. They do not compete with modifiers.
                            </div>

                            {UP_TICKS_REGISTRY[selectedSpellId]?.map(tick => {
                                const rank = player.spellTalents?.allocations?.[`${selectedSpellId}:${tick.id}`] || 0;
                                return (
                                    <div key={tick.id}>
                                        <div className="flex justify-between text-[10px] font-bold text-[#e5d5ac] mb-1">
                                            <span>{tick.name}</span>
                                            <span>{rank}/{tick.maxRank}</span>
                                        </div>
                                        <div className="h-1 bg-[#292524] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#ffd100]" style={{ width: `${(rank / tick.maxRank) * 100}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
