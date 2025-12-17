import React from 'react';
import { CardInstance, CardDefinition } from '../../../modules/cards/types';
import { CARD_REGISTRY } from '../../../modules/cards/CardRegistry';

interface CardSlotProps {
    card?: CardInstance | null;
    onClick?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    selected?: boolean;
    isLocked?: boolean;
    isEmpty?: boolean;
    label?: string;
}

const TIER_COLORS = {
    COMMON: '#A0A0A0',
    UNCOMMON: '#40FF40',
    RARE: '#4040FF',
    EPIC: '#A040FF',
    LEGENDARY: '#FF8000'
};

export const CardSlot: React.FC<CardSlotProps> = ({
    card, onClick, onMouseDown, onMouseUp, selected, isLocked, isEmpty, label
}) => {
    // Resolve definition
    const def = card ? CARD_REGISTRY[card.cardId] : null;

    const borderColor = def ? TIER_COLORS[def.tier] || '#FFF' : '#444';
    const bgColor = selected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)';

    return (
        <div
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            style={{
                width: '60px',
                height: '80px',
                border: `2px solid ${borderColor}`,
                backgroundColor: bgColor,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                opacity: isLocked ? 0.5 : 1,
                boxShadow: selected ? `0 0 10px ${borderColor}` : 'none',
                transition: 'all 0.1s ease',
                margin: '4px'
            }}
            title={def ? `${def.name}\n${def.description}` : 'Empty Slot'}
        >
            {isLocked && <div style={{ fontSize: '20px' }}>🔒</div>}

            {!isLocked && def && (
                <>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', color: borderColor }}>
                        {def.name}
                    </div>
                </>
            )}

            {!isLocked && !def && !isEmpty && (
                <div style={{ fontSize: '10px', color: '#888' }}>{label || 'Empty'}</div>
            )}
        </div>
    );
};
