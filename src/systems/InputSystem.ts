
import { Vector2, GameState } from '../types';
import { getDistance, toScreen } from '../utils/isometric';

export class InputSystem {
  mouseScreen: Vector2 = { x: 0, y: 0 };
  leftMouseDown: boolean = false;
  rightMouseDown: boolean = false;
  shiftHeld: boolean = false;
  altHeld: boolean = false;
  keys: Set<string> = new Set();

  private cleanup: (() => void) | null = null;

  bind(canvas: HTMLCanvasElement) {
    if (this.cleanup) this.cleanup();

    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'Shift') this.shiftHeld = true;
      if (e.key === 'Alt') {
        e.preventDefault();
        this.altHeld = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
      if (e.key === 'Shift') this.shiftHeld = false;
      if (e.key === 'Alt') {
        e.preventDefault();
        this.altHeld = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      this.mouseScreen = { x: e.clientX, y: e.clientY };
      // Only register input if clicking directly on the canvas or gameplay area, not UI overlay
      if (e.target === canvas) {
        if (e.button === 0) this.leftMouseDown = true;
        if (e.button === 2) this.rightMouseDown = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) this.leftMouseDown = false;
      if (e.button === 2) this.rightMouseDown = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      this.mouseScreen = { x: e.clientX, y: e.clientY };
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    this.cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }

  unbind() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  // --- Target Locking Helper ---
  // Iterates through active enemies to see if the mouse click falls within their hitbox.
  // UPDATED: Now supports Screen Space check for accurate Sprite clicking (Head/Body)
  getClickedEnemy(state: GameState, mouseWorld: Vector2): string | null {
    // Fallback for logic-only checks if needed, but UI should prefer screen check usually.
    // Keeping legacy radius check for safety.
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      if (enemy.isDead) continue;
      const clickRadius = enemy.radius + 0.5;
      if (getDistance(mouseWorld, enemy.pos) <= clickRadius) {
        return enemy.id;
      }
    }
    return null;
  }

  // --- Ally Hover Helper ---
  getHoveredAlly(state: GameState, mouseScreen: Vector2, cameraOffset: Vector2): string | null {
    for (const ally of state.allies) {
      const screenPos = toScreen(ally.pos.x, ally.pos.y);
      // Camera offset is negative of player center usually, but let's check basic passed offset
      // In GameCanvas.tsx: const offsetX = canvas.width / 2 - playerScreen.x;
      // So drawX = screen.x + offsetX
      const drawX = screenPos.x + cameraOffset.x;
      const drawY = screenPos.y + cameraOffset.y;
      const scale = ally.scale || 1.0;

      // Hitbox estimates (Head (-48) to Feet (0))
      const hitW = 40 * scale;
      const hitH = 70 * scale;

      const left = drawX - hitW / 2;
      const right = drawX + hitW / 2;
      const top = drawY - hitH + (10 * scale);
      const bottom = drawY + (10 * scale);

      if (mouseScreen.x >= left && mouseScreen.x <= right &&
        mouseScreen.y >= top && mouseScreen.y <= bottom) {
        return ally.id;
      }
    }
    return null;
  }

  getClickedEnemyScreen(state: GameState, mouseScreen: Vector2, cameraOffset: Vector2): string | null {
    // We will perform the check here.

    // 'getDistance' is imported. I should add 'toScreen' to imports.

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (e.isDead) continue;

      const screenPos = toScreen(e.pos.x, e.pos.y);
      const drawX = screenPos.x + cameraOffset.x;
      const drawY = screenPos.y + cameraOffset.y;

      // Estimate Visual Size
      let scale = 1.0;
      if (e.type === 'boss') scale = 2.0;
      else if (e.type === 'golem') scale = 1.4;
      else if (e.type === 'spitter') scale = 0.8;
      if (e.isElite && e.type !== 'boss') scale *= 1.3;

      // Sprite is roughly:
      // Width: ~40px * scale centered
      // Height: ~60px * scale upwards from pivot

      const width = 50 * scale;
      const height = 70 * scale;

      // Rect check (Centered X, Bottom Y)
      const left = drawX - width / 2;
      const right = drawX + width / 2;
      const top = drawY - height;
      const bottom = drawY + (10 * scale); // Little bit of ground buffer

      if (mouseScreen.x >= left && mouseScreen.x <= right &&
        mouseScreen.y >= top && mouseScreen.y <= bottom) {
        return e.id;
      }
    }
    return null;
  }
}

export const inputSystem = new InputSystem();

import { playerRenderer } from '../modules/player/render/PlayerRenderer';

// Toggle Debug
window.addEventListener('keydown', (e) => {
  if (e.key === 'F3') {
    e.preventDefault();
    playerRenderer.debugMode = !playerRenderer.debugMode;
    console.log('Debug Mode:', playerRenderer.debugMode);
  }
});
