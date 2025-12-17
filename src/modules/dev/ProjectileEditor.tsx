import React, { useState, useEffect } from 'react';
import { GameState, SpellType, Vector2 } from '../../types';
import { SPELL_REGISTRY } from '../spells/SpellRegistry';
import { initiateCast } from '../spells/SpellSystem';
import { SpellBehavior } from '../spells/SpellBehavior';
import { BEHAVIOR_REGISTRY } from '../spells/BehaviorRegistry';

interface ProjectileEditorProps {
    gameStateRef: React.MutableRefObject<GameState | undefined>;
    onClose: () => void;
    isEmbedded?: boolean;
    selectedSpellId?: string; // New Prop from Parent
}

export const ProjectileEditor: React.FC<ProjectileEditorProps> = ({ gameStateRef, onClose, isEmbedded, selectedSpellId: propSpellId }) => {
    // If embedded, use prop. If standalone, use local state (legacy support, or just default to prop if available)
    const [localSpellId, setLocalSpellId] = useState<SpellType>(SpellType.ICE_FROST_PULSE);
    const selectedSpell = (isEmbedded && propSpellId) ? (propSpellId as SpellType) : localSpellId;

    // Tweakable parameters (applied to spawned projectile)
    // Initialize from Registry so changes persist across re-opens
    const [scale, setScale] = useState(() => {
        const config = SPELL_REGISTRY[selectedSpell]; // Uses initial selectedSpell
        return (config as any)?.data?.scaleOverride ?? 1;
    });

    const [speedMod, setSpeedMod] = useState(1);

    const [rotationOffset, setRotationOffset] = useState(() => {
        const config = SPELL_REGISTRY[selectedSpell];
        const rads = (config as any)?.data?.rotationOffset ?? 0;
        return Math.round(rads * 180 / Math.PI); // Convert back to Degrees
    });
    const [autoFire, setAutoFire] = useState(false);

    // Also update state when selectedSpell changes (to load its config)
    useEffect(() => {
        const config = SPELL_REGISTRY[selectedSpell];
        if (config && (config as any).data) {
            if ((config as any).data.scaleOverride !== undefined) {
                setScale((config as any).data.scaleOverride);
            } else {
                setScale(1);
            }

            if ((config as any).data.rotationOffset !== undefined) {
                setRotationOffset(Math.round((config as any).data.rotationOffset * 180 / Math.PI));
            } else {
                setRotationOffset(0);
            }
        } else {
            setScale(1);
            setRotationOffset(0);
        }
    }, [selectedSpell]);

    // Live Edit support? 
    // To live edit, we'd need to modify the BEHAVIOR for the spell globally, 
    // or inject these overrides into the data packet of the spawned projectile.
    // The current spell system uses 'data' field. We can inject there.
    // Let's assume behaviors look at data.scale if provided?
    // FrostPulseBehavior uses hardcoded scale 0.25 now. 
    // To support this tool effectively, I should modify FrostPulseBehavior to respecting data.scaleOverride if present.

    // Autosave to Registry (In-Memory)
    useEffect(() => {
        const config = SPELL_REGISTRY[selectedSpell];
        if (config) {
            // Ensure data object exists
            if (!(config as any).data) (config as any).data = {};

            // Update Registry
            (config as any).data.scaleOverride = scale;
            (config as any).data.rotationOffset = (rotationOffset * Math.PI) / 180;

            // Also update base stats if applicable for seamless testing
            if (config.baseStats) {
                // config.baseStats.projectileSpeed = ... (Coordinate with slider)
            }
        }
    }, [scale, rotationOffset, selectedSpell]);

    const handleSpawn = () => {
        try {
            const state = gameStateRef.current;
            if (!state) return;

            // Calculate spawn position (Player + offset)
            const player = state.player;
            const origin = { ...player.pos };

            // Target: Mouse position (screen to world)? 
            // We don't have easy access to mouse world pos here without InputSystem.
            // Let's just fire in the direction the player is facing for simplicity,
            // or add a "Direction" slider (0-360).

            // For visual testing, fixed direction is fine.
            const angle = player.facingRight ? 0 : Math.PI;

            // Override Spell Config for this cast?
            // initiateCast logic is complex. It reads registry.
            // We might want to construct the projectile manually to bypass cooldowns/mana.

            // Manual construction based on SpellSystem logic:
            const config = SPELL_REGISTRY[selectedSpell];
            if (!config) return;

            // Create projectile
            const id = `proj_${Date.now()}_${Math.random()}`;
            const pSpeed = (config.baseStats.projectileSpeed || 10) * speedMod;

            const velocity = {
                x: Math.cos(angle) * pSpeed,
                y: Math.sin(angle) * pSpeed
            };

            // SAFETY CHECK: Ensure lifetime is at least 60 frames (1 second) to prevent instant death/loops
            const baseLife = config.baseStats.projectileLifetime ? (config.baseStats.projectileLifetime * 60) : 100;
            const life = Math.max(60, baseLife); // Force at least 1s lifetime for debug projectiles

            // Inject overrides into data
            const data = {
                ...(config as any).data, // Preserve original data if present (hidden type)
                scaleOverride: scale,
                rotationOffset: (rotationOffset * Math.PI) / 180
            };

            state.projectiles.push({
                id,
                spawnerId: player.id,
                type: selectedSpell,
                pos: { x: origin.x, y: origin.y - 0.5 }, // Lift slightly
                velocity,
                life,
                maxLife: life,
                damage: 10, // Dummy
                isDead: false,
                data
            });
        } catch (e) {
            console.error("Spawn Once Failed:", e);
        }
    };

    // Canvas Ref for True Preview
    const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);

    // True Prieview Loop
    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Find behavior
        const config = SPELL_REGISTRY[selectedSpell];
        // Note: SpellDefinition doesn't explicitly store 'BehaviorName'.
        // We usually infer it from SpellType or look it up.
        // For Frost Pulse, it's "FrostPulseBehavior".
        // Let's rely on a manual map or the one in BehaviorRegistry if keys match types.
        // Looking at BehaviorRegistry, keys are "FrostPulseBehavior", "FireballBehavior", etc.
        // We can create a simple mapping or just iterate.
        // Quick map for now:
        let behaviorKey = 'GenericBehavior';
        if (selectedSpell === SpellType.ICE_FROST_PULSE) behaviorKey = 'FrostPulseBehavior';
        if (selectedSpell === SpellType.FIRE_FIREBALL) behaviorKey = 'FireballBehavior';
        if (selectedSpell === 'LIGHTNING_ARC_BEAM') behaviorKey = 'ArcBehavior'; // Type mismatch fix later

        const behavior = BEHAVIOR_REGISTRY[behaviorKey];

        // Mock Projectile Object
        // Behaviors expect a Projectile { pos, velocity, data, ... }
        const p = {
            id: 'preview_proj',
            pos: { x: 0, y: 0 },
            velocity: { x: 10, y: 0 }, // Moving Right
            data: {
                scaleOverride: scale,
                rotationOffset: (rotationOffset * Math.PI) / 180
            },
            life: 100,
            maxLife: 100,
            type: selectedSpell
        };

        let animId: number;
        const render = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();

            // Draw Center Crosshair
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            // Render via Behavior
            // Behavior renders at Screen X,Y.
            // We want (0,0) world to correspond to Center of Canvas.
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            if (behavior && behavior.onRender) {
                behavior.onRender(ctx, p as any, centerX, centerY);
            } else {
                ctx.fillStyle = '#666';
                ctx.fillText(`No Render for ${behaviorKey}`, 10, 20);
            }

            ctx.restore();
            animId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animId);
    }, [selectedSpell, scale, rotationOffset]);

    // Interactive Handlers
    const handlePreviewWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
    };

    // Simple drag for rotation (X-axis drag)
    const handlePreviewMouseMove = (e: React.MouseEvent) => {
        if (e.buttons === 1) { // Left click drag
            const delta = e.movementX;
            setRotationOffset(prev => {
                let next = prev + delta;
                if (next > 180) next -= 360;
                if (next < -180) next += 360;
                return next;
            });
        }
    };

    // ... Auto Fire Loop ... 
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoFire) {
            interval = setInterval(handleSpawn, 200);
        }
        return () => clearInterval(interval);
    }, [autoFire, selectedSpell, scale, speedMod, rotationOffset]);

    const containerStyle: React.CSSProperties = isEmbedded ? {
        // Embedded: Relative flow, no fixed pos
        background: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 8,
        border: '1px solid #555',
        height: '100%',
        overflowY: 'auto'
    } : {
        // Standalone: Absolute
        position: 'absolute', top: 60, right: 10, width: 300,
        background: 'rgba(0,0,0,0.8)', color: 'white', padding: 20,
        borderRadius: 8, border: '1px solid #555', zIndex: 10000
    };

    return (
        <div style={containerStyle}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Projectile Tuner</h3>
                {!isEmbedded && <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#f00', cursor: 'pointer' }}>✕</button>}
            </div>

            {/* INTERACTIVE LIVE PREVIEW */}
            <div
                style={{
                    marginBottom: 15,
                    background: '#151515',
                    borderRadius: 8,
                    border: '1px solid #444',
                    height: 200,
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'grab'
                }}
                onWheel={handlePreviewWheel}
                onMouseMove={handlePreviewMouseMove}
            >
                <canvas ref={previewCanvasRef} width={280} height={200} />
                <div style={{ position: 'absolute', top: 5, left: 5, fontSize: 10, color: '#666' }}>TRUE RENDER PREVIEW</div>
            </div>

            {/* Only show selector if standalone (not embedded in SpellEditor) */}
            {!isEmbedded && (
                <div style={{ marginBottom: 10 }}>
                    <label>Spell:</label>
                    <select
                        value={selectedSpell}
                        onChange={e => setLocalSpellId(e.target.value as SpellType)}
                        onMouseDown={e => e.stopPropagation()}
                        style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        {Object.values(SpellType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            )}

            <div style={{ marginBottom: 10 }}>
                <label>Scale Override: {scale.toFixed(2)}</label>
                <input
                    type="range" min="0.1" max="5" step="0.05"
                    value={scale}
                    onChange={e => setScale(parseFloat(e.target.value))}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div style={{ marginBottom: 10 }}>
                <label>Speed Mod: {speedMod.toFixed(2)}</label>
                <input
                    type="range" min="0.1" max="3" step="0.1"
                    value={speedMod}
                    onChange={e => setSpeedMod(parseFloat(e.target.value))}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div style={{ marginBottom: 10 }}>
                <label>Rotation Offset (Deg): {rotationOffset}</label>
                <input
                    type="range" min="-180" max="180" step="5"
                    value={rotationOffset}
                    onChange={e => setRotationOffset(parseFloat(e.target.value))}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={handleSpawn}
                    style={{ flex: 1, padding: 8, background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                    Spawn Once
                </button>
                <button
                    onClick={() => setAutoFire(!autoFire)}
                    style={{ flex: 1, padding: 8, background: autoFire ? '#f44336' : '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                    {autoFire ? 'Stop Auto' : 'Auto Fire'}
                </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: '#aaa' }}>
                * Spawns from player position facing movement direction.
            </div>
        </div>
    );
};
