import React, { useState, useEffect } from 'react';
import { SPELL_REGISTRY, SpellDefinition } from '../spells/SpellRegistry';
import { ProjectileEditor } from './ProjectileEditor';
import { CastPreview } from './CastPreview';
import { GameState } from '../../types';

interface SpellEditorProps {
    isActive: boolean;
    onClose: () => void;
    gameStateRef: React.MutableRefObject<GameState | undefined>;
}

export const SpellEditor: React.FC<SpellEditorProps> = ({ isActive, onClose, gameStateRef }) => {
    const [selectedSpellId, setSelectedSpellId] = useState<string>(Object.keys(SPELL_REGISTRY)[0]);
    const [localRegistry, setLocalRegistry] = useState<Record<string, SpellDefinition>>({ ...SPELL_REGISTRY });
    const [ver, setVer] = useState(0); // Force re-render on edit

    // Sync from internal registry if it changes externally (rare, but good practice)
    useEffect(() => {
        if (isActive) {
            setLocalRegistry({ ...SPELL_REGISTRY });
            // Force cursor to be visible and default OS cursor when editor is open
            // This fixes "stuck in game cursor" issues if the game hides it or uses a custom one.
            const originalCursor = document.body.style.cursor;
            document.body.style.cursor = 'default';
            return () => {
                document.body.style.cursor = originalCursor;
            };
        }
    }, [isActive]);

    const [position, setPosition] = useState({ x: 300, y: 60 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLocked, setIsLocked] = useState(true); // Default locked

    // Toggle Lock with M
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (e.key.toLowerCase() === 'm') {
                // If the user meant "Unlock", we toggle isLocked
                setIsLocked(p => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Drag Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && !isLocked) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, isLocked]);

    if (!isActive) return null;

    const spell = SPELL_REGISTRY[selectedSpellId];

    const handleFieldChange = (section: keyof SpellDefinition, field: string, value: any) => {
        // Direct mutation of the registry for live updates
        const s = SPELL_REGISTRY[selectedSpellId] as any;

        if (section === 'baseStats' || section === 'geometry' || section === 'animation' || section === 'timing') {
            s[section][field] = value;
        } else {
            // Top level or other
            s[field] = value;
        }

        // Force update UI
        setVer(v => v + 1);
    };

    const renderInput = (label: string, value: any, type: 'number' | 'text' | 'color', onChange: (val: any) => void) => (
        <div style={{ marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: '#aaa', marginRight: 10 }}>{label}:</label>
            <input
                type={type}
                value={value}
                onChange={(e) => {
                    const v = type === 'number' ? parseFloat(e.target.value) : e.target.value;
                    onChange(v);
                }}
                style={{
                    background: '#333',
                    border: '1px solid #555',
                    color: '#fff',
                    padding: '2px 5px',
                    width: type === 'color' ? 50 : 80,
                    fontSize: 12
                }}
            />
        </div>
    );

    return (
        <div style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: isLocked ? 950 : 950, // Wider for 3 panels
            maxHeight: '80vh',
            background: 'rgba(10, 10, 10, 0.95)',
            border: `1px solid ${isLocked ? '#444' : '#fbbf24'}`,
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            color: '#e5e5e5',
            fontFamily: 'monospace',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column', // Header top, content flex row
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div
                onMouseDown={(e) => {
                    if (!isLocked) {
                        setIsDragging(true);
                        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                    }
                }}
                style={{
                    padding: 10,
                    background: '#1a1a1a',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: isLocked ? 'default' : 'grab',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 16 }}>🪄</span>
                    <strong style={{ color: isLocked ? '#8b5cf6' : '#fbbf24' }}>Spell Editor {isLocked ? '' : '(Unlocked)'}</strong>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                    <button
                        onClick={async () => {
                            const btn = document.getElementById('btn-save-spells');
                            if (btn) btn.innerText = 'Saving...';
                            try {
                                await fetch('/save-spell-config', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(SPELL_REGISTRY)
                                });
                                if (btn) btn.innerText = 'Saved!';
                                setTimeout(() => { if (btn) btn.innerText = 'Save'; }, 1000);
                            } catch (e) {
                                console.error(e);
                                if (btn) btn.innerText = 'Error';
                            }
                        }}
                        id="btn-save-spells"
                        style={{
                            background: '#10b981',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 4
                        }}
                    >
                        Save
                    </button>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            </div>

            {/* Content Container (Flex Row) */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, padding: 15, overflow: 'hidden' }}>

                {/* LEFT PANEL: SPELL PROPERTIES */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }}>

                    {/* Spell Selector */}
                    <div style={{ marginBottom: 15 }}>
                        <select
                            value={selectedSpellId}
                            onChange={(e) => setSelectedSpellId(e.target.value)}
                            style={{ width: '100%', padding: 5, background: '#222', color: '#fff', border: '1px solid #444' }}
                        >
                            {Object.keys(SPELL_REGISTRY).map(key => (
                                <option key={key} value={key}>{SPELL_REGISTRY[key].name} ({key})</option>
                            ))}
                        </select>
                    </div>

                    {/* Editor Sections */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

                        {/* CORE STATS */}
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: 10 }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#fbbf24', fontSize: 13 }}>📊 Base Stats</h4>
                            {renderInput('Base Damage', spell.baseStats.baseDamage, 'number', (v) => handleFieldChange('baseStats', 'baseDamage', v))}
                            {renderInput('Cooldown (ms)', (spell.baseStats.cooldown || 0) * 1000, 'number', (v) => handleFieldChange('baseStats', 'cooldown', v / 1000))}
                            {renderInput('Mana Cost', spell.baseStats.manaCost, 'number', (v) => handleFieldChange('baseStats', 'manaCost', v))}
                            {renderInput('Cast Time (ms)', (spell.baseStats.castTime || 0) * 1000, 'number', (v) => handleFieldChange('baseStats', 'castTime', v / 1000))}
                            {renderInput('Range/Lifetime', spell.baseStats.projectileLifetime, 'number', (v) => handleFieldChange('baseStats', 'projectileLifetime', v))}
                            {renderInput('Speed', spell.baseStats.projectileSpeed, 'number', (v) => handleFieldChange('baseStats', 'projectileSpeed', v))}
                            {renderInput('AoE Radius', spell.baseStats.aoeRadius, 'number', (v) => handleFieldChange('baseStats', 'aoeRadius', v))}
                        </div>

                        {/* VISUALS */}
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: 10 }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#ec4899', fontSize: 13 }}>🎨 Visuals</h4>
                            {renderInput('Primary Color', spell.animation.primaryColor, 'color', (v) => handleFieldChange('animation', 'primaryColor', v))}
                            {renderInput('Secondary Color', spell.animation.secondaryColor, 'color', (v) => handleFieldChange('animation', 'secondaryColor', v))}
                            {renderInput('Screen Shake', spell.animation.screenShake, 'text', (v) => handleFieldChange('animation', 'screenShake', v))}
                        </div>

                        {/* TIMING */}
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: 10 }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', fontSize: 13 }}>⏱️ Timing (ms)</h4>
                            {spell.timing && (
                                <>
                                    {renderInput('Windup', spell.timing.castWindupTime, 'number', (v) => handleFieldChange('timing', 'castWindupTime', v))}
                                    {renderInput('Release Time', spell.timing.releaseTime, 'number', (v) => handleFieldChange('timing', 'releaseTime', v))}
                                    {renderInput('Shake Itsty', spell.timing.screenShakeIntensity || 0, 'number', (v) => handleFieldChange('timing', 'screenShakeIntensity', v))}
                                </>
                            )}
                            {!spell.timing && <div style={{ fontSize: 11, color: '#666' }}>No timing block defined (using defaults)</div>}
                        </div>

                        {/* RIGGING */}
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h4 style={{ margin: 0, color: '#f87171', fontSize: 13 }}>🔧 Rigging</h4>
                                <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={(window as any)._DEBUG_RENDERER_ORIGIN || false}
                                        onChange={(e) => {
                                            (window as any)._DEBUG_RENDERER_ORIGIN = e.target.checked;
                                            setVer(v => v + 1); // Force update to show state
                                        }}
                                    />
                                    Show Origin
                                </label>
                            </div>

                            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>Spawn Offset (Pixels from Hand):</div>
                            {renderInput('Offset X', spell.skeletalAnimation?.spawnOffset?.x || 0, 'number', (v) => {
                                if (!spell.skeletalAnimation) spell.skeletalAnimation = {};
                                if (!spell.skeletalAnimation.spawnOffset) spell.skeletalAnimation.spawnOffset = { x: 0, y: 0 };
                                handleFieldChange('skeletalAnimation', 'spawnOffset', { ...spell.skeletalAnimation.spawnOffset, x: v });
                            })}
                            {renderInput('Offset Y', spell.skeletalAnimation?.spawnOffset?.y || 0, 'number', (v) => {
                                if (!spell.skeletalAnimation) spell.skeletalAnimation = {};
                                if (!spell.skeletalAnimation.spawnOffset) spell.skeletalAnimation.spawnOffset = { x: 0, y: 0 };
                                handleFieldChange('skeletalAnimation', 'spawnOffset', { ...spell.skeletalAnimation.spawnOffset, y: v });
                            })}
                        </div>

                    </div>
                </div>

                {/* SIDE PANEL: PROJECTILE TUNER */}
                <div style={{
                    width: 300,
                    borderLeft: '1px solid #444',
                    paddingLeft: 10,
                    marginLeft: 10,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h4 style={{ marginTop: 0, color: '#60a5fa', marginBottom: 10 }}>🚀 Projectile Tuner</h4>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <ProjectileEditor
                            gameStateRef={gameStateRef}
                            onClose={() => { }} // No close needed when embedded
                            isEmbedded={true}
                            selectedSpellId={selectedSpellId}
                        />
                    </div>
                </div>

                {/* SIDE PANEL: CAST PREVIEW */}
                <CastPreview selectedSpellId={selectedSpellId} />

            </div>
        </div >
    );
};
