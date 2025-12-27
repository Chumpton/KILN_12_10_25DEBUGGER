import { Player, Vector2, MeleeAttackPhase } from '../../../types';
import { inputSystem } from '../../../systems/InputSystem';
import { ENTITY_RIGS } from '../../../data/EntityRigDefinitions';
import { TILE_WIDTH, TILE_HEIGHT } from '../../../constants';
import { AnimationController, AnimationState, WeaponState } from './AnimationController';
import { UIRenderer } from './UIRenderer';
import { drawWeapon } from './drawWeapon';
import { drawHeadArmor, drawChestArmor, drawShoulderArmor } from './drawArmor';
import { calculateProceduralArm } from '../../../utils/animationUtils';
import { renderSkeletalNPC } from '../../../utils/renderers/allies/renderSkeletalNPC';
import { renderWolf } from '../../../utils/renderers/animals/renderWolf';
import { renderBear } from '../../../utils/renderers/animals/renderBear';
import { SPELL_REGISTRY } from '../../spells/SpellRegistry';

import { getAsset } from '../../../utils/AssetLoader';

// Asset loading helper
const get = (key: string) => getAsset(key) || new Image();

const assets = {
    get torso() { return get('SKELETON_TORSO'); },
    get head() { return get('SKELETON_HEAD'); },
    get legs() { return get('SKELETON_LEGS'); },
    get foot() { return get('SKELETON_FOOT'); },
    get arm() { return get('SKELETON_ARM'); },
    get hand() { return get('SKELETON_HAND'); },
    get sword1() { return get('WEAPON_SWORD_1'); }
};

interface BoneTransform {
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

type DrawCommand = {
    type: 'image' | 'procedural';
    z: number;
    // For Image
    img?: HTMLImageElement;
    px?: number;
    py?: number;
    // For Procedural
    render?: (ctx: CanvasRenderingContext2D) => void;
    matrix: DOMMatrix;
};

export class PlayerRenderer {
    private animController: AnimationController;
    private partTransforms: Record<string, BoneTransform> = {};

    constructor() {
        this.animController = new AnimationController();
    }


    // Position Tracking for Projectile Sync
    private lastRenderX: number = 0;
    private lastRenderY: number = 0;

    /**
     * Get the current hand/anchor position as an OFFSET from the player's render center.
     * This avoids frame-lag issues when the camera moves.
     */
    public getHandOffset(): { x: number, y: number } | null {
        const hand = this.partTransforms['fireball_anchor_l'] || this.partTransforms['hand_l'];
        if (!hand) return null;

        return {
            x: hand.x - this.lastRenderX,
            y: hand.y - this.lastRenderY
        };
    }

    /**
     * Legacy absolute position getter (Screen Space of last frame)
     */
    public getHandPosition(): BoneTransform | null {
        return this.partTransforms['fireball_anchor_l'] || this.partTransforms['hand_l'] || null;
    }

    /**
     * Main render function for the player character
     */
    public render(
        ctx: CanvasRenderingContext2D,
        player: Player,
        x: number,
        y: number,
        moveTarget: Vector2 | null,
        hideUI: boolean = false,
        forcedFacing?: boolean,
        isWorldEditorActive?: boolean
    ): void {
        const isMoving = Math.abs(player.velocity.x) > 0.01 || Math.abs(player.velocity.y) > 0.01;
        const facingRight = this.determineFacing(player, moveTarget, forcedFacing);

        // Update animation state
        const state = this.animController.updateState(player, isMoving);
        const time = Date.now();
        const frameData = this.animController.getAnimations(state, time, player, facingRight);
        const animations = frameData.bones;
        let weaponState = frameData.weaponState;

        ctx.save();

        // --- XP COLLECTION GLOW ---
        if (player.xpGlowTimer && player.xpGlowTimer > 0) {
            ctx.save();
            ctx.translate(x, y - 20); // Center on body
            ctx.globalCompositeOperation = 'lighter';
            const glowOpacity = Math.min(1, player.xpGlowTimer / 10);
            ctx.globalAlpha = glowOpacity * 0.6;

            const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
            gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); // Purple 500
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Store render origin for Offset calculations
        this.lastRenderX = x;
        this.lastRenderY = y;

        let renderY = y;

        // --- MORPH RENDER LOGIC ---
        if (player.morph === 'WOLF') {
            renderWolf(ctx, x, y, 1.0, isMoving, facingRight, 0, 0);
            // Optionally render swipes or special effects on top
            if (player.attack.isAttacking) this.renderSwipeEffect(ctx, player, facingRight);
            ctx.restore();
            return;
        }
        if (player.morph === 'BEAR') {
            renderBear(ctx, x, y, 1.0, isMoving, facingRight, 0, 0);
            if (player.attack.isAttacking) this.renderSwipeEffect(ctx, player, facingRight);
            ctx.restore();
            return;
        }
        if (player.morph === 'SHADOW') {
            ctx.globalAlpha = 0.5; // Ghostly transparency
            ctx.filter = 'grayscale(100%) brightness(50%) drop-shadow(0 0 5px #000)';
        }

        // --- MOUNT RENDER LOGIC ---
        if (player.isMounted) {
            weaponState = WeaponState.SHEATHED;
            // 1. Render Mount
            // Create a dummy ally object for the renderer
            const mountDummy: any = {
                id: 'player_mount',
                pos: { x: player.pos.x, y: player.pos.y },
                velocity: player.velocity,
                isMoving: isMoving,
                colorScheme: { skin: '#fff', shirt: '#fff', pants: '#fff' }
            };

            // 2. Adjust Player Position (Sit on top)
            renderY -= 35; // Lift player up

            // 3. Override Legs (Straddle Pose)
            // Ensure leg objects exist
            if (!animations['leg_l']) animations['leg_l'] = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
            if (!animations['leg_r']) animations['leg_r'] = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };

            // Corrected Straddle Pose (Both legs forward)
            const straddleRot = Math.PI / 6; // 30 degrees forward
            animations['leg_l'].rotation = -straddleRot;
            animations['leg_r'].rotation = -straddleRot; // Match left leg

            animations['leg_l'].offsetX = -4;
            animations['leg_r'].offsetX = 4; // Push legs out slightly

            // Override Arms (Stop Swinging) - Hold Reins Pose
            if (!animations['arm_l']) animations['arm_l'] = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
            if (!animations['arm_r']) animations['arm_r'] = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };

