import { ProjectileDefinition, SpellDefinition, SpellType, SpellElement } from '../../types';
import { SPELL_REGISTRY } from '../../modules/spells/SpellRegistry';

export const CATEGORIES: Record<string, string[]> = {
    ELEMENTAL: ['FIRE', 'ICE', 'LIGHTNING'],
    PHYSICAL: ['SWORD_SLASH', 'ARROW_SHOT', 'PUNCH'],
    UTILITY: ['DASH', 'HEAL', 'TELEPORT'],
    OTHER: []
};

export const SPELL_KEYS = Object.keys(SPELL_REGISTRY) as SpellType[];

export const BONE_HIERARCHY: [string, string][] = [
    ['torso', 'head'],
    ['torso', 'arm_l'], ['arm_l', 'hand_l'],
    ['torso', 'arm_r'], ['arm_r', 'hand_r'],
    ['torso', 'leg_l'], ['leg_l', 'foot_l'],
    ['torso', 'leg_r'], ['leg_r', 'foot_r']
];

export const TIMELINE_TRACKS = [
    { label: 'Torso', bone: 'torso' },
    { label: 'Head', bone: 'head' },
    { label: 'Arm Up (R)', bone: 'arm_r' },
    { label: 'Hand (R)', bone: 'hand_r' },
    { label: 'Weapon', bone: 'weapon_r' },
    { label: 'Arm Up (L)', bone: 'arm_l' },
    { label: 'Hand (L)', bone: 'hand_l' },
    { label: 'VFX Spawn', bone: 'vfx_point' },
];

export const DEFAULT_SPELL: SpellDefinition = {
    id: 'new_spell',
    name: 'New Spell',
    element: 'FIRE',
    spellKey: SpellType.FIRE,
    tags: ['PROJECTILE'],
    baseDamage: 25,
    damageType: 'MAGICAL',
    radius: 0.5,
    range: 10,
    cooldown: 1000,
    manaCost: 10,
    castTime: 2000,
    recoveryTime: 500,
    scaling: {
        damagePerLevel: 2,
        radiusPerLevel: 0,
        attribute: 'INT',
        attributeMultiplier: 1.5
    },
    behavior: {
        type: 'PROJECTILE',
        canCrit: true,
        pierceCount: 0,
        chainCount: 0,
        explodeOnHit: true
    },
    vfx: [],
    sfx: {},
    projectile: {
        type: 'STRAIGHT',
        speed: 10,
        gravity: 0,
        maxDistance: 20,
        spreadCount: 1,
        spreadAngle: 0,
        spawnOffset: { x: 0, y: 0 }
    },
    hitboxes: []
};
