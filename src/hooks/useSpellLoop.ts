import { useRef, useState, useEffect, useCallback } from 'react';
import { SpellDefinition } from '../types';

export interface SpellLoopResult {
    loopState: React.MutableRefObject<LoopState>;
    uiProgress: number; // for Timeline
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    cast: () => void;
    setFrameMs: (ms: number) => void;
    projectiles: any[];
}

interface LoopState {
    isPlaying: boolean;
    castProgressMs: number;
    castTimeMs: number;
    releaseAt: number; // 0-1
    castPending: boolean;
    lastTime: number;
    projectiles: any[];
    hasFiredThisCycle: boolean;
}

export const useSpellLoop = (
    currentSpell: SpellDefinition,
    onSpawnProjectile: (projectiles: any[]) => void
): SpellLoopResult => {

    // Internal State Ref (Mutable for Speed)
    const loopState = useRef<LoopState>({
        isPlaying: false,
        castProgressMs: 0,
        castTimeMs: currentSpell.castTime || 1000,
        releaseAt: 0.4,
        castPending: false,
        lastTime: 0,
        projectiles: [],
        hasFiredThisCycle: false
    });

    // React State for UI Sync
    const [uiProgress, setUiProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Sync Props to Ref
    useEffect(() => {
        loopState.current.castTimeMs = currentSpell.castTime;
    }, [currentSpell.castTime]);

    // Controls
    const play = useCallback(() => {
        loopState.current.isPlaying = true;
        loopState.current.lastTime = performance.now();
        setIsPlaying(true);
    }, []);

    const pause = useCallback(() => {
        loopState.current.isPlaying = false;
        setIsPlaying(false);
    }, []);

    const cast = useCallback(() => {
        loopState.current.castPending = true;
    }, []);

    const setFrameMs = useCallback((ms: number) => {
        loopState.current.castProgressMs = ms;
        // If stopped, we might want to reset fired flag if we scrub before release?
        // Simple logic: just set time.
        setUiProgress(ms);
    }, []);

    // Main Loop
    useEffect(() => {
        let rAF: number;

        const loop = (time: number) => {
            const dt = Math.min(time - loopState.current.lastTime, 50); // Cap dt
            loopState.current.lastTime = time;

            if (loopState.current.isPlaying) {
                const totalDuration = currentSpell.castTime + (currentSpell.recoveryTime || 200);
                const prevMs = loopState.current.castProgressMs;

                // Advance
                loopState.current.castProgressMs += dt;

                // Loop
                if (loopState.current.castProgressMs >= totalDuration) {
                    loopState.current.castProgressMs %= totalDuration;
                    loopState.current.hasFiredThisCycle = false;
                }

                // Check Spawn (Release Logic)
                const releaseMs = currentSpell.castTime * loopState.current.releaseAt;

                // If we crossed release point and haven't fired
                if (prevMs < releaseMs && loopState.current.castProgressMs >= releaseMs && !loopState.current.hasFiredThisCycle) {
                    onSpawnProjectile(loopState.current.projectiles);
                    loopState.current.hasFiredThisCycle = true;
                }

                // Sync UI (throttling could occur here but usually 60fps React state is essentially 60fps render)
                setUiProgress(loopState.current.castProgressMs);
            }

            // Manual Cast Trigger
            if (loopState.current.castPending) {
                onSpawnProjectile(loopState.current.projectiles);
                loopState.current.castPending = false;
            }

            // Update Projectiles (Physics)
            // Note: Projectiles are in RIG SPACE (studio units). 
            // Physics should apply directly.
            const validProjectiles: any[] = [];
            loopState.current.projectiles.forEach(p => {
                p.life -= 16.66; // Fixed timestep approx or use dt? Use dt or fixed. Studio uses dt.
                // Using 16ms approx for consistency or dt? User asked to normalize coordinates.
                // Existing logic used dt/16 in some places? No, existing used simple addition?
                // Let's use simple Euler integration with dt. Note: speed is usually pixels/frame.
                // If speed is pixels/frame, we need to normalize by frame time (16ms).
                const frameScale = dt / 16.66;

                p.pos.x += p.vel.x * frameScale;
                p.pos.y += p.vel.y * frameScale;
                // Gravity
                p.vel.y += (p.gravity || 0) * frameScale;

                if (p.life > 0) validProjectiles.push(p);
            });
            loopState.current.projectiles = validProjectiles;

            rAF = requestAnimationFrame(loop);
        };

        loopState.current.lastTime = performance.now();
        rAF = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rAF);
    }, [currentSpell, onSpawnProjectile]); // Dependencies ensure loop updates if config changes

    return {
        loopState,
        uiProgress,
        isPlaying,
        play,
        pause,
        cast,
        setFrameMs,
        projectiles: loopState.current.projectiles
    };
};
