import React, { useEffect, useState } from 'react';
import { debugLastCastPlan, ENABLE_CARDS } from '../spells/SpellSystem';
import { CastPlan } from '../cards/types';

export const CardDebugOverlay: React.FC = () => {
    const [plan, setPlan] = useState<CastPlan | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (debugLastCastPlan !== plan) {
                setPlan(debugLastCastPlan);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [plan]);

    if (!plan) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#0f0',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 9999,
            maxWidth: '300px'
        }}>
            <h3 style={{ margin: '0 0 5px', color: '#fff' }}>Card System Debug</h3>
            <div>Enabled: {ENABLE_CARDS ? 'TRUE' : 'FALSE'}</div>
            <hr style={{ borderColor: '#555' }} />
            <div>Spell: {plan.spellType}</div>
            <div>Stats:</div>
            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                <li>Proj Count: {plan.stats.projectileCount.toFixed(1)}</li>
                <li>Dmg Mult: {plan.stats.damageMult.toFixed(2)}x</li>
                <li>Speed Mult: {plan.stats.projectileSpeedMult.toFixed(2)}x</li>
                <li>Radius Mult: {plan.stats.aoeRadiusMult.toFixed(2)}x</li>
                <li>Pierce: {plan.stats.pierceCount}</li>
            </ul>
            <div>Behaviors: {Array.from(plan.behaviors).join(', ') || 'None'}</div>
            <div>Data: {JSON.stringify(plan.data)}</div>
        </div>
    );
};
