import React, { useState } from 'react';
import { GameState, Vector2 } from '../../types';
import { spawnEnemy } from '../enemies/EnemySystem';
import { WorldEditor } from './WorldEditor';
import { ProjectileEditor } from './ProjectileEditor';
import { SpellEditor } from './SpellEditor';
import { runVerificationSuite } from '../../systems/VerificationSystem';

interface DevToolsProps {
    gameStateRef: React.MutableRefObject<GameState | undefined>;
}

export const DevTools: React.FC<DevToolsProps> = ({ gameStateRef }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isWorldEditorActive, setIsWorldEditorActive] = useState(false);
    const [isSpellEditorActive, setIsSpellEditorActive] = useState(false);
    const [isProjectileEditorActive, setIsProjectileEditorActive] = useState(false);

    const [teleportPos, setTeleportPos] = useState({ x: 0, y: 0 });
    const [inspectedEnemyId, setInspectedEnemyId] = useState<string | null>(null);

    if (!isVisible) {
        return (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999 }}>
                <button onClick={() => setIsVisible(true)} style={{ padding: '5px 10px', background: '#333', color: '#fff' }}>
                    🛠️ Dev
                </button>
            </div>
        );
    }

    const state = gameStateRef.current;

    const handleSpawnEnemy = () => {
        if (!state) return;
        const playerPos = state.player.pos;
        // Spawn 3 tiles away random dir
        const angle = Math.random() * Math.PI * 2;
        const dist = 3;
        const pos = {
            x: playerPos.x + Math.cos(angle) * dist,
            y: playerPos.y + Math.sin(angle) * dist
        };
        spawnEnemy(state, pos);
    };

    const handleClearEnemies = () => {
        if (!state) return;
        state.enemies = [];
    };

    const handleFullRestore = () => {
        if (!state) return;
        state.player.hp = state.player.maxHp;
        state.player.mana = state.player.maxMana;
    };

    const handleResetCharacter = () => {
        if (!state) return;

        // Reset Level & XP
        state.player.level = 1;
        state.player.xp = 0;
        state.player.toNextLevel = 100; // Default starting XP requirement

        // Reset Stats
        state.player.statPoints = 0;
        state.player.baseStats = {
            vitality: 0,
            power: 0,
            haste: 0,
            swiftness: 0,
            shield: 0
        };

        // Reset Talents
        state.player.spellTalentPoints = 0;
        state.player.spellTalents = {
            FIRE: { ignition: 0, blastRadius: 0, multiFlare: 0, pyromania: 0 },
            ICE: { deepFreeze: 0, iciclePierce: 0, shatter: 0, frostbite: 0 },
            LIGHTNING: { overload: 0, highVoltage: 0, chainReaction: 0, staticShock: 0 },
            EARTH: { tremor: 0, heavyBoulder: 0, landslide: 0, aftershock: 0 },
            WIND: { galeForce: 0, zephyrSpeed: 0, tailwind: 0, tornadoSize: 0 }
        };

        // Reset Items
        state.player.inventory = [];
        state.player.equipment = {
            HEAD: null,
            CHEST: null,
            LEGS: null,
            FEET: null,
            SHOULDERS: null,
            MAIN_HAND: null,
            OFF_HAND: null
        };

        // Reset Potions to defaults
        state.player.potions = {
            health: 3,
            mana: 3,
            speed: 3
        };
        state.player.coins = 0;

        // Restore HP/Mana (will recalc based on base stats in next loop usually, but good to top up)
        state.player.hp = state.player.maxHp;
        state.player.mana = state.player.maxMana;

        console.log('Character Reset to Level 1');
    };



    const handleTeleport = () => {
        if (!state) return;
        state.player.pos = { ...teleportPos };
        // Reset velocity and pathing to prevent rubber-banding
        state.player.velocity = { x: 0, y: 0 };
        if (state.player.lockedTargetId) state.player.lockedTargetId = null;
        console.log('Teleported to:', teleportPos);
    };

    const handleUnstick = () => {
        if (!state) return;
        state.player.attack.isAttacking = false;
        state.player.casting.isCasting = false;
        state.player.roll.isRolling = false;
        state.player.velocity = { x: 0, y: 0 };
        state.player.lockedTargetId = null;
        console.log('Unstuck Character');
    };

    return (
        <>
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 200,
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: 10,
                borderRadius: 5,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Dev Tools</strong>
                    <button onClick={() => setIsVisible(false)} style={{ background: 'transparent', border: 'none', color: '#fff' }}>X</button>
                </div>

                {/* --- TELEPORT TOOL --- */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input
                        type="number"
                        value={teleportPos.x}
                        onChange={(e) => setTeleportPos(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '60px', color: 'black' }}
                        placeholder="X"
                    />
                    <input
                        type="number"
                        value={teleportPos.y}
                        onChange={(e) => setTeleportPos(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '60px', color: 'black' }}
                        placeholder="Y"
                    />
                    <button onClick={handleTeleport} style={{ ...btnStyle, padding: '2px 5px' }}>TP</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                        onClick={() => {
                            if (gameStateRef.current) {
                                const p = gameStateRef.current.player;
                                p.level++;
                                p.xp = 0;
                                p.toNextLevel = Math.floor(p.level * 100 * 1.5);
                                p.spellPoints = (p.spellPoints || 0) + 1;
                                p.baseStats.vitality += 1;
                                p.baseStats.power += 1;
                                p.hp = p.maxHp;
                                p.mana = p.maxMana;
                                console.log(`Dev: Level Up to ${p.level}`);
                            }
                        }}
                        style={{ ...btnStyle, background: '#10B981', flex: 1 }} // Tailwind bg-green-700
                    >
                        +1 Level
                    </button>
                    <button
                        onClick={() => {
                            if (gameStateRef.current) {
                                gameStateRef.current.player.spellPoints += 5;
                            }
                        }}
                        style={{ ...btnStyle, background: '#3B82F6', flex: 1 }} // Tailwind bg-blue-700
                    >
                        +5 Pts
                    </button>
                </div>

                <h3 style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #4B5563' }}>World Editor</h3>

                <button
                    onClick={() => {
                        setIsSpellEditorActive(!isSpellEditorActive);
                        if (isWorldEditorActive) setIsWorldEditorActive(false); // Exclusive
                        if (isProjectileEditorActive) setIsProjectileEditorActive(false);
                    }}
                    style={{
                        ...btnStyle,
                        background: isSpellEditorActive ? '#8b5cf6' : '#444',
                        color: isSpellEditorActive ? '#fff' : '#fff',
                        fontWeight: isSpellEditorActive ? 'bold' : 'normal'
                    }}
                >
                    🪄 Spell Editor
                </button>

                <button
                    onClick={() => {
                        setIsProjectileEditorActive(!isProjectileEditorActive);
                        if (isWorldEditorActive) setIsWorldEditorActive(false);
                        if (isSpellEditorActive) setIsSpellEditorActive(false);
                    }}
                    style={{
                        ...btnStyle,
                        background: isProjectileEditorActive ? '#ec4899' : '#444',
                        color: isProjectileEditorActive ? '#fff' : '#fff',
                        fontWeight: isProjectileEditorActive ? 'bold' : 'normal'
                    }}
                >
                    🚀 Projectile Editor
                </button>

                <button
                    onClick={() => {
                        const newState = !isWorldEditorActive;
                        setIsWorldEditorActive(newState);
                        if (newState) setIsSpellEditorActive(false); // Exclusive
                        if (state) {
                            state.isWorldEditorActive = newState;
                        }
                    }}
                    style={{
                        ...btnStyle,
                        background: isWorldEditorActive ? '#fbbf24' : '#444',
                        color: isWorldEditorActive ? '#000' : '#fff',
                        fontWeight: isWorldEditorActive ? 'bold' : 'normal'
                    }}
                >
                    🌍 {isWorldEditorActive ? 'Exit' : 'Edit'} World
                </button>

                <button onClick={handleSpawnEnemy} style={btnStyle}>Spawn Dummy</button>
                <button onClick={() => {
                    if (!state) return;
                    const playerPos = state.player.pos;
                    const angle = Math.random() * Math.PI * 2;
                    const pos = { x: playerPos.x + Math.cos(angle) * 3, y: playerPos.y + Math.sin(angle) * 3 };
                    spawnEnemy(state, pos, 'PATROL', 5);
                }} style={btnStyle}>Spawn Patroller</button>
                <button onClick={() => {
                    if (!state) return;
                    const playerPos = state.player.pos;
                    const angle = Math.random() * Math.PI * 2;
                    const pos = { x: playerPos.x + Math.cos(angle) * 3, y: playerPos.y + Math.sin(angle) * 3 };
                    spawnEnemy(state, pos, 'CHASE');
                }} style={btnStyle}>Spawn Attacker</button>
                <button onClick={handleClearEnemies} style={btnStyle}>Kill All</button>
                <button onClick={handleFullRestore} style={btnStyle}>Full Heal</button>
                <button onClick={handleResetCharacter} style={{ ...btnStyle, background: '#EF4444', marginTop: '5px' }}>⚠️ Reset Character</button>
                <button onClick={handleUnstick} style={{ ...btnStyle, background: '#F59E0B', marginTop: '5px' }}>🔓 Unstick</button>
                <button
                    onClick={() => {
                        if (state) {
                            if (state.player.cooldowns) state.player.cooldowns = {};
                            if (state.player.casting?.cooldowns) state.player.casting.cooldowns = {};
                            console.log('Cooldowns Reset');
                        }
                    }}
                    style={{ ...btnStyle, background: '#3B82F6', marginTop: '5px' }}
                >
                    🔄 Reset CDs
                </button>
                <button onClick={runVerificationSuite} style={{ ...btnStyle, background: '#8B5CF6', marginTop: '5px' }}>🧪 Test Spells</button>

                <div style={{ fontSize: 12 }}>
                    Enemies: {state?.enemies.length ?? 0}<br />
                    Projectiles: {state?.projectiles.length ?? 0}
                </div>

                <div style={{ borderTop: '1px solid #666', paddingTop: '5px', marginTop: '5px' }}>
                    <strong>NPC Inspector</strong>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {state?.enemies.map(e => (
                            <div key={e.id} style={{ background: '#222', padding: '2px' }}>
                                <div
                                    onClick={() => setInspectedEnemyId(e.id === inspectedEnemyId ? null : e.id)}
                                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                >
                                    <span>{e.type} ({Math.round(e.hp)})</span>
                                    <span>{e.id === inspectedEnemyId ? '▼' : '▶'}</span>
                                </div>
                                {e.id === inspectedEnemyId && (
                                    <div style={{ padding: '5px', background: '#333' }}>
                                        <div>
                                            HP: <input
                                                type="number"
                                                value={e.hp}
                                                onChange={(ev) => e.hp = parseFloat(ev.target.value)}
                                                style={{ width: '60px', color: 'black' }}
                                            />
                                        </div>
                                        <div>
                                            Max: <input
                                                type="number"
                                                value={e.maxHp}
                                                onChange={(ev) => e.maxHp = parseFloat(ev.target.value)}
                                                style={{ width: '60px', color: 'black' }}
                                            />
                                        </div>
                                        <div>State: {e.aiState}</div>
                                        <button onClick={() => { e.hp = 0; }} style={{ background: '#991111', color: 'white', fontSize: 10 }}>Kill</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- EXTERNALS --- */}
            {isWorldEditorActive && (
                <WorldEditor
                    gameStateRef={gameStateRef}
                    isActive={isWorldEditorActive}
                    onClose={() => setIsWorldEditorActive(false)}
                />
            )}
            {isSpellEditorActive && (
                <SpellEditor
                    isActive={isSpellEditorActive}
                    onClose={() => setIsSpellEditorActive(false)}
                    gameStateRef={gameStateRef}
                />
            )}
            {isProjectileEditorActive && (
                <ProjectileEditor
                    gameStateRef={gameStateRef}
                    onClose={() => setIsProjectileEditorActive(false)}
                />
            )}
        </>
    );
};

const btnStyle = {
    background: '#444',
    border: '1px solid #666',
    color: '#fff',
    padding: '5px',
    cursor: 'pointer'
};
