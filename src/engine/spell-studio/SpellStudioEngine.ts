import { Ally } from '../../types';
import { SpellEditorSession, ProjectileInstance, RigTransforms } from '../../game/spells/editing/SpellEditorTypes';
import { calculatePose } from './PoseCalculator';
import { calculateTrajectory, calculateSpawnPosition } from './TrajectoryMath';
import { solveIK, getArmChain } from './IKResolver';
import * as RenderPipeline from './RenderPipeline';

/**
 * Spell Studio Engine
 * Core simulation and rendering system, completely decoupled from React
 */

export class SpellStudioEngine {
    private session: SpellEditorSession;
    private projectiles: ProjectileInstance[] = [];
    private releaseAt: number = 0.4;
    private castProgressMs: number = 0;
    private playbackSpeed: number = 1.0;

    // Interaction State
    private hoveredBone: string | null = null;

    // Cached transforms
    private currentTransforms: RigTransforms = {};
    private releaseTransforms: RigTransforms = {};

    // Dummy character for rendering
    private dummyAlly: Ally = {
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
    };

    constructor(session: SpellEditorSession) {
        this.session = session;
    }

    /**
     * Update session reference
     */
    updateSession(session: SpellEditorSession): void {
        this.session = session;
    }

    /**
     * Update simulation state
     */
    update(deltaMs: number): void {
        // Update projectiles
        this.projectiles = this.projectiles.filter(p => {
            p.life -= deltaMs;
            if (p.life <= 0) return false;

            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            p.vel.y += p.gravity;

            return true;
        });
    }

    /**
     * Set playback speed
     */
    setPlaybackSpeed(speed: number): void {
        this.playbackSpeed = speed;
    }

    /**
     * Set hovered bone
     */
    setHoveredBone(bone: string | null): void {
        this.hoveredBone = bone;
    }

    /**
     * Get hovered bone
     */
    getHoveredBone(): string | null {
        return this.hoveredBone;
    }

    /**
     * Set current animation progress
     */
    setProgress(timeMs: number): void {
        this.castProgressMs = timeMs;
    }

    /**
     * Get current progress
     */
    getProgress(): number {
        return this.castProgressMs;
    }

    /**
     * Set release point (0-1)
     */
    setReleaseAt(value: number): void {
        this.releaseAt = value;
    }

    /**
     * Get release point
     */
    getReleaseAt(): number {
        return this.releaseAt;
    }

    /**
     * Cast spell (spawn projectile)
     */
    cast(): void {
        const handKey = this.session.ik.chain === 'RIGHT' ? 'hand_r' : 'hand_l';
        const handTransform = this.currentTransforms[handKey];

        let spawnX = 0, spawnY = 0;

        if (handTransform) {
            spawnX = handTransform.x;
            spawnY = handTransform.y;
        } else {
            // Fallback to aim angle
            spawnX = Math.cos(this.session.canvas.aimAngle) * 40;
            spawnY = Math.sin(this.session.canvas.aimAngle) * 40 - 20;
        }

        const offX = this.session.spell.data?.spawnOffset?.x ?? 0;
        const offY = this.session.spell.data?.spawnOffset?.y ?? 0;
        const speed = this.session.spell.baseStats?.projectileSpeed || 10;

        this.projectiles.push({
            id: Date.now(),
            type: this.session.spell.spellKey,
            pos: { x: spawnX + offX, y: spawnY + offY },
            vel: {
                x: Math.cos(this.session.canvas.aimAngle) * speed,
                y: Math.sin(this.session.canvas.aimAngle) * speed
            },
            gravity: this.session.spell.geometry?.usesGravity ? 0.5 : 0,
            life: (this.session.spell.baseStats?.projectileLifetime || 2) * 1000
        });
    }

    /**
     * Clear all projectiles
     */
    clearProjectiles(): void {
        this.projectiles = [];
    }

    /**
     * Get current projectiles
     */
    getProjectiles(): ProjectileInstance[] {
        return this.projectiles;
    }

