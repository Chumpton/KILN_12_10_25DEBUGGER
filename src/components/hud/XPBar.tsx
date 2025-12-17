import React from 'react';
import { Player } from '../../types';

interface XPBarProps {
    player: Player;
}

export const XPBar: React.FC<XPBarProps> = ({ player }) => {
    const xpPercent = Math.max(0, (player.xp / player.toNextLevel) * 100);

    return (
        <div className="relative inline-block z-10 pointer-events-auto">

            {/* Fill Container - Positioned to fit behind the frame's transparent window */}
            {/* Tightened insets to ensure the background/fill stays strictly within the bone window */}
            <div className="absolute top-[35%] bottom-[35%] left-[2%] right-[2%] z-10 bg-black/60 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-900 via-purple-600 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                />
            </div>

            {/* Frame Image - Acts as the mask/overlay */}
            <img
                src="/assets/ui/xp_bar_frame.png"
                alt="XP Bar"
                className="relative z-20 block object-contain select-none"
            />

            {/* Text Overlay - Topmost */}

        </div>
    );
};