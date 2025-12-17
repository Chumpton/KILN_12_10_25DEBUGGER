
import { Player } from '../../../types';
import { ENTITY_RIGS } from '../../../data/EntityRigDefinitions';

// Load assets from public directory (Re-using NPC assets for now, can be swapped later)
const torsoImg = new Image();
torsoImg.src = '/assets/PlayerSprite/torso.png';

const headImg = new Image();
headImg.src = '/assets/PlayerSprite/head.png';

const legsImg = new Image();
legsImg.src = '/assets/PlayerSprite/legs.png';

const footImg = new Image();
footImg.src = '/assets/PlayerSprite/foot.png';

const armImg = new Image();
armImg.src = '/assets/PlayerSprite/arm.png';

const handImg = new Image();
handImg.src = '/assets/PlayerSprite/hand.png';

export const renderPlayerSkeletal = (
    ctx: CanvasRenderingContext2D,
    player: Player,
    x: number,
    y: number,
    isMoving: boolean,
    facingRight: boolean
): Record<string, { x: number, y: number, rotation: number, scale: number }> => {
    const time = Date.now();

    // --- ANIMATION VARIABLES ---
    const breath = Math.sin(time / 500) * 1.5;
    const sway = Math.sin(time / 1000) * 0.02;
    const armSway = Math.sin(time / 800) * 0.05;

    // RUNNING ANIMATION
    const runSpeed = 150;
    const runAmplitude = 0.5;
    const legLSwing = isMoving ? Math.sin(time / runSpeed) * runAmplitude : 0;
    const legRSwing = isMoving ? Math.sin(time / runSpeed + Math.PI) * runAmplitude : 0;
    const armLSwing = isMoving ? Math.sin(time / runSpeed + Math.PI) * runAmplitude : armSway;
    const armRSwing = isMoving ? Math.sin(time / runSpeed) * runAmplitude : -armSway;
    const bounce = isMoving ? Math.abs(Math.sin(time / runSpeed)) * 4 : 0;

    // ROLLING ANIMATION
    const isRolling = (player as any).roll?.isRolling || false;
    const rollRotation = isRolling ? (time / 100) : 0;
    const rollClumpRadius = 8;

    const config = ENTITY_RIGS['skeleton_npc'];
    if (!config) return {};

    const parts = config.parts;
    const partTransforms: Record<string, { x: number, y: number, rotation: number, scale: number }> = {};

    ctx.save();
    ctx.translate(x, y - bounce);

    const scale = config.scale || 1.0;
    ctx.scale(scale, scale);

    const captureTransform = (partKey: string) => {
        const t = ctx.getTransform();
        const p = t.transformPoint(new DOMPoint(0, 0));
        partTransforms[partKey] = {
            x: p.x,
            y: p.y,
            rotation: 0,
            scale: scale
        };
    };

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, bounce, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    type DrawCmd = { img: HTMLImageElement, z: number, px: number, py: number, drawMatrix: DOMMatrix };
    const drawList: DrawCmd[] = [];

    const recordDraw = (img: HTMLImageElement | null, z: number, px: number, py: number) => {
        if (img && img.complete) {
            drawList.push({
                img,
                z,
                px,
                py,
                drawMatrix: ctx.getTransform()
            });
        }
    };

    // Helper to apply rolling transform
    const applyRollTransform = (partIndex: number, baseX: number, baseY: number) => {
        if (isRolling) {
            const angle = rollRotation + (partIndex * Math.PI * 2 / 8);
            const offsetX = Math.cos(angle) * rollClumpRadius;
            const offsetY = Math.sin(angle) * rollClumpRadius;
            ctx.translate(offsetX, offsetY - 30);
            ctx.rotate(rollRotation * 2);
        } else {
            ctx.translate(baseX, baseY);
        }
    };

    // Render all parts
    const partsList = [
        { name: 'arm_r', img: armImg, index: 0, hasChild: true },
        { name: 'leg_r', img: legsImg, index: 1, hasChild: true },
        { name: 'leg_l', img: legsImg, index: 2, hasChild: true },
        { name: 'torso', img: torsoImg, index: 3, hasChild: true },
        { name: 'arm_l', img: armImg, index: 5, hasChild: true }
    ];

    partsList.forEach(({ name, img, index, hasChild }) => {
        const part = (parts[name] as any) || { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 0, flipX: false };
        if (!img.complete) return;

        const torsoY = (parts['torso']?.y || -45) + breath;
        const baseY = name.includes('arm') ? torsoY + part.y : part.y;

        ctx.save();
        applyRollTransform(index, part.x, baseY);

        if (!isRolling) {
            let rotation = part.rotation || 0;
            if (name === 'arm_r') rotation += armRSwing;
            if (name === 'arm_l') {
                rotation += armLSwing;
                // Casting logic
                if (player.casting.isCasting && player.casting.targetPos) {
                    const dx = player.casting.targetPos.x - player.pos.x;
                    const dy = player.casting.targetPos.y - player.pos.y;
                    let aimAngle = Math.atan2(dy, facingRight ? dx : -dx);
                    rotation = aimAngle - Math.PI / 2;
                }
            }
            if (name === 'leg_r') rotation += legRSwing;
            if (name === 'leg_l') rotation += legLSwing;
            if (name === 'torso') rotation += sway;
            ctx.rotate(rotation);
        }

        ctx.scale((part.scale || 1) * (part.flipX ? -1 : 1), part.scale || 1);
        captureTransform(name);
        recordDraw(img, part.zIndex ?? 0, -img.width / 2, name === 'torso' ? -img.height : 0);

        // Render child parts (hands, feet, head)
        if (hasChild && !isRolling) {
            if (name.includes('arm') && handImg.complete) {
                const handName = name.replace('arm', 'hand');
                const hand = (parts[handName] as any) || { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 1, flipX: false };
                ctx.save();
                ctx.translate(hand.x, img.height - 2 + hand.y);
                ctx.rotate(hand.rotation || 0);
                ctx.scale((hand.scale || 1) * (hand.flipX ? -1 : 1), hand.scale || 1);
                captureTransform(handName);
                recordDraw(handImg, hand.zIndex ?? 1, -handImg.width / 2, 0);
                ctx.restore();
            }
            if (name.includes('leg') && footImg.complete) {
                const footName = name.replace('leg', 'foot');
                const foot = (parts[footName] as any) || { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 3, flipX: false };
                const lScale = part.scale || 1;
                const relX = (foot.x - part.x) / lScale;
                const relY = (foot.y - part.y) / lScale;

                ctx.save();
                ctx.translate(relX, relY);
                ctx.rotate(foot.rotation || 0);
                ctx.scale((foot.scale || 1) / lScale, (foot.scale || 1) / lScale);
                if (foot.flipX) ctx.scale(-1, 1);
                captureTransform(footName);
                recordDraw(footImg, foot.zIndex ?? 3, -footImg.width / 2, -footImg.height / 2);
                ctx.restore();
            }
            if (name === 'torso' && headImg.complete) {
                const head = (parts['head'] as any) || { x: 0, y: 2, rotation: 0, scale: 1, zIndex: 7, flipX: false };
                ctx.save();
                ctx.translate(head.x, -img.height + head.y);
                ctx.rotate(sway * 0.5 + (head.rotation || 0));
                ctx.scale(head.scale || 1, head.scale || 1);
                if (head.flipX) ctx.scale(-1, 1);
                captureTransform('head');
                recordDraw(headImg, head.zIndex ?? 7, -headImg.width / 2, -headImg.height);
                ctx.restore();
            }
        }
        ctx.restore();
    });

    // Render head separately when rolling
    if (isRolling && headImg.complete) {
        const head = (parts['head'] as any) || { x: 0, y: 2, scale: 1, zIndex: 7, flipX: false };
        ctx.save();
        applyRollTransform(4, 0, -45);
        ctx.scale(head.scale || 1, head.scale || 1);
        captureTransform('head');
        recordDraw(headImg, head.zIndex ?? 7, -headImg.width / 2, -headImg.height);
        ctx.restore();
    }

    // ANCHORS
    const nameTag = parts['name_tag'];
    if (nameTag) {
        ctx.save();
        ctx.translate(nameTag.x, nameTag.y);
        captureTransform('name_tag');
        ctx.restore();
    }

    const hpBar = parts['hp_bar'];
    if (hpBar) {
        ctx.save();
        ctx.translate(hpBar.x, hpBar.y);
        captureTransform('hp_bar');
        ctx.restore();
    }

    ctx.restore();

    // --- SORT AND DRAW ---
    const sortedDraw = drawList.sort((a, b) => a.z - b.z);

    for (const cmd of sortedDraw) {
        ctx.save();
        ctx.setTransform(cmd.drawMatrix);
        ctx.drawImage(cmd.img, cmd.px, cmd.py);
        ctx.restore();
    }

    // --- DRAW CHARGE EFFECT ---
    if (player.casting.isCasting && !isRolling) {
        const handT = partTransforms['hand_l'];
        if (handT) {
            const pct = Math.min(1, player.casting.timer / player.casting.duration);
            const size = 5 + (pct * 25);

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(handT.x, handT.y);

            const dx = player.casting.targetPos?.x ? player.casting.targetPos.x - player.pos.x : 0;
            const dy = player.casting.targetPos?.y ? player.casting.targetPos.y - player.pos.y : 0;
            const angle = Math.atan2(dy, dx);

            const offset = 15;
            const bx = Math.cos(angle) * offset;
            const by = Math.sin(angle) * offset;

            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 20;
            ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + pct * 0.5})`;
            ctx.beginPath();
            ctx.arc(bx, by, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffaa';
            ctx.beginPath();
            ctx.arc(bx, by, size * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    return partTransforms;
};
