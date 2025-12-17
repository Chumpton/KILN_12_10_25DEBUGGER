import React from 'react';
import { Player } from '../../types';

interface MenuRackProps {
    player: Player;
    toggleWindow: (window: 'spells' | 'stats' | 'inventory' | 'spellbook' | 'shop') => void;
    onToggleMount: () => void;
}

export const MenuRack: React.FC<MenuRackProps> = ({ player, toggleWindow, onToggleMount }) => {
    // This creates a solid black stroke effect around the emoji
    const strokeStyle = {
        textShadow: `
            2px 0 #000, -2px 0 #000, 
            0 2px #000, 0 -2px #000, 
            1px 1px #000, -1px -1px #000, 
            1px -1px #000, -1px 1px #000
        `
    };

    return (
        <div className="flex gap-6 pointer-events-auto p-4 items-center">
            {/* Spellbook */}
            <button
                onClick={() => toggleWindow('spellbook')}
                title="Spellbook"
                className={`transition-transform duration-200 hover:scale-125 active:scale-95 focus:outline-none relative ${player.spellPoints && player.spellPoints > 0 ? 'animate-pulse drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : ''}`}
            >
                <img
                    src="/assets/icons/spellbook.png"
                    alt="Spellbook"
                    className="w-16 h-16 object-contain filter drop-shadow-xl block select-none"
                />


            </button>

            {/* Talents/Spells */}
            <button
                onClick={() => toggleWindow('spells')}
                title="Talents"
                className="transition-transform duration-200 hover:scale-125 active:scale-95 focus:outline-none"
            >
                <img
                    src="/assets/icons/talents.png"
                    alt="Talents"
                    className="w-20 h-20 object-contain filter drop-shadow-xl block select-none"
                />
            </button>

            {/* Stats */}
            <button
                onClick={() => toggleWindow('stats')}
                title="Stats"
                className={`transition-transform duration-200 hover:scale-125 active:scale-95 focus:outline-none ${player.statPoints > 0 ? 'animate-bounce' : ''
                    }`}
            >
                <img
                    src="/assets/icons/stats.png"
                    alt="Stats"
                    className="w-16 h-16 object-contain filter drop-shadow-xl block select-none"
                />
            </button>

            {/* Inventory */}
            <button
                onClick={() => toggleWindow('inventory')}
                title="Inventory"
                className="transition-transform duration-200 hover:scale-125 active:scale-95 focus:outline-none"
            >
                <img
                    src="/assets/icons/backpack.png"
                    alt="Inventory"
                    className="w-16 h-16 object-contain filter drop-shadow-xl block select-none"
                />
            </button>

            {/* Mount */}
            <button
                onClick={onToggleMount}
                title="Mount (O)"
                className="transition-transform duration-200 hover:scale-125 active:scale-95 focus:outline-none"
            >
                <span
                    style={strokeStyle}
                    className={`text-6xl filter contrast-125 drop-shadow-xl block select-none ${player.isMounted ? 'brightness-125 sepia-0' : ''}`}
                    role="img"
                    aria-label="Mount"
                >
                    🐴
                </span>
            </button>
        </div>
    );
};