            // Fixed rotation (approx 30 deg forward to hold reins)
            const reinRotation = -Math.PI / 6;
            animations['arm_l'].rotation = reinRotation;
            animations['arm_r'].rotation = reinRotation;
            animations['arm_r'].offsetY = 0.66;

            // Symmetry Correction: Align hand_r (x=1, y=-11.5) to match hand_l (x=0, y=-10.5) relative to arm
            if (!animations['hand_r']) animations['hand_r'] = { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
            animations['hand_r'].offsetX = -1;
            animations['hand_r'].offsetY = 1;

            // ARM SYMMETRY LOGIC
            // Ensure arms are positioned symmetrically regardless of facing.
            if (facingRight) {
                // Right Facing (Scale 1):
                // User wants Arm R to be BEHIND horse (Back), Arm L to be FRONT.
                animations['arm_l'].offsetX = 0; // Front
                animations['arm_r'].offsetX = -1.84; // Back (pushed left)
            } else {
                // Left Facing (Scale -1):
                // Arm R is Back, Arm L is Front (This was confirmed working)
                animations['arm_l'].offsetX = 0;
                animations['arm_r'].offsetX = 1.84;
            }

            // Determine which limbs are "back" (behind the horse)
            const backLegName = facingRight ? 'leg_l' : 'leg_r';
            // Always render Right Arm as 'Back' (Behind Horse)
            const backArmName = 'arm_r';

            // Render the "back" limbs first (behind the horse)
            this.renderSkeleton(ctx, x, renderY, animations, state, player, weaponState, facingRight, (name) => name === backLegName || name === backArmName);

            // Handle Mount Facing (since renderSkeletalNPC doesn't natively handle facing param)
            // FIX: Inverted logic to match Horse Sprite direction (likely Left-Facing default)
            ctx.save();
            if (facingRight) {
                ctx.translate(x, y);
                ctx.scale(-1, 1);
                ctx.translate(-x, -y);
            }
            // Draw mount at x, y
            renderSkeletalNPC(ctx, mountDummy, x, y, undefined, false, false, 'horse');
            ctx.restore();

            // Render the rest of the player (excluding the back limbs)
            this.renderSkeleton(ctx, x, renderY, animations, state, player, weaponState, facingRight, (name) => name !== backLegName && name !== backArmName);
        } else {
            this.renderSkeleton(ctx, x, renderY, animations, state, player, weaponState, facingRight);
        }

        this.renderSwipeEffect(ctx, player, facingRight);

        // Debug rendering: Pass hideUI to filter out text/grid but NOT lines
        this.renderDebug(ctx, player, facingRight, x, renderY, hideUI);

        ctx.restore();

        if (!hideUI && !isWorldEditorActive) {
            UIRenderer.renderPlayerUI(ctx, player, x, y, facingRight);

            // Determine active hands for casting visuals
            const activeAnchors: string[] = [];

            // Primary Hand (Left / Anchor)
            // Use 'fireball_anchor_l' if available for perfectly stable aiming, else fallback to hand_l
            if (this.partTransforms['fireball_anchor_l']) activeAnchors.push('fireball_anchor_l');
            else if (this.partTransforms['hand_l']) activeAnchors.push('hand_l');

            // Secondary Hand (Right) - For Dual Hand Casts (Frost Pulse)
            if (player.casting.currentSpell === 'ICE_FROST_PULSE') {
                if (this.partTransforms['hand_r_tip']) activeAnchors.push('hand_r_tip');
                else if (this.partTransforms['hand_r']) activeAnchors.push('hand_r');
            }

            if (player.casting.isCasting) {
                const chargePercent = Math.min(1, player.casting.timer / player.casting.duration);
                const spellDef = SPELL_REGISTRY[player.casting.currentSpell];
                const rawColor = spellDef?.animation?.primaryColor || '#ffaa00';
                const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;

                activeAnchors.forEach(anchorKey => {
                    const anchor = this.partTransforms[anchorKey];
                    if (anchor) {
                        // Use the arm's actual rotation for positioning the charge effect
                        // (If it's a hand, it inherits arm rotation usually, or we use its own)
                        const armRotation = anchor.rotation || 0;
                        UIRenderer.renderSpellCharge(ctx, anchor.x, anchor.y, chargePercent, armRotation, color);
                    }
                });
            }
        }

