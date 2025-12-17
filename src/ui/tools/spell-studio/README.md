# Spell Studio - Antigravity Architecture

## Overview

The Spell Studio has been refactored into a clean, layered architecture following the "antigravity" principle. This separates concerns into distinct, testable layers that can operate independently.

## Architecture Layers

### 1. **UI Layer** (`src/ui/tools/spell-studio/`)
Pure React components for presentation only. No business logic, no rendering logic.

- **SpellStudio.tsx** - Main orchestrator, coordinates panels and manages UI state
- **panels/LibraryPanel.tsx** - Animation library browser (pure UI)
- **panels/TimelinePanel.tsx** - Timeline scrubber and playback controls (pure UI)
- **panels/InspectorPanel.tsx** - Property inspector using controller for mutations
- **panels/CanvasPanel.tsx** - Thin canvas wrapper, delegates to engine

### 2. **Engine Layer** (`src/engine/spell-studio/`)
Pure simulation and rendering logic, completely decoupled from React.

- **SpellStudioEngine.ts** - Main engine class, orchestrates simulation and rendering
- **TrajectoryMath.ts** - Pure projectile trajectory calculations
- **PoseCalculator.ts** - Skeletal pose calculation wrapper
- **IKResolver.ts** - Inverse kinematics solver (2-bone IK)
- **RenderPipeline.ts** - Pure rendering functions (grid, character, projectiles, etc.)

### 3. **Game Layer** (`src/game/spells/editing/`)
Data structures and definitions for spell editing.

- **SpellEditorTypes.ts** - Unified session state and type definitions
- **SpellEditorController.ts** - Business logic for spell mutations

### 4. **Hooks** (`src/hooks/`)
React integration layer.

- **useSpellStudio.ts** - Manages session, engine, and controller lifecycle
- **useSpellLoop.ts** - Animation loop management (existing)

## Key Concepts

### Unified Session State

All editing state is consolidated into a single `SpellEditorSession` object:

```typescript
interface SpellEditorSession {
    spell: SpellDefinition;      // The spell being edited
    rig: RigEditorState;          // Rig configuration
    timeline: TimelineState;      // Timeline state
    canvas: CanvasState;          // Canvas visualization
    ik: IKState;                  // IK system state
}
```

### Rig Space vs Screen Space

All calculations happen in **rig space** (normalized coordinates):
- Bone positions
- Projectile trajectories
- IK targets
- Spawn offsets

**Screen space** transformations (zoom, pan) are applied only during rendering.

### Engine Independence

The `SpellStudioEngine` can run completely independently of React:
- Testable in isolation
- Reusable for multiplayer/collaborative editing
- Can run headless for validation
- Ready for undo/redo systems

## Data Flow

```
User Input → UI Components → Controller → Session Update → Engine → Render
```

1. User interacts with UI panels
2. UI calls controller methods
3. Controller updates session state
4. Session change triggers engine update
5. Engine recalculates and renders

## Benefits

### ✅ Maintainability
- Clear separation of concerns
- Each file has a single, well-defined purpose
- Easy to locate and fix bugs

### ✅ Testability
- Pure functions can be unit tested
- Engine can be tested without React
- Controllers can be tested with mock sessions

### ✅ Reusability
- Engine can be used in different contexts
- Math functions are framework-agnostic
- Rendering pipeline is composable

### ✅ Performance
- Efficient rendering with minimal React re-renders
- Calculations happen in normalized space
- Clear optimization points

### ✅ Extensibility
- Easy to add new features
- Clear extension points
- Ready for advanced features (multiplayer, undo/redo, etc.)

## Migration Notes

The old `SpellStudio.tsx` in `src/components/` now re-exports the new implementation for backward compatibility. All imports should continue to work.

## Future Enhancements

With this architecture, the following features become straightforward:

- **Undo/Redo** - Session snapshots
- **Multiplayer Editing** - Sync session state
- **Session Persistence** - Save/load sessions to disk
- **Headless Validation** - Run engine without UI
- **Advanced IK** - Swap IK solvers
- **Custom Renderers** - Plug in different render pipelines
- **Animation Blending** - Interpolate between poses
- **Onion Skinning** - Render multiple poses

## File Structure

```
src/
  ui/
    tools/
      spell-studio/
        SpellStudio.tsx           ← Main orchestrator
        panels/
          LibraryPanel.tsx        ← Pure UI
          InspectorPanel.tsx      ← Pure UI + Controller
          TimelinePanel.tsx       ← Pure UI
          CanvasPanel.tsx         ← Thin wrapper

  engine/
    spell-studio/
      SpellStudioEngine.ts        ← Core engine
      TrajectoryMath.ts           ← Pure math
      IKResolver.ts               ← Pure IK
      PoseCalculator.ts           ← Pose wrapper
      RenderPipeline.ts           ← Pure rendering

  game/
    spells/
      editing/
        SpellEditorTypes.ts       ← Data structures
        SpellEditorController.ts  ← Business logic

  hooks/
    useSpellStudio.ts             ← Session management
    useSpellLoop.ts               ← Animation loop
```

## Development Guidelines

### Adding New Features

1. **Data changes** → Update `SpellEditorTypes.ts`
2. **Business logic** → Add to `SpellEditorController.ts`
3. **Calculations** → Add pure functions to appropriate engine file
4. **Rendering** → Add to `RenderPipeline.ts`
5. **UI** → Update panels or create new ones

### Testing

- **Unit tests** for math functions (TrajectoryMath, IKResolver)
- **Integration tests** for engine (SpellStudioEngine)
- **Component tests** for UI panels
- **E2E tests** for full workflows

### Performance

- Keep calculations in rig space
- Minimize session updates
- Use React.memo for panels
- Profile rendering pipeline

---

**This is the antigravity form.** 🚀
