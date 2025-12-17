import React, { useEffect, useRef } from 'react';
import { Player, EquipmentItem, EquipmentSlot, ShopItem } from '../../../types';
import { RARITY_COLORS, POTION_CONFIG } from '../../../constants';
import { renderCharacter } from '../../../modules/player/render/renderCharacter';

interface InventoryModalProps {
    player: Player;
    onEquip: (item: EquipmentItem) => void;
    onUnequip: (slot: EquipmentSlot) => void;
    onClose: () => void;
    setHoveredItem: (data: { item: EquipmentItem | ShopItem, x: number, y: number } | null) => void;
    isPaused: boolean;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ player, onEquip, onUnequip, onClose, setHoveredItem, isPaused }) => {
    const GRID_CELL_SIZE = 80; // Doubled from 40
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Equipment slots - WoW style layout with emojis
    const LEFT_SLOTS: { slot: EquipmentSlot; emoji: string }[] = [
        { slot: 'HEAD', emoji: '🎩' },
        { slot: 'SHOULDERS', emoji: '🦴' },
        { slot: 'CHEST', emoji: '🦺' },
        { slot: 'LEGS', emoji: '👖' },
        { slot: 'FEET', emoji: '👢' }
    ];
    const RIGHT_SLOTS: { slot: EquipmentSlot; emoji: string }[] = [
        { slot: 'MAIN_HAND', emoji: '⚔️' },
        { slot: 'OFF_HAND', emoji: '🛡️' }
    ];

    // Render character preview on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Scale the character to be 2x larger
            ctx.save();
            ctx.scale(2, 2);

            const centerX = canvas.width / 4; // Divide by 4 because of 2x scale
            const centerY = canvas.height / 2 - 20; // Adjust for scaled coordinates
            renderCharacter(ctx, player, centerX, centerY, null, true);

            ctx.restore();
        } catch (error) {
            console.error('Error rendering character preview:', error);
        }
    }, [player.equipment, player]);

    const renderEquipmentSlot = (slotData: { slot: EquipmentSlot; emoji: string }) => {
        const { slot, emoji } = slotData;
        const item = player.equipment[slot];
        return (
            <div
                key={slot}
                className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-2xl cursor-pointer relative transition-all
                    ${item ? 'bg-[#1c1917] border-2' : 'bg-[#0f0e0d] border border-dashed border-[#3d342b] opacity-60'}
                `}
                style={{ borderColor: item ? RARITY_COLORS[item.rarity] : undefined }}
                onClick={() => item && onUnequip(slot)}
                onMouseEnter={(e) => {
                    if (item) setHoveredItem({ item, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredItem(null)}
            >
                {item ? (
                    item.icon
                ) : (
                    <span className="opacity-30 filter grayscale">{emoji}</span>
                )}
            </div>
        );
    };

    return (
        <div className="pointer-events-auto z-40" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            <div className="bg-[#0c0a09] border-[3px] border-[#4a3f35] rounded-lg p-6 w-[750px] shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
                {!isPaused && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-50 w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-900 border border-red-400 shadow-[0_0_5px_red] hover:scale-110 transition-transform cursor-pointer"
                    />
                )}

                {/* Header */}
                <h2 className="text-xl text-[#d4c5a3] font-bold mb-4 text-center border-b border-[#292524] pb-2 uppercase tracking-widest">
                    Character
                </h2>

                {/* Top Row: Character + Stats */}
                <div className="flex gap-4 mb-4">
                    {/* LEFT: Equipment Slots */}
                    <div className="flex flex-col gap-2">
                        {LEFT_SLOTS.map(renderEquipmentSlot)}
                    </div>

                    {/* CENTER: Character Preview */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-[#141210] border-2 border-[#3d342b] rounded-lg p-3">
                            <canvas
                                ref={canvasRef}
                                width={220}
                                height={280}
                                className="block"
                            />
                        </div>
                    </div>

                    {/* RIGHT: Weapon Slots */}
                    <div className="flex flex-col gap-2">
                        {RIGHT_SLOTS.map(renderEquipmentSlot)}
                    </div>

                    {/* FAR RIGHT: Stats Panel */}
                    <div className="flex-1 bg-[#0f0e0d] border border-[#3d342b] rounded-lg p-3 min-w-[160px]">
                        <div className="text-lg text-[#d4c5a3] font-bold mb-3 pb-2 border-b border-[#292524]">
                            Attributes
                        </div>
                        <div className="space-y-3 text-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-[#a89068]">💪 Strength</span>
                                <span className="text-[#d4c5a3] font-bold">{player.baseStats.power}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#a89068]">❤️ Vitality</span>
                                <span className="text-[#d4c5a3] font-bold">{player.baseStats.vitality}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#a89068]">⚡ Haste</span>
                                <span className="text-[#d4c5a3] font-bold">{player.baseStats.haste}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#a89068]">🏃 Swiftness</span>
                                <span className="text-[#d4c5a3] font-bold">{player.baseStats.swiftness}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Backpack */}
                <div className="flex justify-center">
                    <div
                        className="relative bg-[#0f0e0d] border border-[#3d342b] rounded p-2"
                        style={{
                            width: 8 * GRID_CELL_SIZE + 16,
                            height: 4 * GRID_CELL_SIZE + 16
                        }}
                    >
                        {/* Grid background */}
                        <div className="absolute inset-2 grid gap-[1px]" style={{
                            gridTemplateColumns: `repeat(8, ${GRID_CELL_SIZE}px)`,
                            gridTemplateRows: `repeat(4, ${GRID_CELL_SIZE}px)`
                        }}>
                            {Array.from({ length: 32 }).map((_, i) => (
                                <div key={i} className="bg-[#141210] border border-[#1f1c19] rounded-sm" />
                            ))}
                        </div>

                        {/* Items */}
                        {player.inventory.map((item) => {
                            if (item.gridX === undefined || item.gridY === undefined) return null;
                            return (
                                <div
                                    key={item.id}
                                    className="absolute cursor-pointer transition-transform hover:scale-110 hover:z-10"
                                    style={{
                                        left: 8 + item.gridX * GRID_CELL_SIZE,
                                        top: 8 + item.gridY * GRID_CELL_SIZE,
                                        width: item.w * GRID_CELL_SIZE,
                                        height: item.h * GRID_CELL_SIZE
                                    }}
                                    onClick={() => onEquip(item)}
                                    onMouseEnter={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    <div
                                        className="w-full h-full bg-[#1c1917] border-2 rounded-lg flex items-center justify-center text-5xl relative overflow-hidden"
                                        style={{ borderColor: RARITY_COLORS[item.rarity] }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
                                        <span className="relative filter drop-shadow-md">{item.icon}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};