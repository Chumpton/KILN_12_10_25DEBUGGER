import { Ally, HitboxDefinition } from '../../types';
import { renderSkeletalNPC } from '../../utils/renderers/allies/renderSkeletalNPC';
import { BEHAVIOR_REGISTRY } from '../../modules/spells/BehaviorRegistry';
import { SPELL_REGISTRY } from '../../modules/spells/SpellRegistry';
import { RigTransforms, ProjectileInstance } from '../../game/spells/editing/SpellEditorTypes';
import { TrajectoryPoint } from './TrajectoryMath';

/**
 * Pure rendering pipeline for Spell Studio
 * All drawing operations, no state management
 */

export interface RenderContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    zoom: number;
}

export interface GridRenderOptions {
    show: boolean;
    gridSize: number;
    color: string;
    axisColor: string;
}

export interface CharacterRenderOptions {
    ally: Ally;
    rigData: any;
    parts: any;
    showDebug: boolean;
}

export interface PathRenderOptions {
    trajectoryPoints: TrajectoryPoint[];
    spawnPos: TrajectoryPoint;
    spellType: string;
    color: string;
}

export interface ProjectileRenderOptions {
    projectiles: ProjectileInstance[];
}

export interface DummyEnemyRenderOptions {
    show: boolean;
    aimAngle: number;
    distances: number[];
}

export interface BoneHierarchyOptions {
    transforms: RigTransforms;
    hoveredBone: string | null;
    selectedBone: string;
}

export interface HitboxRenderOptions {
    hitboxes: HitboxDefinition[];
    currentFrame: number;
    transforms: RigTransforms;
}

const BONE_HIERARCHY: [string, string][] = [
    ['torso', 'head'],
    ['torso', 'arm_l'], ['arm_l', 'hand_l'],
    ['torso', 'arm_r'], ['arm_r', 'hand_r'],
    ['torso', 'leg_l'], ['leg_l', 'foot_l'],
    ['torso', 'leg_r'], ['leg_r', 'foot_r']
];

/**
 * Clear canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height); // usage of clearRect preferred over fillRect for transparency
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);
}

/**
 * Render grid and axes
 */
export function renderGrid(renderCtx: RenderContext, options: GridRenderOptions): void {
    if (!options.show) return;

    const { ctx, width, height, centerX, centerY, zoom } = renderCtx;
    const gridSize = options.gridSize * zoom;

    ctx.strokeStyle = options.color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    for (let x = centerX % gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = centerY % gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.stroke();

    // Axes
    ctx.strokeStyle = options.axisColor;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
}

/**
 * Render character with skeletal rig
 */
export function renderCharacter(
    renderCtx: RenderContext,
    options: CharacterRenderOptions
): RigTransforms {
    const { ctx, centerX, centerY, zoom } = renderCtx;
    const { ally, rigData, parts, showDebug } = options;

    // Render and return transforms
    return renderSkeletalNPC(
        ctx,
        ally,
        centerX,
        centerY,
        {
            ...rigData,
            parts,
            scale: (rigData.scale || 1) * zoom
        },
        true,
        showDebug
    );
}

/**
 * Render trajectory path preview
 */
export function renderTrajectoryPath(
    renderCtx: RenderContext,
    options: PathRenderOptions
): void {
    const { ctx, centerX, centerY, zoom } = renderCtx;
    const { trajectoryPoints, spawnPos, spellType, color } = options;

    if (trajectoryPoints.length === 0) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Start at spawn position
    const sx = centerX + spawnPos.x * zoom;
    const sy = centerY + spawnPos.y * zoom;
    ctx.moveTo(sx, sy);

    // Draw trajectory
    trajectoryPoints.forEach(point => {
        const px = centerX + point.x * zoom;
        const py = centerY + point.y * zoom;
        ctx.lineTo(px, py);
    });

    ctx.stroke();
    ctx.restore();

    // Render ghost projectile at spawn
    const config = SPELL_REGISTRY[spellType];
    const behavior = BEHAVIOR_REGISTRY[config?.behaviorKey || 'GenericBehavior'];
    if (behavior?.onRender) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        behavior.onRender(
            ctx,
            {
                type: spellType,
                pos: { x: sx, y: sy },
                vel: { x: 0, y: 0 },
                life: 1000,
                id: -1
            } as any,
            sx,
            sy
        );
        ctx.restore();
    }

    // Render crosshair at spawn
    renderCrosshair(ctx, sx, sy, '#22d3ee');
}

/**
 * Render crosshair at position
 */
export function renderCrosshair(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();

    ctx.restore();
}

/**
 * Render active projectiles
 */
