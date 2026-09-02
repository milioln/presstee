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
import { CROP_ICON_SVG } from './icons';

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
    .map((l) => {
      const croppable = !l.knownColor;
      return `<div class="layerchip${l.id === S.activeLayerId ? ' on' : ''}" data-l="${l.id}" title="${l.fileName}">
        <img src="${l.img}" alt="" />
        <div class="layerchip-actions">
          ${croppable ? `<button type="button" data-crop="${l.id}" aria-label="Recadrer ce visuel">${CROP_ICON_SVG}</button>` : ''}
          <button type="button" data-rm="${l.id}" aria-label="Retirer ce visuel">×</button>
        </div>
      </div>`;
    })
    .join('');
}

function paintCropVisibility(): void {
  const layer = activeLayer();
  toggle('cropBtn', !!layer && !layer.knownColor);
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
    const cropChip = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-crop]');
    if (cropChip) {
      S.activeLayerId = cropChip.dataset.crop!;
      syncEditor();
      // #cropBtn est rendu visible par syncEditor() ci-dessus (le calque
      // ciblé est recadrable) juste avant ce clic programmatique — ouvre
      // directement l'outil sans repasser par le panneau "4".
      document.getElementById('cropBtn')?.click();
      return;
    }
    const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-l]');
    if (chip) {
      S.activeLayerId = chip.dataset.l!;
      syncEditor();
    }
  });
}
