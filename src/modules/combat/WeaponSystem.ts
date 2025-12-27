import { GameState, Player, Vector2, Enemy, MeleeAttackPhase } from '../../types';
import { normalize } from '../../utils/isometric';
import { soundSystem } from '../../systems/SoundSystem';
import { SpellCallbacks } from '../spells/SpellBehavior';

function distToSegmentSquared(p: Vector2, v: Vector2, w: Vector2): number {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x))) * (p.x - (v.x + t * (w.x - v.x))) +
        (p.y - (v.y + t * (w.y - v.y))) * (p.y - (v.y + t * (w.y - v.y)));
}

// Frame constants (assuming 60 FPS)
const FRAMES = {
    WINDUP: 5,         // 0.08s
    SWING: 9,          // 0.15s (Active Hitbox)
    FOLLOW_THROUGH: 6, // 0.10s
    RECOVERY: 10       // 0.17s
};

export const WeaponSystem = {
    initiateAttack: (state: GameState, player: Player, target: Vector2, callbacks: SpellCallbacks) => {
        // 1. Buffer Input if already attacking
        if (player.attack.isAttacking) {
            // Only allow buffering during swing, follow-through, or recovery
            if (player.attack.phase !== MeleeAttackPhase.WINDUP) {
                player.attack.inputBuffer = true;
                console.log("WeaponSystem: Attack Buffered");
            }
            return;
        }

        // 2. Block if blocked (e.g. stunned, casting hard spell)
        if (player.casting.isCasting) return;

        // 3. Block if no Sword (User Request)
        const weapon = player.equipment.MAIN_HAND;
        // Strict check: Must have weapon AND be type SWORD
        if (!weapon || weapon.weaponType !== 'SWORD') {
            callbacks.addFloatingText("Need Sword!", player.pos, '#ff5555');
            return;
        }

        // 4. Start New Attack (Combo 1)
        startAttack(player, target, 1);
    },

    update: (state: GameState, dt: number, callbacks: SpellCallbacks) => {
        const player = state.player;

        if (!player.attack.isAttacking) {
            // Cooldown Decay
            if (player.attack.cooldown > 0) {
                player.attack.cooldown -= (dt / 16.66);
            }
            return;
        }

        // --- HIT STOP LOGIC ---
        // If we want a hit stop, we can pause the timer increment here.
        // We'll use a hacky property on the player.attack object or just a local var if we could.
        // For now, let's skip complex hitstop state and just slow down dt? 
        // No, let's proceed with state updates.

        // Update Timer
        player.attack.timer += (dt / 16.66);
        const timer = player.attack.timer;

        // --- STATE MACHINE TRANSITIONS ---

        // 1. WINDUP -> SWING
        if (player.attack.phase === MeleeAttackPhase.WINDUP) {
            if (timer >= FRAMES.WINDUP) {
                player.attack.phase = MeleeAttackPhase.SWING;
                player.attack.timer = 0; // Reset for next phase? 
                // Alternatively, keep global timer. Let's reset for phase-local simplicity in renders?
                // Actually, for the Renderer's sake, it might expect a 0-1 global progress?
                // The current Renderer uses `timer / duration`. 
                // WE MUST UPDATE RENDERER to support Phase-based rendering or emulate the old global progress.
                // Let's stick to accumulating `timer` as "Total Time in Phase" logic + explicitly setting phase.
            }
        }
        // 2. SWING -> END (immediately when swing completes)
        else if (player.attack.phase === MeleeAttackPhase.SWING) {
            // Hitbox Logic
            processHitbox(state, player, callbacks, timer, FRAMES.SWING);

            if (timer >= FRAMES.SWING) {
                // Check if there's a buffered input for combo
                if (player.attack.inputBuffer) {
                    // Trigger Next Combo immediately
                    const nextCombo = (player.attack.comboCount % 3) + 1; // 1->2, 2->3, 3->1
                    startAttack(player, player.attack.targetPos, nextCombo);
                    return;
                }

                // End Attack immediately (no follow-through or recovery)
                player.attack.isAttacking = false;
                player.attack.phase = MeleeAttackPhase.IDLE;
                player.attack.comboCount = 0;
                player.attack.inputBuffer = false;
                player.attack.comboWindowOpen = false;
                player.attack.cooldown = 3; // Short cooldown
            }
        }
        // 3. FOLLOW THROUGH -> RECOVERY (kept for compatibility but should not be reached)
        else if (player.attack.phase === MeleeAttackPhase.FOLLOW_THROUGH) {
            if (timer >= FRAMES.FOLLOW_THROUGH) {
                player.attack.phase = MeleeAttackPhase.RECOVERY;
                player.attack.timer = 0;
                player.attack.comboWindowOpen = true; // Open window for next input
            }
        }
        // 4. RECOVERY -> END or COMBO (kept for compatibility but should not be reached)
        else if (player.attack.phase === MeleeAttackPhase.RECOVERY) {
            // Check Buffer for Combo
            if (player.attack.inputBuffer && player.attack.comboWindowOpen) {
                // Trigger Next Combo
                const nextCombo = (player.attack.comboCount % 3) + 1; // 1->2, 2->3, 3->1
                startAttack(player, player.attack.targetPos, nextCombo);
                return;
            }

            if (timer >= FRAMES.RECOVERY) {
                // End Attack
                player.attack.isAttacking = false;
                player.attack.phase = MeleeAttackPhase.IDLE;
                player.attack.comboCount = 0;
                player.attack.inputBuffer = false;
                player.attack.comboWindowOpen = false;
                player.attack.cooldown = 5;
            }
        }
    }
};

