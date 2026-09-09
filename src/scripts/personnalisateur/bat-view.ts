// Bascule "Modèle 3D" / "Bon à tirer" du viewer (configurateur.astro) :
// le client peut prévisualiser le bon à tirer du projet en cours
// d'édition (pas seulement une fois ajouté au panier, cf. bat.ts /
// /bon-a-tirer) et le confirmer explicitement pendant qu'il attend la
// validation définitive de l'atelier. Aucune transmission au serveur :
// la confirmation est un repère local pour le client (et, une fois le
// projet ajouté au panier ou envoyé en devis, une information qui
// accompagne sa demande) — pas un enregistrement côté Presstee.
import { S, saveState } from './state';
import { snapshotCurrent, type SavedItem } from './cart';
import { pieceCard } from './bat';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// Signature du contenu qui compte pour un bon à tirer — délibérément
// sans le contenu image des calques (trop lourd à comparer à chaque
// rendu) : le nom de fichier + les dimensions + le vecteur d'origine
// servent de repère suffisant pour détecter un changement de visuel,
// combinés à tout ce qui influe sur le rendu ou le prix (position,
// taille, rotation, couleurs, coloris, emplacement, tailles, technique).
function signatureOf(item: SavedItem): string {
  const layers = item.layers
    .map((l) => [l.place, l.fileName, l.vector, l.natW, l.natH, l.x, l.y, l.w, l.rot, l.colors].join(':'))
    .join('|');
  const colorLots = item.colorLots
    .map((lot) => `${lot.color.hex}:${Object.entries(lot.sizeDist).map(([t, n]) => `${t}${n}`).join('')}`)
    .join('|');
  return [item.garment, colorLots, layers, item.tech, item.delai].join('§');
}

function fmtDate(ts: number): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

export function renderBATView(): void {
  const item = snapshotCurrent();
  el('batViewRoot').innerHTML = `<div class="bat-pieces">${pieceCard(item, 0)}</div>`;

  const signature = signatureOf(item);
  const stillValid = S.batConfirme != null && S.batConfirme.signature === signature;

  el('batConfirm').style.display = stillValid ? 'none' : 'block';
  el('batConfirmed').style.display = stillValid ? 'flex' : 'none';
  if (stillValid && S.batConfirme) {
    el('batConfirmedDate').textContent = fmtDate(S.batConfirme.at);
  }
}

export function bindBATView(): void {
  el('batRefresh').addEventListener('click', () => {
    renderBATView();
    const btn = el<HTMLButtonElement>('batRefresh');
    const original = btn.textContent;
    btn.textContent = 'Actualisé ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  });

  el('batConfirmBtn').addEventListener('click', () => {
    const item = snapshotCurrent();
    S.batConfirme = { at: Date.now(), signature: signatureOf(item) };
    saveState();
    renderBATView();
  });
  el('batUnconfirm').addEventListener('click', () => {
    S.batConfirme = null;
    saveState();
    renderBATView();
  });

  const toggle = el('viewToggle');
  toggle.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-view]');
    if (!b) return;
    toggle.querySelectorAll('button').forEach((btn) => btn.classList.remove('on'));
    b.classList.add('on');
    const bat = b.dataset.view === 'bat';
    el('editView').style.display = bat ? 'none' : '';
    el('batView').style.display = bat ? 'block' : 'none';
    if (bat) renderBATView();
  });
}
