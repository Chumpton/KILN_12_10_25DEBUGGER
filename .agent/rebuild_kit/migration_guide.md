# Migration Guide

**Goal:** Move features from `KILN_12_7_25` to `KILN_REBORN` without porting the lag.

## What to KEEP (Copy directly or with minor tweaks)
1.  **Assets**: Copy the entire `public/assets` folder. This is pure data.
2.  **Constants**: `src/constants.ts` contains valuable game balance data. Copy it but check for 60FPS adjustments.
3.  **World Generation Logic**: The math in `WorldGen.ts` (noise, biome rules) is solid.
4.  **Spell Definitions**: `src/content/spells` is good data.
5.  **Rig Definitions**: `EntityRigDefinitions.ts` is critical for the skeletal animation.

## What to REWRITE (Do NOT copy paste blindly)
1.  **`GameCanvas.tsx`**: **DO NOT COPY.** This file became too bloated. Rewrite it as a thin wrapper around a new `GameEngine` class.
2.  **`GameLoop.ts`**: The old loop had mixed responsibilities. Rewrite to be a pure time-step manager.
3.  **Rendering Loops**: The old `render()` function in `GameCanvas` mixed logic and drawing. Break this into `RenderSystem` class.

## Common Pitfalls to Avoid
1.  **Re-creating Objects in Render Loop**: Never say `const batch = []` inside `render()`. Use `itemPool.get()` or reuse arrays.
2.  **Canvas State Thrashing**: Minimize `ctx.save()`, `ctx.restore()`, and `ctx.fillStyle = ...` changes. Batch by color/texture.
3.  **Large Range Iteration**: Never iterate `canvas.width / TILE_HEIGHT`. Always use `toWorld` projection to find the exact visual bounds.
4.  **Event Listeners**: Ensure every `addEventListener` has a matching `removeEventListener` in `useEffect` cleanup.

## Specific Feature Porting
*   **Main Menu**: The `MainMenu.tsx` is mostly UI code. It can be copied, but ensure it doesn't leave heavy assets loaded when the game starts.
*   **Trees/Foliage**: Port the `renderTree` function but ensure it is called within the "Smart Viewport" loop, not the naive loop.
