import { Application, Graphics } from 'pixi.js'

export function PomodoroStage(container: HTMLElement, getSeconds: () => number, getRunning: () => boolean, quote: string) {
  let app: Application | null = null;
  let destroyed = false;
  let resizeHandler: (() => void) | null = null;
  let drawHandler: (() => void) | null = null;
  let canvasAppended = false;

  (async () => {
    if (destroyed) return;
    app = new Application();
    await app.init({ resizeTo: container, background: 0xffffff, antialias: true });
    if (destroyed || !app) return;
    if (app.canvas && !container.contains(app.canvas)) {
      container.appendChild(app.canvas);
      canvasAppended = true;
    }

    const g = new Graphics();
    app.stage.addChild(g);

    const baseColor = 0xe5e7eb; // gray-200
    const progressColor = 0x10b981; // emerald-500
    const size = () => Math.min(container.clientWidth, container.clientHeight) * 0.72;
    const thickness = 16;

    function draw() {
  if (destroyed || !app) return;
      const s = size();
      const cx = container.clientWidth / 2;
      const cy = container.clientHeight / 2 + 10;
      const radius = Math.max(10, s / 2);

      const total = 30 * 60;
      const sec = getSeconds();
      const progress = total > 0 ? (total - sec) / total : 1;

      g.clear();

      // base circle
      g.setStrokeStyle({
        width: thickness,
        color: baseColor,
        alpha: 1
      });
      g.arc(cx, cy, radius, 0, Math.PI * 2);

      // progress arc
      g.setStrokeStyle({
        width: thickness,
        color: progressColor,
        alpha: 1
      });
      const start = -Math.PI / 2;
      const end = start + Math.PI * 2 * progress;
      g.arc(cx, cy, radius, start, end);
    }

    drawHandler = draw;
    app.ticker.add(draw);
    window.addEventListener('pomodoro:progress', draw as any);

    resizeHandler = () => draw();
    window.addEventListener('resize', resizeHandler);
  })();

  return () => {
    destroyed = true;
    if (drawHandler) {
      window.removeEventListener('pomodoro:progress', drawHandler as any);
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    if (app) {
      try {
        app.destroy(true);
      } catch {}
      if (canvasAppended && app.canvas && container.contains(app.canvas)) {
        container.removeChild(app.canvas);
      }
      app = null;
    }
  };
}