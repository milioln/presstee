// Bande de calques : plusieurs visuels (logo + texte, texte recto +
// texte dos...) peuvent coexister. Cette bande liste ceux de
// l'emplacement actuellement affiché, permet d'en choisir un à éditer
// (position/taille/rotation, dans le panneau "4 — Taille et position")
// et de le retirer. syncEditor() est le point de passage unique après
// toute mutation de S.layers ou de S.place : il maintient l'invariant
// "le calque actif appartient à l'emplacement affiché" et rafraîchit
// tout l'écran en conséquence.
import { S, activeLayer } from './state';
import { render, paintWidth, paintRotate } from './render';
import { analyse } from './file-analysis';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function toggle(id: string, show: boolean): void {
  const e = document.getElementById(id);
  if (e) e.style.display = show ? '' : 'none';
}

export function paintLayers(): void {
  const strip = el('layerStrip');
  const layers = S.layers.filter((l) => l.place === S.place);
  strip.style.display = layers.length ? 'flex' : 'none';
  strip.innerHTML = layers
    .map(
      (l) => `<div class="layerchip${l.id === S.activeLayerId ? ' on' : ''}" data-l="${l.id}" title="${l.fileName}">
        <img src="${l.img}" alt="" />
        <button type="button" class="layerchip-rm" data-rm="${l.id}" aria-label="Retirer ce visuel">×</button>
      </div>`
    )
    .join('');
}

function paintCropVisibility(): void {
  const layer = activeLayer();
  toggle('cropBtn', !!layer && !layer.vector && !layer.knownColor);
}

// Point de passage central : appelé après tout ajout, sélection ou
// retrait de calque, et après tout changement d'emplacement.
export function syncEditor(): void {
  const current = S.layers.find((l) => l.id === S.activeLayerId);
  if (!current || current.place !== S.place) {
    const first = S.layers.find((l) => l.place === S.place);
    S.activeLayerId = first ? first.id : null;
  }
  const hasAny = S.layers.length > 0;
  toggle('placeBlock', hasAny);
  toggle('adjust', hasAny);
  const layer = activeLayer();
  toggle('adjustControls', !!layer);
  toggle('adjustEmpty', hasAny && !layer);
  paintLayers();
  paintCropVisibility();
  paintWidth();
  paintRotate();
  analyse();
  render();
}

export function bindLayers(): void {
  el('layerStrip').addEventListener('click', (e) => {
    const rm = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-rm]');
    if (rm) {
      S.layers = S.layers.filter((l) => l.id !== rm.dataset.rm);
      syncEditor();
      return;
    }
    const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-l]');
    if (chip) {
      S.activeLayerId = chip.dataset.l!;
      syncEditor();
    }
  });
}
