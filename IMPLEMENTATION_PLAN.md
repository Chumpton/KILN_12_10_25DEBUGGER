# Kiln Project - Scalable RPG Implementation Plan

## 1. Objective
Refactor the current monolithic file structure into a modular, domain-driven architecture capable of supporting an expansive RPG with hundreds of spells, items, enemies, and complex systems, while maintaining the integrity of the current gameplay and systems (Player, Rigging, Spells, Hotbar).

## 2. Core Architecture Principles
- **Domain Segmentation**: Group code by Feature (e.g., `combat`, `inventory`, `world`) rather than Type (e.g., `components`, `utils`).
- **Data-Driven Content**: Define items, spells, and enemies as data/configurations that are loaded by systems, rather than hardcoded logic.
- **Separation of Concerns**: Visuals (Rendering) should be strictly separated from Logic (Simulation).

## 3. Proposed Folder Structure

```
src/
├── core/                   # The "Engine"
│   ├── loop/               # Game Loop & Time
│   ├── input/              # Input Handling
│   ├── events/             # Event Bus
│   └── types/              # Global Types
├── systems/                # Game Logic Systems (The Brains)
│   ├── combat/             # Damage, Health, Stats, Leveling
│   ├── spells/             # Spell Execution, Cooldowns, Casting
│   ├── inventory/          # Loot, Equipment, Shops
│   ├── ai/                 # Enemy Behaviors, Pathfinding
│   └── physics/            # Movement, Collision
├── content/                # Game Data Definitions (The content)
│   ├── spells/             # Spell Configs (Data + Behavior)
│   ├── items/              # Item Database & Loot Tables
│   ├── enemies/            # Enemy Stats & Behaviors
│   └── quests/             # Quest Definitions
├── rendering/              # Visual Layer (The Eyes)
│   ├── canvas/             # Main Canvas Components
│   ├── actors/             # Player, Ally, Enemy Renderers
│   ├── world/              # Terrain, Structures, Atmosphere
│   └── ui/                 # React UI Components
│       ├── hud/
│       ├── menus/
│       └── tools/          # Rigging Editor, etc.
└── utils/                  # Shared Helpers
```

## 4. Migration Phase 1: Segmentation (Current Focus)

We will progressively move files without breaking the build.

### A. Spells & Combat
**Goal**: Break `SpellRegistry.ts` (45KB) and `SpellSystem.ts`.
1.  Create `src/content/spells/library/` to hold individual spell definitions (e.g., `Fireball.ts`, `SwordSwipe.ts`).
2.  Create `src/systems/combat/` to house `damage` calculations and `stat` updates (currently inside `GameLoop` and `GameCanvas`).
3.  Ensure `SpellSystem` (logic) allows easy registration of new spells from the library.

### B. Items & Inventory
**Goal**: Organize Item management.
1.  Move `ItemDatabase.ts` to `src/content/items/ItemRegistry.ts`.
2.  Create `src/systems/inventory/InventoryManager.ts` to handle logic like "equip", "drop", "pickup" (currently scattered).

### C. Rendering Extraction
**Goal**: Clean up `GameCanvas.tsx`.
1.  Extract `VisualEffects` logic (puffs, sparkles) into `src/rendering/VisualEffectsSystem.ts`.
2.  Move specific renderers (House, Portal) to `src/rendering/world/structures/`.

## 5. Future Scalability (Phase 2)
- **JSON/YAML Loading**: Eventually move static data to JSON files for easier editing by non-programmers.
- **Save/Load System**: Serialize `GameState` to LocalStorage.
- **Asset Manager**: Preload images/sounds efficiently.
