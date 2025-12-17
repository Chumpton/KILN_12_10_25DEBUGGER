
import React from 'react';
import { Player } from '../../types';

interface HealthOrbProps {
    player: Player;
}

export const HealthOrb: React.FC<HealthOrbProps> = ({ player }) => {
    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
    const shieldPercent = Math.max(0, (player.shield / player.maxShield));

    return (
        <div className="relative w-32 h-32 z-20 pointer-events-auto group">
            {/* Liquid Background/Fill */}
            <div className="absolute inset-1 rounded-full bg-black overflow-hidden ring-1 ring-black/50">
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-950 via-red-600 to-red-500 transition-all duration-300 ease-out"
                    style={{ height: `${hpPercent}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 pointer-events-none"></div>
            </div>

            {/* Orb Frame Image */}
            <img
                src="/assets/ui/health_orb_frame.png"
                alt="Health Orb"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
            />

            {/* Shield Overlay */}
            {shieldPercent > 0 && (
                <div className="absolute inset-1 rounded-full overflow-hidden z-15 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <path
                            d="M 50,5 A 45,45 0 0 1 50,95"
                            fill="none"
                            stroke="cyan"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${shieldPercent * 142} 200`}
                            className="filter drop-shadow-[0_0_2px_cyan]"
                        />
                    </svg>
                </div>
            )}


        </div>
    );
};