    /**
     * Calculate current pose transforms
     */
    private calculateCurrentPose(): RigTransforms {
        const parts = calculatePose({
            timeMs: this.castProgressMs,
            aimAngle: this.session.canvas.aimAngle,
            animationId: this.session.timeline.selectedAnim
        });

        const mockCtx = RenderPipeline.createMockContext();

        const transforms = RenderPipeline.renderCharacter(
            {
                ctx: mockCtx,
                width: 0,
                height: 0,
                centerX: 0,
                centerY: 0,
                zoom: 1
            },
            {
                ally: this.dummyAlly,
                rigData: this.session.rig.rigData,
                parts,
                showDebug: false
            }
        );

        // Apply IK if enabled
        if (this.session.ik.enabled) {
            const chain = getArmChain(this.session.ik.chain);
            const ikTransforms = solveIK({
                chain,
                target: this.session.ik.target,
                currentTransforms: transforms
            });

            return { ...transforms, ...ikTransforms };
        }

        return transforms;
    }

    /**
     * Calculate pose for a specific time offset (for onion skinning)
     */
    private calculateOffsetPose(offsetMs: number): RigTransforms {
        const parts = calculatePose({
            timeMs: offsetMs,
            aimAngle: this.session.canvas.aimAngle,
            animationId: this.session.timeline.selectedAnim
        });

        const mockCtx = RenderPipeline.createMockContext();

        return RenderPipeline.renderCharacter(
            {
                ctx: mockCtx,
                width: 0,
                height: 0,
                centerX: 0,
                centerY: 0,
                zoom: 1
            },
            {
                ally: this.dummyAlly,
                rigData: this.session.rig.rigData,
                parts,
                showDebug: false
            }
        );
    }

    /**
     * Calculate release pose transforms
     */
    private calculateReleasePose(): RigTransforms {
        const releaseMs = (this.session.spell.baseStats?.castTime || 0.5) * 1000 * this.releaseAt;
        const parts = calculatePose({
            timeMs: releaseMs,
            aimAngle: this.session.canvas.aimAngle,
            animationId: this.session.timeline.selectedAnim
        });

        const mockCtx = RenderPipeline.createMockContext();

        return RenderPipeline.renderCharacter(
            {
                ctx: mockCtx,
                width: 0,
                height: 0,
                centerX: 0,
                centerY: 0,
                zoom: 1
            },
            {
                ally: this.dummyAlly,
                rigData: this.session.rig.rigData,
                parts,
                showDebug: false
            }
        );
    }

    /**
     * Get spawn position in rig space
     */
    getSpawnPosition(): { x: number; y: number } {
        const handKey = this.session.ik.chain === 'RIGHT' ? 'hand_r' : 'hand_l';
        const releaseHand = this.releaseTransforms[handKey];

        let rx = 0, ry = 0;

        if (releaseHand) {
            rx = releaseHand.x;
            ry = releaseHand.y;
        } else {
            rx = Math.cos(this.session.canvas.aimAngle) * 40;
            ry = Math.sin(this.session.canvas.aimAngle) * 40 - 20;
        }

        const offX = this.session.spell.data?.spawnOffset?.x ?? 0;
        const offY = this.session.spell.data?.spawnOffset?.y ?? 0;

        return { x: rx + offX, y: ry + offY };
    }

    /**
     * Get current transforms (for external use)
     */
    getCurrentTransforms(): RigTransforms {
        return this.currentTransforms;
    }

    /**
     * Main render function
     */
    render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        const { canvas, spell, rig } = this.session;

        // Calculate center with pan
        const centerX = width / 2 + canvas.pan.x;
        const centerY = height / 2 + 50 + canvas.pan.y;

        const renderCtx: RenderPipeline.RenderContext = {
            ctx,
            width,
            height,
            centerX,
            centerY,
            zoom: canvas.zoom
        };

        // Clear
        RenderPipeline.clearCanvas(ctx, width, height);

