




import { SpellType } from '../../types';
import { SpellBehavior } from './SpellBehavior';
import { FIREBALL_BEHAVIOR } from './behaviors/Fireball';
import { GENERIC_SPELL_BEHAVIOR } from './behaviors/GenericSpell';
import { FROST_PULSE_BEHAVIOR } from './behaviors/FrostPulseBehavior';
import { DETONATE_BEHAVIOR } from './behaviors/DetonateBehavior';
import { ARC_BEAM_BEHAVIOR } from './behaviors/ArcBehavior';
import { ARC_LIGHTNING_BEHAVIOR } from './behaviors/ArcLightningBehavior';
import { PortalBehavior } from './behaviors/PortalBehavior';
import { FrostBreathBehavior } from './behaviors/FrostBreath';
import { FireCircleBehavior } from './behaviors/FireCircleBehavior';
import { StoneShieldBehavior } from './behaviors/StoneShieldBehavior';
import { BlizzardBehavior } from './behaviors/BlizzardBehavior';
import { GravityWellBehavior } from './behaviors/GravityWellBehavior';

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
    "FrostBreathBehavior": FrostBreathBehavior,
    "BlizzardBehavior": BlizzardBehavior,

    // Lightning
    "ArcBehavior": ARC_BEAM_BEHAVIOR,
    "ArcLightningBehavior": ARC_LIGHTNING_BEHAVIOR,
    "StormCallBehavior": GENERIC_SPELL_BEHAVIOR,

    // Earth
    "EarthProjectileBehavior": GENERIC_SPELL_BEHAVIOR,
    "BoulderTossBehavior": GENERIC_SPELL_BEHAVIOR,
    "PortalBehavior": PortalBehavior,

    // Fire - New
    "FireCircleBehavior": FireCircleBehavior,

    // Earth - New
    "StoneShieldBehavior": StoneShieldBehavior,

    // Arcane
    "GravityWellBehavior": GravityWellBehavior
};
