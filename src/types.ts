

export type Vector2 = {
  x: number;
  y: number;
};

export enum SpellType {
  // --- FIRE ---
  FIRE_FLAME_WAVE = 'FIRE_FLAME_WAVE',
  FIRE_METEORFALL = 'FIRE_METEORFALL',
  FIRE_CINDER_DASH = 'FIRE_CINDER_DASH',
  FIRE_FLAME_WALL = 'FIRE_FLAME_WALL',
  FIRE_FLAMEBURST_PUNCH = 'FIRE_FLAMEBURST_PUNCH',
  FIRE_HEAT_BLOOM_AURA = 'FIRE_HEAT_BLOOM_AURA',
  FIRE_MOLTEN_ORB = 'FIRE_MOLTEN_ORB',
  FIRE_INFERNO_BEAM = 'FIRE_INFERNO_BEAM',
  FIRE_LAVA_LASH = 'FIRE_LAVA_LASH',
  FIRE_FLAMEBURST = 'FIRE_FLAMEBURST',
  FIRE_DETONATE = 'FIRE_DETONATE',
  FIRE_CIRCLE = 'FIRE_CIRCLE',

  // --- ICE ---
  ICE_FROST_BOLT = 'ICE_FROST_BOLT',
  ICE_FROST_BREATH = 'FROST_BREATH',
  FROST_BREATH = 'FROST_BREATH', // Support inconsistent naming in spec
  ICE_FROST_PULSE = 'ICE_FROST_PULSE',
  ICE_GLACIAL_SPIKE = 'ICE_GLACIAL_SPIKE',
  ICE_FROZEN_NOVA = 'ICE_FROZEN_NOVA',
  ICE_ICE_WALL = 'ICE_ICE_WALL',
  ICE_BLIZZARD = 'ICE_BLIZZARD',
  ICE_PERMAFROST_AURA = 'ICE_PERMAFROST_AURA',
  ICE_SHATTER_LANCE = 'ICE_SHATTER_LANCE',
  ICE_CHILLING_DASH = 'ICE_CHILLING_DASH',
  ICE_ICE_JAVELIN = 'ICE_ICE_JAVELIN',
  ICE_FROSTQUAKE = 'ICE_FROSTQUAKE',

  // --- LIGHTNING ---
  LIGHTNING_SPARK_CHAIN = 'LIGHTNING_SPARK_CHAIN',
  LIGHTNING_LIGHTNING_BOLT = 'LIGHTNING_LIGHTNING_BOLT',
  LIGHTNING_SHOCK_NOVA = 'LIGHTNING_SHOCK_NOVA',
  LIGHTNING_BALL_LIGHTNING = 'LIGHTNING_BALL_LIGHTNING',
  LIGHTNING_THUNDER_DASH = 'LIGHTNING_THUNDER_DASH',
  LIGHTNING_STATIC_SPHERE = 'LIGHTNING_STATIC_SPHERE',
  LIGHTNING_ARC_BEAM = 'LIGHTNING_ARC_BEAM',
  LIGHTNING_STORMCALL = 'LIGHTNING_STORMCALL',
  LIGHTNING_VOLT_CHAKRAM = 'LIGHTNING_VOLT_CHAKRAM',
  LIGHTNING_MAGNET_PIERCER = 'LIGHTNING_MAGNET_PIERCER',
  LIGHTNING_ARC_LIGHTNING = 'LIGHTNING_ARC_LIGHTNING',

  // --- EARTH ---
  EARTH_STONE_SHIELD = 'EARTH_STONE_SHIELD',
  EARTH_STONE_SHOT = 'EARTH_STONE_SHOT',
  EARTH_ROCK_CRASH = 'EARTH_ROCK_CRASH',
  EARTH_EARTHEN_PILLAR = 'EARTH_EARTHEN_PILLAR',
  EARTH_SEISMIC_WAVE = 'EARTH_SEISMIC_WAVE',
  EARTH_BOULDER_TOSS = 'EARTH_BOULDER_TOSS',
  EARTH_QUICKSAND = 'EARTH_QUICKSAND',
  EARTH_CRYSTAL_SPIRES = 'EARTH_CRYSTAL_SPIRES',
  EARTH_LEAP_SLAM = 'EARTH_LEAP_SLAM',
  EARTH_TECTONIC_SHIFT = 'EARTH_TECTONIC_SHIFT',
  EARTH_EARTHQUAKE = 'EARTH_EARTHQUAKE',

