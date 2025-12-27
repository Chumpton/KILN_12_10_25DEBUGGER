import React from 'react';
import { SpellDefinition } from '../../../../types';

interface LibraryPanelProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    onBack: () => void;
    onSave: () => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;

    // Mode Switching
    mode: 'ANIMATIONS' | 'SPELLS';
    onModeChange: (m: 'ANIMATIONS' | 'SPELLS') => void;

    // Animations
    animations: Record<string, any>;
    selectedAnim: string;
    onSelectAnim: (k: string) => void;

    // Spells
    spells?: Record<string, SpellDefinition>;
    selectedSpellId?: string;
    onSelectSpell?: (k: string) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
    collapsed, setCollapsed, onBack, onSave,
    searchTerm, setSearchTerm,
    mode, onModeChange,
    animations, selectedAnim, onSelectAnim,
    spells, selectedSpellId, onSelectSpell
}) => {
    // Filter logic
    const list = mode === 'ANIMATIONS' ? Object.keys(animations) : Object.keys(spells || {});
    const filtered = list.filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className={`border-r border-[#3f3f46] bg-[#27272a] flex flex-col transition-all duration-300 ${collapsed ? 'w-12' : 'w-72'}`}>
            <div className="p-4 border-b border-[#3f3f46] flex items-center justify-between">
                {!collapsed && (
                    <div className="flex gap-2 text-xs font-bold">
                        <button
                            onClick={() => onModeChange('SPELLS')}
                            className={`px-2 py-1 rounded ${mode === 'SPELLS' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            SPELLS
                        </button>
                        <button
                            onClick={() => onModeChange('ANIMATIONS')}
                            className={`px-2 py-1 rounded ${mode === 'ANIMATIONS' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            ANIMS
                        </button>
                    </div>
                )}
                <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-[#3f3f46] rounded text-zinc-400">
                    {collapsed ? '»' : '«'}
                </button>
            </div>

            {!collapsed && (
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex gap-2 mb-4">
                        <button onClick={onBack} className="flex-1 py-2 bg-[#3f3f46] hover:bg-[#52525b] text-xs font-bold rounded">
                            ← EXIT
                        </button>
                        <button onClick={onSave} className="flex-1 py-2 bg-blue-800/50 hover:bg-blue-800/80 border border-blue-600 text-blue-200 text-xs font-bold rounded">
                            SAVE ALL
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder={`Search ${mode.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#18181b] border border-[#52525b] rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        {filtered.map(key => {
                            const isSelected = mode === 'ANIMATIONS' ? (selectedAnim === key) : (selectedSpellId === key);

                            return (
                                <button
                                    key={key}
                                    onClick={() => mode === 'ANIMATIONS' ? onSelectAnim(key) : onSelectSpell?.(key)}
                                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${isSelected ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-[#3f3f46] text-zinc-400'}`}
                                >
                                    {key}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
