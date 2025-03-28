declare module 'gif.js' {
  interface Options {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
  }

  interface FrameOptions {
    delay?: number;
  }

  class GIF {
    constructor(options?: Options);
    addFrame(canvas: HTMLCanvasElement, options?: FrameOptions): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    render(): void;
  }

  export default GIF;
} 
