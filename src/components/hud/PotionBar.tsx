import React from 'react';
import { Player } from '../../types';
import { POTION_CONFIG } from '../../constants';

interface PotionBarProps {
    player: Player;
    onUsePotion: (type: 'health' | 'mana' | 'speed') => void;
}

export const PotionBar: React.FC<PotionBarProps> = ({ player, onUsePotion }) => {
    return (
        <div className="flex flex-col-reverse gap-4 pointer-events-auto items-center pb-2">
            {/* Health Potion */}
            <div
                className="relative cursor-pointer transition-all transform hover:scale-110 active:scale-95 group"
                onClick={() => onUsePotion('health')}
                title="Health Potion (1)"
            >
                <img src="ui/potions/potion_health.png" className="w-10 h-12 object-contain drop-shadow-md pixelated" alt="Health" />

                <div className="absolute -top-1 -right-2 bg-red-950 border border-red-700 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-20">
                    {player.potions.health}
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-1 rounded">
                    [1]
                </div>
            </div>

            {/* Mana Potion */}
            <div
                className="relative cursor-pointer transition-all transform hover:scale-110 active:scale-95 group"
                onClick={() => onUsePotion('mana')}
                title="Mana Potion (2)"
            >
                <img src="ui/potions/potion_mana.png" className="w-10 h-12 object-contain drop-shadow-md pixelated" alt="Mana" />

                <div className="absolute -top-1 -right-2 bg-blue-950 border border-blue-700 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-20">
                    {player.potions.mana}
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-1 rounded">
                    [2]
                </div>
            </div>

            {/* Speed Potion */}
            <div
                className="relative cursor-pointer transition-all transform hover:scale-110 active:scale-95 group"
                onClick={() => onUsePotion('speed')}
                title="Speed Potion (3)"
            >
                <img src="ui/potions/potion_speed.png" className="w-12 h-12 drop-shadow-md pixelated" alt="Speed" />

                <div className="absolute -top-1 -right-2 bg-green-950 border border-green-700 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-20">
                    {player.potions.speed}
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-1 rounded">
                    [3]
                </div>
            </div>
        </div>
    );
};