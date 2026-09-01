// Point d'entrée du personnalisateur — assemble les modules et branche
// les contrôles du panneau restants (vêtement, couleur, quantité,
// technique, délai, ajustements). Port direct de la V0 + persistance
// locale (nouveauté V1).
import { S, loadState } from './state';
import { GARMENTS, CARACTERISTIQUES } from './garments';
import { catalogueColoris, paliersQuantite, quantiteMin, quantiteMax } from '../../config/parametres-metier';
import { placeSide } from './derived';
import { render, paintTechs, paintRecap } from './render';
import { syncSliders } from './sliders';
import { syncPlace, bindPlacement } from './placement';
import { bindDeselect } from './interactions';
import { bindZoom, setZ } from './zoom';
import { bindFileInput, restoreFileUI } from './file-input';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function paintModels(): void {
  const models = el('models');
  models.innerHTML = Object.keys(GARMENTS)
    .map(
      (k) =>
        `<button class="opt${k === S.garment ? ' on' : ''}" data-g="${k}"><svg viewBox="0 0 400 460"><path d="${GARMENTS[k as keyof typeof GARMENTS].icon}" fill="none" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/></svg>${GARMENTS[k as keyof typeof GARMENTS].name}</button>`
    )
    .join('');
  models.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-g]');
    if (!b) return;
    S.garment = b.dataset.g as typeof S.garment;
    S.view = placeSide();
    models.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('on', x === b));
    syncPlace();
    paintCaracteristiques();
    render();
  });
}

// Col / manches / coupe : seules les caractéristiques pertinentes pour
// la famille en cours sont affichées (CARACTERISTIQUES dans garments.ts).
function paintCaracteristiques(): void {
  const attrs = CARACTERISTIQUES[S.garment];

  const colBlock = el('caracCol');
  colBlock.style.display = attrs.col ? 'block' : 'none';
  if (attrs.col) {
    el('colSeg')
      .querySelectorAll<HTMLButtonElement>('[data-col]')
      .forEach((b) => b.classList.toggle('on', b.dataset.col === S.col));
  }

  const mancheBlock = el('caracManche');
  mancheBlock.style.display = attrs.manche ? 'block' : 'none';
  if (attrs.manche) {
    el('mancheSeg')
      .querySelectorAll<HTMLButtonElement>('[data-manche]')
      .forEach((b) => b.classList.toggle('on', b.dataset.manche === S.manche));
  }

  const coupeBlock = el('caracCoupe');
  coupeBlock.style.display = attrs.coupe ? 'block' : 'none';
  if (attrs.coupe) {
    el('coupeSeg')
      .querySelectorAll<HTMLButtonElement>('[data-coupe]')
      .forEach((b) => b.classList.toggle('on', b.dataset.coupe === S.coupe));
  }

  el('caracBlock').style.display = attrs.col || attrs.manche || attrs.coupe ? 'block' : 'none';
}

function bindCaracteristiques(): void {
  el('colSeg').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-col]');
    if (!b) return;
    S.col = b.dataset.col as typeof S.col;
    paintCaracteristiques();
    render();
  });
  el('mancheSeg').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-manche]');
    if (!b) return;
    S.manche = b.dataset.manche as typeof S.manche;
    paintCaracteristiques();
    render();
  });
  el('coupeSeg').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-coupe]');
    if (!b) return;
    S.coupe = b.dataset.coupe as typeof S.coupe;
    paintCaracteristiques();
    render();
  });
}

function paintColorName(): void {
  el('colorName').textContent = S.color.nom;
}

function paintColors(): void {
  const colors = el('colors');
  colors.innerHTML = catalogueColoris
    .map((c, i) => `<button class="sw${c.hex === S.color.hex ? ' on' : ''}" data-c="${i}" style="background:${c.hex}" aria-label="${c.nom}"></button>`)
    .join('');
  paintColorName();
  colors.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-c]');
    if (!b) return;
    S.color = catalogueColoris[+b.dataset.c!];
    colors.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b));
    paintColorName();
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
}

function setQty(v: number): void {
  S.qty = Math.max(quantiteMin, Math.min(quantiteMax, v || 1));
  const qVal = el<HTMLInputElement>('qVal');
  qVal.value = String(S.qty);
  el('qPal').textContent = S.qty < 30 ? 'petite série' : S.qty < 100 ? 'série moyenne' : 'grande série';
  paintTechs();
  paintRecap();
}

function bindQuantity(): void {
  const qVal = el<HTMLInputElement>('qVal');
  el('qPresets').innerHTML = paliersQuantite.map((v) => `<button data-q="${v}">${v}</button>`).join('');
  el('qPresets').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-q]');
    if (!b) return;
    setQty(+b.dataset.q!);
  });
  el('qMinus').addEventListener('click', () => setQty(S.qty - (S.qty > 50 ? 10 : 5)));
  el('qPlus').addEventListener('click', () => setQty(S.qty + (S.qty >= 50 ? 10 : 5)));
  qVal.addEventListener('input', () => setQty(+qVal.value));
}

function bindAdjust(): void {
  const rSize = el<HTMLInputElement>('rSize');
  const rRot = el<HTMLInputElement>('rRot');
  rSize.addEventListener('input', () => {
    S.w = +rSize.value / 100;
    syncSliders();
    render();
  });
  rRot.addEventListener('input', () => {
    S.rot = +rRot.value;
    syncSliders();
    render();
  });
  el('center').addEventListener('click', () => {
    S.x = 0.5;
    S.y = 0.5;
    render();
  });
  el('reset').addEventListener('click', () => {
    Object.assign(S, { x: 0.5, y: 0.5, w: 0.62, rot: 0 });
    syncSliders();
    render();
  });
}

function bindShotsClick(): void {
  el('shots').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-v]');
    if (!b) return;
    S.view = +b.dataset.v!;
    render();
  });
}

export function init(): void {
  loadState();

  paintModels();
  paintCaracteristiques();
  bindCaracteristiques();
  paintColors();
  bindDelai();
  bindTechs();
  bindQuantity();
  bindAdjust();
  bindPlacement();
  bindShotsClick();
  bindZoom();
  bindFileInput();
  bindDeselect();

  // Reflète les valeurs restaurées (ou par défaut) dans les commandes du
  // délai avant le premier rendu.
  document.querySelectorAll<HTMLButtonElement>('[data-d]').forEach((b) => b.classList.toggle('on', b.dataset.d === S.delai));

  syncPlace();
  setQty(S.qty);
  syncSliders();
  setZ(1);
  restoreFileUI();
  render();
}
