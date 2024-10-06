import { BaseRuntime } from './BaseRuntime';

export class BasicGuiRuntime extends BaseRuntime {
  scale = 2;
  width = 240;
  height = 320;

  px = (x: number) => x * this.scale;
}
