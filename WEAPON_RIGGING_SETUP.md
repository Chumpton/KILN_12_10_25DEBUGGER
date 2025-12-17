# Weapon Rigging Setup Instructions

## Step 1: Add Sword1.png Asset

1. Create the weapons directory:
   - Navigate to: `public/assets/`
   - Create a new folder called `weapons`

2. Add the Sword1.png file:
   - Place your `Sword1.png` file in `public/assets/weapons/`
   - Full path should be: `public/assets/weapons/Sword1.png`

## Step 2: Use the Rigging Editor

1. Start the game and go to Main Menu
2. Click the "Rigging" button
3. In the rigging editor, you'll now see a new part called `weapon_r`
4. Select `weapon_r` from the parts list
5. Adjust the following properties to position the sword in the character's hand:
   - **X**: Horizontal offset from hand center
   - **Y**: Vertical offset from hand (default: 15)
   - **Rotation**: Angle of the sword
   - **Scale**: Size of the sword
   - **Z-Index**: Rendering order (6 = in front of hand)

## Step 3: Position the Sword

Recommended starting values for a sword held in right hand:
- X: 0 (centered on hand)
- Y: 15-25 (extends down from hand)
- Rotation: 0 to -0.5 (slight angle)
- Scale: 1.0
- Z-Index: 6 (renders in front)

## Step 4: Save

Click "SAVE RIG" to persist your weapon positioning to the code.

## How It Works

The weapon is rendered as a child of the right hand (`hand_r`), which is itself a child of the right arm (`arm_r`). This means:
- The weapon moves with the hand
- The weapon rotates with arm animations
- The weapon follows all character movements
- You can adjust the weapon independently in the rigging editor

## Future Enhancements

You can easily add more weapons by:
1. Adding more weapon assets to `/public/assets/weapons/`
2. Adding them to the `assets` object in `PlayerRenderer.ts`
3. Creating weapon-specific rig parts (e.g., `weapon_axe`, `weapon_staff`)
4. Conditionally rendering based on equipped weapon

## Current Implementation

- ✅ Weapon asset loading system
- ✅ Weapon rig part (`weapon_r`)
- ✅ Hierarchical rendering (weapon → hand → arm)
- ✅ Rigging editor support
- ✅ Z-index sorting
- ✅ Transform inheritance from parent bones
