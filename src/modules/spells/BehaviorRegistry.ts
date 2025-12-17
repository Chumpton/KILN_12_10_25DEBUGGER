




import { SpellType } from '../../types';
import { SpellBehavior } from './SpellBehavior';
import { FIREBALL_BEHAVIOR } from './behaviors/Fireball';
import { GENERIC_SPELL_BEHAVIOR } from './behaviors/GenericSpell';
import { FROST_PULSE_BEHAVIOR } from './behaviors/FrostPulseBehavior';
import { DETONATE_BEHAVIOR } from './behaviors/DetonateBehavior';
import { ARC_BEAM_BEHAVIOR } from './behaviors/ArcBehavior';
import { ARC_LIGHTNING_BEHAVIOR } from './behaviors/ArcLightningBehavior';

export const BEHAVIOR_REGISTRY: Record<string, SpellBehavior> = {
    // Core / Generic
    "GenericBehavior": GENERIC_SPELL_BEHAVIOR,
    "ProjectileBehavior": GENERIC_SPELL_BEHAVIOR,

    // Fire
    "FireballBehavior": FIREBALL_BEHAVIOR,
    "DetonateBehavior": DETONATE_BEHAVIOR,
    "FlameblastBehavior": GENERIC_SPELL_BEHAVIOR, // Placeholder

    // Ice
    "FrostPulseBehavior": FROST_PULSE_BEHAVIOR,

    // Lightning
    "ArcBehavior": ARC_BEAM_BEHAVIOR,
    "ArcLightningBehavior": ARC_LIGHTNING_BEHAVIOR,
    "StormCallBehavior": GENERIC_SPELL_BEHAVIOR,

    // Earth
    "EarthProjectileBehavior": GENERIC_SPELL_BEHAVIOR,
    "BoulderTossBehavior": GENERIC_SPELL_BEHAVIOR,
    "PORTAL_BEHAVIOR": PortalBehavior
};
