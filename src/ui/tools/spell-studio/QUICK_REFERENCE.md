# Spell Studio - Quick Reference Guide

## 🎯 Common Tasks

### Adding a New Spell Property

1. **Update Type** in `src/game/spells/editing/SpellEditorTypes.ts`:
```typescript
interface SpellEditorSession {
    spell: SpellDefinition; // Add property to SpellDefinition in types.ts
}
```

2. **Add Controller Method** in `src/game/spells/editing/SpellEditorController.ts`:
```typescript
setMyNewProperty(value: number): void {
    this.updateSpell({
        ...this.session.spell,
        myNewProperty: value
    });
}
```

3. **Add UI Control** in `src/ui/tools/spell-studio/panels/InspectorPanel.tsx`:
```typescript
<input 
    type="number" 
    value={spell.myNewProperty} 
    onChange={e => controller.setMyNewProperty(parseFloat(e.target.value))} 
/>
```

### Adding a New Visualization

1. **Add Render Function** in `src/engine/spell-studio/RenderPipeline.ts`:
```typescript
export function renderMyFeature(
    renderCtx: RenderContext,
    options: MyFeatureOptions
): void {
    const { ctx, centerX, centerY, zoom } = renderCtx;
    // Your rendering code here
}
```

2. **Call from Engine** in `src/engine/spell-studio/SpellStudioEngine.ts`:
```typescript
render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // ... existing rendering
    RenderPipeline.renderMyFeature(renderCtx, { /* options */ });
}
```

3. **Add Toggle** in session canvas state and UI.

### Adding New Math/Physics

1. **Create Pure Function** in appropriate engine file:
```typescript
// In src/engine/spell-studio/TrajectoryMath.ts
export function calculateMyPhysics(params: MyParams): Result {
    // Pure calculation, no side effects
    return result;
}
```

2. **Use in Engine**:
```typescript
const result = calculateMyPhysics({ /* params */ });
```

## 📋 File Locations

### Need to modify...

| What | Where |
|------|-------|
| Spell data structure | `src/types.ts` → `SpellDefinition` |
| Session state | `src/game/spells/editing/SpellEditorTypes.ts` |
| Spell mutations | `src/game/spells/editing/SpellEditorController.ts` |
| Math/Physics | `src/engine/spell-studio/TrajectoryMath.ts` or `IKResolver.ts` |
| Rendering | `src/engine/spell-studio/RenderPipeline.ts` |
| Engine logic | `src/engine/spell-studio/SpellStudioEngine.ts` |
| UI panels | `src/ui/tools/spell-studio/panels/*.tsx` |
| Main orchestrator | `src/ui/tools/spell-studio/SpellStudio.tsx` |

## 🔍 Debugging Tips

### Check Session State
```typescript
// In SpellStudio.tsx
console.log('Current session:', session);
```

### Check Engine State
```typescript
// In CanvasPanel.tsx or SpellStudio.tsx
console.log('Current transforms:', engine.getCurrentTransforms());
console.log('Spawn position:', engine.getSpawnPosition());
```

### Check Rendering
```typescript
// In RenderPipeline.ts
console.log('Rendering at:', centerX, centerY, 'zoom:', zoom);
```

### Verify Calculations
```typescript
// Test pure functions in isolation
import { calculateTrajectory } from 'src/engine/spell-studio/TrajectoryMath';
const points = calculateTrajectory({ /* params */ });
console.log('Trajectory points:', points);
```

## 🎨 Coordinate Systems

### Rig Space (Calculations)
- Origin at character center
- No zoom applied
- Used for all logic

### Screen Space (Rendering)
- Origin at canvas top-left
- Zoom and pan applied
- Used only for drawing

### Conversion
```typescript
// Rig → Screen
const screenX = centerX + rigX * zoom;
const screenY = centerY + rigY * zoom;

// Screen → Rig
const rigX = (screenX - centerX) / zoom;
const rigY = (screenY - centerY) / zoom;
```

## 🧪 Testing Checklist

- [ ] Spell properties update correctly
- [ ] Timeline scrubbing works
- [ ] Projectile preview shows correct path
- [ ] IK moves arm correctly
- [ ] Spawn offset dragging works
- [ ] Zoom and pan work smoothly
- [ ] Animation playback is smooth
- [ ] No console errors
- [ ] Performance is acceptable

## 🚀 Performance Tips

1. **Minimize session updates** - Batch changes when possible
2. **Use React.memo** for panels that don't change often
3. **Profile rendering** - Use browser DevTools
4. **Optimize calculations** - Cache results when appropriate
5. **Avoid unnecessary re-renders** - Check React DevTools

## 📚 Key Principles

1. **Rig Space for Logic** - All calculations in normalized space
2. **Pure Functions** - No side effects in math/physics
3. **Single Responsibility** - Each file does one thing
4. **Controller for Mutations** - All state changes through controller
5. **Engine Independence** - Engine works without React

## 🔗 Related Files

- **Types**: `src/types.ts` - Core game types
- **Rig Definitions**: `src/data/EntityRigDefinitions.ts`
- **Animation Data**: `src/data/AnimationData.ts`
- **Spell Behaviors**: `src/modules/spells/BehaviorRegistry.ts`
- **Skeletal Renderer**: `src/utils/renderers/allies/renderSkeletalNPC.ts`

## 💡 Common Patterns

### Updating Session
```typescript
const updateCanvas = (updates: Partial<typeof session.canvas>) => {
    setSession({
        ...session,
        canvas: { ...session.canvas, ...updates }
    });
};
```

### Using Controller
```typescript
controller.setSpellName('New Name');
controller.adjustSpawnOffset({ x: 10, y: 5 });
```

### Rendering Pattern
```typescript
RenderPipeline.clearCanvas(ctx, width, height);
RenderPipeline.renderGrid(renderCtx, gridOptions);
RenderPipeline.renderCharacter(renderCtx, characterOptions);
```

---

**Quick Start**: Open `src/ui/tools/spell-studio/SpellStudio.tsx` and follow the data flow! 🎯
