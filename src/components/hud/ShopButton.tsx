
import React from 'react';

interface ShopButtonProps {
    coins: number;
    onClick: () => void;
}

export const ShopButton: React.FC<ShopButtonProps> = ({ coins, onClick }) => {
    return (
        <div
            className="relative cursor-pointer transition-transform hover:scale-105 pointer-events-auto"
            onClick={onClick}
        >
            <img
                src="ui/hud_shop.png"
                className="w-28 drop-shadow-lg pixelated"
                alt="Shop"
            />
            {/* Coin Counter Positioned Next to Coin Icon */}
            <div
                className="absolute top-[18px] left-[38px] text-yellow-100 text-xl tracking-widest leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: '"Jersey 25", sans-serif' }}
            >
                {coins}
            </div>
        </div>
    );
};
