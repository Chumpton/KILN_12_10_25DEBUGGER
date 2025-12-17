# Current Status: KILN ARPG

**Action:** Rebuild Strategy Initiated.
**Reason:** Unresolved performance degradation following UI iterations.
**Goal:** Clean slate architecture (`KILN_REBORN`) separating Engine, Game Logic, and UI.

## Rebuild Kit
I have generated the following artifacts in `.agent/rebuild_kit/` to assist in the reconstruction:

1.  **`file_structure.json`**: A comprehensive JSON map of the ideal Clean Architecture.
2.  **`rebuild_prompts.md`**: A sequence of copy-paste prompts to guide an AI through the rebuild process, phase by phase.
3.  **`migration_guide.md`**: Detailed instructions on what to salvage (Assets, Logic) and what to rewrite (Render Loops, Canvas Wrapper).

## Key Architectural Changes
*   **Engine vs Game**: Strict separation. The `Engine` handles the loop and canvas, the `Game` handles the rules.
*   **Asset Loading**: Centralized `AssetLoader` is already prototyped and should be the standard.
*   **Rendering**: Moving away from React-controlled Canvas to a persistent `Renderer` class to avoid React render cycles impacting 60FPS.

## Next Steps for User
1.  Review `.agent/rebuild_kit/file_structure.json`.
2.  Start a new Chat session or Project.
3.  Upload the `rebuild_prompts.md` content to the AI.
4.  Copy over the `src/assets` folder from this project.
