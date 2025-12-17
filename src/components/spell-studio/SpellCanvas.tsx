import React, { useRef, useEffect, useState } from 'react';
import { SpellDefinition, Ally } from '../../types';
import { renderSkeletalNPC } from '../../utils/renderers/allies/renderSkeletalNPC';
import { calculatePoseForTime } from '../../utils/animationUtils';
import { BEHAVIOR_REGISTRY } from '../../modules/spells/BehaviorRegistry';
import { SPELL_REGISTRY } from '../../modules/spells/SpellRegistry';

interface SpellCanvasProps {
    currentSpell: SpellDefinition;
    setCurrentSpell: (s: SpellDefinition) => void;

    loopStateRef: React.MutableRefObject<any>;

    rigData: any;
    setRigData: (d: any) => void;
    selectedPart: string;
    setSelectedPart: (p: string) => void;

    activeTab: string;
    previewPath: boolean;
    showHitboxes: boolean;
    showDummyEnemies: boolean;
    showBoneDebug: boolean;
    spellPreviewMode: string;
    showGrid: boolean;
    onionSkin: boolean;

    ikEnabled: boolean;
    ikTarget: { x: number, y: number };
    setIkTarget: (v: { x: number, y: number }) => void;
    ikChain: 'LEFT' | 'RIGHT';

    zoom: number;
    pan: { x: number, y: number };
    setPan: (p: { x: number, y: number }) => void;

    aimAngle: number;
    setAimAngle: (a: number) => void;

    // Output Ref for parent loop
    partTransformsRef?: React.MutableRefObject<any>;
}

