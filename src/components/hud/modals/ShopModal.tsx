import React from 'react';
import { Player, ShopItem, EquipmentItem } from '../../../types';
import { RARITY_COLORS } from '../../../constants';

interface ShopModalProps {
    shopItems: ShopItem[];
    player: Player;
    onBuyItem: (item: ShopItem) => void;
    onClose: () => void;
    shopResetTimer: number;
    setHoveredItem: (data: { item: EquipmentItem | ShopItem, x: number, y: number } | null) => void;
    isPaused: boolean;
}

export const ShopModal: React.FC<ShopModalProps> = ({ shopItems, player, onBuyItem, onClose, shopResetTimer, setHoveredItem, isPaused }) => {
    const shopMinutes = Math.floor((shopResetTimer / 60) / 60);
    const shopSeconds = Math.floor((shopResetTimer / 60) % 60);
    const shopTimerStr = `${shopMinutes}:${shopSeconds.toString().padStart(2, '0')}`;

    return (
        <div className="pointer-events-auto z-40" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            <div className="bg-[#0c0a09] border-[3px] border-[#4a3f35] rounded-lg p-6 w-[400px] shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
                {!isPaused && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-50 w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-900 border border-red-400 shadow-[0_0_5px_red] hover:scale-110 transition-transform cursor-pointer"
                    />
                )}
                <h2 className="text-xl text-[#d4c5a3] font-bold mb-4 text-center border-b border-[#292524] pb-2 uppercase tracking-widest flex justify-between items-center px-2">
                    <span>Merchant</span>
                    <span className="text-xs font-mono text-[#857056]">Restock: {shopTimerStr}</span>
                </h2>
                <div className="grid grid-cols-4 gap-2 p-2">
                    {shopItems.map(item => (
                        <div
                            key={item.id}
                            className={`relative bg-[#141210] border-2 rounded-lg p-2 flex flex-col items-center cursor-pointer transition-all hover:bg-[#1c1917] ${player.coins >= item.price ? 'border-[#3d342b] hover:border-[#d4b06c]' : 'border-red-900/30 opacity-60'}`}
                            style={{ borderColor: player.coins >= item.price ? RARITY_COLORS[item.rarity] : undefined }}
                            onClick={() => onBuyItem(item)}
                            onMouseEnter={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div className="text-2xl mb-1 filter drop-shadow">{item.icon}</div>
                            <div className="text-[#e5d5ac] font-bold text-xs flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#d4b06c] border border-[#fcd34d]"></div>
                                {item.price}
                            </div>
                            <div className="text-[10px] text-[#57534e]">{item.w}x{item.h}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};