import { BasicGuiRuntime } from './BasicGuiRuntime';

export class CanvasRuntime extends BasicGuiRuntime {
  ctx!: CanvasRenderingContext2D;

  flush() {
    const { ctx, px } = this;
    const { width, height } = ctx.canvas;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
  }
}