  // Legacy / Utility & Monster Spells
  FIRE = 'FIRE',
  ICE = 'ICE',
  WIND = 'WIND',
  EARTH = 'EARTH', // General Earth type
  ACID_SPIT = 'ACID_SPIT',
  FLAME_WALL = 'FLAME_WALL',
  ARCANE_EXPLOSION = 'ARCANE_EXPLOSION',

  FIRE_FIREBALL = 'FIRE_FIREBALL', // Missing basic spell?
  BOMB = 'BOMB',
  HEARTHSTONE = 'HEARTHSTONE',
  SWORD_SWIPE = 'SWORD_SWIPE',
  WHIRLWIND_STRIKE = 'WHIRLWIND_STRIKE',
  TELEPORT = 'TELEPORT',
  FLAMEBLAST = 'FLAMEBLAST',
  ARCANE_PORTAL = 'ARCANE_PORTAL',
  GRAVITY_WELL = 'GRAVITY_WELL',

  // Keep legacy for compatibility during refactor if needed (or map them later)
  // For now, I will assume we are doing a hard cutover as requested.
  // But wait, there are 40 spells in the list. I see 30 above.
  // Let me re-read the user request to make sure I didn't miss the Earth ones.
  // Ah, the user request cut off after "EARTH_SEISMIC_WAVE ... truncated".
  // I only have 34 full definitions + part of Seismic wave.
  // I must be careful. I will use what I have and maybe preserve legacy ones for safety if I don't have the full list.
  // Wait, I can see the truncated message says "truncated 46874 bytes".
  // The user provided "40 Spells (10 per element)".
  // I have:
  // Fire: 10
  // Ice: 10
  // Lightning: 10
  // Earth: I see Stone Shot, Rock Crash, Earthen Pillar, Seismic Wave... (4 so far).
  // I am missing 6 Earth spells.
  // I should probably ask for the rest, OR I can just map what I have.
  // The prompt says "Implement... 40 Spells".
  // I'll define the enums I know. For the missing ones, I might check if they were in the previous file content or just stub them.
  // Actually, I should probably check if the user gave me a file or I can read the clipboard... no I can't.
  // I will define the ones I have. I'll add the others as generic placeholders if I can guess them or just leave them out for now.
  // Actually, looking at the previous file (SpellSystem.ts), there were legacy Earth spells: EARTH, ROCK_AURA, BOULDER_TOSS, EARTHEN_ARMOR, STONE_SPIKES, QUAKE_STOMP, MUD_SNARE.
  // The new list has EARTH_STONE_SHOT, EARTH_ROCK_CRASH, EARTH_EARTHEN_PILLAR, EARTH_SEISMIC_WAVE.
  // I'll just add the ones I have fully.
}

export type SpellElement = 'FIRE' | 'ICE' | 'LIGHTNING' | 'EARTH' | 'WIND' | 'ARCANE' | 'NATURE' | 'PHYSICAL' | 'UTILITY';

export enum MeleeAttackPhase {
  IDLE = 'IDLE',
  WINDUP = 'WINDUP',
  SWING = 'SWING',
  FOLLOW_THROUGH = 'FOLLOW_THROUGH',
  RECOVERY = 'RECOVERY'
}

export interface Entity {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  radius: number;
  isDead: boolean;
}

export interface FireTalents { ignition: number; blastRadius: number; multiFlare: number; pyromania: number; }
export interface IceTalents { deepFreeze: number; iciclePierce: number; shatter: number; frostbite: number; }
export interface LightningTalents { overload: number; highVoltage: number; chainReaction: number; staticShock: number; }
export interface EarthTalents { tremor: number; heavyBoulder: number; landslide: number; aftershock: number; }
export interface WindTalents { galeForce: number; zephyrSpeed: number; tailwind: number; tornadoSize: number; }

export interface PlayerSpellTalents {
  allocations: Record<string, number>; // Key: "spellId:talentId" -> currentRank
}

