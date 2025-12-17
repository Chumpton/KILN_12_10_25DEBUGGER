# Rebuild Prompts Strategy

Use these prompts sequentially to rebuild the game from a clean slate.

## Phase 1: Core Engine & Rendering (The Foundation)
**Prompt:**
> "Initialize a new React TypeScript project. Create a `src/engine` directory. 
> Implement a `GameLoop.ts` class that uses `requestAnimationFrame` and provides a `start()`, `stop()`, and `onUpdate(dt)` callback system. 
> Implement a `Renderer.ts` class that manages an HTML5 Canvas Context.
> Create `src/engine/graphics/Camera.ts` to handle Isometric rendering math (`toScreen`, `toWorld`) and viewport tracking.
> Finally, create a `GameCanvas.tsx` React component that initializes these systems and renders a simple static grid of tiles to prove the engine works. 
> **Constraint:** Do not add game logic yet. Focus on achieving 60 FPS with an empty grid."

## Phase 2: Asset Management & World Generation
**Prompt:**
> "Implement `src/engine/assets/AssetLoader.ts` to preload images (Player, Tiles, UI).
> Copy the `WorldGen.ts` logic from the old project but refactor it to be purely functional (input: x, y -> output: TileData).
> Update `Renderer.ts` to use a 'Smart Viewport' (only iterate visible tiles). 
> Draw the generated world using the `AssetLoader` images. 
> **Constraint:** Ensure tile rendering is batched and uses no expensive canvas effects (shadow/filter)."

## Phase 3: Entity System & Player
**Prompt:**
> "Create `src/game/GameState.ts` to hold the Player position and Stats.
> Implement `src/modules/entities/Player.ts` to handle movement input (Mouse Click/Keyboard).
> Integrate `PlayerRenderer.ts` (migrated from old project) to draw the character in the center of the screen.
> Update `Camera.ts` to lock onto the player coordinates.
> **Verification:** You should be able to walk around the infinite procedural world smoothly."

## Phase 4: Combat & Spells
**Prompt:**
> "Port the `SpellSystem` and `ProjectileSystem` from the old project.
> Create a standardized `IEntity` interface for Enemies and Player.
> Implement `Enemy.ts` with basic AI (chase player).
> Ensure projectiles detect collision with Enemies using spatial hashing or simple distance checks.
> **Constraint:** Use Object Pooling for Projectiles and Enemies to prevent Frame Drops."

## Phase 5: UI & Integration
**Prompt:**
> "Port the `MainMenu` and `HUD` components.
> Ensure `App.tsx` handles the state switching (Menu <-> Game).
> Connect the HUD to the `GameState` to show Health/Mana.
> **Final Polish:** Verify that switching between Menu and Game cleans up the GameLoop and Event Listeners perfectly."
