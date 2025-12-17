import React from 'react';
import { SpellDefinition, SpellElement, ProjectileDefinition } from '../../types';

interface InspectorPanelProps {
    activeTab: string; // 'RIG' | 'SPELL' | 'VFX'
    setActiveTab: (t: string) => void;

    currentSpell: SpellDefinition;
    setCurrentSpell: (s: SpellDefinition) => void;

    rigData: any;
    setRigData: (d: any) => void;
    selectedPart: string;
    // selectedPart is used for RIG tab

    // IK
    ikEnabled: boolean;
    setIkEnabled: (v: boolean) => void;
    ikTarget: { x: number, y: number };
    setIkTarget: (v: { x: number, y: number }) => void;
    ikChain: 'LEFT' | 'RIGHT';
    setIkChain: (v: 'LEFT' | 'RIGHT') => void;

    // Timing
    castTime: number;
    recoveryTime: number;
    cooldown: number;
    releaseAt: number;
    setReleaseAt: (v: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    activeTab, setActiveTab, currentSpell, setCurrentSpell,
    rigData, setRigData, selectedPart,
    ikEnabled, setIkEnabled, ikTarget, setIkTarget, ikChain, setIkChain,
    castTime, recoveryTime, cooldown, releaseAt, setReleaseAt
}) => {

    const renderSpellTab = () => (
        <div className="space-y-4">
            {/* Core Config */}
            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                <h4 className="text-[10px] uppercase text-purple-400 font-bold">Core</h4>
                <div>
                    <label className="text-[10px] text-zinc-400">Name</label>
                    <input type="text" value={currentSpell.name} onChange={e => setCurrentSpell({ ...currentSpell, name: e.target.value })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                </div>
                <div>
                    <label className="text-[10px] text-zinc-400">Element</label>
                    <select value={currentSpell.element} onChange={e => setCurrentSpell({ ...currentSpell, element: e.target.value as any, spellKey: e.target.value as any })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200">
                        {['FIRE', 'ICE', 'LIGHTNING', 'EARTH', 'WIND'].map(el => <option key={el} value={el}>{el}</option>)}
                    </select>
                </div>
            </div>

            {/* Timing */}
            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                <h4 className="text-[10px] uppercase text-yellow-500 font-bold">Timing</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-zinc-400">Cast (ms)</label>
                        <input type="number" value={currentSpell.castTime} onChange={e => setCurrentSpell({ ...currentSpell, castTime: parseFloat(e.target.value) })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-400">Recov (ms)</label>
                        <input type="number" value={currentSpell.recoveryTime} onChange={e => setCurrentSpell({ ...currentSpell, recoveryTime: parseFloat(e.target.value) })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-zinc-400">Release @ {Math.round(releaseAt * 100)}%</label>
                    <input type="range" min="0" max="1" step="0.01" value={releaseAt} onChange={e => setReleaseAt(parseFloat(e.target.value))} className="w-full h-1 bg-[#3f3f46] accent-yellow-500 appearance-none rounded" />
                </div>
            </div>

            {/* Projectile Config */}
            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                <h4 className="text-[10px] uppercase text-blue-400 font-bold">Projectile</h4>
                {currentSpell.projectile && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-zinc-400">Speed</label>
                                <input type="number" value={currentSpell.projectile.speed} onChange={e => setCurrentSpell({ ...currentSpell, projectile: { ...currentSpell.projectile!, speed: parseFloat(e.target.value) } })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-400">Gravity</label>
                                <input type="number" value={currentSpell.projectile.gravity || 0} onChange={e => setCurrentSpell({ ...currentSpell, projectile: { ...currentSpell.projectile!, gravity: parseFloat(e.target.value) } })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-400">Type</label>
                            <select value={currentSpell.projectile.type} onChange={e => setCurrentSpell({ ...currentSpell, projectile: { ...currentSpell.projectile!, type: e.target.value as any } })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200">
                                {['STRAIGHT', 'LOBBED', 'HOMING', 'RETURN'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderRigTab = () => (
        <div className="space-y-4">
            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                <h4 className="text-[10px] uppercase text-orange-400 font-bold">Inverse Kinematics</h4>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">Enable IK</span>
                    <input type="checkbox" checked={ikEnabled} onChange={e => setIkEnabled(e.target.checked)} className="accent-orange-500" />
                </div>
                {ikEnabled && (
                    <div className="flex gap-2">
                        <button onClick={() => setIkChain('LEFT')} className={`flex-1 py-1 text-[10px] border ${ikChain === 'LEFT' ? 'border-orange-500 text-orange-400' : 'border-zinc-700 text-zinc-500'}`}>LEFT</button>
                        <button onClick={() => setIkChain('RIGHT')} className={`flex-1 py-1 text-[10px] border ${ikChain === 'RIGHT' ? 'border-orange-500 text-orange-400' : 'border-zinc-700 text-zinc-500'}`}>RIGHT</button>
                    </div>
                )}
            </div>

            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                <h4 className="text-[10px] uppercase text-green-400 font-bold">Selected Part: {selectedPart}</h4>
                {rigData.parts[selectedPart] && (
                    <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400">Rotation</label>
                        <input type="range" min="0" max="6.28" step="0.1" value={rigData.parts[selectedPart].rotation || 0} onChange={e => {
                            const p = rigData.parts[selectedPart];
                            setRigData({ ...rigData, parts: { ...rigData.parts, [selectedPart]: { ...p, rotation: parseFloat(e.target.value) } } });
                        }} className="w-full h-1 bg-[#3f3f46] accent-green-500 appearance-none rounded" />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-72 bg-[#27272a] border-l border-[#3f3f46] flex flex-col">
            <div className="flex border-b border-[#3f3f46]">
                {['RIG', 'SPELL', 'VFX'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest ${activeTab === tab ? 'bg-[#3f3f46] text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'SPELL' && renderSpellTab()}
                {activeTab === 'RIG' && renderRigTab()}
                {activeTab === 'VFX' && <div className="text-zinc-500 text-xs italic text-center mt-10">VFX Editor Placeholder</div>}
            </div>
        </div>
    );
};
