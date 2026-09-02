// Recadrage du visuel actif : overlay plein écran avec un cadre de
// sélection redimensionnable posé sur l'image, sans dépendance externe.
// S'applique à tout fichier importé, y compris SVG (rasterisé comme
// n'importe quelle image via <img>/canvas, cf. file-analysis.ts qui
// fait de même pour le comptage de couleurs) — seul le texte généré
// (couleur connue) n'a pas de bouton, cf. paintCropVisibility dans
// layers.ts.
import { activeLayer } from './state';
import { syncEditor } from './layers';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

let box: Box = { left: 0, top: 0, width: 0, height: 0 };
let stageSize = { width: 0, height: 0 };

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function paintBox(): void {
  const rect = el('cropRect');
  rect.style.left = `${box.left}px`;
  rect.style.top = `${box.top}px`;
  rect.style.width = `${box.width}px`;
  rect.style.height = `${box.height}px`;
}

export function openCrop(): void {
  const layer = activeLayer();
  if (!layer) return;
  const img = el<HTMLImageElement>('cropImg');
  img.onload = () => {
    const r = img.getBoundingClientRect();
    stageSize = { width: r.width, height: r.height };
    const inset = Math.min(r.width, r.height) * 0.12;
    box = { left: inset, top: inset, width: r.width - inset * 2, height: r.height - inset * 2 };
    paintBox();
  };
  img.src = layer.img;
  el('cropOverlay').style.display = 'flex';
}

function closeCrop(): void {
  el('cropOverlay').style.display = 'none';
}

function startDrag(mode: string, e: PointerEvent): void {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const startY = e.clientY;
  const start = { ...box };
  const minSize = 24;

  const move = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    let { left, top, width, height } = start;
    if (mode === 'move') {
      left = clamp(start.left + dx, 0, stageSize.width - start.width);
      top = clamp(start.top + dy, 0, stageSize.height - start.height);
    } else {
      if (mode.includes('w')) {
        const nl = clamp(start.left + dx, 0, start.left + start.width - minSize);
        width = start.width - (nl - start.left);
        left = nl;
      }
      if (mode.includes('e')) {
        width = clamp(start.width + dx, minSize, stageSize.width - start.left);
      }
      if (mode.includes('n')) {
        const nt = clamp(start.top + dy, 0, start.top + start.height - minSize);
        height = start.height - (nt - start.top);
        top = nt;
      }
      if (mode.includes('s')) {
        height = clamp(start.height + dy, minSize, stageSize.height - start.top);
      }
    }
    box = { left, top, width, height };
    paintBox();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function applyCrop(): void {
  const layer = activeLayer();
  const img = el<HTMLImageElement>('cropImg');
  if (!layer || !img.naturalWidth) {
    closeCrop();
    return;
  }
  const scale = img.naturalWidth / stageSize.width;
  const sx = box.left * scale;
  const sy = box.top * scale;
  const sw = box.width * scale;
  const sh = box.height * scale;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw));
  c.height = Math.max(1, Math.round(sh));
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  layer.img = c.toDataURL('image/png');
  // Le résultat est toujours un raster, même si la source était un SVG.
  layer.vector = false;
  layer.natW = 0;
  layer.natH = 0;
  layer.colors = null;
  layer.dom = null;
  layer.colorSwatches = null;
  closeCrop();
  syncEditor();
}

export function bindCrop(): void {
  el('cropBtn').addEventListener('click', openCrop);
  el('cropCancel').addEventListener('click', closeCrop);
  el('cropApply').addEventListener('click', applyCrop);
  document.querySelectorAll<HTMLElement>('#cropRect [data-h]').forEach((h) => {
    h.addEventListener('pointerdown', (e) => startDrag(h.dataset.h!, e as PointerEvent));
  });
  el('cropRect').addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).dataset.h) return;
    startDrag('move', e as PointerEvent);
  });
}