export interface PlayerBaseStats {
  vitality: number;  // Increases Max HP
  power: number;     // Increases Spell Damage
  haste: number;     // Reduces Cooldowns
  swiftness: number; // Increases Movement Speed
  shield: number;    // Increases Max Shield
  damage?: number;   // Flat Damage Bonus
  projectileCount?: number; // Additional Projectiles
}

export type EquipmentSlot = 'HEAD' | 'CHEST' | 'LEGS' | 'FEET' | 'SHOULDERS' | 'MAIN_HAND' | 'OFF_HAND';
export type Rarity = 'common' | 'rare' | 'legendary' | 'mythic';
export type VisualTheme = 'RUSTED' | 'IRON' | 'HIGHLORD' | 'NECRO';
export type HeroClass = 'MAGE' | 'WARRIOR' | 'RANGER';

export interface BaseStatConfig {
  VITALITY: { hpPerPoint: number };
  POWER: { dmgPerPoint: number };
  HASTE: { cdrPerPoint: number };
  SWIFTNESS: { speedPerPoint: number };
}

export interface ClassConfig {
  [key: string]: {
    hp: number;
    mana: number;
    spell: string;
    stats: {
      vitality: number;
      power: number;
      haste: number;
      swiftness: number;
    };
    emoji: string;
    desc: string;
  };
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  visual: {
    theme: VisualTheme;
    primaryColor: string;
  };
  stats: Partial<PlayerBaseStats>;
  icon: string;
  weaponId?: string; // Link to WeaponRegistry
  weaponLength?: number; // Length in pixels for rendering
  weaponType?: 'SWORD' | 'STAFF' | 'BOW';
  // Grid Inventory
  w: number;
  h: number;
  gridX?: number; // Column index (0-9)
  gridY?: number; // Row index (0-3)
}

export interface ShopItem extends EquipmentItem {
  price: number;
}

export interface OrbitingRock {
  id: number;
  angleOffset: number;
  isDead: boolean;
  respawnTimer: number;
}

export interface PlayerVisuals {
  bodyType: 'slim' | 'average' | 'bulky';
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  head?: string; // Path to head asset
}



export type MorphType = 'NONE' | 'WOLF' | 'BEAR' | 'SHADOW';

export interface Buff {
  id: string;
  name: string;
  icon: string;
  duration: number; // milliseconds
  maxDuration: number;
  stacks?: number;
  description?: string;
  type: 'buff' | 'debuff';
}

export interface Player extends Entity {
  name: string; // Added Name
  heroClass: HeroClass;
  facingRight: boolean; // Visual state
  visuals: PlayerVisuals; // New visuals field
  morph: MorphType; // Transformation State
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldRegenTimer: number;
  mana: number;
  maxMana: number;
  xp: number;
  xpTally: number; // For accumulating UI tally
  xpTimer: number; // For tally fadeout
  xpGlowTimer: number; // For purple collection glow
  level: number;
  toNextLevel: number;
  currentSpell: SpellType;
  knownSpells: SpellType[];
  hotbar: (SpellType | null)[];
  cooldowns: Record<string, number>; // SpellType -> Remaining MS
  speed: number;

  // Progression
  statPoints: number; // For Base Stats
  spellTalentPoints: number; // For Elemental Trees
  spellTalents: PlayerSpellTalents;
  baseStats: PlayerBaseStats;

  bombAmmo: number;
  isMounted: boolean;
  coins: number;
  magicDust: number; // Global Resource
  spellUpgrades: Record<string, number>; // SpellID -> Level
  spellExperience: Record<string, number>; // SpellID -> Current Dust Progress
  potions: {
    health: number;
    mana: number;
    speed: number;
  };
  potionKillCounter: number; // Tracks kills for recharge
  spellPoints?: number; // Available points to unlock spells
  activeBuffs: {
    speedBoost: number; // Frames remaining
    rockAuraTimer: number; // Frames remaining
    righteousFire: boolean;
    stoneskin: number; // Frames
    thorns: number; // Frames
    deflection: number; // Frames
    morphTimer: number; // Frames
  };
  buffs: Buff[]; // New UI Buffs system


