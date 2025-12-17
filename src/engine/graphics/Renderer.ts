
export class GameRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: false }); // Optimization
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
    }

    public resize() {
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    public get context() {
        return this.ctx;
    }

    public clear() {
        this.ctx.fillStyle = '#051005'; // Clear color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
