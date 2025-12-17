import React from 'react';

interface LibraryPanelProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    onBack: () => void;
    onSave: () => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    animations: Record<string, any>;
    selectedAnim: string;
    onSelectAnim: (k: string) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
    collapsed, setCollapsed, onBack, onSave,
    searchTerm, setSearchTerm, animations, selectedAnim, onSelectAnim
}) => {
    // Filter logic
    const filteredAnims = Object.keys(animations).filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className={`border-r border-[#3f3f46] bg-[#27272a] flex flex-col transition-all duration-300 ${collapsed ? 'w-12' : 'w-72'}`}>
            <div className="p-4 border-b border-[#3f3f46] flex items-center justify-between">
                {!collapsed && <h2 className="font-bold text-zinc-100 uppercase tracking-widest text-sm">Library</h2>}
                <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-[#3f3f46] rounded">
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
                            placeholder="Search animations..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#18181b] border border-[#52525b] rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        {filteredAnims.map(key => (
                            <button
                                key={key}
                                onClick={() => onSelectAnim(key)}
                                className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${selectedAnim === key ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-[#3f3f46] text-zinc-400'}`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
