import React, { useEffect, useRef } from 'react';
import { Player, Vector2, SpellType } from '../../types';
import { PlayerRenderer } from '../player/render/PlayerRenderer';
import { SPELL_REGISTRY } from '../spells/SpellRegistry';
import { BEHAVIOR_REGISTRY } from '../spells/BehaviorRegistry';

interface CastPreviewProps {
    selectedSpellId: string;
}

export const CastPreview: React.FC<CastPreviewProps> = ({ selectedSpellId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Origin State (Autosaved to Registry)
    const [originOffset, setOriginOffset] = React.useState<{ x: number, y: number }>(() => {
        const config = SPELL_REGISTRY[selectedSpellId];
        return (config as any)?.data?.originOffset || { x: 0, y: -0.5 };
    });

    // Hand Glow Offset State
    const [handGlowOffset, setHandGlowOffset] = React.useState<number>(() => {
        const config = SPELL_REGISTRY[selectedSpellId];
        return config?.skeletalAnimation?.handGlowOffset ?? 20;
    });

    // Playback Speed State
    const [playbackSpeed, setPlaybackSpeed] = React.useState<number>(1.0);

    // Interaction State
    const isDragging = useRef(false);

    // Autosave when offset changes
    useEffect(() => {
        const config = SPELL_REGISTRY[selectedSpellId];
        if (config) {
            if (!(config as any).data) (config as any).data = {};
            (config as any).data.originOffset = originOffset;

            // Sync Hand Glow
            if (!config.skeletalAnimation) config.skeletalAnimation = {};
            config.skeletalAnimation.handGlowOffset = handGlowOffset;
        }
    }, [originOffset, handGlowOffset, selectedSpellId]);

    // Handle Mouse Events safely
    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Origin in Screen Space
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 50;
        const screenX = centerX + (originOffset.x * 50);
        const screenY = centerY + (originOffset.y * 50);

        // Hit Test (10px radius)
        const dist = Math.sqrt(Math.pow(mx - screenX, 2) + Math.pow(my - screenY, 2));
        if (dist < 10) {
            isDragging.current = true;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Screen -> World
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 50;

        const worldX = (mx - centerX) / 50;
        const worldY = (my - centerY) / 50;

        setOriginOffset({ x: worldX, y: worldY });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dummy Player
        const player: Player = {
            id: 'preview_player',
            pos: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            hp: 100,
            maxHp: 100,
            shield: 0,
            maxShield: 100,
            xp: 0,
            level: 1,
            isMoving: false,
            facingRight: true,
            isMounted: false,
            mountId: null,
            inventory: [],
            equipment: {}, // Empty to prevent drawArmor crashes

            // Casting State
            casting: {
                isCasting: false,
                currentSpell: selectedSpellId,
                timer: 0,
                duration: 60,
                targetPos: { x: 5, y: 0 }, // Aim Right
                hitTargets: []
            },
            attack: { // Dummy attack state
                isAttacking: false,
                timer: 0,
                phase: 0 as any,
                cooldown: 0,
                comboCount: 0,
                weaponId: 'preview_staff',
                duration: 0,
                targetPos: { x: 0, y: 0 }, // Vector2
                hitTargets: [],
                comboWindowOpen: false,
                inputBuffer: false
            },
            stats: {
                strength: 5,
                dexterity: 5,
                intelligence: 5,
                vitality: 5,
                armor: 0,
                moveSpeed: 5,
                attackSpeed: 1,
                hpRegen: 1,
                mpRegen: 1
            },
            statusMain: 'IDLE',
            statusEffects: [],
            maxMp: 100,
            mp: 100,
            knownSpells: [],
            hotbar: []
        };

        let renderer: PlayerRenderer | null = null;
        try {
            renderer = new PlayerRenderer();
        } catch (e) {
            console.error("Failed to init preview renderer:", e);
        }

        // Local Projectiles for Preview
        let previewProjectiles: any[] = [];
        let animationFrameId: number;

        const loop = () => {
            if (!renderer || !ctx) return;

            try {
                // Logic: Cycle Casting
                const spellDef = SPELL_REGISTRY[selectedSpellId];
                const castTime = spellDef?.baseStats?.castTime ? spellDef.baseStats.castTime * 60 : 60;

                // Identify Behavior
                let behaviorKey = 'GenericBehavior';
                if (selectedSpellId === SpellType.ICE_FROST_PULSE) behaviorKey = 'FrostPulseBehavior';
                else if (selectedSpellId === SpellType.FIRE_FIREBALL) behaviorKey = 'FireballBehavior';
                else if (spellDef?.behaviorKey) behaviorKey = spellDef.behaviorKey;

                const behavior = BEHAVIOR_REGISTRY[behaviorKey];

                // Ensure Current Spell Matches Prop
                if (player.casting.currentSpell !== selectedSpellId) {
                    player.casting.currentSpell = selectedSpellId;
                    player.casting.timer = 0;
                    previewProjectiles = []; // Clear on switch
                }

                if (!player.casting.isCasting) {
                    // START CAST
                    player.casting.isCasting = true;
                    player.casting.duration = Math.max(30, castTime); // Min visual duration
                    player.casting.timer = 0;
                } else {
                    // UPDATE CAST
                    const prevTimer = player.casting.timer;
                    player.casting.timer += playbackSpeed;

                    // Fire Point (at end of cast)
                    if (prevTimer < player.casting.duration && player.casting.timer >= player.casting.duration) {
                        // FIRE!
                        // Calculate Spawn Origin
                        const pConfig = spellDef;
                        const pData = {
                            ...(pConfig.data || {}),
                            scaleOverride: pConfig.data?.scaleOverride !== undefined ? pConfig.data.scaleOverride : 1
                        };

                        previewProjectiles.push({
                            pos: { x: player.pos.x + originOffset.x, y: player.pos.y + originOffset.y },
                            velocity: { x: 5, y: 0 }, // Right
                            data: pData,
                            life: 60,
                            maxLife: 60,
                            type: selectedSpellId
                        });
                    }

                    if (player.casting.timer >= player.casting.duration + 40) { // Slight pause after
                        player.casting.isCasting = false;
                    }
                }

                // Update Projectiles
                previewProjectiles.forEach(p => {
                    p.pos.x += p.velocity.x * 0.016 * playbackSpeed; 
                    p.life -= 1 * playbackSpeed;
                });
                previewProjectiles = previewProjectiles.filter(p => p.life > 0);

                // --- RENDER ---
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Background Grid
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.moveTo(0, canvas.height / 2 + 50); ctx.lineTo(canvas.width, canvas.height / 2 + 50);
                ctx.stroke();

                // Render Player
                ctx.save();
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2 + 50; // Lower center
                renderer.render(ctx, player, centerX, centerY, null, false);
                ctx.restore();

                // Render Projectiles & Debug Origin
                previewProjectiles.forEach(p => {
                    if (behavior && behavior.onRender) {
                        // Calculate screen pos relative to CENTER (Player Pos)
                        // Player is at (0,0) world -> (centerX, centerY) screen.
                        // Projectile at (p.x, p.y) world -> ?
                        const relX = (p.pos.x - player.pos.x) * 64; // Scale assuming 64px/unit? 
                        // Wait, onRender takes Screen Coordinates directly.
                        // World to Screen: screenX = center + (worldX - camX)*scale
                        // Here camX = player.pos.x = 0.
                        // So screenX = centerX + p.pos.x * 64? (Assuming default zoom/scale)
                        // Let's assume 1 unit = 50px (Visual estimation) or match renderer.
                        // Player renderer scales output?
                        // Let's use simple offset.
                        const screenX = centerX + (p.pos.x - player.pos.x) * 50;
                        const screenY = centerY + (p.pos.y - player.pos.y) * 50;

                        behavior.onRender(ctx, p, screenX, screenY);
                    }
                });

                // --- DEBUG ORIGIN MARKER (Dynamic) ---
                const originScreenX = centerX + (originOffset.x * 50);
                const originScreenY = centerY + (originOffset.y * 50);

                // Hover effect logic handled by mouse handlers for cursor, here just draw
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(originScreenX, originScreenY, 5, 0, Math.PI * 2); // Larger handle
                ctx.fill();
                // Crosshair
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(originScreenX - 6, originScreenY); ctx.lineTo(originScreenX + 6, originScreenY);
                ctx.moveTo(originScreenX, originScreenY - 6); ctx.lineTo(originScreenX, originScreenY + 6);
                ctx.stroke();

                // Line to center
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY); ctx.lineTo(originScreenX, originScreenY);
                ctx.stroke();

            } catch (e) {
                console.error("Preview Render Error:", e);
                ctx.fillStyle = 'red';
                ctx.font = '10px monospace';
                ctx.fillText("Render Error", 10, 20);
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
        return () => cancelAnimationFrame(animationFrameId);
    }, [selectedSpellId, originOffset, handGlowOffset, playbackSpeed]);

    return (
        <div style={{
            width: 300,
            borderLeft: '1px solid #444',
            paddingLeft: 10,
            marginLeft: 10,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <h4 style={{ marginTop: 0, color: '#a78bfa', marginBottom: 10 }}>🔮 Cast Preview</h4>
            <div
                style={{ flex: 1, background: '#111', borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: isDragging.current ? 'grabbing' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={canvasRef} width={280} height={300} style={{ width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', bottom: 5, left: 5, fontSize: 10, color: '#555' }}>
                    Drag Green Target to set Origin
                </div>
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>
                Offset: X:{originOffset.x.toFixed(2)} Y:{originOffset.y.toFixed(2)}
            </div>

            {/* Controls */}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, color: '#aaa' }}>
                    Speed: {playbackSpeed.toFixed(1)}x
                    <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </label>
                <label style={{ fontSize: 10, color: '#aaa' }}>
                    Hand Glow Offset: {handGlowOffset}px
                    <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={handGlowOffset}
                        onChange={(e) => setHandGlowOffset(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </label>
            </div>
        </div>
    );
};
