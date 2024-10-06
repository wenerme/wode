import process from 'node:process';
import sdl from '@kmamal/sdl';
import { sleep } from '@wener/utils';
import { createCanvas } from 'canvas';
import { BasicVm } from './BBVM';
import { BasicGuiRuntime } from './BasicGuiRuntime';

export async function runBbvm({}: {} = {}) {
  const scale = 2;
  const px = (x: number) => x * scale;
  const window = sdl.video.createWindow({
    title: 'BBVM',
    width: px(240),
    height: px(320),
  });

  const { pixelWidth: width, pixelHeight: height } = window;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'white';
  ctx.font = `${px(20)}px simsun, sans-serif`;
  ctx.fillText('Hello, BBVM!', 0, px(20));
  ctx.font = `${px(16)}px simsun, sans-serif`;
  ctx.fillText('Click to start clocking.', 0, px(20 + 16));

  const buffer = canvas.toBuffer('raw');
  window.render(width, height, width * 4, 'bgra32', buffer);

  console.log(`window created scale=${scale}`);

  window.on('mouseButtonUp', () => {
    console.log('mouse button up');

    void Promise.resolve().then(async () => {
      let i = 0;
      while (true) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'white';
        ctx.font = `${px(20)}px simsun, sans-serif`;
        ctx.fillText(`Hello, BBVM! ${i}`, 0, px(20));
        ctx.font = `${px(16)}px simsun, sans-serif`;
        ctx.fillText('Click to stop clocking.', 0, px(20 + 16));
        const buffer = canvas.toBuffer('raw');
        window.render(width, height, width * 4, 'bgra32', buffer);
        i++;
        console.log('clocking', i);
        await sleep(1000);
      }
    });
  });

  window.on('dropFile', ({ file }) => {
    console.log('file dropped', file);
  });

  window.on('close', () => {
    console.log('window closed');
    process.exit(0);
  });
}

export class NodeJSRuntime extends BasicGuiRuntime {
  window!: ReturnType<typeof sdl.video.createWindow>;
  canvas!: ReturnType<typeof createCanvas>;
  ctx!: CanvasRenderingContext2D;

  async reset(vm: BasicVm) {
    this.vm = vm;
    const { px, width, height } = this;

    const window = (this.window = sdl.video.createWindow({
      title: 'BBVM',
      width: px(width),
      height: px(height),
    }));

    const { pixelWidth, pixelHeight } = window;
    const canvas = (this.canvas = createCanvas(pixelWidth, pixelHeight));
    const ctx = canvas.getContext('2d');

    this.ctx = ctx as any;
  }

  render() {
    const { window, canvas } = this;
    const { pixelWidth, pixelHeight } = window;
    const buffer = canvas.toBuffer('raw');
    window.render(pixelWidth, pixelHeight, pixelWidth * 4, 'bgra32', buffer);
  }
}
