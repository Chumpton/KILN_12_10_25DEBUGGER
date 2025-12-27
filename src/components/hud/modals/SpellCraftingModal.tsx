import React, { useState, useMemo, useEffect } from 'react';
import { Player, SpellType } from '../../../types';
import { SPELL_REGISTRY } from '../../../modules/spells/SpellRegistry';
import { TALENT_REGISTRY } from '../../../modules/talents/TalentRegistry';

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
    name: config.ui?.shortLabel || config.name,
    school: config.school,
    type: config.spellType,
    icon: config.ui?.iconId || ELEMENT_ICONS[config.school] || '',
    description: config.ui?.description || ''
}));

interface SpellCraftingModalProps {
    player: Player;
    onClose: () => void;
    onUpgradeSpell: (spell: SpellType) => void;
    onUpgradeTalent: (spell: SpellType, talentId: string) => void;
    selectedSpellId?: SpellType | null;
    isPaused: boolean;
}

export const SpellCraftingModal: React.FC<SpellCraftingModalProps> = ({
    player, onClose, onUpgradeSpell, onUpgradeTalent, selectedSpellId: initialSpellId
}) => {
    // We can also infer selectedSpell from props or maintain internal state
    const [selectedSpellId, setSelectedSpellId] = useState<SpellType>(initialSpellId || SpellType.FIRE_FIREBALL);

    // --- SANITIZATION (FORCE FIX) ---
    useEffect(() => {
        // Force fix bad data states for the user session
        if (typeof player.magicDust !== 'number') {
            player.magicDust = 0;
            console.warn('[SpellCrafting] Resetting Dust to 0');
        }
        if (!player.spellUpgrades) {
            player.spellUpgrades = {};
        }
        console.log(`[SpellCraftingModal] Debug: Dust=${player.magicDust}, Spells=${JSON.stringify(player.spellUpgrades)}`);
    }, [player]);

    // Update internal state if prop changes
    useEffect(() => {
        if (initialSpellId) setSelectedSpellId(initialSpellId);
    }, [initialSpellId]);

    // Ensure selected spell exists in registry
    const selectedSpell = useMemo(() => SPELL_LIST.find(s => s.id === selectedSpellId) || SPELL_LIST[0], [selectedSpellId]);

    // --- CATEGORY LOGIC ---
    const TALENT_CATEGORIES: Record<string, string> = {
        'scattercast': 'PROJECTILE',
        'thermal_drift': 'PROJECTILE',
        'living_fireball': 'PROJECTILE',
        'scorched_path': 'AREA',
        'delayed_detonation': 'AREA',
        'chain_explosion': 'AREA',
        'inferno_presence': 'AREA',
        'glass_cannon': 'SPECIAL',
        'run_and_gun': 'SPECIAL',
        'heartburst': 'SPECIAL',
        'default': 'SPECIAL'
    };

    const getCategory = (talentId: string) => TALENT_CATEGORIES[talentId] || 'SPECIAL';

    const [activeTab, setActiveTab] = useState<'PROJECTILE' | 'AREA' | 'SPECIAL'>('PROJECTILE');

    // --- TALENT FILTERING ---
    const allTalents = TALENT_REGISTRY[selectedSpellId] || [];
    const currentAllocations = player.spellTalents?.[selectedSpellId] || {};

    // Split into MAJOR (Big Slots) and AFFIXES (Small Chips)
    const majorTalents = allTalents.filter(t => !t.id.startsWith('affix_'));
    const affixTalents = allTalents.filter(t => t.id.startsWith('affix_'));

    // Active Majors
    const activeMajorIds = Object.keys(currentAllocations).filter(id =>
        currentAllocations[id] > 0 && !id.startsWith('affix_')
    );

    // Active Affixes
    // Actually, Affixes are also bought/upgraded.
    // The user wants "Affix Chips".
    // Let's list ALL available Affixes in the bottom section, and highlight active ones?
    // Or just show them as a list of buttons that you can buy/upgrade.

    // Filter Major for Drawer
    const availableMajors = majorTalents.filter(t => !activeMajorIds.includes(t.id));
    const filteredAvailableMajors = availableMajors.filter(t => getCategory(t.id) === activeTab);

    // Stats
    const currentLevel = player.spellUpgrades?.[selectedSpellId] || 1;
    const baseDmg = selectedSpell.baseStats.baseDamage + (currentLevel * selectedSpell.baseStats.damagePerLevel);
    const cooldown = selectedSpell.baseStats.cooldown;
    const radius = selectedSpell.baseStats.aoeRadius;

    // Dust
    const dust = player.magicDust || 0;
    const levelCost = currentLevel * 100;

    // --- RENDER HELPERS ---
    const renderTalentGridItem = (talent: any, isAffix: boolean) => {
        const currentRank = currentAllocations[talent.id] || 0;
        const isActive = activeMajorIds.includes(talent.id) || (isAffix && currentRank > 0);
        const isMax = currentRank >= talent.maxRank;

        // Cost
        const baseCost = isAffix ? 50 : 200;
        const upgradeCost = baseCost + (currentRank * (isAffix ? 25 : 150));
        const canAfford = dust >= upgradeCost;
        const isLocked = !isActive && activeMajorIds.length >= 3 && !isAffix;

        return (
            <button
                key={talent.id}
                onClick={() => (!isLocked || isActive) && canAfford && !isMax && onUpgradeTalent(selectedSpellId, talent.id)}
                disabled={(!isActive && isLocked) || !canAfford || isMax}
                className={`
                    relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                    ${isActive
                        ? 'bg-[#1c1917] border-[#d4b06c] shadow-[0_0_15px_rgba(212,176,108,0.15)]'
                        : 'bg-[#0c0a09] border-[#292524] hover:border-[#44403c]'}
                    ${isLocked ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                    ${!canAfford && !isMax ? 'opacity-70' : ''}
                    h-32 w-full
                `}
            >
                {/* Icon */}
                <div className={`text-3xl mb-3 transition-transform group-hover:scale-110 ${isActive ? 'text-[#e5d5ac]' : 'text-[#57534e]'}`}>
                    {talent.icon}
                </div>

                {/* Rank Pips */}
                <div className="flex gap-1 mb-2">
                    {Array.from({ length: talent.maxRank }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i < currentRank ? (isActive ? 'bg-[#d4b06c]' : 'bg-[#57534e]') : 'bg-[#1c1917] border border-[#292524]'}`}
                        />
                    ))}
                </div>

                {/* Name */}
                <div className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${isActive ? 'text-[#e5d5ac]' : 'text-[#78716c]'}`}>
                    {talent.name}
                </div>

                {/* Hover Cost / Info */}
                {!isMax && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl z-10 backdrop-blur-sm">
                        <div className="text-[#d4b06c] font-black text-lg">{upgradeCost}</div>
                        <div className="text-[9px] text-[#78716c] font-bold uppercase tracking-widest">Dust</div>
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="pointer-events-auto z-50 fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm font-sans select-none">
            {/* Main Window Frame */}
            <div className="w-[1200px] h-[850px] bg-[#050403] border border-[#292524] rounded-sm flex shadow-2xl relative overflow-hidden text-[#e7e5e4]">

                {/* === SIDEBAR === */}
                <div className="w-[280px] bg-[#0c0a09] border-r border-[#292524] flex flex-col">
                    <div className="p-6 border-b border-[#292524]">
                        <h2 className="text-[#a89068] font-black uppercase tracking-[0.2em] text-xs mb-4">Spell Mastery</h2>
                        {/* Search Placeholder */}
                        <div className="bg-[#14120f] border border-[#292524] rounded px-3 py-2 text-xs text-[#57534e] flex items-center gap-2">
                            <span>🔍</span>
                            <span>Search Spells...</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {SPELL_LIST.filter(spell => player.knownSpells?.includes(spell.id as SpellType)).map(spell => {
                            const isSelected = selectedSpellId === spell.id;
                            const upgradeLvl = player.spellUpgrades?.[spell.id] || 1;

                            return (
                                <button
                                    key={spell.id}
                                    onClick={() => setSelectedSpellId(spell.id as SpellType)}
                                    className={`
                                        w-full p-3 rounded flex items-center gap-4 transition-all border-l-2
                                        ${isSelected
                                            ? 'bg-[#1c1917] border-[#d4b06c] text-[#e5d5ac]'
                                            : 'bg-transparent border-transparent text-[#57534e] hover:bg-[#14120f] hover:text-[#a8a29e]'}
                                    `}
                                >
                                    <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-inner
                                        ${isSelected ? 'bg-[#0c0a09] shadow-black/50' : 'bg-[#14120f]'}
                                    `}>
                                        {spell.icon ? <img src={spell.icon} className="w-6 h-6 object-contain opacity-80" /> : "✨"}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-sm uppercase tracking-wide">{spell.name}</div>
                                        {/* Status Line */}
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-mono ${isSelected ? 'text-[#d4b06c]' : 'text-[#44403c]'}`}>LV {upgradeLvl}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* === MAIN CONTENT === */}
                <div className="flex-1 flex flex-col bg-[#080706] relative bg-[url('/assets/ui/noise.png')] bg-opacity-5">

                    {/* Header Bar */}
                    <div className="h-14 flex items-center justify-between px-8 border-b border-[#292524]">
                        <div className="flex items-center gap-4">
                            <span className="text-[#a89068] font-bold text-xs tracking-widest">MAGIC DUST <span className="text-[#ffdb73] text-sm ml-1">{dust}</span></span>
                            <span className="text-[#292524]">|</span>
                            {/* MARKER V2 */}
                            <span className="text-[#57534e] font-bold text-xs tracking-widest uppercase">{selectedSpell.school} FORGE V2</span>
                        </div>
                        <button onClick={onClose} className="text-[#57534e] hover:text-[#e5d5ac] text-xs font-bold tracking-widest transition-colors">CLOSE</button>
                    </div>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col items-center">

                        {/* 1. HERO SECTION (Circle + Stats) */}
                        <div className="flex flex-col items-center mb-12 w-full max-w-2xl">

                            {/* Circle */}
                            <div className="relative w-32 h-32 mb-6 group">
                                {/* Rings */}
                                <div className="absolute inset-0 rounded-full border-2 border-[#292524]"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-[#d4b06c] border-t-transparent animate-spin-slow opacity-20"></div>

                                {/* Inner Content */}
                                <div className="absolute inset-2 bg-[#0c0a09] rounded-full flex flex-col items-center justify-center shadow-lg border border-[#292524]">
                                    {selectedSpell.icon ? <img src={selectedSpell.icon} className="w-12 h-12 object-contain mb-1" /> : <span className="text-3xl">🔮</span>}
                                </div>

                                {/* Level Badge */}
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#d4b06c] text-[#0c0a09] px-3 py-1 rounded text-xs font-black uppercase tracking-wider shadow-lg border-2 border-[#0c0a09]">
                                    LV {currentLevel}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-center gap-12 w-full mb-8">
                                <div className="flex flex-col items-center">
                                    <span className="text-[#57534e] text-[9px] font-bold uppercase tracking-widest mb-1">Damage</span>
                                    <span className="text-[#e5d5ac] font-mono text-lg font-bold">{Math.round(baseDmg)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[#57534e] text-[9px] font-bold uppercase tracking-widest mb-1">Cooldown</span>
                                    <span className="text-[#e5d5ac] font-mono text-lg font-bold">{cooldown}s</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[#57534e] text-[9px] font-bold uppercase tracking-widest mb-1">Radius</span>
                                    <span className="text-[#e5d5ac] font-mono text-lg font-bold">{radius}m</span>
                                </div>
                            </div>

                            {/* Level Up Button */}
                            <button
                                onClick={() => (dust >= levelCost) && onUpgradeSpell(selectedSpellId)}
                                disabled={dust < levelCost}
                                className={`
                                    bg-[#1c1917] border border-[#44403c] rounded-full px-8 py-3 flex items-center gap-3 transition-all
                                    ${dust >= levelCost
                                        ? 'hover:border-[#d4b06c] hover:bg-[#292524] hover:shadow-[0_0_20px_rgba(212,176,108,0.1)] group'
                                        : 'opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <span className="text-[#a89068] font-bold text-xs tracking-widest uppercase group-hover:text-[#e5d5ac]">Level Up Spell</span>
                                <span className="w-1 h-1 bg-[#44403c] rounded-full"></span>
                                <span className="text-[#d4b06c] font-black text-xs">{levelCost} Dust</span>
                            </button>
                        </div>


                        {/* 2. TALENTS CHECKBOX GRID (The "Look" of the user image) */}
                        {/* 
                           The user image showed a 3x3 grid. 
                           I will render ACTIVE slots prominently, then the rest. 
                           Or better: I will render ALL Major talents in a grid, and HIGHLIGHT the active ones.
                           This matches the user's "Selection" mental model better than separate slots.
                        */}
                        <div className="w-full max-w-3xl">
                            {/* Tabs for categories (still useful even if grid) */}
                            <div className="flex justify-center gap-8 mb-8 border-b border-[#292524]">
                                {['PROJECTILE', 'AREA', 'SPECIAL'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 -mb-0.5 ${activeTab === tab ? 'text-[#e5d5ac] border-[#d4b06c]' : 'text-[#57534e] border-transparent hover:text-[#a8a29e]'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Grid of Majors */}
                            <div className="grid grid-cols-4 gap-4 mb-12">
                                {filteredAvailableMajors.concat(
                                    // Also show active ones that match this category? 
                                    // Actually, let's just show *ALL* majors for this tab.
                                    majorTalents.filter(t => getCategory(t.id) === activeTab)
                                ).filter((t, index, self) =>
                                    // Dedupe because I concatenated available + all
                                    index === self.findIndex((t2) => t2.id === t.id)
                                ).map(talent => renderTalentGridItem(talent, false))}

                                {filteredAvailableMajors.length === 0 && majorTalents.filter(t => getCategory(t.id) === activeTab).length === 0 && (
                                    <div className="col-span-4 py-8 text-center text-[#292524] uppercase font-bold text-xs tracking-widest">
                                        No talents in this category
                                    </div>
                                )}
                            </div>

                            {/* Affixes Section */}
                            <div className="border-t border-[#292524] pt-8">
                                <h3 className="text-[#57534e] text-center text-[10px] font-black uppercase tracking-[0.2em] mb-6">Affix Modifications</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {affixTalents.map(talent => renderTalentGridItem(talent, true))}
                                    {affixTalents.length === 0 && <span className="col-span-5 text-center text-[#292524] text-xs">No Affixes</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. LIVE PREVIEW FOOTER */}
                    <div className="h-16 bg-[#0c0a09] border-t border-[#292524] flex items-center justify-between px-8 z-10 box-border">
                        <div className="flex flex-col">
                            <span className="text-[#44403c] font-bold text-[9px] uppercase tracking-widest mb-1">Live Preview</span>
                            <div className="flex items-center gap-2 text-xs text-[#a8a29e]">
                                {/* Dynamic Text based on actives */}
                                {activeMajorIds.length > 0 ? (
                                    activeMajorIds.map((id, i) => {
                                        const t = allTalents.find(t => t.id === id);
                                        return (
                                            <span key={id} className="flex items-center gap-2">
                                                {i > 0 && <span className="text-[#292524]">•</span>}
                                                <span className="font-bold text-[#e5d5ac]">{t?.name}</span>
                                            </span>
                                        );
                                    })
                                ) : (
                                    <span className="text-[#44403c] italic">No behaviors modified</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="text-[#57534e] hover:text-[#a8a29e] text-[10px] font-bold uppercase tracking-widest px-4 py-2">Refund All</button>
                            <button
                                onClick={onClose}
                                className="bg-[#d4b06c] hover:bg-[#ffe082] text-black text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-sm shadow-lg transition-all"
                            >
                                Confirm Build
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};