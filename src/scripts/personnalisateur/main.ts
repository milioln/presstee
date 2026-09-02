// Point d'entrée du personnalisateur — assemble les modules et branche
// les contrôles du panneau (couleur, emplacement, taille du visuel,
// répartition des tailles, technique, délai). Le vêtement est fixe
// ("T-shirt col rond unisexe, 180 g/m²") : le choix du support et des
// caractéristiques (col/manches/coupe) reviendra quand chaque référence
// du catalogue aura son propre personnalisateur.
import { S, activeLayer, loadState } from './state';
import { catalogueColoris, TAILLES } from '../../config/parametres-metier';
import { render, paintTechs, paintRecap, paintSizeDist, paintWidth, paintRotate, syncCamera } from './render';
import { syncPlace, bindPlacement } from './placement';
import { bindFileInput } from './file-input';
import { bindModeTabs, bindTextInput } from './text-input';
import { bindModelDrag } from './drag3d';
import { bindLayers, syncEditor } from './layers';
import { bindCrop } from './crop';
import { bindLayerPopup } from './layer-popup';
import { TECHS } from './recommendation';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function paintColorName(): void {
  el('colorName').textContent = S.color.nom;
}

function paintDarkNote(): void {
  const dark = ['#1B1B1F', '#20304F', '#1F5A4A'].includes(S.color.hex);
  el('darkNote').textContent = dark ? 'Coloris foncé : prévoir une sous-couche blanche en sérigraphie.' : 'Coloris clair : marquage direct, sans sous-couche.';
}

function paintColors(): void {
  const colors = el('colors');
  colors.innerHTML = catalogueColoris
    .map((c, i) => `<button class="sw${c.hex === S.color.hex ? ' on' : ''}" data-c="${i}" style="background:${c.hex}" aria-label="${c.nom}"></button>`)
    .join('');
  paintColorName();
  paintDarkNote();
  colors.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-c]');
    if (!b) return;
    S.color = catalogueColoris[+b.dataset.c!];
    colors.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b));
    paintColorName();
    paintDarkNote();
    render();
  });
}

function bindDelai(): void {
  el('delai').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-d]');
    if (!b) return;
    S.delai = b.dataset.d as typeof S.delai;
    document.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('on', x === b));
    paintRecap();
  });
}

function bindTechs(): void {
  el('techs').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-t]');
    if (!b) return;
    S.tech = b.dataset.t as typeof S.tech;
    paintTechs();
    paintRecap();
  });
  el('resetTech').addEventListener('click', () => {
    S.tech = 'auto';
    paintTechs();
    paintRecap();
  });
}

function bindSizeDist(): void {
  el('sizeRows').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sz]');
    if (!b) return;
    const t = b.dataset.sz as (typeof TAILLES)[number];
    const d = +b.dataset.d!;
    S.sizeDist[t] = Math.max(0, Math.min(999, S.sizeDist[t] + d));
    paintSizeDist();
    paintTechs();
    paintRecap();
  });
}

// Repositionner, redimensionner ou incliner un calque ne change pas
// son contenu : inutile de relancer l'analyse couleur/résolution à
// chaque clic ou frame de glisser, seul paintWidth()/render() suffit.
function bindAdjust(): void {
  el('wMinus').addEventListener('click', () => {
    const layer = activeLayer();
    if (!layer) return;
    layer.w = Math.max(0.12, Math.round((layer.w - 0.06) * 100) / 100);
    paintWidth();
    render();
  });
  el('wPlus').addEventListener('click', () => {
    const layer = activeLayer();
    if (!layer) return;
    layer.w = Math.min(1, Math.round((layer.w + 0.06) * 100) / 100);
    paintWidth();
    render();
  });
}

// Le glisser sur le canevas 3D fait tourner la caméra (pas le
// visuel) sauf sur le calque actif lui-même : le repositionnement
// passe aussi par ces flèches, qui déplacent le calque actif dans la
// zone d'impression (layer.x/layer.y en fraction 0–1).
function bindPosition(): void {
  const step = 0.08;
  const move = (dx: number, dy: number): void => {
    const layer = activeLayer();
    if (!layer) return;
    layer.x = Math.max(0, Math.min(1, Math.round((layer.x + dx) * 100) / 100));
    layer.y = Math.max(0, Math.min(1, Math.round((layer.y + dy) * 100) / 100));
    render();
  };
  el('pUp').addEventListener('click', () => move(0, step));
  el('pDown').addEventListener('click', () => move(0, -step));
  el('pLeft').addEventListener('click', () => move(-step, 0));
  el('pRight').addEventListener('click', () => move(step, 0));
  el('pCenter').addEventListener('click', () => {
    const layer = activeLayer();
    if (!layer) return;
    layer.x = 0.5;
    layer.y = 0.5;
    render();
  });
}

function bindRotate(): void {
  const step = 15;
  el('rMinus').addEventListener('click', () => {
    const layer = activeLayer();
    if (!layer) return;
    layer.rot = Math.round(layer.rot - step);
    paintRotate();
    render();
  });
  el('rPlus').addEventListener('click', () => {
    const layer = activeLayer();
    if (!layer) return;
    layer.rot = Math.round(layer.rot + step);
    paintRotate();
    render();
  });
}

function bindResetView(): void {
  el('vReset').addEventListener('click', () => {
    const mv = el<any>('stage');
    mv.fieldOfView = 'auto';
    syncCamera();
  });
}

// Pré-sélectionne une technique quand on arrive depuis une page du guide
// (/personnalisateur?technique=serigraphie) — ne s'applique qu'aux
// techniques réellement proposées ici (la broderie n'y figure pas encore).
function applyTechFromUrl(): void {
  const param = new URLSearchParams(window.location.search).get('technique');
  if (param && Object.prototype.hasOwnProperty.call(TECHS, param)) {
    S.tech = param as typeof S.tech;
  }
}

export function init(): void {
  loadState();
  applyTechFromUrl();

  paintColors();
  bindDelai();
  bindTechs();
  bindSizeDist();
  bindAdjust();
  bindPosition();
  bindRotate();
  bindPlacement();
  bindResetView();
  bindFileInput();
  bindModeTabs();
  bindTextInput();
  bindModelDrag();
  bindLayers();
  bindCrop();
  bindLayerPopup();

  // Reflète les valeurs restaurées (ou par défaut) dans les commandes du
  // délai avant le premier rendu.
  document.querySelectorAll<HTMLButtonElement>('[data-d]').forEach((b) => b.classList.toggle('on', b.dataset.d === S.delai));

  syncPlace();
  paintSizeDist();
  syncEditor();
}
