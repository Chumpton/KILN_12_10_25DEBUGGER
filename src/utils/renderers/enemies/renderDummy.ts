
import { Enemy } from '../../../types';
import { ENTITY_RIGS } from '../../../data/EntityRigDefinitions';


// Import from AssetLoader to be consistent
import { GameAssets as Assets } from '../../AssetLoader';

export const renderDummy = (
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    x: number,
    y: number
) => {
    const time = Date.now();

    // --- STATE MAPPING ---
    const isMoving = Math.abs(enemy.velocity.x) > 0.01 || Math.abs(enemy.velocity.y) > 0.01;
    const isAttacking = enemy.isAttacking;

    // Direction
    const flipX = !enemy.facingRight; // Our rigs usually face right by default?
    // Actually, looking at renderPlayerSkeletal: 
    // const armRSwing = isMoving ? Math.sin(time / runSpeed) * runAmplitude : -armSway;
    // And renderSkeletalNPC: 
    // ctx.scale((arm_r.scale || 1) * (arm_r.flipX ? -1 : 1), arm_r.scale || 1);

    // --- ASSETS ---
    // We use the "PlayerSprite" assets we just renamed
    const torsoImg = new Image(); torsoImg.src = Assets.SKELETON_TORSO;
    const headImg = new Image(); headImg.src = Assets.SKELETON_HEAD;
    const legsImg = new Image(); legsImg.src = Assets.SKELETON_LEGS;
    const footImg = new Image(); footImg.src = Assets.SKELETON_FOOT;
    const armImg = new Image(); armImg.src = Assets.SKELETON_ARM;
    const handImg = new Image(); handImg.src = Assets.SKELETON_HAND;
    const weaponImg = new Image(); weaponImg.src = Assets.WEAPON_SWORD_1;

    // --- ANIMATION VARIABLES ---
    const breath = Math.sin(time / 500) * 1.5;
    const sway = Math.sin(time / 1000) * 0.02;
    const armSway = Math.sin(time / 800) * 0.05;

    // RUNNING
    const runSpeed = 150;
    const runAmplitude = 0.5;
    const legLSwing = isMoving ? Math.sin(time / runSpeed) * runAmplitude : 0;
    const legRSwing = isMoving ? Math.sin(time / runSpeed + Math.PI) * runAmplitude : 0;

    const armLSwing = isMoving ? Math.sin(time / runSpeed + Math.PI) * runAmplitude : armSway;
    const armRSwing = isMoving ? Math.sin(time / runSpeed) * runAmplitude : -armSway;

    const bounce = isMoving ? Math.abs(Math.sin(time / runSpeed)) * 4 : 0;

    // RIG CONFIG
    const config = ENTITY_RIGS['skeleton_npc'];
    if (!config) return;

    const parts = config.parts;
    const scale = config.scale || 1.0;

    // --- DRAWING CONTEXT ---
    ctx.save();
    ctx.translate(x, y - bounce);
    ctx.scale(scale, scale);
    if (flipX) ctx.scale(-1, 1); // Flip the whole container if facing left

    // Function to draw an image centered at 0,0 (or custom anchor)
    // We'll follow the renderSkeletalNPC logic structure for consistency

    const drawPart = (img: HTMLImageElement, x: number, y: number, rotation: number, scaleX: number, scaleY: number) => {
        if (!img.complete) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(img, -img.width / 2, -img.height / 2); // Center anchor (or adjust per part)
        ctx.restore();
    };

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, bounce, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- RENDER PARTS (Back to Front) ---

    // 1. RIGHT ARM (Back)
    const arm_r = parts['arm_r'] || { x: 11, y: 0, rotation: 0 };
    if (armImg.complete) {
        const torsoY = (parts['torso']?.y || -45) + breath;
        ctx.save();
        ctx.translate(arm_r.x, torsoY + arm_r.y);
        ctx.rotate(armRSwing + (arm_r.rotation || 0));

        // Attack Override
        if (isAttacking) {
            // Simple "Raise Sword" pose for now, need sophisticated attack anims later
            ctx.rotate(-Math.PI / 2);
        }

        ctx.drawImage(armImg, -armImg.width / 2, 0); // Pivot at top

        // Hand R
        if (handImg.complete) {
            const hand_r = parts['hand_r'] || { x: 0, y: 0, rotation: 0 };
            ctx.save();
            ctx.translate(0, armImg.height - 2); // End of arm
            ctx.rotate(hand_r.rotation || 0);
            ctx.drawImage(handImg, -handImg.width / 2, 0);

            // Weapon R
            if (weaponImg.complete) {
                const weapon_r = parts['weapon_r'] || { x: 0, y: 15, rotation: 0 };
                ctx.save();
                ctx.translate(weapon_r.x, weapon_r.y);
                ctx.rotate(weapon_r.rotation || 0);
                // Sword pivot is usually handle
                ctx.drawImage(weaponImg, -weaponImg.width / 2, -weaponImg.height);
                ctx.restore();
            }
            ctx.restore();
        }
        ctx.restore();
    }

    // 2. LEGS
    if (legsImg.complete) {
        // R
        const leg_r = parts['leg_r'] || { x: 4, y: -45 };
        ctx.save();
        ctx.translate(leg_r.x, leg_r.y);
        ctx.rotate(legRSwing);
        ctx.drawImage(legsImg, -legsImg.width / 2, 0);

        // Foot R
        if (footImg.complete) {
            ctx.translate(0, legsImg.height - 4);
            ctx.drawImage(footImg, -footImg.width / 2, -footImg.height / 2);
        }
        ctx.restore();

        // L
        const leg_l = parts['leg_l'] || { x: -4, y: -45 };
        ctx.save();
        ctx.translate(leg_l.x, leg_l.y);
        ctx.rotate(legLSwing);
        ctx.drawImage(legsImg, -legsImg.width / 2, 0);

        // Foot L
        if (footImg.complete) {
            ctx.translate(0, legsImg.height - 4);
            ctx.drawImage(footImg, -footImg.width / 2, -footImg.height / 2);
        }
        ctx.restore();
    }

    // Finish main body transform
    ctx.restore();

    // --- OVERHEAD UI ---  
    // Name Tag
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText("Dummy", x, y - 90);

    // HP Bar
    const barW = 100; // Fixed reasonable width
    const barH = 6;
    const barX = x - barW / 2;
    const barY = y - 90;
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);

    // Only show HP if injured
    if (enemy.hp < enemy.maxHp - 0.1) {
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // Fill
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(barX, barY, barW * hpPct, barH);

        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // Text Rep
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.ceil(enemy.hp)} / ${Math.ceil(enemy.maxHp)}`, x, barY - 5);
    }

};
