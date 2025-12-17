# Spell Studio Enhancements Implementation Plan

## Objective
To significantly enhance the Spell Studio tool by adding comprehensive features for spell creation, editing, debugging, and visualization.

## Features Implemented

### 1. Spell Configuration Tab
- **Core Definition**: Edit Name, Element (Fire, Ice, etc.), and Spell Type (Projectile, Melee, etc.).
- **Stats**: Configure Base Damage, Mana Cost, Cast Time, Recovery Time, and Cooldown.
- **Projectile Config**: If type is Projectile, configure Speed and Gravity.
- **Hitboxes**: Add and remove multiple hitboxes (Circle/Box) with offsets and dimensions.
- **Timing & Phases**: Interactive slider to set the "Release Point" of the spell relative to the cast time.

### 2. Timeline Visualization
- **Phase Bands**: Colored underlays on the timeline to clearly visualize the phases:
    - **Blue**: Wind-up (Start to Release).
    - **Orange**: Active/Recovery (Release to End).
- **Release Point**: Draggable/input-controlled slider to adjust when the spell effect triggers during the animation.
- **Keyframe & Event Interaction**: Retained and polished existing event and keyframe manipulation.

### 3. Visualizers & Debugging
- **Hitbox Visualization**: Toggleable red outlines showing the effective hitboxes of the spell relative to the character or bones.
- **Path Preview**: Toggleable cyan trajectory line showing the projectile's predicted path based on speed, gravity, and aim angle.
- **Spawn Point Editor**: Draggable cyan "Ghost Origin" point near the character. 
    -   Click and drag the cyan crosshair to offset the projectile spawn location (e.g., to align with a staff tip or hand).
    -   Overrides the default calculation.
- **Dummy Enemies**: Toggleable option to show/hide dummy targets (implementation stubbed/visual).
- **Analytics Panel**: Real-time calculation and display of:
    - **DPS Estimate**: Based on damage and total cycle time.
    - **Burst Damage**: Raw base damage.
    - **Mana Efficiency**: Damage per Mana point.
    - **Total Cycle Time**: Cast + Recovery + Cooldown.

### 4. VFX Layering
- **VFX Tab**: Dedicated tab to manage visual effect layers.
- **Layer Editor**: Add/Remove VFX layers.
- **Configuration**: Assign Asset ID, Trigger Phase (Windup/Release/Impact), and Attachment Bone for each layer.

### 5. Content Pipeline
- **Import/Export**: "Export JSON" and "Import JSON" buttons in the Spell Tab allow copying the spell definition to/from the clipboard/console for easy sharing and saving.
- **Save Hooks**: Integration with existing save endpoints for Animation Library and Rig Config.

## User Guide

1.  **Open Spell Studio**: Navigate to the studio (usually via a main menu or dev toggle).
2.  **Select 'SPELL' Tab**: In the right-hand panel, click the 'SPELL' tab.
3.  **Configure Spell**:
    -   Set the Name and Element.
    -   Adjust specific Stats like Damage and Cast Time.
    -   Use the "Timing & Phases" slider to sync the spell release with the animation.
4.  **Edit Hitboxes**:
    -   Click "Hitboxes" in the top Toolbar to enable visualization.
    -   In the config panel, add Hitboxes and tweak their size/shape.
5.  **Preview Trajectory**:
    -   Click "Path" in the Toolbar.
    -   Adjust "Projectile Speed/Gravity" and the "Aim Angle" (in Properties tab) to see the path update.
6.  **Manage VFX**:
    -   Switch to 'VFX' tab.
    -   Add layers for particle effects attached to specific bones (e.g., 'hand_r') triggering at specific phases.
7.  **Save/Export**:
    -   Click "Export JSON" to get the configuration text.
    -   Save Animations/Rigs using the respective buttons in the 'PROPERTIES' tab.

## Verification
-   **Visual**: Verify hitboxes draw correctly on the canvas.
-   **Logic**: Verify DPS calculations update when Damage or Cooldown changes.
-   **Integration**: Verify that `currentSpell` state persists while switching tabs.
