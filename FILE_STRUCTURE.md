# Spell Studio - Complete File Structure

```
src/
├── ui/
│   └── tools/
│       └── spell-studio/
│           ├── SpellStudio.tsx                 ← Main orchestrator (NEW)
│           ├── README.md                       ← Architecture docs
│           ├── QUICK_REFERENCE.md              ← Developer guide
│           └── panels/
│               ├── LibraryPanel.tsx            ← Animation browser (Pure UI)
│               ├── TimelinePanel.tsx           ← Timeline controls (Pure UI)
│               ├── InspectorPanel.tsx          ← Property editor (Pure UI + Controller)
│               └── CanvasPanel.tsx             ← Canvas wrapper (NEW)
│
├── engine/
│   └── spell-studio/
│       ├── SpellStudioEngine.ts                ← Core simulation engine (NEW)
│       ├── TrajectoryMath.ts                   ← Projectile math (NEW)
│       ├── IKResolver.ts                       ← Inverse kinematics (NEW)
│       ├── PoseCalculator.ts                   ← Pose calculations (NEW)
│       ├── RenderPipeline.ts                   ← Pure rendering (NEW)
│       └── index.ts                            ← Module exports (NEW)
│
├── game/
│   └── spells/
│       └── editing/
│           ├── SpellEditorTypes.ts             ← Session state types (NEW)
│           ├── SpellEditorController.ts        ← Business logic (NEW)
│           └── index.ts                        ← Module exports (NEW)
│
├── hooks/
│   ├── useSpellStudio.ts                       ← Session management (NEW)
│   └── useSpellLoop.ts                         ← Animation loop (EXISTING)
│
├── components/
│   ├── SpellStudio.tsx                         ← Re-export for compatibility (MODIFIED)
│   └── spell-studio/
│       ├── SpellCanvas.tsx                     ← [TO BE REMOVED]
│       ├── InspectorPanel.tsx                  ← [TO BE REMOVED]
│       ├── LibraryPanel.tsx                    ← [TO BE REMOVED]
│       ├── TimelinePanel.tsx                   ← [TO BE REMOVED]
│       └── constants.ts                        ← Shared constants (KEEP)
│
├── types.ts                                    ← Core game types
├── data/
│   ├── EntityRigDefinitions.ts                 ← Rig definitions
│   └── AnimationData.ts                        ← Animation library
│
├── modules/
│   └── spells/
│       └── BehaviorRegistry.ts                 ← Spell behaviors
│
└── utils/
    └── renderers/
        └── allies/
            └── renderSkeletalNPC.ts            ← Skeletal renderer

REFACTOR_SUMMARY.md                             ← Refactor overview (NEW)
```

## Layer Breakdown

### 🎨 UI Layer (React)
**Location**: `src/ui/tools/spell-studio/`
- Pure presentation components
- No business logic
- No rendering logic
- Delegates to controller and engine

### ⚙️ Engine Layer (Pure Logic)
**Location**: `src/engine/spell-studio/`
- Simulation and rendering
- Completely React-independent
- Pure functions and classes
- Testable in isolation

### 🎮 Game Layer (Data)
**Location**: `src/game/spells/editing/`
- Data structures
- Business logic
- Type definitions
- Controller pattern

### 🔗 Hooks Layer (Integration)
**Location**: `src/hooks/`
- React integration
- Lifecycle management
- State coordination

## File Sizes (Approximate)

| File | Lines | Purpose |
|------|-------|---------|
| SpellStudioEngine.ts | ~280 | Core engine |
| RenderPipeline.ts | ~280 | Rendering functions |
| TrajectoryMath.ts | ~100 | Math functions |
| IKResolver.ts | ~120 | IK solver |
| PoseCalculator.ts | ~50 | Pose wrapper |
| SpellEditorController.ts | ~140 | Business logic |
| SpellEditorTypes.ts | ~90 | Type definitions |
| SpellStudio.tsx | ~130 | Main orchestrator |
| CanvasPanel.tsx | ~130 | Canvas wrapper |
| InspectorPanel.tsx | ~200 | Property editor |
| useSpellStudio.ts | ~80 | Session hook |

**Total New Code**: ~1,600 lines
**Old SpellCanvas.tsx**: ~330 lines (replaced)

## Dependencies

### UI → Engine
```typescript
import { SpellStudioEngine } from '../../../engine/spell-studio';
```

### UI → Game
```typescript
import { SpellEditorController, SpellEditorSession } from '../../../game/spells/editing';
```

### Engine → Game
```typescript
import { SpellEditorSession, RigTransforms } from '../../game/spells/editing';
```

### Hooks → All
```typescript
import { SpellStudioEngine } from '../engine/spell-studio';
import { SpellEditorController, SpellEditorSession } from '../game/spells/editing';
```

## Import Paths

From any file, here's how to import:

### From UI Components
```typescript
// Engine
import { SpellStudioEngine } from '../../../engine/spell-studio';

// Game
import { SpellEditorController } from '../../../game/spells/editing';

// Hooks
import { useSpellStudio } from '../../../hooks/useSpellStudio';
```

### From Engine
```typescript
// Game
import { SpellEditorSession } from '../../game/spells/editing';

// Types
import { SpellDefinition } from '../../types';

// Utils
import { renderSkeletalNPC } from '../../utils/renderers/allies/renderSkeletalNPC';
```

### From Hooks
```typescript
// Engine
import { SpellStudioEngine } from '../engine/spell-studio';

// Game
import { SpellEditorSession } from '../game/spells/editing';

// Data
import { ENTITY_RIGS } from '../data/EntityRigDefinitions';
```

## Migration Status

| Component | Status | Location |
|-----------|--------|----------|
| SpellStudio | ✅ Refactored | `src/ui/tools/spell-studio/SpellStudio.tsx` |
| SpellCanvas | ✅ Replaced | `src/ui/tools/spell-studio/panels/CanvasPanel.tsx` |
| InspectorPanel | ✅ Refactored | `src/ui/tools/spell-studio/panels/InspectorPanel.tsx` |
| LibraryPanel | ✅ Moved | `src/ui/tools/spell-studio/panels/LibraryPanel.tsx` |
| TimelinePanel | ✅ Moved | `src/ui/tools/spell-studio/panels/TimelinePanel.tsx` |
| Engine Logic | ✅ Extracted | `src/engine/spell-studio/` |
| Session State | ✅ Unified | `src/game/spells/editing/SpellEditorTypes.ts` |
| Controller | ✅ Created | `src/game/spells/editing/SpellEditorController.ts` |

---

**All files are in their antigravity positions!** 🚀