export function renderProjectiles(
    renderCtx: RenderContext,
    options: ProjectileRenderOptions
): void {
    const { ctx, centerX, centerY, zoom } = renderCtx;
    const { projectiles } = options;

    projectiles.forEach(projectile => {
        const px = centerX + projectile.pos.x * zoom;
        const py = centerY + projectile.pos.y * zoom;

        const config = SPELL_REGISTRY[projectile.type];
        const behavior = BEHAVIOR_REGISTRY[config?.behaviorKey || 'GenericBehavior'];
        if (behavior?.onRender) {
            ctx.save();
            behavior.onRender(
                ctx,
                { ...projectile, pos: { x: px, y: py } } as any,
                px,
                py
            );
            ctx.restore();
        } else {
            // Fallback rendering
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(px, py, 5 * zoom, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

/**
 * Render dummy enemies for testing
 */
export function renderDummyEnemies(
    renderCtx: RenderContext,
    options: DummyEnemyRenderOptions
): void {
    if (!options.show) return;

    const { ctx, centerX, centerY, zoom } = renderCtx;
    const { aimAngle, distances } = options;

    distances.forEach((distance, index) => {
        const ex = centerX + Math.cos(aimAngle) * distance * zoom;
        const ey = centerY + Math.sin(aimAngle) * distance * zoom;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(ex, ey, (20 + index * 5) * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.fillText(`Enemy ${index + 1}`, ex - 10, ey);
    });
}

/**
 * Render bone hierarchy and debug visuals
 */
export function renderBoneHierarchy(
    renderCtx: RenderContext,
    options: BoneHierarchyOptions
): void {
    const { ctx, zoom } = renderCtx;
    const { transforms, hoveredBone, selectedBone } = options;

    ctx.save();
    ctx.lineWidth = 1;

    // Draw Connections
    BONE_HIERARCHY.forEach(([parent, child]) => {
        const pT = transforms[parent];
        const cT = transforms[child];
        if (pT && cT) {
            ctx.strokeStyle = (hoveredBone === parent || hoveredBone === child)
                ? '#facc15'
                : 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = (hoveredBone === parent || hoveredBone === child) ? 2 : 1;

            ctx.beginPath();
            ctx.moveTo(pT.x, pT.y);
            ctx.lineTo(cT.x, cT.y);
            ctx.stroke();
        }
    });

    // Draw Pivots
    Object.keys(transforms).forEach((key) => {
        const t = transforms[key];
        const isHovered = hoveredBone === key;
        const isSelected = selectedBone === key;

        ctx.fillStyle = isSelected
            ? '#3b82f6'
            : (isHovered ? '#facc15' : 'rgba(255, 255, 0, 0.6)');

        ctx.beginPath();
        ctx.arc(t.x, t.y, isHovered ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();

        if (isHovered || isSelected) {
            // Label
            ctx.fillStyle = 'white';
            ctx.font = '10px sans-serif';
            ctx.fillText(key, t.x + 8, t.y - 8);
        }
    });

    ctx.restore();
}

/**
 * Render hitboxes
 */
export function renderHitboxes(
    renderCtx: RenderContext,
    options: HitboxRenderOptions
): void {
    const { ctx, zoom, centerX, centerY } = renderCtx;
    const { hitboxes, currentFrame, transforms } = options;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.lineWidth = 2;

    hitboxes.forEach(hb => {
        // Frame Check
        if (currentFrame < hb.startFrame || currentFrame > hb.endFrame) return;

        ctx.save();
        if (hb.attachedToBone && transforms[hb.attachedToBone]) {
            // Bone Attached
            const t = transforms[hb.attachedToBone];
            ctx.translate(t.x, t.y);
            if (t.rotation) ctx.rotate(t.rotation);

            // Draw relative to bone
            const drawX = hb.offsetX * zoom;
            const drawY = hb.offsetY * zoom;
            const w = hb.width * zoom;
            const h = hb.height * zoom;

            if (hb.shape === 'CIRCLE') {
                ctx.beginPath();
                ctx.arc(drawX, drawY, w, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(drawX - w / 2, drawY - h / 2, w, h);
                ctx.strokeRect(drawX - w / 2, drawY - h / 2, w, h);
            }
        } else {
            // Relative to Center
            const drawX = centerX + hb.offsetX * zoom;
            const drawY = centerY + hb.offsetY * zoom;
            const w = hb.width * zoom;
            const h = hb.height * zoom;

            if (hb.shape === 'CIRCLE') {
                ctx.beginPath();
                ctx.arc(drawX, drawY, w, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(drawX - w / 2, drawY - h / 2, w, h);
                ctx.strokeRect(drawX - w / 2, drawY - h / 2, w, h);
            }
        }
        ctx.restore();
    });

    ctx.restore();
}

/**
 * Create a mock context for calculations (no actual drawing)
 */
export function createMockContext(): CanvasRenderingContext2D {
    return {
        save: () => { },
        restore: () => { },
        translate: () => { },
        rotate: () => { },
        scale: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        fill: () => { },
        arc: () => { },
        ellipse: () => { },
        fillText: () => { },
        drawImage: () => { },
        transform: () => { },
        setTransform: () => { },
        createLinearGradient: () => ({ addColorStop: () => { } }),
        measureText: () => ({ width: 0 }),
        closePath: () => { },
        rect: () => { },
        clearRect: () => { },
        fillRect: () => { },
        strokeRect: () => { },
        clip: () => { },
        globalAlpha: 1,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        shadowColor: '',
        shadowBlur: 0
    } as any;
}
