export interface ScrollEngineOptions {
  speed?: number;
  basePixelsPerSec?: number;
  mirrorHorizontal?: boolean;
  mirrorVertical?: boolean;
}

export class ScrollEngine {
  public speed: number;
  public basePixelsPerSec: number;
  public scrollY: number;
  public maxScrollY: number;
  public isPlaying: boolean;
  public mirrorHorizontal: boolean;
  public mirrorVertical: boolean;
  private animId: number | null = null;
  private smoothAnimId: number | null = null;
  private lastTime: number = 0;
  private onUpdate?: (y: number, cssTransform: string) => void;

  constructor(options: ScrollEngineOptions = {}) {
    const rawSpeed = options.speed ?? 3.0;
    this.speed = (typeof rawSpeed === 'number' && !isNaN(rawSpeed))
      ? Math.max(0, Math.min(50, rawSpeed))
      : 3.0;
    this.basePixelsPerSec = options.basePixelsPerSec ?? 40.0;
    this.scrollY = 0;
    this.maxScrollY = Number.POSITIVE_INFINITY;
    this.isPlaying = false;
    this.mirrorHorizontal = options.mirrorHorizontal ?? false;
    this.mirrorVertical = options.mirrorVertical ?? false;
  }

  setUpdateCallback(cb: (y: number, cssTransform: string) => void) {
    this.onUpdate = cb;
  }

  private cancelSmooth() {
    if (this.smoothAnimId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.smoothAnimId);
      this.smoothAnimId = null;
    }
  }

  play() {
    if (this.isPlaying) return;
    this.cancelSmooth();
    this.isPlaying = true;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.loop();
  }

  pause() {
    this.isPlaying = false;
    if (this.animId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  setSpeed(speed: number) {
    if (typeof speed !== 'number' || isNaN(speed)) {
      this.speed = 3.0;
      return;
    }
    this.speed = Math.max(0, Math.min(50, speed));
  }

  setMirror(horizontal: boolean, vertical: boolean = false) {
    this.mirrorHorizontal = Boolean(horizontal);
    this.mirrorVertical = Boolean(vertical);
    if (this.onUpdate) this.onUpdate(this.scrollY, this.getCssTransform());
  }

  setMaxScrollY(maxY: number) {
    if (typeof maxY === 'number' && !isNaN(maxY) && maxY >= 0) {
      this.maxScrollY = maxY;
      if (this.scrollY > this.maxScrollY) {
        this.scrollY = this.maxScrollY;
        if (this.onUpdate) this.onUpdate(this.scrollY, this.getCssTransform());
      }
    }
  }

  /**
   * Manual scroll (wheel, touchpad, drag, or global hotkey):
   * Pauses auto-scroll and smoothly applies deltaPx so Play resumes from the new Y without jumps.
   */
  manualScroll(deltaPx: number, smooth: boolean = false): number {
    if (typeof deltaPx !== 'number' || isNaN(deltaPx)) return this.scrollY;
    this.pause();
    this.cancelSmooth();

    const targetY = Math.min(this.maxScrollY, Math.max(0, this.scrollY + deltaPx));
    if (!smooth || typeof requestAnimationFrame === 'undefined') {
      this.scrollY = targetY;
      if (this.onUpdate) this.onUpdate(this.scrollY, this.getCssTransform());
      return this.scrollY;
    }

    const startY = this.scrollY;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = 70; // short 70ms ease-out for silky wheel/hotkey step

    const animate = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.scrollY = Math.max(0, startY + (targetY - startY) * eased);
      if (this.onUpdate) this.onUpdate(this.scrollY, this.getCssTransform());
      if (t < 1) {
        this.smoothAnimId = requestAnimationFrame(animate);
      } else {
        this.scrollY = targetY;
        this.smoothAnimId = null;
      }
    };
    this.smoothAnimId = requestAnimationFrame(animate);
    return targetY;
  }

  step(deltaMs: number): number {
    if (!this.isPlaying) return this.scrollY;
    const pixelsPerSec = this.basePixelsPerSec * this.speed;
    const deltaY = (pixelsPerSec * deltaMs) / 1000.0;
    this.scrollY = Math.min(this.maxScrollY, this.scrollY + deltaY);
    return this.scrollY;
  }

  rewind(amount: number = 100): number {
    const safeAmount = (typeof amount === 'number' && !isNaN(amount) && amount > 0) ? amount : 0;
    this.scrollY = Math.max(0, this.scrollY - safeAmount);
    if (this.onUpdate) this.onUpdate(this.scrollY, this.getCssTransform());
    return this.scrollY;
  }

  reset(): void {
    this.cancelSmooth();
    this.scrollY = 0;
    this.pause();
    if (this.onUpdate) this.onUpdate(this.scrollY, this.getCssTransform());
  }

  getCssTransform(): string {
    const scaleX = this.mirrorHorizontal ? -1 : 1;
    const scaleY = this.mirrorVertical ? -1 : 1;
    return `translate3d(0px, -${this.scrollY}px, 0px) scale(${scaleX}, ${scaleY})`;
  }

  private loop = () => {
    if (!this.isPlaying) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const deltaMs = Math.min(100, now - this.lastTime);
    this.lastTime = now;

    this.step(deltaMs);
    if (this.onUpdate) {
      this.onUpdate(this.scrollY, this.getCssTransform());
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animId = requestAnimationFrame(this.loop);
    }
  };
}