        // Grid
        RenderPipeline.renderGrid(renderCtx, {
            show: canvas.showGrid,
            gridSize: 50,
            color: '#2a2a30',
            axisColor: '#3f3f46'
        });

        // --- ONION SKINNING ---
        if (canvas.showOnionSkin) {
            const frameTime = 1000 / 60 * this.playbackSpeed * 4;

            // Prev Frame
            const prevTime = Math.max(0, this.castProgressMs - frameTime);
            const prevParts = calculatePose({
                timeMs: prevTime,
                aimAngle: canvas.aimAngle,
                animationId: this.session.timeline.selectedAnim
            });

            ctx.save();
            ctx.globalAlpha = 0.3;
            RenderPipeline.renderCharacter(renderCtx, {
                ally: this.dummyAlly,
                rigData: { ...rig.rigData, scale: (rig.rigData.scale || 1) * canvas.zoom },
                parts: prevParts,
                showDebug: false
            });

            // Next Frame
            const nextTime = this.castProgressMs + frameTime;
            const nextParts = calculatePose({
                timeMs: nextTime,
                aimAngle: canvas.aimAngle,
                animationId: this.session.timeline.selectedAnim
            });

            RenderPipeline.renderCharacter(renderCtx, {
                ally: this.dummyAlly,
                rigData: { ...rig.rigData, scale: (rig.rigData.scale || 1) * canvas.zoom },
                parts: nextParts,
                showDebug: false
            });
            ctx.restore();
        }

        // Calculate poses
        this.currentTransforms = this.calculateCurrentPose();
        this.releaseTransforms = this.calculateReleasePose();

        // Render character (Current)
        const currentParts = calculatePose({
            timeMs: this.castProgressMs,
            aimAngle: canvas.aimAngle,
            animationId: this.session.timeline.selectedAnim
        });

        const renderParts = { ...currentParts };
        if (this.session.ik.enabled) {
            Object.entries(this.currentTransforms).forEach(([key, t]) => {
                if (renderParts[key]) {
                    renderParts[key].rotation = t.rotation; // Apply IK solved rotations
                }
            });
        }

        RenderPipeline.renderCharacter(renderCtx, {
            ally: this.dummyAlly,
            rigData: { ...rig.rigData, scale: (rig.rigData.scale || 1) * canvas.zoom },
            parts: renderParts,
            showDebug: false // We handle debug separately below for better control
        });

        // --- BONE DEBUG & HOVER ---
        if (canvas.showBoneDebug) {
            RenderPipeline.renderBoneHierarchy(renderCtx, {
                transforms: this.currentTransforms,
                hoveredBone: this.hoveredBone,
                selectedBone: rig.selectedPart
            });
        }

        // --- HITBOXES ---
        if (canvas.showHitboxes) {
            RenderPipeline.renderHitboxes(renderCtx, {
                hitboxes: spell.hitboxes || [],
                currentFrame: Math.floor(this.castProgressMs / 16.666),
                transforms: this.currentTransforms
            });
        }

        // Trajectory preview
        if (canvas.previewPath) {
            const spawnPos = this.getSpawnPosition();
            const trajectory = calculateTrajectory({
                startPos: spawnPos,
                angle: canvas.aimAngle,
                speed: spell.baseStats?.projectileSpeed || 10,
                gravity: spell.geometry?.usesGravity ? 0.5 : 0,
                maxSteps: 30
            });

            RenderPipeline.renderTrajectoryPath(renderCtx, {
                trajectoryPoints: trajectory,
                spawnPos,
                spellType: spell.spellKey || spell.element,
                color: '#06b6d4'
            });
        }

        // Projectiles
        RenderPipeline.renderProjectiles(renderCtx, {
            projectiles: this.projectiles
        });

        // Dummy enemies
        RenderPipeline.renderDummyEnemies(renderCtx, {
            show: canvas.showDummyEnemies,
            aimAngle: canvas.aimAngle,
            distances: [150, 250, 350]
        });
    }
}