function startAttack(player: Player, target: Vector2, combo: number) {
    player.attack.isAttacking = true;
    player.attack.phase = MeleeAttackPhase.WINDUP;
    player.attack.timer = 0;
    player.attack.comboCount = combo;
    player.attack.targetPos = { ...target };
    player.attack.hitTargets = []; // Clear for new swing
    player.attack.inputBuffer = false;
    player.attack.comboWindowOpen = false;

    // Optional: Duration isn't really used as a total max anymore, but we can store it for debug
    player.attack.duration = FRAMES.WINDUP + FRAMES.SWING + FRAMES.FOLLOW_THROUGH + FRAMES.RECOVERY;

    // Face Target
    const dx = target.x - player.pos.x;
    // Renderer handles facing, but we could update player.facingRight if needed.

    console.log(`WeaponSystem: Starting Attack Combo ${combo}`);
}

function processHitbox(state: GameState, player: Player, callbacks: SpellCallbacks, timer: number, duration: number) {
    // Only check collision every active frame during Swing

    // Calculate arc based on swing progress (0 to 1 over Swing phase)
    const t = timer / duration;

    // Geometry (Matching Attacking.ts logic basically)
    const mouseAngle = Math.atan2(
        player.attack.targetPos.y - player.pos.y,
        player.attack.targetPos.x - player.pos.x
    );

    const SWIPE_ARC = Math.PI / 2; // 90 deg
    const startOffset = -SWIPE_ARC / 2;
    const endOffset = SWIPE_ARC / 2;

    // Current Sword Angle
    const currentAngle = mouseAngle + startOffset + (endOffset - startOffset) * t;

    // Reach
    const reach = 3.5;
    const tipX = player.pos.x + Math.cos(currentAngle) * reach;
    const tipY = player.pos.y + Math.sin(currentAngle) * reach;

    // Hit Check
    let hitStopApplied = false;

    state.enemies.forEach(e => {
        if (e.isDead || player.attack.hitTargets.includes(e.id)) return;

        const distSq = distToSegmentSquared(e.pos, player.pos, { x: tipX, y: tipY });
        const hitRadius = e.radius + 0.5; // Generous

        if (distSq < hitRadius * hitRadius) {
            // HIT!
            const damage = calculateDamage(player);
            e.hp -= damage;
            callbacks.addFloatingText(`${Math.round(damage)}`, e.pos, '#ffffff');
            callbacks.createImpactPuff(e.pos, "SWORD_SWIPE" as any);
            soundSystem.playEnemyHit();

            // Knockback
            const kbDir = normalize({ x: e.pos.x - player.pos.x, y: e.pos.y - player.pos.y });
            e.velocity.x += kbDir.x * 0.25;
            e.velocity.y += kbDir.y * 0.25;

            player.attack.hitTargets.push(e.id);
            if (e.hp <= 0) {
                e.isDead = true;
                callbacks.onEnemyDeath(e);
            }

            // Hit Stop Simulation (Impact) - Limit to once per frame
            if (!hitStopApplied) {
                // rewind timer by 4 frames (extend swing phase), but don't go below 0
                player.attack.timer = Math.max(0, player.attack.timer - 4);
                hitStopApplied = true;
                console.log("Hit Stop Applied");
            }
        }
    });
}

function calculateDamage(player: Player): number {
    const base = 5;
    const weapon = player.equipment.MAIN_HAND?.stats.damage || base;
    const power = player.baseStats.power || 0;
    // Combo multiplier?
    const comboMult = 1 + (player.attack.comboCount - 1) * 0.2; // 1.0, 1.2, 1.4
    return (weapon + power * 1.5) * comboMult;
}
