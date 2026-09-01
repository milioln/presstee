// Manipulation du visuel sur la scène (glisser, redimensionner, pivoter)
// à la souris et au doigt — port direct de la V0 (événements Pointer,
// compatibles souris et tactile).
import { S } from './state';
import { syncShots, paintDiag, paintRecap } from './render';
import { syncSliders } from './sliders';

export function bindStage(): void {
  const stage = document.getElementById('stage')!;
  const d = stage.querySelector<HTMLElement>('.design');
  if (!d) return;
  const area = stage.querySelector<HTMLElement>('.printarea')!;
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  const guide = (on: boolean) => area.classList.toggle('show', on);

  d.addEventListener('pointerdown', (e: PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains('hdl')) return;
    e.preventDefault();
    e.stopPropagation();
    S.sel = true;
    d.classList.add('sel');
    d.setPointerCapture(e.pointerId);
    guide(true);
    const r = area.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = S.x;
    const oy = S.y;
    const mv = (ev: PointerEvent) => {
      S.x = cl(ox + (ev.clientX - sx) / r.width);
      S.y = cl(oy + (ev.clientY - sy) / r.height);
      d.style.left = S.x * 100 + '%';
      d.style.top = S.y * 100 + '%';
      syncShots();
    };
    const up = () => {
      guide(false);
      d.removeEventListener('pointermove', mv);
      d.removeEventListener('pointerup', up);
      paintDiag();
      paintRecap();
    };
    d.addEventListener('pointermove', mv);
    d.addEventListener('pointerup', up);
  });

  const rz = d.querySelector<HTMLElement>('.rz');
  rz?.addEventListener('pointerdown', (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    rz.setPointerCapture(e.pointerId);
    guide(true);
    const r = area.getBoundingClientRect();
    const cx = r.left + S.x * r.width;
    const cy = r.top + S.y * r.height;
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const w0 = S.w;
    const mv = (ev: PointerEvent) => {
      S.w = Math.max(0.08, Math.min(1.2, w0 * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0)));
      d.style.width = S.w * 100 + '%';
      syncSliders();
      syncShots();
    };
    const up = () => {
      guide(false);
      paintDiag();
      paintRecap();
      rz.removeEventListener('pointermove', mv);
      rz.removeEventListener('pointerup', up);
    };
    rz.addEventListener('pointermove', mv);
    rz.addEventListener('pointerup', up);
  });

  const rt = d.querySelector<HTMLElement>('.rt');
  rt?.addEventListener('pointerdown', (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    rt.setPointerCapture(e.pointerId);
    guide(true);
    const r = area.getBoundingClientRect();
    const cx = r.left + S.x * r.width;
    const cy = r.top + S.y * r.height;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    const r0 = S.rot;
    const mv = (ev: PointerEvent) => {
      let g = r0 + ((Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) * 180) / Math.PI;
      S.rot = Math.round((((g + 180) % 360) + 360) % 360) - 180;
      d.style.transform = `translate(-50%,-50%) rotate(${S.rot}deg)`;
      syncSliders();
      syncShots();
    };
    const up = () => {
      guide(false);
      rt.removeEventListener('pointermove', mv);
      rt.removeEventListener('pointerup', up);
    };
    rt.addEventListener('pointermove', mv);
    rt.addEventListener('pointerup', up);
  });
}

// Désélectionne le visuel quand on clique hors de la scène. Écouteur
// global posé une seule fois par main.ts (pas à chaque bindStage/render,
// pour ne pas empiler les écouteurs à chaque re-rendu).
export function bindDeselect(): void {
  document.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.frame') && S.sel) {
      S.sel = false;
      document.querySelector('#stage .design')?.classList.remove('sel');
    }
  });
}
