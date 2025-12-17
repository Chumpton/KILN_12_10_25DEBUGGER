import React from 'react';
import { Quest } from '../../types';

interface QuestPanelProps {
    activeQuest: Quest;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({ activeQuest }) => {
    const questPercent = Math.min(100, Math.max(0, (activeQuest.current / activeQuest.target) * 100));

    return (
        <div className="bg-black/80 border border-yellow-700/50 p-2 rounded pointer-events-auto w-64 shadow-lg">
            <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">Current Quest</h3>
            <div className="text-white font-bold text-sm mb-1">{activeQuest.description}</div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-yellow-500" style={{ width: `${questPercent}%` }}></div>
            </div>
            <div className="text-[10px] text-gray-400 text-right">{activeQuest.current} / {activeQuest.target}</div>
        </div>
    );
};