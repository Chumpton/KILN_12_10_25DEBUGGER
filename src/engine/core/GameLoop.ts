
type UpdateCallback = (dt: number) => void;
type RenderCallback = () => void;

export class GameLoop {
    private rafId: number | null = null;
    private lastTime: number = 0;
    private isRunning: boolean = false;

    private onUpdate: UpdateCallback;
    private onRender: RenderCallback;

    constructor(onUpdate: UpdateCallback, onRender: RenderCallback) {
        this.onUpdate = onUpdate;
        this.onRender = onRender;
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop() {
        this.isRunning = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private loop = (time: number) => {
        if (!this.isRunning) return;

        const dt = time - this.lastTime;
        this.lastTime = time;

        // Cap dt to prevent huge jumps (e.g. tab switching)
        const safeDt = Math.min(dt, 100);

        this.onUpdate(safeDt);
        this.onRender();

        this.rafId = requestAnimationFrame(this.loop);
    }
}