export const SpellCanvas: React.FC<SpellCanvasProps> = ({
    currentSpell, setCurrentSpell, loopStateRef,
    rigData, setRigData, selectedPart, setSelectedPart,
    activeTab, previewPath, showHitboxes, showDummyEnemies, showBoneDebug, spellPreviewMode, showGrid, onionSkin,
    ikEnabled, ikTarget, setIkTarget, ikChain,
    zoom, pan, setPan, aimAngle, setAimAngle,
    partTransformsRef
}) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ghostSpawnPosRef = useRef({ x: 0, y: 0 }); // RIG SPACE
    const dummyAllyRef = useRef<Ally>({
        id: 'dummy_studio',
        name: 'Studio',
        pos: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 16,
        isDead: false,
        colorScheme: {
            skin: '#f4a460',
            shirt: '#4a5568',
            pants: '#2d3748'
        },
        description: 'Studio Preview Character'
    });

    const [dragMode, setDragMode] = useState<'NONE' | 'PAN' | 'DRAG_PART' | 'DRAG_IK' | 'DRAG_SPAWN'>('NONE');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const drawScene = () => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        const centerX = cvs.width / 2 + pan.x;
        const centerY = cvs.height / 2 + 50 + pan.y;

        // Grid (Screen Space Drawing)
        if (showGrid) {
            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const gridSize = 50 * zoom;
            for (let x = centerX % gridSize; x < cvs.width; x += gridSize) {
                ctx.moveTo(x, 0); ctx.lineTo(x, cvs.height);
            }
            for (let y = centerY % gridSize; y < cvs.height; y += gridSize) {
                ctx.moveTo(0, y); ctx.lineTo(cvs.width, y);
            }
            ctx.stroke();
            // Axis
            ctx.strokeStyle = '#3f3f46';
            ctx.beginPath();
            ctx.moveTo(centerX, 0); ctx.lineTo(centerX, cvs.height);
            ctx.moveTo(0, centerY); ctx.lineTo(cvs.width, centerY);
            ctx.stroke();
        }

        // Mock CTX for Logic Calculates
        const mockCtx = {
            save: () => { }, restore: () => { }, translate: () => { }, rotate: () => { }, scale: () => { },
            beginPath: () => { }, moveTo: () => { }, lineTo: () => { }, stroke: () => { }, fill: () => { },
            arc: () => { }, ellipse: () => { }, fillText: () => { }, drawImage: () => { }, transform: () => { }, setTransform: () => { },
            createLinearGradient: () => ({ addColorStop: () => { } }), measureText: () => ({ width: 0 }),
            closePath: () => { }, rect: () => { }, clip: () => { }, globalAlpha: 1, fillStyle: '', strokeStyle: '',
            lineWidth: 1, shadowColor: '', shadowBlur: 0
        } as any;

        // --- RELEASE POSE (RIG SPACE) ---
        const releaseMs = currentSpell.castTime * loopStateRef.current.releaseAt;
        const releaseParts = calculatePoseForTime(releaseMs, 0);
        // Normalized: Center=0,0, Rotation=0?, Scale=1 (No Zoom)
        const releaseTransforms = renderSkeletalNPC(mockCtx, dummyAllyRef.current, 0, 0, {
            ...rigData, parts: releaseParts, scale: 1
        }, false, false);

        // --- CURRENT POSE (RIG SPACE) ---
        const currentParts = calculatePoseForTime(loopStateRef.current.castProgressMs, 0);
        const rigTransforms = renderSkeletalNPC(mockCtx, dummyAllyRef.current, 0, 0, {
            ...rigData, parts: currentParts, scale: 1
        }, false, false);

        // Write to Ref for Parent
        if (partTransformsRef) partTransformsRef.current = rigTransforms;

        // --- RENDER CHARACTER (SCREEN SPACE) ---
        // We can either transform Rig Space points manually OR call renderSkeletalNPC with ctx + zoom.
        // Calling renderSkeletalNPC is standard for drawing images/sprites efficiently.
        renderSkeletalNPC(ctx, dummyAllyRef.current, centerX, centerY, {
            ...rigData, parts: currentParts, scale: (rigData.scale || 1) * zoom
        }, true, false);

        // --- PATH PREVIEW (RIG SPACE LOGIC -> SCREEN RENDER) ---
        if (previewPath) {
            const handKey = ikChain === 'RIGHT' ? 'hand_r' : 'hand_l';
            let rx = 0, ry = 0; // Rig Space
            if (releaseTransforms && releaseTransforms[handKey]) {
                rx = releaseTransforms[handKey].x;
                ry = releaseTransforms[handKey].y;
            } else {
                rx += Math.cos(aimAngle) * 40;
                ry += Math.sin(aimAngle) * 40 - 20;
            }

            // Apply Offset (Rig Space)
            const offX = (currentSpell.projectile?.spawnOffset?.x ?? 0);
            const offY = (currentSpell.projectile?.spawnOffset?.y ?? 0);
            rx += offX; ry += offY;

            // Update Ghost Ref (Rig Space)
            ghostSpawnPosRef.current = { x: rx, y: ry };

            // Render to Screen
            const sx = centerX + rx * zoom;
            const sy = centerY + ry * zoom;

            ctx.save();
            ctx.strokeStyle = '#06b6d4';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sx, sy);

            // Trajectory
            let px = rx, py = ry; // Rig Simulation
            const speed = (currentSpell.projectile?.speed || 10);
            let vx = Math.cos(aimAngle) * speed;
            let vy = Math.sin(aimAngle) * speed;
            const grav = (currentSpell.projectile?.gravity || 0);

            for (let i = 0; i < 30; i++) {
                px += vx; py += vy; vy += grav;
                // Draw line to Screen Pos
                ctx.lineTo(centerX + px * zoom, centerY + py * zoom);
            }
            ctx.stroke();
            ctx.restore();

            // Draw Ghost Visual
            const spellType = currentSpell.spellKey || currentSpell.element;
            const behaviorKey = SPELL_REGISTRY[spellType]?.behaviorKey || 'GenericBehavior';
            const behavior = BEHAVIOR_REGISTRY[behaviorKey];
            if (behavior?.onRender) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                behavior.onRender(ctx, {
                    type: spellType, pos: { x: sx, y: sy }, vel: { x: 0, y: 0 }, life: 1000, id: -1
                } as any, sx, sy);
                ctx.restore();
            }

            // Crosshair
            ctx.save();
            ctx.translate(sx, sy);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
            ctx.restore();
        }

        // --- PROJECTILES ---
        loopStateRef.current.projectiles.forEach((p: any) => {
            const px = centerX + (p.pos.x * zoom);
            const py = centerY + (p.pos.y * zoom);

            const behaviorKey = SPELL_REGISTRY[p.type]?.behaviorKey || 'GenericBehavior';
            const behavior = BEHAVIOR_REGISTRY[behaviorKey];
            if (behavior?.onRender) {
                ctx.save();
                behavior.onRender(ctx, { ...p, pos: { x: px, y: py } } as any, px, py);
                ctx.restore();
            } else {
                ctx.fillStyle = 'orange';
                ctx.beginPath(); ctx.arc(px, py, 5 * zoom, 0, Math.PI * 2); ctx.fill();
            }
        });

        // --- DUMMIES ---
        if (showDummyEnemies) {
            [150, 250, 350].forEach((d, i) => {
                const ex = centerX + Math.cos(aimAngle) * d * zoom;
                const ey = centerY + Math.sin(aimAngle) * d * zoom;
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath(); ctx.arc(ex, ey, (20 + i * 5) * zoom, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = 'white'; ctx.fillText(`Enemy ${i + 1}`, ex - 10, ey);
            });
        }
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = canvasRef.current.width / 2 + pan.x;
        const centerY = canvasRef.current.height / 2 + 50 + pan.y;

        // Mouse in Rig Space
        const mx = (e.clientX - rect.left - centerX) / zoom;
        const my = (e.clientY - rect.top - centerY) / zoom;

        // Check Drag Spawn
        if (previewPath || activeTab === 'SPELL') {
            const { x: sx, y: sy } = ghostSpawnPosRef.current; // Rig Space
            if (Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2) < 20 / zoom) { // 20px hit radius scaled? Or fixed screen pixels? 
                // Hit testing is usually easier in Screen Space. 
                // But if we use Rig Space: distance < 20/zoom.
                setDragMode('DRAG_SPAWN');
                setDragStart({ x: e.clientX, y: e.clientY }); // Screen Drag Start
                return;
            }
        }

        setDragMode('PAN');
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current || dragMode === 'NONE') return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        if (dragMode === 'PAN') {
            setPan({ x: pan.x + dx, y: pan.y + dy });
        } else if (dragMode === 'DRAG_SPAWN') {
            const curX = currentSpell.projectile?.spawnOffset?.x ?? 0;
            const curY = currentSpell.projectile?.spawnOffset?.y ?? 0;

            // dx/dy are Screen Deltas. Convert to Rig Space Delta.
            setCurrentSpell({
                ...currentSpell,
                projectile: {
                    ...currentSpell.projectile!,
                    spawnOffset: { x: curX + dx / zoom, y: curY + dy / zoom }
                }
            });
        }
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const onMouseUp = () => setDragMode('NONE');
    const onMouseLeave = () => setDragMode('NONE');

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;

        // Set canvas size to match container
        const updateSize = () => {
            const parent = cvs.parentElement;
            if (parent) {
                cvs.width = parent.clientWidth;
                cvs.height = parent.clientHeight;
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        let rAF: number;
        const render = () => {
            drawScene();
            rAF = requestAnimationFrame(render);
        };
        render();
        return () => {
            cancelAnimationFrame(rAF);
            window.removeEventListener('resize', updateSize);
        };
    });

    return (
        <canvas
            ref={canvasRef}
            className="flex-1 w-full h-full bg-[#18181b] cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        />
    );
};
