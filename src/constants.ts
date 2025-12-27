
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const MAP_SIZE = 20; // Used for spawning radius bounds

export const DEBUG_MODE = false;

export const FEATURE_FLAGS = {
  USE_TALENTS: true,
  USE_UNIFIED_MODIFIERS: true
};

export const HOUSE_POS = { x: -19.8, y: -13.7 };
export const HOUSE_RADIUS = 12.0; // Clears the 10x10 area + massive buffer

export const PLAYER_START_HP = 100; // PoE2 style: Higher base HP
export const PLAYER_START_MANA = 100;
export const PLAYER_START_SHIELD = 60; // Slightly higher shield
export const SHIELD_REGEN_RATE = 0.6; // 60fps adjusted (was 1.5)
export const SHIELD_COOLDOWN = 180; // 60fps adjusted (was 75)

export const MAX_LEVEL = 100;

export const MANA_REGEN = 0.2; // 60fps adjusted (was 0.5)

export const PLAYER_BASE_SPEED = 0.9; // 60fps adjusted (was 2.16)
export const MOUNT_SPEED_MULT = 2.0;

export const ROLL_DURATION = 72; // ~1.2s @ 60fps (was 30)
export const ROLL_COOLDOWN = 216; // ~3.6s @ 60fps (was 90)
export const ROLL_SPEED_MULT = 3.5; // Reduced from 5.0 to prevent wall clipping

export const ENEMY_BASE_SPEED = 1.6; // 60fps adjusted (was 3.75)
export const MAX_ENEMIES = 30;
export const ENEMY_RADIUS = 1.2; // 2x size collision
export const ENEMY_PHASE_DURATION = 120; // 60fps adjusted (was 50)

// Difficulty Scaling
export const SPAWN_INTERVAL_START = 120; // 2 seconds @ 60fps
export const SPAWN_INTERVAL_MIN = 12;    // 0.2 seconds @ 60fps

export const ZOMBIE_CONFIG = {
  baseDamage: 12, // PoE2: Higher base damage
  damagePerLevel: 2.0, // Better scaling
  attackCooldown: 70, // 60fps adjusted (was 29)
};

export const ENEMY_CASTER_CONFIG = {
  hp: 55, // PoE2: More HP
  speed: 1.2, // 60fps adjusted (was 2.88)
  damage: 14, // Higher damage
  range: 8,
  cooldown: 120, // 60fps adjusted (was 50)
};

export const ANT_CONFIG = {
  hp: 28, // PoE2: Nearly doubled HP
  speed: 3.75, // 60fps adjusted (was 9.0)
  damage: 8, // Doubled damage
  radius: 0.8, // Small hitbox
  xp: 5
};

export const GOLEM_CONFIG = {
  hp: 100, // PoE2: Doubled HP for tank
  speed: 0.5, // 60fps adjusted (Very slow) (was 1.25)
  damage: 25, // Higher damage
  radius: 1.5,
  xp: 30
};

export const SPITTER_CONFIG = {
  hp: 32, // PoE2: More HP
  speed: 1.6, // 60fps adjusted (was 3.75)
  damage: 12, // Higher damage
  radius: 0.9,
  range: 6.5, // Approx 200px in isometric view relative to TILE size
  cooldown: 96, // 60fps adjusted (was 40)
  xp: 15
};

export const BOSS_CONFIG = {
  hpMultiplier: 8, // PoE2: Bosses are MUCH tankier
  damageMultiplier: 2,
  radius: 3.0,
  xpMultiplier: 10,
  coinMultiplier: 10
};

export const ELITE_CONFIG = {
  hpMultiplier: 3, // PoE2: Elites less tanky but still dangerous
  damageMultiplier: 1.5, // Slightly less damage
  scale: 1.5,
  xpMultiplier: 4
};

