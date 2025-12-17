
import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';

export class Camera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 1;

    // Viewport dimensions
    public width: number = 0;
    public height: number = 0;

    constructor() { }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public follow(targetX: number, targetY: number) {
        // Smooth lerp could go here, for now hard lock
        this.x = targetX;
        this.y = targetY;
    }

    // World (Grid) -> Screen (Pixels)
    public toScreen(worldX: number, worldY: number): { x: number, y: number } {
        // Isometric projection
        // Center of screen is (this.x, this.y)

        // Standard Iso:
        // screenX = (tileX - tileY) * (WIDTH/2)
        // screenY = (tileX + tileY) * (HEIGHT/2)

        // We want (this.x, this.y) to be at center (width/2, height/2)

        const isoX = (worldX - worldY) * (TILE_WIDTH / 2);
        const isoY = (worldX + worldY) * (TILE_HEIGHT / 2);

        // Calculate offset based on camera position
        const camIsoX = (this.x - this.y) * (TILE_WIDTH / 2);
        const camIsoY = (this.x + this.y) * (TILE_HEIGHT / 2);

        const screenX = isoX - camIsoX + (this.width / 2);
        const screenY = isoY - camIsoY + (this.height / 2);

        return { x: screenX, y: screenY };
    }

    // Screen (Pixels) -> World (Grid)
    public toWorld(screenX: number, screenY: number): { x: number, y: number } {
        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;

        // Adjust for camera offset
        const adjX = screenX - (this.width / 2);
        const adjY = screenY - (this.height / 2);

        // Reconstruct World Iso X/Y relative to camera
        // camIsoX...
        // This is complex to reverse perfectly without just reversing the matrix.
        // Let's use the existing utils/isometric logic flavor.

        // From iso formula:
        // sx = (x - y) * hw
        // sy = (x + y) * hh
        // sx/hw = x - y
        // sy/hh = x + y
        // (sx/hw + sy/hh) = 2x -> x = (sx/hw + sy/hh)/2
        // (sy/hh - sx/hw) = 2y -> y = (sy/hh - sx/hw)/2

        // We need 'virtual' screen coordinates relative to camera world pos
        // The camera world pos (cx, cy) projects to (0,0) center offset.

        const camIsoX = (this.x - this.y) * halfW;
        const camIsoY = (this.x + this.y) * halfH;

        const worldIsoX = adjX + camIsoX;
        const worldIsoY = adjY + camIsoY;

        const x = (worldIsoX / halfW + worldIsoY / halfH) / 2;
        const y = (worldIsoY / halfH - worldIsoX / halfW) / 2;

        return { x, y };
    }

    public getVisibleBounds(): { minX: number, maxX: number, minY: number, maxY: number } {
        // Project 4 corners of screen to world
        const tl = this.toWorld(0, 0);
        const tr = this.toWorld(this.width, 0);
        const br = this.toWorld(this.width, this.height);
        const bl = this.toWorld(0, this.height);

        const buffer = 24; // Massive padding for 4x4 tiles

        return {
            minX: Math.floor(Math.min(tl.x, tr.x, br.x, bl.x)) - buffer,
            maxX: Math.ceil(Math.max(tl.x, tr.x, br.x, bl.x)) + buffer,
            minY: Math.floor(Math.min(tl.y, tr.y, br.y, bl.y)) - buffer,
            maxY: Math.ceil(Math.max(tl.y, tr.y, br.y, bl.y)) + buffer
        };
    }
}
