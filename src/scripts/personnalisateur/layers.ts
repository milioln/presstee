// Bande de calques : plusieurs visuels (logo + texte, texte recto +
// texte dos...) peuvent coexister. Cette bande liste ceux de
// l'emplacement actuellement affiché, permet d'en choisir un à éditer
// (position/taille/rotation, dans le panneau "4 — Taille et position")
// et de le retirer. syncEditor() est le point de passage unique après
// toute mutation de S.layers ou de S.place : il maintient l'invariant
// "le calque actif appartient à l'emplacement affiché" et rafraîchit
// tout l'écran en conséquence.
import { S, saveState, activeLayer } from './state';
import { render, paintWidth, paintRotate } from './render';
import { analyse } from './file-analysis';
import { CROP_ICON_SVG, MOVE_ICON_SVG } from './icons';
import { syncPlace } from './placement';
import { GARMENTS } from './garments';
import type { Emplacement } from '../../config/parametres-metier';

const PLACE_LABEL: Record<Emplacement, string> = { face: 'Face', coeur: 'Cœur', dos: 'Dos' };
const PLACE_ORDER: Emplacement[] = ['face', 'coeur', 'dos'];

// Même cycle que layer-popup.ts (dupliqué plutôt que partagé : les deux
// modules n'ont sinon aucune dépendance commune, et ce calcul tient en
// trois lignes).
function nextPlace(current: Emplacement): Emplacement {
  const available = PLACE_ORDER.filter((p) => p !== 'coeur' || !GARMENTS[S.garment].noCoeur);
  const idx = available.indexOf(current);
  return available[(idx + 1) % available.length];
}

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
      const dest = nextPlace(l.place);
      return `<div class="layerchip${l.id === S.activeLayerId ? ' on' : ''}" data-l="${l.id}" title="${l.fileName}">
        <img src="${l.img}" alt="" />
        <div class="layerchip-actions">
          ${croppable ? `<button type="button" data-crop="${l.id}" aria-label="Recadrer ce visuel">${CROP_ICON_SVG}</button>` : ''}
          <button type="button" data-move="${l.id}" aria-label="Déplacer ce visuel vers ${PLACE_LABEL[dest]}" title="Déplacer vers ${PLACE_LABEL[dest]}">${MOVE_ICON_SVG}</button>
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
    const moveChip = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-move]');
    if (moveChip) {
      const layer = S.layers.find((l) => l.id === moveChip.dataset.move);
      if (!layer) return;
      // Recentré plutôt que de reporter x/y à l'identique : ces
      // coordonnées sont relatives à la zone d'impression de
      // l'emplacement d'origine, pas transposables telles quelles vers
      // celle d'un autre emplacement (cf. layer-popup.ts, même logique).
      layer.place = nextPlace(layer.place);
      layer.x = 0.5;
      layer.y = 0.5;
      S.activeLayerId = layer.id;
      S.place = layer.place;
      saveState();
      syncPlace();
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