export const ROCK_AURA_CONFIG = {
  damage: 2,
  radius: 1.2,
  rockCount: 3,
  respawnTime: 300, // 5 seconds @ 60fps
  rotationSpeed: 0.02, // Slowed down for 60fps
  duration: 5400, // 90 seconds @ 60fps
};

export const LOOT_DROP_CHANCE = 0.20; // Increased slightly to account for equipment
export const LOOT_LIFE = 600; // 60fps adjusted (was 250)
export const COIN_VALUE_RANGE = { min: 1, max: 5 };

export const SHOP_RESET_DURATION = 10800; // 60fps adjusted (was 4500)

export const HEARTHSTONE_POS = { x: -20.17, y: -0.39 };
export const SAFE_ZONE_RADIUS = 21;
export const HEARTHSTONE_COOLDOWN = 1800; // 30s @ 60fps

export const LEVEL_5_UNLOCK = 5;
export const LEVEL_7_UNLOCK = 7;

export const INVENTORY_GRID_W = 10;
export const INVENTORY_GRID_H = 4;

export const SPELL_TALENT_INFO = {
  FIRE: {
    ignition: { name: "Ignite", desc: "Burn damage over time" },
    blastRadius: { name: "Blast Radius", desc: "Increases explosion size" },
    multiFlare: { name: "Multi-Flare", desc: "Adds extra projectiles" },
    pyromania: { name: "Pyromania", desc: "Increases base damage" }
  },
  ICE: {
    deepFreeze: { name: "Deep Freeze", desc: "Increases slow duration" },
    iciclePierce: { name: "Icicle Pierce", desc: "Chance to pass through enemies" },
    shatter: { name: "Shatter", desc: "Frozen enemies explode on death" },
    frostbite: { name: "Frostbite", desc: "Increased damage to slowed enemies" }
  },
  LIGHTNING: {
    overload: { name: "Overload", desc: "Increases damage variance" },
    highVoltage: { name: "High Voltage", desc: "Increases Crit Chance" },
    chainReaction: { name: "Chain Reaction", desc: "+1 Chain count per rank" },
    staticShock: { name: "Static Shock", desc: "Chance to stun" }
  },
  EARTH: {
    tremor: { name: "Tremor", desc: "Increases Knockback" },
    heavyBoulder: { name: "Heavy Boulder", desc: "Increases Projectile Size" },
    landslide: { name: "Landslide", desc: "Fires 2 smaller rocks" },
    aftershock: { name: "Aftershock", desc: "Adds AoE damage on impact" }
  },
  WIND: {
    galeForce: { name: "Gale Force", desc: "Increases Knockback" },
    zephyrSpeed: { name: "Zephyr", desc: "Increases Projectile Speed" },
    tailwind: { name: "Tailwind", desc: "Reduces Cooldown" },
    tornadoSize: { name: "Tornado", desc: "Increases Hitbox Size" }
  }
};

export const BASE_STAT_CONFIG = {
  VITALITY: { hpPerPoint: 8 }, // PoE2: Slightly less HP per point but higher base
  POWER: { dmgPerPoint: 1.5 }, // PoE2: Much better damage scaling
  HASTE: { cdrPerPoint: 0.02 }, // 2% per point
  SWIFTNESS: { speedPerPoint: 0.02 } // 2% per point
};

export const CLASS_CONFIG: any = {
  MAGE: {
    hp: 100, mana: 120, spell: 'FIRE_FIREBALL', stats: { vitality: 0, power: 3, haste: 0, swiftness: 0 }, emoji: '🧙‍♂️', desc: "High Magic Power"
  },
  WARRIOR: {
    hp: 150, mana: 40, spell: 'EARTH_STONE_SHOT', stats: { vitality: 4, power: 0, haste: 0, swiftness: 0 }, emoji: '🛡️', desc: "Tanky & Strong"
  },
  RANGER: {
    hp: 120, mana: 80, spell: 'WIND_SLASH', stats: { vitality: 1, power: 1, haste: 0, swiftness: 2 }, emoji: '🧝', desc: "Fast & Agile"
  }
};

