# Path of Exile 2 Style Balance Adjustments

## Philosophy
Match PoE2's combat pacing where:
- Player feels powerful but vulnerable
- Enemies are dangerous but killable
- Damage scales meaningfully with gear/stats
- Combat is fast-paced but tactical

## Current vs Proposed Values

### Player Stats (Level 1)
**Current:**
- HP: 50-90 (class dependent)
- Damage: ~30 (Fireball base)
- HP per Vitality: 10

**Proposed (PoE2 Style):**
- HP: 100-150 (class dependent)
- Damage: 15-25 (spell base)
- HP per Vitality: 8
- Power damage multiplier: 1.5 (up from 0.5)

### Enemy Stats
**Current:**
- Basic Zombie: 30 HP, 9 damage
- Ant: 15 HP, 4 damage
- Golem: 50 HP, 15 damage

**Proposed (PoE2 Style):**
- Basic Zombie: 40-60 HP (scales with player level), 12-18 damage
- Ant: 25-35 HP, 8-12 damage
- Golem: 80-120 HP, 20-30 damage
- Elite multiplier: 3x HP, 1.5x damage (down from 5x/2x)
- Boss multiplier: 8x HP, 2x damage (up from 5x/2x)

### Spell Damage
**Current:**
- Fireball: 30 base
- Ice: 4 base
- Lightning: 6 base

**Proposed (PoE2 Style):**
- Fireball: 18-24 base (slower, harder hitting)
- Frostbolt: 12-16 base (faster, consistent)
- Lightning: 8-14 base (high variance, fast)
- Damage variance matters more

### Scaling Per Level
**Player:**
- HP: +8 per level (down from +5)
- Spell damage: +10% per level
- Enemy damage: +15% per level

**Enemies:**
- HP: +25% per player level
- Damage: +15% per player level

## Implementation Notes
- Keep cooldowns the same (already balanced)
- Keep mana costs the same
- Adjust BASE_STAT_CONFIG for better scaling
- Update enemy spawn HP/damage formulas
- Rebalance potion healing (50 → 80)