        // Render Sword Trail during weapon attacks
        if (player.attack.isAttacking && this.partTransforms['hand_r']) {
            this.renderSwordTrail(ctx, player, facingRight);
        }

        // --- XP TALLY TEXT ---
        if (player.xpTally && player.xpTally > 0) {
            ctx.save();
            ctx.translate(x, y - 80); // Float above head

            // Fade out
            let alpha = 1.0;
            if (player.xpTimer < 30) {
                alpha = player.xpTimer / 30;
            }
            ctx.globalAlpha = alpha;

            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#d8b4fe'; // Light purple
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(`+${player.xpTally} XP`, 0, 0);
            ctx.fillText(`+${player.xpTally} XP`, 0, 0);

            ctx.restore();
        }
    }

    private renderSwordTrail(ctx: CanvasRenderingContext2D, player: Player, facingRight: boolean) {
        const handTransform = this.partTransforms['hand_r'];
        if (!handTransform) return;

        // Calculate aim angle
        let aimAngle = 0;
        if (player.attack.targetPos) {
            const dx = player.attack.targetPos.x - player.pos.x;
            const dy = player.attack.targetPos.y - player.pos.y;
            aimAngle = Math.atan2(dy, facingRight ? dx : -dx);
        }

        // Calculate swing progress
        let swingProgress = 0;
        const WINDUP_FRAMES = 5;
        const SWING_FRAMES = 9;

        if (player.attack.phase === 'WINDUP' as any) {
            swingProgress = -(player.attack.timer / WINDUP_FRAMES) * 0.5;
        } else if (player.attack.phase === 'SWING' as any) {
            const t = player.attack.timer / SWING_FRAMES;
            swingProgress = -0.5 + t * 1.0;
        } else {
            swingProgress = 0.5;
        }

        // Only show trail during active swing
        if (player.attack.phase !== 'SWING' as any) return;

        const swingArc = Math.PI / 4;
        const currentAngle = aimAngle + (swingProgress * swingArc * 2);

        // Sword reach (matching WeaponSystem)
        const swordReach = 3.5;
        const armLength = 20; // Approximate arm length in pixels

        // Calculate positions along the arm-hand-sword line
        const shoulderX = handTransform.x - Math.cos(currentAngle) * armLength;
        const shoulderY = handTransform.y - Math.sin(currentAngle) * armLength;
        const swordTipX = handTransform.x + Math.cos(currentAngle) * (swordReach * 16); // Convert to pixels
        const swordTipY = handTransform.y + Math.sin(currentAngle) * (swordReach * 16);

        // Draw gradient trail
        ctx.save();
        ctx.globalAlpha = Math.abs(swingProgress) * 0.6; // Fade based on swing progress

        const gradient = ctx.createLinearGradient(shoulderX, shoulderY, swordTipX, swordTipY);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0)'); // Transparent at shoulder
        gradient.addColorStop(0.3, 'rgba(100, 200, 255, 0.3)'); // Faint at arm
        gradient.addColorStop(0.6, 'rgba(150, 220, 255, 0.6)'); // Brighter at hand
        gradient.addColorStop(1, 'rgba(200, 240, 255, 0.8)'); // Brightest at sword tip

        // Draw the trail line
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(swordTipX, swordTipY);
        ctx.stroke();