export const QUEST_CONFIG = {
  baseKillTarget: 10,
  baseCollectTarget: 15,
  baseRewardXp: 50,
  baseRewardCoins: 25,
};

export const COLORS = {
  background: '#051005', // Deep dark forest green/black
  grid: '#2d2d2d',
  gridHighlight: '#3d3d3d',
  uiBg: 'rgba(0, 0, 0, 0.7)',
  text: '#ffffff',
  fire: '#ef4444',
  ice: '#3b82f6',
  xp: '#a855f7', // Purple
  hp: '#ef4444',
  tree: '#2d6a4f',
  bomb: '#1c1917',
};

// Ground colors for procedural generation (WoW Forest Style)
export const GROUND_COLORS = [
  '#1a331a', // Dark Pine Green
  '#264d26', // Forest Green
  '#142614', // Deep Shadow Green
  '#335533', // Mossy Green
  '#2d4a2d', // Desaturated Forest
];

// Road colors for procedural generation (Dirt/Earth)
export const ROAD_COLORS = [
  '#3d3024', // Dark Dirt
  '#4a3b2e', // Packed Earth
  '#2e241b', // Mud
  '#544536', // Light Dirt
];

export const FOLIAGE_VARIANTS = ['🌿', '🌾', '🍄', '🌱'];

export const RARITY_COLORS = {
  common: '#ffffff', // White
  magic: '#3b82f6',  // Blue
  rare: '#fbbf24',   // Yellow
  legendary: '#f59e0b', // Orange/Gold
  set: '#10b981',    // Green (or Purple #a855f7) - User said Green/Purple
  mythic: '#a855f7'
};

export const LOOT_PHYSICS = {
  GRAVITY: 0.8,
  BOUNCE_FACTOR: 0.5,
  FRICTION: 0.9,
  INITIAL_POP: -8.0, // Initial Negative Z velocity (Up)
  VACUUM_RANGE: 3.0, // Tiles
  VACUUM_SPEED: 0.2
};

export const POTION_START_CHARGES = 0;
export const POTION_MAX_CHARGES = 5;
export const KILLS_PER_CHARGE = 3;

export const POTION_CONFIG = {
  HEALTH: {
    restore: 80, // PoE2: Better healing for higher HP pools
    color: '#ef4444',
    emoji: '🍷'
  },
  MANA: {
    restore: 60, // Slightly better mana restore
    color: '#3b82f6',
    emoji: '🧪'
  },
  SPEED: {
    duration: 300, // 5 seconds @ 60fps (was 125)
    multiplier: 1.5,
    color: '#22c55e',
    emoji: '⚡'
  }
};

export const IMPACT_PUFF_CONFIG: Record<string, { emoji: string, color: string }> = {
  FIRE: { emoji: '✨', color: '#ef4444' },
  ICE: { emoji: '❄️', color: '#3b82f6' },
  LIGHTNING: { emoji: '⚡', color: '#fcd34d' },
  WIND: { emoji: '💨', color: '#a7f3d0' },
  EARTH: { emoji: '🪨', color: '#8b4513' },
  ARCANE_EXPLOSION: { emoji: '✨', color: '#9333ea' },
  BOMB: { emoji: '💥', color: '#000000' },
  ROCK_AURA: { emoji: '🪨', color: '#8b4513' },
  GRAVITY_WELL: { emoji: '🌌', color: '#8b5cf6' },
  ICE_BLIZZARD: { emoji: '❄️', color: '#00BFFF' }
};

export const SPELL_UNLOCK_ORDER = [
  'ROCK_AURA', // Level 3
  'ICE',
  'LIGHTNING',
  'WIND',
  'ARCANE_EXPLOSION',
  'TELEPORT',
  'BOMB',
  'EARTH'
];
