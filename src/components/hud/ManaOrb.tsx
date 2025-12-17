import React from 'react';
import { Player } from '../../types';

interface ManaOrbProps {
    player: Player;
}

export const ManaOrb: React.FC<ManaOrbProps> = ({ player }) => {
    const manaPercent = Math.max(0, (player.mana / player.maxMana) * 100);

    return (
        <div className="relative w-32 h-32 z-20 pointer-events-auto group">
            {/* Liquid Background/Fill */}
            <div className="absolute inset-1 rounded-full bg-black overflow-hidden ring-1 ring-black/50">
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-950 via-blue-600 to-blue-500 transition-all duration-300 ease-out"
                    style={{ height: `${manaPercent}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 pointer-events-none"></div>
            </div>

            {/* Orb Frame Image */}
            <img
                src="/assets/ui/health_orb_frame.png"
                alt="Mana Orb"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
            />


        </div>
    );
};