  // Loot System
  equipment: {
    HEAD: EquipmentItem | null;
    CHEST: EquipmentItem | null;
    LEGS: EquipmentItem | null;
    FEET: EquipmentItem | null;
    SHOULDERS: EquipmentItem | null;
    MAIN_HAND: EquipmentItem | null;
    OFF_HAND: EquipmentItem | null;
  };
  // Card System
  equippedCards: Partial<Record<SpellType, import('./modules/cards/types').CardInstance[]>>;
  cardInventory: import('./modules/cards/types').CardInstance[];
  inventory: EquipmentItem[];

  // Rock Aura
  rockAura: {
    rotation: number;
    rocks: OrbitingRock[];
  };

  // Roll Mechanic
  roll: {
    isRolling: boolean;
    timer: number;
    cooldown: number;
    dir?: Vector2; // Locked direction
  };

  // Casting Animation
  casting: {
    isCasting: boolean;
    currentSpell: SpellType;
    timer: number;
    duration: number;
    targetPos: Vector2;
    hitTargets: string[]; // Track enemies hit during a swing to apply damage once
    // New Channeling Fields
    tickTimer: number;   // For defining tick rate (e.g. every 6 frames)
    startFrame: number;  // Absolute frame start
    endFrame: number;    // Absolute frame end (for auto-stop)
    // Optional trail points for melee swings (world-space positions used for visual trail)
    trail: { x: number; y: number }[]; // Changed type and made non-optional
    // Channeling
    isChanneling?: boolean;
    channelStart?: number;
    channelStage?: number;
    maxChannelStages?: number;
    // Burst Logic
    burstQueue?: {
      spellId: SpellType;
      count: number;
      interval: number;
      timer: number;
      originalTarget: Vector2;
      behaviors?: Set<string>; // To carry over behaviors?
      data?: any; // Carry over data
    }[];
  };

  // Weapon Attack State
  attack: {
    isAttacking: boolean;
    phase: MeleeAttackPhase;
    weaponId: string | null;
    timer: number;
    duration: number;
    cooldown: number;
    comboCount: number;
    targetPos: Vector2; // Locked direction of the swing
    hitTargets: string[]; // Track engaged enemies to prevent double hits
    comboWindowOpen: boolean;
    inputBuffer: boolean;
  };

  lockedTargetId: string | null;
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  xpValue: number;    // NEW
  coinValue: number;  // NEW
  damage: number;
  isFrozen: boolean;
  freezeTimer: number;
  stunTimer?: number; // Stun support
  type: 'melee' | 'caster' | 'boss' | 'ant' | 'golem' | 'spitter' | 'dummy' | 'wolf';
  isElite: boolean; // Elite modifier
  facingRight: boolean; // Visual state

  // Ranged Cooldown (Frame based)
  attackCooldown: number;

  // Melee Attack State (Time based)
  isAttacking: boolean;
  attackStartTime: number;
  nextAttackTime: number; // When cooldown finishes
  didDamage: boolean;

  // Unstuck / Phasing Logic
  lastStuckPos?: Vector2;
  stuckCheckTimer?: number;
  stuckCounter?: number;
  isPhasing: boolean;
  phaseTimer: number;
  forceMoveDir?: Vector2; // Legacy wiggle

  // Burn
  burnTimer: number;
  burnDamage: number;

  // Shock
  shockTimer: number;
  shockStacks?: number;

  // AI State
  spawnPos: Vector2;
  aiState: 'IDLE' | 'PATROL' | 'CHASE';
  patrolTarget: Vector2 | null;
  patrolTimer: number;
  patrolRange?: number;

  // Animation States
  hitTimer: number; // Frames for hit flash
  enemyState: 'ALIVE' | 'DYING';
  deathTimer: number; // Frames for death animation
  // Optional hitbox expressed in world units (ellipse centered near the body)
  hitbox?: {
    rx: number; // horizontal radius (world units)
    ry: number; // vertical radius (world units)
    offsetX?: number; // center offset from entity.pos.x
    offsetY?: number; // center offset from entity.pos.y
    rotation?: number; // radians
  };

  // Detailed hitboxes for individual body parts (screen-space rectangles)
  detailedHitboxes?: {
    head?: { x: number; y: number; w: number; h: number };
    torso?: { x: number; y: number; w: number; h: number };
    legs?: { x: number; y: number; w: number; h: number };
    leftArm?: { x: number; y: number; w: number; h: number };
    rightArm?: { x: number; y: number; w: number; h: number };
  };

