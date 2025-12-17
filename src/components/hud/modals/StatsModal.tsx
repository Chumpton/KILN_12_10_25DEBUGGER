import React from 'react';
import { Player } from '../../../types';

interface StatsModalProps {
    player: Player;
    onUpgradeBaseStat: (stat: 'vitality' | 'power' | 'haste' | 'swiftness') => void;
    onClose: () => void;
    isPaused: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({ player, onUpgradeBaseStat, onClose, isPaused }) => {
    return (
        <div className="pointer-events-auto z-40" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            <div className="bg-[#0c0a09] border-[3px] border-[#4a3f35] rounded-lg p-6 w-[280px] shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
                {!isPaused && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-50 w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-900 border border-red-400 shadow-[0_0_5px_red] hover:scale-110 transition-transform cursor-pointer"
                    />
                )}
                <h2 className="text-xl text-[#d4c5a3] font-bold mb-4 text-center border-b border-[#292524] pb-2 uppercase tracking-widest">Attributes</h2>

                <div className="mb-4 text-center text-[#a89068] text-sm">
                    Points: <span className="text-[#e5d5ac] font-bold text-lg ml-2">{player.statPoints}</span>
                </div>

                <div className="space-y-3">
                    {/* Vitality */}
                    <div className="flex justify-between items-center bg-[#141210] p-3 rounded border border-[#3d342b]">
                        <div>
                            <div className="text-[#d4c5a3] font-bold uppercase tracking-wide text-xs flex items-center gap-2"><span className="text-xl">❤️</span> Vitality</div>
                            <div className="text-[10px] text-[#57534e] ml-7">Rank {player.baseStats.vitality}</div>
                        </div>
                        <button
                            disabled={player.statPoints === 0}
                            onClick={() => onUpgradeBaseStat('vitality')}
                            className="bg-[#1c1917] disabled:bg-[#0f0e0d] disabled:opacity-50 hover:bg-[#292524] text-[#a89068] w-6 h-6 rounded border border-[#4a3f35] font-bold shadow text-xs transition-colors"
                        >
                            +
                        </button>
                    </div>

                    {/* Power */}
                    <div className="flex justify-between items-center bg-[#141210] p-3 rounded border border-[#3d342b]">
                        <div>
                            <div className="text-[#d4c5a3] font-bold uppercase tracking-wide text-xs flex items-center gap-2"><span className="text-xl">⚔️</span> Power</div>
                            <div className="text-[10px] text-[#57534e] ml-7">Rank {player.baseStats.power}</div>
                        </div>
                        <button
                            disabled={player.statPoints === 0}
                            onClick={() => onUpgradeBaseStat('power')}
                            className="bg-[#1c1917] disabled:bg-[#0f0e0d] disabled:opacity-50 hover:bg-[#292524] text-[#a89068] w-6 h-6 rounded border border-[#4a3f35] font-bold shadow text-xs transition-colors"
                        >
                            +
                        </button>
                    </div>

                    {/* Haste */}
                    <div className="flex justify-between items-center bg-[#141210] p-3 rounded border border-[#3d342b]">
                        <div>
                            <div className="text-[#d4c5a3] font-bold uppercase tracking-wide text-xs flex items-center gap-2"><span className="text-xl">⚡</span> Haste</div>
                            <div className="text-[10px] text-[#57534e] ml-7">Rank {player.baseStats.haste}</div>
                        </div>
                        <button
                            disabled={player.statPoints === 0}
                            onClick={() => onUpgradeBaseStat('haste')}
                            className="bg-[#1c1917] disabled:bg-[#0f0e0d] disabled:opacity-50 hover:bg-[#292524] text-[#a89068] w-6 h-6 rounded border border-[#4a3f35] font-bold shadow text-xs transition-colors"
                        >
                            +
                        </button>
                    </div>

                    {/* Swiftness */}
                    <div className="flex justify-between items-center bg-[#141210] p-3 rounded border border-[#3d342b]">
                        <div>
                            <div className="text-[#d4c5a3] font-bold uppercase tracking-wide text-xs flex items-center gap-2"><span className="text-xl">👢</span> Swiftness</div>
                            <div className="text-[10px] text-[#57534e] ml-7">Rank {player.baseStats.swiftness}</div>
                        </div>
                        <button
                            disabled={player.statPoints === 0}
                            onClick={() => onUpgradeBaseStat('swiftness')}
                            className="bg-[#1c1917] disabled:bg-[#0f0e0d] disabled:opacity-50 hover:bg-[#292524] text-[#a89068] w-6 h-6 rounded border border-[#4a3f35] font-bold shadow text-xs transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};