        ctx.restore();
    }

    private determineFacing(player: Player, moveTarget: Vector2 | null, forcedFacing?: boolean): boolean {
        if (forcedFacing !== undefined) return forcedFacing;

        // 1. Casting Priority (Look at target)
        if (player.casting.isCasting && player.casting.targetPos) {
            const dx = player.casting.targetPos.x - player.pos.x;
            const dy = player.casting.targetPos.y - player.pos.y;
            // Screen Space Delta
            const screenDx = (dx - dy);

            if (screenDx > 0.01) return true;
            if (screenDx < -0.01) return false;
        }

        // 2. Velocity Priority (Movement)
        // If moving, face the direction of movement (Screen Space X)
        if (Math.abs(player.velocity.x) > 0.01 || Math.abs(player.velocity.y) > 0.01) {
            const screenDx = player.velocity.x - player.velocity.y;
            // Only update if movement is significant enough on X axis to warrant a turn
            if (Math.abs(screenDx) > 0.1) {
                return screenDx > 0;
            }
        }

        // 3. Default to stored state
        return (player as any).facingRight ?? false;
    }

    private renderSkeleton(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        animations: Record<string, any>,
        state: AnimationState,
        player: Player,
        weaponState: WeaponState,
        facingRight: boolean,
        partFilter?: (name: string) => boolean
    ): void {
        const config = ENTITY_RIGS['skeleton_npc'];
        if (!config) return;

        let parts = config.parts;
        const scale = config.scale || 1;
        const isRolling = state === AnimationState.ROLLING;

        // DYNAMIC Z-ORDER SWAP REMOVED - standard flip is sufficient
        // Since Rig is Left-Facing (Left=Front=HighZ), we just flip X for Right Facing.

        ctx.save();
        ctx.translate(x, y);
        // Rig is Left-Facing.
        // Facing Right -> Scale 1.
        // Facing Left -> Scale -1. (Previous logic was inverted)
        ctx.scale(facingRight ? scale : -scale, scale);

        // Shadow (Only if not mounted - Mount has its own shadow)
        if ((!partFilter || partFilter('shadow')) && !player.isMounted) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const drawList: DrawCommand[] = [];
        this.partTransforms = {};

        const recordDraw = (img: HTMLImageElement, z: number, px: number, py: number) => {
            if (img.complete) {
                drawList.push({ type: 'image', img, z, px, py, matrix: ctx.getTransform() });
            }
        };

        const recordProcedural = (render: (ctx: CanvasRenderingContext2D) => void, z: number) => {
            drawList.push({ type: 'procedural', render, z, matrix: ctx.getTransform() });
        };

        const captureTransform = (partKey: string) => {
            const t = ctx.getTransform();
            const p = t.transformPoint(new DOMPoint(0, 0));
            // Extract rotation from matrix: atan2(b, a)
            const rotation = Math.atan2(t.b, t.a);
            this.partTransforms[partKey] = { x: p.x, y: p.y, rotation, scale: scale };
        };

        this.renderBodyParts(ctx, parts, animations, isRolling, recordDraw, recordProcedural, captureTransform, player, weaponState, facingRight, partFilter, x, y);

        ctx.restore();

        drawList.sort((a, b) => a.z - b.z).forEach(cmd => {
            ctx.save();
            ctx.setTransform(cmd.matrix);
            if (cmd.type === 'image' && cmd.img) {
                ctx.drawImage(cmd.img, cmd.px!, cmd.py!);
            } else if (cmd.type === 'procedural' && cmd.render) {
                cmd.render(ctx);
            }
            ctx.restore();
        });
    }

    private renderBodyParts(
        ctx: CanvasRenderingContext2D,
        parts: any,
        animations: any,
        isRolling: boolean,
        recordDraw: Function,
        recordProcedural: Function,
        captureTransform: Function,
        player: Player,
        weaponState: WeaponState,
        facingRight: boolean,
        partFilter: ((name: string) => boolean) | undefined,
        x: number,
        y: number
    ): void {
        // Calculate torso Transform
        const torsoBasePart = parts['torso'] || { x: 0, y: -45, rotation: 0 };
        const torsoAnim = animations['torso'] || { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };

        // Torso Pivot Calc (Bottom Center)
        const torsoX = (torsoBasePart.x || 0) + torsoAnim.offsetX;
        const torsoY = (torsoBasePart.y || 0) + torsoAnim.offsetY;
        const torsoRotation = (torsoBasePart.rotation || 0) + torsoAnim.rotation;

        const partsList = [
            { name: 'arm_r', img: assets.arm },
            { name: 'leg_r', img: assets.legs },
            { name: 'leg_l', img: assets.legs },
            { name: 'torso', img: assets.torso },
            { name: 'arm_l', img: assets.arm }
        ];

        partsList.forEach(({ name, img }) => {
            if (partFilter && !partFilter(name)) return;

            const part = parts[name] || { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 0, flipX: false };
            const anim = animations[name] || { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };

            if (!img.complete) return;

            let finalX = 0; // Scoped for use in aim calculation
            let finalY = 0;

            ctx.save();

            if (isRolling) {
                ctx.translate(anim.offsetX, anim.offsetY);
                ctx.rotate(anim.rotation);
            } else {
                // HIERARCHY LOGIC
                if (name.includes('arm')) {
                    // 1. Get Shoulder Offset relative to Torso (using Rig data)
                    // In EntityRig, arm.y is RELATIVE to torso, arm.x IS offset from center (TorsoX=0).
                    const sX = part.x;
                    const sY = part.y;

                    // 2. Rotate this offset by Torso Rotation
                    const rX = sX * Math.cos(torsoRotation) - sY * Math.sin(torsoRotation);
                    const rY = sX * Math.sin(torsoRotation) + sY * Math.cos(torsoRotation);

                    // 3. Apply to Torso Position
                    finalX = torsoX + rX + anim.offsetX;
                    finalY = torsoY + rY + anim.offsetY;

                    // --- DATA DRIVEN RECOIL INJECTION ---
                    if (player.casting.isCasting && player.casting.currentSpell) {
                        const spellDef = SPELL_REGISTRY[player.casting.currentSpell];
                        const armProfile = spellDef?.skeletalAnimation?.boneMotionProfiles?.arms;

                        if (armProfile && armProfile.recoilAmount && player.casting.targetPos) {
                            // Calculate simple recoil vector (World -> Screen approx)
                            // We use World Direction but apply to Screen X/Y directly for visual pop
                            const dx = player.casting.targetPos.x - player.pos.x;
                            const dy = player.casting.targetPos.y - player.pos.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const dirX = dx / dist;
                            const dirY = dy / dist;

                            // Calculate decay
                            // Assuming 250ms duration or driven by timer
                            const t = player.casting.timer; // ms
                            const decay = Math.max(0, 1 - (t / 150));
                            const amount = armProfile.recoilAmount * decay;

                            // Isometric projection factor for Y (0.5 squash)
                            const screenDirX = dirX - dirY;
                            const screenDirY = (dirX + dirY) * 0.5;
                            // Normalize screen dir
                            const sLen = Math.sqrt(screenDirX * screenDirX + screenDirY * screenDirY) || 1;

                            // Recoil is opposite to aim
                            finalX -= (screenDirX / sLen) * amount;
                            finalY -= (screenDirY / sLen) * amount;
                        }
                    }

                    ctx.translate(finalX, finalY);

                } else {
                    // Legs and Torso
                    const baseX = part.x + anim.offsetX;
                    const baseY = part.y + anim.offsetY;
                    ctx.translate(baseX, baseY);
                }

                // ROTATION
                let effectiveRotation = (part.rotation || 0) + anim.rotation;

                // Child Inheritance
                if (name.includes('arm')) {
                    effectiveRotation += torsoRotation;
                }

                // Casting Aim Override
                const isFrostPulse = player.casting.currentSpell === 'ICE_FROST_PULSE'; // Hardcoded check or registry flag 'twoHandedCast'
                const isAimingLimb = (name === 'arm_l' || (name === 'arm_r' && isFrostPulse));

                if (isAimingLimb && player.casting.isCasting && player.casting.targetPos) {
                    // We must calculate the angle in SCREEN SPACE to match visuals (isometric projection compresses Y)

                    // 1. Calculate World Delta
                    const wDx = player.casting.targetPos.x - player.pos.x;
                    const wDy = player.casting.targetPos.y - player.pos.y;

                    // 2. Project to Screen Delta (Isometric Formula inline)
                    const sDx = (wDx - wDy) * (TILE_WIDTH / 2);
                    const sDy = (wDx + wDy) * (TILE_HEIGHT / 2);

                    // 3. Adjust for Shoulder Offset (which is rendered relative to Player Feet)
                    // The 'ctx' has been translated to 'finalX, finalY'.
                    // So 'finalX, finalY' IS the shoulder offset from player center (feet).
                    // We need Screen Vector from Shoulder -> Target.
                    // V_shoulder_target = V_feet_target - V_feet_shoulder

                    // Note: If flipped (facingLeft with Scale -1), the 'finalX' was applied in the flipped context logic,
                    // but sDx is absolute screen space.
                    // Screen X offset of shoulder is: facingRight (Scale 1) ? finalX : -finalX
                    const shoulderScreenX = facingRight ? finalX : -finalX;
                    const shoulderScreenY = finalY;

                    const aimDx = sDx - shoulderScreenX;
                    let aimDy = sDy - shoulderScreenY;

                    // Correct for Mount Height Offset
                    if (player.isMounted) aimDy += 35;

                    // 4. Calculate Angle
                    // If flipped, the localized X axis is inverted relative to Screen X.
                    // Local X+ is Screen X- (Left).
                    // So we project the Vector (aimDx, aimDy) into Local Space.
                    // Right (Scale 1): LocalDx = aimDx
                    // Left (Scale -1): LocalDx = -aimDx

                    const localAimDx = facingRight ? aimDx : -aimDx;
                    const localAimDy = aimDy;

                    const screenAimAngle = Math.atan2(localAimDy, localAimDx);

                    // 5. Apply to Rotation (Sprite points Down by default, PI/2)
                    // We want Sprite Down (PI/2) to map to Angle.
                    // Rot + PI/2 = Angle => Rot = Angle - PI/2
                    effectiveRotation = screenAimAngle - Math.PI / 2;
                }

                ctx.rotate(effectiveRotation);
            }

            ctx.scale((part.scale || 1) * (part.flipX ? -1 : 1), part.scale || 1);
            captureTransform(name);

            // MANUALLY Capture Hand Position from Arm Transform
            if (name === 'arm_l' || name === 'arm_r') {
                // Determine Hand Length / Tip Offset
                // Default to 20 (approx hand center/wrist)
                let handLength = 20;

                // Allow Spell Config optimization
                if (player.casting.isCasting && player.casting.currentSpell) {
                    const spellConfig = SPELL_REGISTRY[player.casting.currentSpell];
                    if (spellConfig?.skeletalAnimation?.handGlowOffset !== undefined) {
                        handLength = spellConfig.skeletalAnimation.handGlowOffset;
                    }
                }

                const t = ctx.getTransform();
                const p = t.transformPoint(new DOMPoint(0, handLength));

                if (name === 'arm_l') {
                    this.partTransforms['hand_l'] = { x: p.x, y: p.y, rotation: 0, scale: 1 };
                } else {
                    this.partTransforms['hand_r_tip'] = { x: p.x, y: p.y, rotation: 0, scale: 1 };
                }
            }

            recordDraw(img, part.zIndex ?? 0, -img.width / 2, name === 'torso' ? -img.height : 0);

            if (name === 'torso' && player.equipment.CHEST) {
                recordProcedural((c: CanvasRenderingContext2D) => drawChestArmor(c, player.equipment.CHEST!), (part.zIndex ?? 0) + 1);
            }
            if (name.includes('arm') && player.equipment.SHOULDERS) {
                recordProcedural((c: CanvasRenderingContext2D) => drawShoulderArmor(c, player.equipment.SHOULDERS!), (part.zIndex ?? 0) + 2);
            }

            if (name === 'torso' && weaponState === WeaponState.SHEATHED && player.equipment.MAIN_HAND && parts['sheath'] && assets.sword1.complete) {
                const sheath = parts['sheath'];
                recordProcedural((c: CanvasRenderingContext2D) => {
                    c.save();
                    c.translate(sheath.x, sheath.y);
                }, sheath.zIndex ?? 11);
            }

            if (!isRolling) {
                if (name === 'arm_l' && player.casting.isCasting && player.casting.targetPos) {

                }
                this.renderChildParts(ctx, name, parts, img, recordDraw, recordProcedural, captureTransform, player, weaponState, animations, facingRight);
            }

            ctx.restore();
        });

        // Rolling Head Logic (unchanged)
        if (isRolling && (!partFilter || partFilter('head'))) {
            const head = parts['head'] || { x: 0, y: 2, rotation: 0, scale: 1, zIndex: 7, flipX: false };
            const headAnim = animations['head'] || { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
            ctx.save();
            ctx.translate(headAnim.offsetX, headAnim.offsetY);
            ctx.rotate(headAnim.rotation);
            ctx.scale(head.scale || 1, head.scale || 1);
            captureTransform('head');
            recordDraw(assets.head, head.zIndex ?? 7, -assets.head.width / 2, -assets.head.height);
            if (player.equipment.HEAD) {
                recordProcedural((c: CanvasRenderingContext2D) => {
                    c.translate(0, -assets.head.height / 2);
                    drawHeadArmor(c, player.equipment.HEAD!);
                }, (head.zIndex ?? 7) + 1);
            }
            ctx.restore();
        }
    }

    private renderChildParts(
        ctx: CanvasRenderingContext2D,
        parentName: string,
        parts: any,
        parentImg: HTMLImageElement,
        recordDraw: Function,
        recordProcedural: Function,
        captureTransform: Function,
        player: Player,
        weaponState: WeaponState,
        animations: any,
        facingRight: boolean
    ): void {
        const parentAnim = animations[parentName] || { rotation: 0 };
        // NOTE: Effective Rotation of parent is already applied to Context.
        // So children drawn here are already in Parent's Rotated Space.

        if (parentName.includes('arm')) {
            // FIREBALL ANCHOR LOGIC
            const anchorName = 'fireball_anchor_l';
            const anchorPart = parts[anchorName];
            if (parentName === 'arm_l' && anchorPart) {
                ctx.save();
                ctx.translate(anchorPart.x, parentImg.height - 2 + anchorPart.y);
                // No Rotation per se, or inherit? It inherits Parent (Arm) rotation automatically.
                // We just want to capture its world position.
                captureTransform(anchorName);
                // Debug: draw small dot? 
                // recordProcedural((c)=> { c.fillStyle='red'; c.fillRect(-2,-2,4,4); }, 20);
                ctx.restore();
            }

            // Existing Hand Logic...
            if (assets.hand.complete) {
                const handName = parentName.replace('arm', 'hand');
                const hand = parts[handName] || { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 1, flipX: false };
                const handAnim = animations[handName] || { rotation: 0, offsetX: 0, offsetY: 0 };

                ctx.save();
                ctx.translate(hand.x + handAnim.offsetX, parentImg.height - 2 + hand.y + handAnim.offsetY);
                ctx.rotate((hand.rotation || 0) + handAnim.rotation);
                ctx.scale((hand.scale || 1) * (hand.flipX ? -1 : 1), hand.scale || 1);
                captureTransform(handName);
                recordDraw(assets.hand, hand.zIndex ?? 1, -assets.hand.width / 2, 0);

                if (parentName === 'arm_r' && player.equipment.MAIN_HAND && weaponState === WeaponState.DRAWN && assets.sword1.complete) {
                    const weapon = parts['weapon_r'] || { x: 0, y: 15, rotation: 0, scale: 1, zIndex: 6, flipX: false };

                    // --- WEAPON SWING ANIMATION ---
                    // Calculate extra rotation based on attack phase
                    let swingRot = 0;
                    if (player.attack.isAttacking && player.attack.phase === 'SWING' as any) {
                        // Swing progress 0 -> 1
                        const t = player.attack.timer / 9; // SWING_FRAMES = 9
                        // Swipe from -45 to +90 degrees relative to hand
                        // Easing function for snap? Linear is fine for Terraria style.
                        const startAngle = -Math.PI / 2;
                        const endAngle = Math.PI;
                        swingRot = startAngle + (endAngle - startAngle) * t;
                    } else if (player.attack.phase === 'WINDUP' as any) {
                        // Windup (hold back)
                        swingRot = -Math.PI / 2;
                    }

                    const animRot = (animations['weapon_r']?.rotation || 0) + swingRot;

                    recordProcedural((c: CanvasRenderingContext2D) => {
                        c.save();
                        c.translate(weapon.x, weapon.y);
                        c.rotate((weapon.rotation || 0) + animRot);
                        c.scale((weapon.scale || 1) * (weapon.flipX ? -1 : 1), weapon.scale || 1);
                        // Pivot at handle (bottom center approx)
                        c.drawImage(assets.sword1, -assets.sword1.width / 2, -assets.sword1.height);
                        c.restore();
                    }, weapon.zIndex ?? 6);
                }
                ctx.restore();
            }
        }

        if (parentName.includes('leg') && assets.foot.complete) {
            const footName = parentName.replace('leg', 'foot');
            const foot = parts[footName] || { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 0, flipX: false };
            const leg = parts[parentName] || { x: 0, y: 0, scale: 1 };
            const lScale = leg.scale || 1;
            const relX = (foot.x - leg.x) / lScale;
            const relY = (foot.y - leg.y) / lScale;
            ctx.save();
            ctx.translate(relX, relY);
            ctx.rotate(foot.rotation || 0);
            const fScaleX = (foot.scale || 1) / lScale;
            const fScaleY = (foot.scale || 1) / lScale;
            ctx.scale(fScaleX * (foot.flipX ? -1 : 1), fScaleY);
            captureTransform(footName);
            recordDraw(assets.foot, foot.zIndex ?? 0, -assets.foot.width / 2, -assets.foot.height / 2);
            ctx.restore();
        }

        if (parentName === 'torso' && assets.head.complete) {
            const head = parts['head'] || { x: 0, y: -2, rotation: 0, scale: 1, zIndex: 7, flipX: false };
            const headAnim = animations['head'] || { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 };
            ctx.save();
            ctx.translate(head.x, -parentImg.height + head.y);
            ctx.translate(headAnim.offsetX, headAnim.offsetY);
            ctx.rotate(head.rotation + headAnim.rotation);
            ctx.scale((head.scale || 1) * (head.flipX ? -1 : 1), head.scale || 1);
            captureTransform('head');
            recordDraw(assets.head, head.zIndex ?? 7, -assets.head.width / 2, -assets.head.height);
            if (player.equipment.HEAD) {
                recordProcedural((c: CanvasRenderingContext2D) => {
                    c.translate(0, -assets.head.height / 2);
                    drawHeadArmor(c, player.equipment.HEAD!);
                }, (head.zIndex ?? 7) + 1);
            }
            ctx.restore();
        }
    }

    public debugMode: boolean = false;
    public debugOverrides: { shoulderOffset?: number, handOffset?: number, projectileDist?: number } = {};

    private renderSwipeEffect(ctx: CanvasRenderingContext2D, player: Player, facingRight: boolean) {
        if (!player.attack.isAttacking) return;
        const phase = player.attack.phase;
        if (phase === MeleeAttackPhase.WINDUP) return;

        const F_SWING = 9;
        const F_FOLLOW = 6;
        let t = 0;
        let alpha = 1.0;

        if (phase === MeleeAttackPhase.SWING) {
            const progress = player.attack.timer / F_SWING;
            t = 1 - Math.pow(1 - Math.min(1, progress), 3);
        } else if (phase === MeleeAttackPhase.FOLLOW_THROUGH) {
            t = 1.0;
            const progress = player.attack.timer / F_FOLLOW;
            alpha = 1.0 - Math.min(1, progress);
        } else {
            return;
        }

        if (alpha <= 0.01) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        const SWIPE_ARC = Math.PI / 2;
        const startOffset = -SWIPE_ARC / 2;
        const endOffset = SWIPE_ARC / 2;
        let aimAngle = 0;
        if (player.attack.targetPos) {
            const dx = player.attack.targetPos.x - player.pos.x;
            const dy = player.attack.targetPos.y - player.pos.y;
            const localDx = facingRight ? dx : -dx;
            const localDy = dy;
            aimAngle = Math.atan2(localDy, localDx);
        }

        const currentAngle = aimAngle + startOffset + (endOffset - startOffset) * t;
        const radius = 3.5 * 32;
        const trailLength = Math.PI / 4;
        let trailStart = currentAngle - trailLength;
        const totalStartAngle = aimAngle + startOffset;
        if (trailStart < totalStartAngle) trailStart = totalStartAngle;

        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.arc(0, -48, radius, trailStart, currentAngle, false);
        ctx.lineTo(0, -48);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, -48, radius * 0.2, 0, -48, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -48, radius, trailStart, currentAngle, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    private renderDebug(ctx: CanvasRenderingContext2D, player: Player, facingRight: boolean, x?: number, y?: number, hideUI: boolean = false) {
        // Check global debug flag from Spell Editor
        if ((window as any)._DEBUG_RENDERER_ORIGIN) {
            this.debugMode = true;
        } else {
            this.debugMode = false;
        }

        if (!this.debugMode) return;

        // Get transforms - ensure they exist
        const torso = this.partTransforms['torso'];
        const shoulder = this.partTransforms['arm_l'];
        const hand = this.partTransforms['fireball_anchor_l'] || this.partTransforms['hand_l'];

        if (!torso || !shoulder || !hand) return;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to screen space

        // 1. Draw Skeleton Points
        if (!hideUI) {
            // Torso (Cyan)
            ctx.fillStyle = 'cyan';
            ctx.beginPath(); ctx.arc(torso.x, torso.y, 4, 0, Math.PI * 2); ctx.fill();

            // Shoulder (Yellow)
            ctx.fillStyle = 'yellow';
            ctx.beginPath(); ctx.arc(shoulder.x, shoulder.y, 4, 0, Math.PI * 2); ctx.fill();

            // Hand (Magenta)
            ctx.fillStyle = 'magenta';
            ctx.beginPath(); ctx.arc(hand.x, hand.y, 4, 0, Math.PI * 2); ctx.fill();
        }

        // 2. Aim Data & Lines
        const mouseX = inputSystem.mouseScreen.x;
        const mouseY = inputSystem.mouseScreen.y;

        let aimAngle = 0;
        let armAngle = 0;

        // Calculate Aim Angle
        if (player.casting.targetPos) {
            const dx = player.casting.targetPos.x - player.pos.x;
            const dy = player.casting.targetPos.y - player.pos.y;
            aimAngle = Math.atan2(dy, dx);
        } else {
            const dx = mouseX - shoulder.x;
            const dy = mouseY - shoulder.y;
            aimAngle = Math.atan2(dy, dx);
        }

        // Arm/Hand Vector
        const armDx = hand.x - shoulder.x;
        const armDy = hand.y - shoulder.y;
        armAngle = Math.atan2(armDy, armDx);

        // Draw Lines

        // Shoulder -> Hand (White)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.lineTo(hand.x, hand.y);
        ctx.stroke();

        // Shoulder -> Mouse (Blue)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();

        // Hand -> Extended Vector (Red)
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hand.x, hand.y);
        ctx.lineTo(hand.x + Math.cos(armAngle) * 50, hand.y + Math.sin(armAngle) * 50);
        ctx.stroke();

        // Draw Hand Anchor Crosshair (Always visible)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hand.x, hand.y, 5, 0, Math.PI * 2);
        ctx.moveTo(hand.x - 8, hand.y);
        ctx.lineTo(hand.x + 8, hand.y);
        ctx.moveTo(hand.x, hand.y - 8);
        ctx.lineTo(hand.x, hand.y + 8);
        ctx.stroke();

        // Label Hand
        ctx.fillStyle = '#ff0000';
        ctx.font = '10px monospace';
        ctx.fillText(`HAND\n(${Math.round(hand.x)}, ${Math.round(hand.y)})`, hand.x + 10, hand.y);

        // Text Info (if not hidden)
        if (!hideUI) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            const info = [
                `Aim: ${(aimAngle * 180 / Math.PI).toFixed(1)}°`,
                `Arm: ${(armAngle * 180 / Math.PI).toFixed(1)}°`,
                `Hand: ${Math.round(hand.x)}, ${Math.round(hand.y)}`
            ];

            info.forEach((text, i) => {
                ctx.strokeText(text, shoulder.x + 20, shoulder.y + 20 + (i * 15));
                ctx.fillText(text, shoulder.x + 20, shoulder.y + 20 + (i * 15));
            });
        }

        // Grid (if x/y provided)
        if (x !== undefined && y !== undefined && !hideUI) {
            const GRID_SIZE = 10;
            const GRID_EXTENT = 100;

            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;

            for (let ox = -GRID_EXTENT; ox <= GRID_EXTENT; ox += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x + ox, y - GRID_EXTENT);
                ctx.lineTo(x + ox, y + GRID_EXTENT);
                ctx.stroke();
            }
            for (let oy = -GRID_EXTENT; oy <= GRID_EXTENT; oy += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x - GRID_EXTENT, y + oy);
                ctx.lineTo(x + GRID_EXTENT, y + oy);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.restore();
    }
}

export const playerRenderer = new PlayerRenderer();