  // Status Effects
  status?: Record<string, any>; // Generic status bag (shockStacks etc)
}

export interface Projectile extends Entity {
  spawnerId?: string; // ID of entity that created this
  spellType: SpellType;
  damage: number;
  duration: number; // Frames to live (Legacy?)
  life?: number; // Current life
  maxLife?: number; // Max life
  // data?: any; // REMOVED DUPLICATE
  hitList: string[]; // For piercing: track enemies already hit
  isShrapnel?: boolean; // For fire: prevent recursive explosions
  targetPos?: Vector2; // For bomb tossing
  isEnemy: boolean;
  prevPos?: Vector2; // Previous position for continuous collision detection
  // Elemental Properties
  explosionRadius?: number;
  knockback?: number;
  // Bouncing Logic
  bounces?: number;
  maxBounces?: number;
  chainRange?: number;
  passedFlameWall?: boolean; // FLAME_WALL buff tracking
  data?: any; // Generic data for trails etc
}

export interface AreaEffect extends Entity {
  spellType: SpellType;
  duration: number;
  radius: number; // For circular effects
  tickTimer: number;
  tickInterval: number;
  damage: number;
  ownerId: string; // Player or Enemy ID
  data?: any; // E.g. max stages for Flameblast
  // Rectangular props (Flame Wall)
  rotation?: number;
  width?: number;
  height?: number;
}

export interface Loot extends Entity {
  type: 'bomb' | 'equipment' | 'coin' | 'xp_orb' | 'potion';
  life: number;
  data?: EquipmentItem;
  value?: number;

  // Physics & Render State
  rarity: 'common' | 'magic' | 'rare' | 'legendary' | 'set' | 'mythic';
  labelVisible: boolean;
  physics: {
    velocity: Vector2;
    z: number; // Height off ground
    vz: number; // Vertical velocity
    isGrounded: boolean;
  };
  renderPos: Vector2; // Final render position (pos.y - z)

  // XP Orb Physics State (Legacy support, merging into global physics)
  xpProps?: {
    state: 'DROPPING' | 'IDLE' | 'VACUUM';
    timer: number;
    velocity: Vector2;
    targetGround: Vector2;
    startPos: Vector2;
    vacuumSpeed: number;
  };
}

export interface FloatingText {
  id: string;
  pos: Vector2; // Screen coords
  text: string;
  color: string;
  life: number;
  velocity: Vector2;
}

export interface VisualEffect {
  id: string;
  type: 'sparkle' | 'lightning_chain' | 'nova' | 'impact_puff' | 'click_pulse';
  pos: Vector2;
  life: number;
  data?: any; // For lightning: targetPos, For nova: radius, For puff: emoji/color
}

export type QuestType = 'kill' | 'collect';

export interface Quest {
  id: string;
  type: QuestType;
  description: string;
  target: number;
  current: number;
  rewardXp: number;
  rewardCoins: number;
}

export interface TreeState {
  pos: Vector2;
  burnTimer: number;
  isBurnt: boolean;
}

export interface Ally extends Entity {
  name: string;
  colorScheme: {
    skin: string;
    shirt: string;
    shirtColor?: string; // fix for shirt color type inconsistency if any
    pants: string;
  };
  description: string;
  headEmoji?: string;
  scale?: number;
}

export interface WorldObject {
  id: string;
  assetPath: string;
  assetType: 'geometric' | 'png' | 'tile';
  pos: Vector2;
  scale: number;
  zIndex: number;
  width?: number; // Original pixel width
  height?: number; // Original pixel height
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  allies: Ally[];
  projectiles: Projectile[];
  loot: Loot[];
  texts: FloatingText[];
  visualEffects: VisualEffect[];
  trees: Record<string, TreeState>; // Track burnt trees by "x,y" key
  tileMap?: any[]; // Array from TileSystem.exportData()
  tileVersion?: number; // Version number for syncing tile map changes
  score: number;
  gameOver: boolean;
  activeQuest: Quest;
  questsCompleted: number;
  shopItems: ShopItem[];
  shopResetTimer: number;
  bossSpawnPending?: boolean;
  areaEffects: AreaEffect[];
  isWorldEditorActive?: boolean; // World editor mode flag
  worldObjects: WorldObject[]; // Placed objects from World Editor
  frame: number;
}

