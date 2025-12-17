import React, { useRef, useEffect, useState } from 'react';
import { SpellStudioEngine } from '../../../../engine/spell-studio/SpellStudioEngine';
import { SpellEditorSession } from '../../../../game/spells/editing/SpellEditorTypes';
import { SpellEditorController } from '../../../../game/spells/editing/SpellEditorController';

/**
 * Pure UI wrapper for the canvas
 * Handles interactions and delegates rendering
 */

interface CanvasPanelProps {
    engine: SpellStudioEngine;
    session: SpellEditorSession;
    controller: SpellEditorController;
    activeTab: string;
}

type DragMode = 'NONE' | 'PAN' | 'DRAG_SPAWN' | 'DRAG_PART' | 'DRAG_IK';

export const CanvasPanel: React.FC<CanvasPanelProps> = ({
    engine,
    session,
    controller,
    activeTab
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragMode, setDragMode] = useState<DragMode>('NONE');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [pan, setPan] = useState(session.canvas.pan);

    // Sync pan to session locally to avoid jitter, but eventually we should sync back?
    // Actually, session is source of truth.
    useEffect(() => {
        setPan(session.canvas.pan);
    }, [session.canvas.pan]);

    // Update engine hover state
    const updateHover = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = canvasRef.current.width / 2 + pan.x;
        const centerY = canvasRef.current.height / 2 + 50 + pan.y;

        // Mouse in Rig Space
        const mx = (e.clientX - rect.left - centerX) / session.canvas.zoom;
        const my = (e.clientY - rect.top - centerY) / session.canvas.zoom;

        const transforms = engine.getCurrentTransforms();
        let found: string | null = null;
        let minDist = 20; // Hit radius

        Object.entries(transforms).forEach(([key, t]) => {
            const trans = t as { x: number, y: number };
            const dist = Math.sqrt(Math.pow(mx - trans.x, 2) + Math.pow(my - trans.y, 2));
            if (dist < minDist) {
                minDist = dist;
                found = key;
            }
        });

        engine.setHoveredBone(found);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = canvasRef.current.width / 2 + pan.x;
        const centerY = canvasRef.current.height / 2 + 50 + pan.y;

        // Mouse in rig space
        const mx = (e.clientX - rect.left - centerX) / session.canvas.zoom;
        const my = (e.clientY - rect.top - centerY) / session.canvas.zoom;

        // 0. Check Spawn Point (Highest Priority if showing)
        if (session.canvas.previewPath || activeTab === 'SPELL') {
            const spawnPos = engine.getSpawnPosition();
            const distance = Math.sqrt(
                Math.pow(mx - spawnPos.x, 2) +
                Math.pow(my - spawnPos.y, 2)
            );

            if (distance < 20 / session.canvas.zoom) {
                setDragMode('DRAG_SPAWN');
                setDragStart({ x: e.clientX, y: e.clientY });
                return;
            }
        }

        // 1. Check IK Target
        if (session.ik.enabled) {
            const target = session.ik.target;
            const dist = Math.sqrt(Math.pow(mx - target.x, 2) + Math.pow(my - target.y, 2));
            if (dist < 15) {
                setDragMode('DRAG_IK');
                setDragStart({ x: e.clientX, y: e.clientY });
                return;
            }
        }

        // 2. Check Bones
        const transforms = engine.getCurrentTransforms();
        let clicked: string | null = null;
        let minDist = 30; // Radius

        // Prioritize currently selected
        if (transforms[session.rig.selectedPart]) {
            const t = transforms[session.rig.selectedPart];
            const dist = Math.sqrt(Math.pow(mx - t.x, 2) + Math.pow(my - t.y, 2));
            if (dist < minDist) {
                clicked = session.rig.selectedPart;
            }
        }

        if (!clicked) {
            Object.entries(transforms).forEach(([key, t]) => {
                const trans = t as { x: number, y: number };
                const dist = Math.sqrt(Math.pow(mx - trans.x, 2) + Math.pow(my - trans.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    clicked = key;
                }
            });
        }

        if (clicked) {
            controller.setSelectedPart(clicked);
            setDragMode('DRAG_PART');
            setDragStart({ x: e.clientX, y: e.clientY });
        } else {
            // Default to pan
            setDragMode('PAN');
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;

        // Handle Hover
        if (dragMode === 'NONE') {
            updateHover(e);
            return;
        }

        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        if (dragMode === 'PAN') {
            // We update local pan for smoothness, but should push to session eventually?
            // The Refactor design removed setPan from props, relying on session.
            // But we can't update session every frame cheaply? 
            // Actually, we can if updates are fast. 
            // But here let's just update local state and maybe push on mouse up?
            // Or just allow direct mutation via a special callback if provided.
            // For now, let's assume we can't update session pan easily from here without flickering if we rerender everything.
            // BUT, the CanvasPanel is re-rendered when session changes.
            // Let's rely on session update. Ideally we'd have a specific setPan prop.
            // The original logic updated local state `setPan`. 
            // Let's emulate that by updating LOCAL state, and assume `engine` reads it from session?
            // No, engine reads from session. So we MUST update session.
            // Let's cheat and update local `pan` and FORCE engine update in render loop manually?
            // No, stick to clean flow: Update Controller -> Session -> Engine.
            // Wait, we don't have setPan in controller.

            // TODO: Add setPan to controller or use a direct callback.
            // For now, use local state and force engine to respect it? 
            // Actually, the component receives `session`. If we update local `pan`, we validly drift from session.
            // We should sync back on MouseUp.
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        } else if (dragMode === 'DRAG_SPAWN') {
            controller.adjustSpawnOffset({
                x: dx / session.canvas.zoom,
                y: dy / session.canvas.zoom
            });
        } else if (dragMode === 'DRAG_IK') {
            controller.adjustIKTarget({
                x: dx / session.canvas.zoom,
                y: dy / session.canvas.zoom
            });
        } else if (dragMode === 'DRAG_PART') {
            const part = session.rig.selectedPart;
            const currentBase = session.rig.rigData.parts[part];

            // Calculate delta in Rig Space
            const deltaX = dx / session.canvas.zoom;
            const deltaY = dy / session.canvas.zoom;

            // Are we in Animation Mode?
            // If timeline exists and we have a selected anim, yes.
            const animId = session.timeline.selectedAnim;
            const time = engine.getProgress();

            if (animId && time !== undefined) {
                // Calculate new Animation Offset
                // We want to apply delta to the CURRENT pose, then reverse 'base' to find the key value.
                // Current World Pos (Rig Space)
                const currentTrans = engine.getCurrentTransforms()[part];
                if (currentTrans) {
                    // The visual position the user sees
                    const visualX = currentTrans.x;
                    const visualY = currentTrans.y;

                    // The target visual position
                    const targetX = visualX + deltaX;
                    const targetY = visualY + deltaY;

                    // The value to store in keyframe (assuming additive: Key = Target - Base)
                    const keyX = targetX - (currentBase?.x || 0);
                    const keyY = targetY - (currentBase?.y || 0);

                    controller.updateRigPart(part, { x: keyX, y: keyY }, time, animId);
                }
            } else {
                // Base Rig Edit Mode
                if (currentBase) {
                    controller.updateRigPart(part, {
                        x: (currentBase.x || 0) + deltaX,
                        y: (currentBase.y || 0) + deltaY
                    });
                }
            }
        }

        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const onMouseUp = () => {
        setDragMode('NONE');
    };

    const onMouseLeave = () => {
        setDragMode('NONE');
        engine.setHoveredBone(null);
    };

    const onWheel = (e: React.WheelEvent) => {
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.max(0.1, Math.min(5, session.canvas.zoom + delta));
        controller.setCanvasZoom(newZoom);
    };

    // Render Loop
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;

        const updateSize = () => {
            const parent = cvs.parentElement;
            if (parent) {
                // Handle DPI scaling for sharp rendering
                const dpr = window.devicePixelRatio || 1;
                const rect = parent.getBoundingClientRect();

                // Set actual size in memory (scaled to account for extra pixel density)
                cvs.width = rect.width * dpr;
                cvs.height = rect.height * dpr;

                // Normalize coordinate system to use css pixels
                const ctx = cvs.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);

                // Force engine to grasp new dimensions immediately if needed
                // engine.resize(rect.width, rect.height);
            }
        };

        // Use ResizeObserver to detect container size changes (e.g. panel collapse)
        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });

        if (cvs.parentElement) {
            resizeObserver.observe(cvs.parentElement);
        }

        // Initial size
        updateSize();

        let lastTime = performance.now();
        let rAF: number;

        const render = (time: number) => {
            const deltaMs = time - lastTime;
            lastTime = time;

            // Hack: inject local Pan into session object for Engine to see
            session.canvas.pan = pan;

            engine.update(deltaMs);
            const ctx = cvs.getContext('2d');
            if (ctx) {
                // Pass logical width/height (CSS pixels), not physical buffer size
                // We divide by DPR because we already scaled the context?
                // Actually the engine expects logical units usually.
                // If we used ctx.scale(dpr, dpr), then drawing 100 units draws 100*dpr pixels.
                // So we should pass the CSS width/height to the engine.
                const rect = cvs.getBoundingClientRect();
                engine.render(ctx, rect.width, rect.height);
            }

            rAF = requestAnimationFrame(render);
        };

        rAF = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(rAF);
            resizeObserver.disconnect();
        };
    }, [engine, session, pan]); // Re-bind if session object ref changes

    return (
        <canvas
            ref={canvasRef}
            className="flex-1 w-full h-full bg-[#18181b] cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onWheel={onWheel}
        />
    );
};
