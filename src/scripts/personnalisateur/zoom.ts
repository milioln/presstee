// Zoom (molette + boutons) et déplacement au glisser quand zoomé — port
// direct de la V0.
import { S } from './state';
import { applyZoom } from './render';

export function setZ(v: number): void {
  S.z = Math.max(1, Math.min(3, +v.toFixed(2)));
  if (S.z === 1) {
    S.px = 0;
    S.py = 0;
  }
  applyZoom();
}

export function bindZoom(): void {
  const frame = document.getElementById('frame')!;
  document.getElementById('zIn')!.addEventListener('click', () => setZ(S.z + 0.25));
  document.getElementById('zOut')!.addEventListener('click', () => setZ(S.z - 0.25));
  document.getElementById('zRst')!.addEventListener('click', () => setZ(1));

  frame.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      e.preventDefault();
      setZ(S.z + (e.deltaY < 0 ? 0.12 : -0.12));
    },
    { passive: false }
  );

  frame.addEventListener('pointerdown', (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('.design') || (e.target as HTMLElement).closest('.zoomctl') || S.z === 1) return;
    frame.classList.add('panning');
    frame.setPointerCapture(e.pointerId);
    const r = frame.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = S.px;
    const oy = S.py;
    const mv = (ev: PointerEvent) => {
      S.px = ox + ((ev.clientX - sx) / r.width) * 100;
      S.py = oy + ((ev.clientY - sy) / r.height) * 100;
      applyZoom();
    };
    const up = () => {
      frame.classList.remove('panning');
      frame.removeEventListener('pointermove', mv);
      frame.removeEventListener('pointerup', up);
    };
    frame.addEventListener('pointermove', mv);
    frame.addEventListener('pointerup', up);
  });
}