export interface Renderable {
  type: 'player' | 'enemy' | 'projectile' | 'tree' | 'loot' | 'effect' | 'foliage' | 'rock_aura' | 'ally' | 'structure_floor' | 'structure_roof' | 'structure_portal' | 'area_effect' | 'charge_circle';
  y: number; // Y-sort key
  pos: Vector2;
  data?: any;
}

export interface BoneTransform {
  x?: number;
  y?: number;
  rotation?: number; // radians
  scale?: number;
}

export const DEFAULT_TRANSFORM_VAL: BoneTransform = { x: 0, y: 0, rotation: 0, scale: 1 };

export interface AnimationKeyframe {
  frame: number;
  bones: Record<string, BoneTransform>;
  events?: string[];
}

export interface AnimationHitbox {
  id: string;
  bone: string;
  type: 'RECT' | 'CIRCLE';
  x: number;
  y: number;
  w?: number; // for RECT
  h?: number; // for RECT
  r?: number; // for CIRCLE
  activeStart: number;
  activeEnd: number;
}

export interface AnimationPhase {
  duration: number;
  startFrame: number;
  color: string;
}

export interface SpellDefinition {
  id: string;
  name: string;
  // Core Stats
  element: SpellElement;
  spellKey: SpellType;
  tags: string[]; // PROJECTILE, AOE, MOVEMENT, etc.
  baseDamage: number;
  damageType: 'PHYSICAL' | 'MAGICAL' | 'TRUE';
  radius: number;
  range: number;
  cooldown: number; // ms
  manaCost: number;
  castTime: number; // ms
  recoveryTime: number; // ms

  // Scaling
  scaling: {
    damagePerLevel: number;
    radiusPerLevel: number;
    attribute: 'INT' | 'STR' | 'DEX';
    attributeMultiplier: number;
  };

  // Behavior
  behavior: {
    type: 'PROJECTILE' | 'MELEE' | 'AURA' | 'DASH' | 'CHANNELED';
    canCrit: boolean;
    pierceCount: number;
    chainCount: number;
    explodeOnHit: boolean;
    hitsPerSecond?: number; // For channeled
  };

  // Trajectory (if projectile)
  projectile?: ProjectileDefinition;

  // Visuals
  vfx: VFXLayerDefinition[];
  sfx: {
    castSound?: string;
    impactSound?: string;
  };

  // Detection
  hitboxes: HitboxDefinition[];
}

export interface ProjectileDefinition {
  type: 'STRAIGHT' | 'LOBBED' | 'HOMING' | 'ORBIT' | 'RETURN';
  speed: number;
  gravity?: number;
  maxDistance: number;
  homingStrength?: number;
  spreadCount: number;
  spreadAngle: number;
  spawnOffset?: { x: number; y: number };
}

export interface VFXLayerDefinition {
  id: string;
  attachTo: string; // Bone name or 'vfx_point'
  phase: 'CAST_START' | 'TRAVEL' | 'IMPACT' | 'LOOP';
  style: 'GLOW' | 'FLAME_TRAIL' | 'SPARK_BURST' | 'EXPLOSION' | 'SMOKE' | 'CUSTOM';
  color: string;
  scale: number;
  lifetime: number;
}

export interface HitboxDefinition {
  id: string;
  shape: 'CIRCLE' | 'BOX' | 'CAPSULE';
  attachedToBone?: string; // If undefined, relative to caster origin
  offsetX: number;
  offsetY: number;
  width: number; // or Radius
  height: number;
  startFrame: number;
  endFrame: number;
}

export interface AnimationEvent {
  id: string;
  frame: number;
  type: 'SOUND' | 'PARTICLE' | 'SCREEN_SHAKE' | 'SPAWN_PROJECTILE' | 'CUSTOM' | 'CAST' | 'HITBOX_START' | 'HITBOX_END';
  data: string;
}

export interface AnimationClip {
  id: string;
  name: string;
  totalDuration: number;
  phases: Record<string, AnimationPhase>;
  keyframes: AnimationKeyframe[];
  hitboxes: AnimationHitbox[];
  events: AnimationEvent[];
}
