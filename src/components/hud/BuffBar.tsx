import React from 'react';
import { Player, Buff } from '../../types';

interface BuffBarProps {
    player: Player;
}

export const BuffBar: React.FC<BuffBarProps> = ({ player }) => {
    if (!player.buffs || player.buffs.length === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 20,
            right: 220, // Left of Minimap/DevTools
            display: 'flex',
            gap: 4,
            flexDirection: 'row-reverse', // Grow left
            pointerEvents: 'none'
        }}>
            {player.buffs.map(buff => (
                <div key={buff.id} style={{
                    width: 32,
                    height: 32,
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: 4,
                    border: buff.type === 'debuff' ? '1px solid #ef4444' : '1px solid #4ade80',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <img src={buff.icon} alt={buff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        fontSize: 10,
                        textAlign: 'center',
                        lineHeight: 1
                    }}>
                        {Math.ceil(buff.duration / 1000)}s
                    </div>
                    {/* Cooldown Shade */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${(1 - (buff.duration / buff.maxDuration)) * 100}%`,
                        background: 'rgba(0,0,0,0.4)'
                    }} />
                </div>
            ))}
        </div>
    );
};
