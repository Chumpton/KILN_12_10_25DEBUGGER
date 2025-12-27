import { SpellDefinition } from '../../../modules/spells/SpellRegistry';
import { SpellEditorSession } from './SpellEditorTypes';
import { ANIMATION_LIBRARY } from '../../../data/AnimationData'; // Import added

/**
 * Controller for spell editing operations
 * Handles all spell mutation logic
 */

export class SpellEditorController {
    private session: SpellEditorSession;
    private onChange: (session: SpellEditorSession) => void;

    constructor(
        session: SpellEditorSession,
        onChange: (session: SpellEditorSession) => void
    ) {
        this.session = session;
        this.onChange = onChange;
    }

    /**
     * Update the entire spell
     */
    updateSpell(spell: SpellDefinition): void {
        this.session = {
            ...this.session,
            spell
        };
        this.onChange(this.session);
    }

    /**
     * Update spell name
     */
    setSpellName(name: string): void {
        this.updateSpell({
            ...this.session.spell,
            name
        });
    }

    /**
     * Update spell school (element)
     */
    setSpellSchool(school: string): void {
        this.updateSpell({
            ...this.session.spell,
            school: school as any
        });
    }

    /**
     * Update Base Stats
     */
    updateBaseStats(stats: Partial<any>): void {
        this.updateSpell({
            ...this.session.spell,
            baseStats: {
                ...this.session.spell.baseStats,
                ...stats
            }
        });
    }

    setCastTime(castTime: number): void {
        this.updateBaseStats({ castTime });
    }

    setRecoveryTime(cooldown: number): void {
        this.updateBaseStats({ cooldown });
    }

    setProjectileSpeed(projectileSpeed: number): void {
        this.updateBaseStats({ projectileSpeed });
    }

    setProjectileGravity(gravity: number): void {
        this.updateSpell({
            ...this.session.spell,
            geometry: {
                ...this.session.spell.geometry,
                usesGravity: gravity > 0,
                // If we want to store gravity strength, we might need a custom data field or check if geometry supports it. 
                // Using 'arcHeight' as proxy or just boolean for now.
            }
        });
    }

    // New: Update Geometry
    updateGeometry(geo: Partial<any>): void {
        this.updateSpell({
            ...this.session.spell,
            geometry: {
                ...this.session.spell.geometry,
                ...geo
            }
        });
    }

    /**
     * Update a rig part's transform (Base Rig or Animation Keyframe)
     */
    updateRigPart(
        part: string,
        data: Partial<{ x: number; y: number; rotation: number; scale: number }>,
        time?: number,
        animId?: string
    ): void {
        // If animation context is provided, we edit the Keyframe
        if (animId && time !== undefined) {
            const anim = ANIMATION_LIBRARY[animId];
            if (anim) {
                if (!anim.keyframes) anim.keyframes = [];

                // Find exact keyframe or create one?
                // For now, let's assume auto-key behavior:
                // If a keyframe exists exactly at 'time', update it.
                // If not, create one by copying previous state (interpolated) or just setting this value?
                // Creating a keyframe from scratch needs full pose?
                // 'addKeyframe' logic I wrote earlier does init.

                let kf = anim.keyframes.find(k => Math.abs(k.frame - time) < 0.1); // Float tolerance
                if (!kf) {
                    // Create new keyframe
                    kf = { frame: time, bones: {} };
                    anim.keyframes.push(kf);
                    anim.keyframes.sort((a, b) => a.frame - b.frame);
                }

                if (!kf.bones[part]) {
                    kf.bones[part] = { x: 0, y: 0, rotation: 0, scale: 1 };
                }

                // Merge updates
                kf.bones[part] = { ...kf.bones[part], ...data };

                // Trigger update
                this.onChange({ ...this.session });
                return;
            }
        }

        // Fallback: Update Base Rig Data (Bind Pose)
        // This is only if we are specifically editing the Rig Definition, not the Animation.
        // Currently CanvasPanel might call this.

        let currentRig = this.session.rig.rigData;
        const currentPart = currentRig.parts[part];
        if (!currentPart) return;

        const updatedPart = { ...currentPart, ...data };

        // Deep update session
        this.session = {
            ...this.session,
            rig: {
                ...this.session.rig,
                rigData: {
                    ...currentRig,
                    parts: {
                        ...currentRig.parts,
                        [part]: updatedPart
                    }
                },
                selectedPart: part
            }
        };
        this.onChange(this.session);
    }

    /**
     * Set IK Target
     */
    setIKTarget(target: { x: number; y: number }): void {
        this.session = {
            ...this.session,
            ik: {
                ...this.session.ik,
                target
            }
        };
        this.onChange(this.session);
    }

    /**
     * Adjust IK Target by delta
     */
    adjustIKTarget(delta: { x: number; y: number }): void {
        const current = this.session.ik.target;
        this.setIKTarget({
            x: current.x + delta.x,
            y: current.y + delta.y
        });
    }

    /**
     * Set selection
     */
    setSelectedPart(part: string): void {
        this.session = {
            ...this.session,
            rig: {
                ...this.session.rig,
                selectedPart: part
            }
        };
        this.onChange(this.session);
    }

    /**
     * Set Canvas Zoom
     */
    setCanvasZoom(zoom: number): void {
        this.session = {
            ...this.session,
            canvas: {
                ...this.session.canvas,
                zoom
            }
        };
        this.onChange(this.session);
    }

    /**
     * Set Canvas Pan
     */
    setCanvasPan(pan: { x: number; y: number }): void {
        this.session = {
            ...this.session,
            canvas: {
                ...this.session.canvas,
                pan
            }
        };
        this.onChange(this.session);
    }

    /**
     * Set selected animation
     */
    setSelectedAnim(animKey: string): void {
        this.session = {
            ...this.session,
            timeline: {
                ...this.session.timeline,
                selectedAnim: animKey
            }
        };
        this.onChange(this.session);
    }

    /**
     * Add a keyframe for a specific bone at a specific time
     */
    addKeyframe(animKey: string, bone: string, time: number): void {
        const anim = ANIMATION_LIBRARY[animKey];
        if (!anim) return;

        // Ensure keyframes array
        if (!anim.keyframes) anim.keyframes = [];

        // Find or create keyframe
        let kf = anim.keyframes.find(k => k.frame === time);
        if (!kf) {
            kf = {
                frame: time,
                bones: {}
            };
            anim.keyframes.push(kf);
            // Sort keyframes by frame time
            anim.keyframes.sort((a, b) => a.frame - b.frame);
        }

        if (!kf.bones[bone]) {
            kf.bones[bone] = { x: 0, y: 0, rotation: 0, scale: 1 };
        }

        this.onChange({ ...this.session });
    }
}
