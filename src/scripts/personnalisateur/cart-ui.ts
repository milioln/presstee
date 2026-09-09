// Panneau "Mes projets enregistrés" (le panier a sa propre page,
// /panier, pour une vue plus confortable) — et câblage des 3 boutons de
// fin de parcours (panier, devis, enregistrer).
import { getCart, getSaved, removeSaved, loadSaved, addToCart, saveProject, briefForCurrent, bindOnLoaded, type SavedItem } from './cart';
import { setDemandeBrief } from '../../lib/demande-brief';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function renderList(): void {
  const items: SavedItem[] = getSaved();
  const wrap = el('listItems');
  el('listEmpty').style.display = items.length ? 'none' : 'block';
  wrap.innerHTML = items
    .map(
      (it) => `<div class="listRow" data-id="${it.id}">
        <span class="listSwatch" style="background:${it.color.hex}"></span>
        <div class="listInfo">
          <strong>${it.techNom}</strong>
          <span>${it.color.nom} · ${it.qty} pièce${it.qty > 1 ? 's' : ''} · ${fmtDate(it.savedAt)}</span>
        </div>
        <button type="button" class="mini-btn" data-load="${it.id}">Charger</button>
        <button type="button" class="listRm" data-rm="${it.id}" aria-label="Retirer">×</button>
      </div>`
    )
    .join('');
}

function openList(): void {
  renderList();
  el('listOverlay').style.display = 'flex';
}

function closeList(): void {
  el('listOverlay').style.display = 'none';
}

export function paintBadges(): void {
  el('cartCount').textContent = String(getCart().length);
  el('savedCount').textContent = String(getSaved().length);
}

function flash(btnId: string, text: string): void {
  const btn = el<HTMLButtonElement>(btnId);
  const original = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1400);
}

export function bindCartUI(): void {
  el('openSaved').addEventListener('click', openList);
  el('listClose').addEventListener('click', closeList);
  el('listOverlay').addEventListener('click', (e) => {
    if (e.target === el('listOverlay')) closeList();
  });

  el('listItems').addEventListener('click', (e) => {
    const rm = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-rm]');
    if (rm) {
      removeSaved(rm.dataset.rm!);
      renderList();
      paintBadges();
      return;
    }
    const load = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-load]');
    if (load) {
      loadSaved(load.dataset.load!);
      closeList();
    }
  });

  el('addToCart').addEventListener('click', () => {
    const item = addToCart();
    paintBadges();
    flash('addToCart', 'Ajouté ✓');
    const batLink = el('batLink');
    batLink.querySelector('a')!.setAttribute('href', `/bon-a-tirer?id=${item.id}`);
    batLink.style.display = 'block';
  });
  el('saveProject').addEventListener('click', () => {
    saveProject();
    paintBadges();
    flash('saveProject', 'Enregistré ✓');
  });
  el('sendQuote').addEventListener('click', () => {
    setDemandeBrief(briefForCurrent());
    window.location.href = '/demande-devis';
  });

  paintBadges();
}

export { bindOnLoaded };
