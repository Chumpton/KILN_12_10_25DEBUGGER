import { useState, useRef, useEffect } from 'react';
import { SpellDefinition } from '../types';
import { SpellEditorSession } from '../game/spells/editing/SpellEditorTypes';
import { SpellStudioEngine } from '../engine/spell-studio/SpellStudioEngine';
import { SpellEditorController } from '../game/spells/editing/SpellEditorController';
import { ENTITY_RIGS } from '../data/EntityRigDefinitions';

/**
 * Hook to manage Spell Studio session and engine
 */
export function useSpellStudio(initialSpell: SpellDefinition) {
    // Initialize session
    const [session, setSession] = useState<SpellEditorSession>(() => ({
        spell: initialSpell,
        rig: {
            rigKey: 'skeleton_npc',
            rigData: ENTITY_RIGS['skeleton_npc'] || ENTITY_RIGS['skeleton_npc'],
            selectedPart: 'hand_r'
        },
        timeline: {
            currentTimeMs: 0,
            totalDurationMs: initialSpell.castTime + (initialSpell.recoveryTime || 200),
            isPlaying: false,
            zoom: 1,
            scrollX: 0,
            selectedAnim: 'cast_fireball'
        },
        canvas: {
            zoom: 1,
            pan: { x: 0, y: 0 },
            aimAngle: 0,
            showGrid: true,
            showBoneDebug: false,
            showHitboxes: true,
            showDummyEnemies: false,
            showOnionSkin: false,
            previewPath: true
        },
        ik: {
            enabled: false,
            chain: 'RIGHT',
            target: { x: 50, y: 0 }
        }
    }));

    // Create engine
    const engineRef = useRef<SpellStudioEngine | null>(null);
    if (!engineRef.current) {
        engineRef.current = new SpellStudioEngine(session);
    }

    // Update engine when session changes
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.updateSession(session);
        }
    }, [session]);

    // Create controller
    const controllerRef = useRef<SpellEditorController | null>(null);
    if (!controllerRef.current) {
        controllerRef.current = new SpellEditorController(session, setSession);
    }

    // Update controller session
    useEffect(() => {
        if (controllerRef.current) {
            controllerRef.current = new SpellEditorController(session, setSession);
        }
    }, [session]);

    return {
        session,
        setSession,
        engine: engineRef.current,
        controller: controllerRef.current
    };
}
