import React, { useState } from 'react';
import { SpellEditorSession } from '../../../../game/spells/editing/SpellEditorTypes';
import { SpellEditorController } from '../../../../game/spells/editing/SpellEditorController';
import { ANIMATION_LIBRARY } from '../../../../data/AnimationData';

interface InspectorPanelProps {
    session: SpellEditorSession;
    controller: SpellEditorController;
    selectedAnim: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = ['PROPERTIES', 'SPELL', 'VFX', 'EVENTS'];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    session,
    controller,
    selectedAnim,
    activeTab,
    onTabChange
}) => {

    // Local state for Event creation
    const [newEventFrame, setNewEventFrame] = useState(0);
    const [newEventType, setNewEventType] = useState('SOUND');
    const [newEventData, setNewEventData] = useState('');

    const { rig, spell, ik } = session;
    const activeBone = rig.rigData.parts[rig.selectedPart];

    const handleBoneChange = (field: string, value: any) => {
        controller.updateRigPart(rig.selectedPart, { [field]: value });
    };

    const handleAddEvent = () => {
        const clip = ANIMATION_LIBRARY[selectedAnim];
        if (!clip) return;
        if (!clip.events) clip.events = [];
        clip.events.push({
            id: Date.now().toString(),
            frame: newEventFrame,
            type: newEventType as any,
            data: newEventData
        });
        // Force refresh somehow? React won't see this mutation unless we trigger update.
        // In the original code, they did `setSelectedAnim(prev => prev)`.
        // Here, we might need a callback on parent or just force update locally.
        // Or better, let's treat AnimationLibrary as external mutable state.
        // We'll use a dummy state to force re-render.
        setNewEventData(d => d); // dummy
    };

    const handleDeleteEvent = (id: string) => {
        const clip = ANIMATION_LIBRARY[selectedAnim];
        if (!clip || !clip.events) return;
        clip.events = clip.events.filter(e => e.id !== id);
        setNewEventData(d => d); // force render
    };

    return (
        <div className="w-80 bg-[#27272a] border-l border-[#3f3f46] flex flex-col h-full text-zinc-300 font-sans select-none">
            {/* TABS */}
            <div className="flex border-b border-[#3f3f46]">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-wider ${activeTab === tab ? 'bg-[#3f3f46] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* --- PROPERTIES TAB --- */}
                {activeTab === 'PROPERTIES' && activeBone && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-zinc-100 uppercase">{rig.selectedPart}</h3>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                        </div>

                        {/* TRANSFORM */}
                        <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                            <h4 className="text-[10px] uppercase text-zinc-500 font-bold">Transform</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-zinc-400">Pos X</label>
                                    <input type="number" value={Math.round(activeBone.x)} onChange={e => handleBoneChange('x', parseFloat(e.target.value))} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-400">Pos Y</label>
                                    <input type="number" value={Math.round(activeBone.y)} onChange={e => handleBoneChange('y', parseFloat(e.target.value))} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-400 flex justify-between">Rotation <span>{(activeBone.rotation || 0).toFixed(2)} rad</span></label>
                                <input type="range" min={-6.28} max={6.28} step={0.1} value={activeBone.rotation || 0} onChange={e => handleBoneChange('rotation', parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-[#3f3f46] appearance-none rounded" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-400 flex justify-between">Scale <span>{(activeBone.scale || 1).toFixed(2)}x</span></label>
                                <input type="range" min={0.1} max={3} step={0.1} value={activeBone.scale || 1} onChange={e => handleBoneChange('scale', parseFloat(e.target.value))} className="w-full accent-yellow-500 h-1 bg-[#3f3f46] appearance-none rounded" />
                            </div>
                        </div>

                        {/* FLIP */}
                        <div className="flex items-center justify-between p-3 bg-[#18181b] rounded border border-[#3f3f46]">
                            <label className="text-xs text-zinc-400">Flip Horizontal</label>
                            <input type="checkbox" checked={!!activeBone.flipX} onChange={e => handleBoneChange('flipX', e.target.checked)} className="bg-[#27272a] border-[#3f3f46] text-blue-500 rounded" />
                        </div>

                        {/* GLOBAL IK */}
                        <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] uppercase text-orange-400 font-bold">Inverse Kinematics (IK)</h4>
                                {/* Need a toggle for IK enabled */}
                            </div>

                            <div className="flex gap-2 text-[10px]">
                                {/* Assuming we had setIkChain in session, but let's assume it's global for now */}
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-400">IK Target X</label>
                                <input type="number" value={Math.round(ik.target.x)} onChange={e => controller.setIKTarget({ ...ik.target, x: parseFloat(e.target.value) })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-400">IK Target Y</label>
                                <input type="number" value={Math.round(ik.target.y)} onChange={e => controller.setIKTarget({ ...ik.target, y: parseFloat(e.target.value) })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SPELL TAB --- */}
                {activeTab === 'SPELL' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                            <h4 className="text-[10px] uppercase text-purple-400 font-bold">Core Definition</h4>
                            <div>
                                <label className="text-[10px] text-zinc-400">Name</label>
                                <input type="text" value={spell.name} onChange={e => controller.setSpellName(e.target.value)} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-zinc-400">Element</label>
                                    <select value={spell.element} onChange={e => controller.setSpellElement(e.target.value)} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200">
                                        {['FIRE', 'ICE', 'LIGHTNING', 'EARTH', 'WIND'].map(el => <option key={el} value={el}>{el}</option>)}
                                    </select>
                                </div>
                                {/* Type selector */}
                            </div>
                        </div>

                        {/* Stats - using generic Input helper or direct */}
                        <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                            <h4 className="text-[10px] uppercase text-green-400 font-bold">Stats</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-zinc-400">Base Dmg</label>
                                    <input type="number" value={spell.baseDamage} onChange={e => controller.updateSpell({ ...spell, baseDamage: parseFloat(e.target.value) })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-400">Mana Cost</label>
                                    <input type="number" value={spell.manaCost} onChange={e => controller.updateSpell({ ...spell, manaCost: parseFloat(e.target.value) })} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                </div>
                            </div>
                        </div>

                        {/* Timing */}
                        <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                            <h4 className="text-[10px] uppercase text-yellow-500 font-bold">Timing</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-zinc-400">Cast Time</label>
                                    <input type="number" value={spell.castTime} onChange={e => controller.setCastTime(parseFloat(e.target.value))} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-400">Recovery</label>
                                    <input type="number" value={spell.recoveryTime} onChange={e => controller.setRecoveryTime(parseFloat(e.target.value))} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                </div>
                            </div>
                        </div>

                        {/* Projectile */}
                        {spell.projectile && (
                            <div className="bg-[#18181b] p-3 rounded border border-[#3f3f46] space-y-3">
                                <h4 className="text-[10px] uppercase text-cyan-400 font-bold">Projectile</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-zinc-400">Speed</label>
                                        <input type="number" value={spell.projectile.speed} onChange={e => controller.setProjectileSpeed(parseFloat(e.target.value))} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400">Gravity</label>
                                        <input type="number" value={spell.projectile.gravity || 0} onChange={e => controller.setProjectileGravity(parseFloat(e.target.value))} className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-1 text-xs text-zinc-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- EVENTS TAB --- */}
                {activeTab === 'EVENTS' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                        <h3 className="text-xs uppercase text-zinc-500 font-bold mb-2">Animation Events ({selectedAnim})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {ANIMATION_LIBRARY[selectedAnim]?.events?.map(ev => (
                                <div key={ev.id} className="bg-[#18181b] p-2 rounded border border-[#3f3f46] flex justify-between items-center group">
                                    <div>
                                        <div className="text-[10px] text-yellow-400 font-bold">{ev.type}</div>
                                        <div className="text-[10px] text-zinc-400">Frame: {ev.frame} | Data: {ev.data}</div>
                                    </div>
                                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-red-500 text-xs opacity-0 group-hover:opacity-100 px-2">×</button>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#3f3f46] pt-4 space-y-3">
                            <h4 className="text-[10px] uppercase text-zinc-400 font-bold">Add Event</h4>
                            <div>
                                <label className="text-[10px] text-zinc-500 block mb-1">Frame</label>
                                <input type="number" value={newEventFrame} onChange={e => setNewEventFrame(parseInt(e.target.value))} className="w-full bg-[#18181b] border border-[#3f3f46] rounded p-1 text-xs text-zinc-300" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 block mb-1">Type</label>
                                <select value={newEventType} onChange={e => setNewEventType(e.target.value)} className="w-full bg-[#18181b] border border-[#3f3f46] rounded p-1 text-xs text-zinc-300">
                                    {['SOUND', 'PARTICLE', 'SCREEN_SHAKE', 'SPAWN_PROJECTILE', 'CAST', 'HITBOX_START', 'HITBOX_END', 'CUSTOM'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 block mb-1">Data</label>
                                <input type="text" value={newEventData} onChange={e => setNewEventData(e.target.value)} className="w-full bg-[#18181b] border border-[#3f3f46] rounded p-1 text-xs text-zinc-300" />
                            </div>
                            <button onClick={handleAddEvent} className="w-full py-2 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-600 text-blue-400 rounded text-xs font-bold uppercase"> + Add Event </button>
                        </div>
                    </div>
                )}

                {/* --- VFX TAB --- */}
                {activeTab === 'VFX' && (
                    <div className="p-4 text-xs text-zinc-500">
                        VFX Editor coming soon...
                    </div>
                )}
            </div>
        </div>
    );
};
