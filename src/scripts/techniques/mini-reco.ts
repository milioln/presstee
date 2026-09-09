// Mini-recommandation en direct pour les pages /techniques/* — réutilise
// reco() (même moteur que le configurateur/simulateur/quiz) plutôt qu'une
// nouvelle logique, pour dire si LA technique de cette page convient au
// projet décrit, ou renvoyer vers celle qui convient mieux.
import { reco, TECHS, type TechKey } from '../personnalisateur/recommendation';
import { qtyStep } from '../personnalisateur/catalogue-match';

export function initTechMiniReco(): void {
  const root = document.getElementById('techMiniReco');
  if (!root) return;
  const tech = root.dataset.tech as TechKey;

  const couleursGroup = document.getElementById('tmrCouleurs')!;
  const qtyVal = document.getElementById('tmrQtyVal')!;
  const minus = document.getElementById('tmrMinus')!;
  const plus = document.getElementById('tmrPlus')!;
  const result = document.getElementById('tmrResult')!;

  let couleurs: number | null = null;
  let qty = 25;

  function render(): void {
    qtyVal.textContent = `${qty} pièce${qty > 1 ? 's' : ''}`;
    const r = reco(couleurs, qty);
    result.innerHTML = r.k === tech
      ? `<p class="techMiniReco-ok">✓ ${TECHS[tech].n} convient bien à ce projet.</p>`
      : `<p class="techMiniReco-alt">Plutôt <a href="/techniques/${r.k}">${TECHS[r.k].n}</a> pour ce projet : ${r.why}</p>`;
  }

  couleursGroup.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pill');
    if (!b) return;
    couleursGroup.querySelectorAll('.pill').forEach((p) => p.classList.remove('on'));
    b.classList.add('on');
    couleurs = b.dataset.value ? +b.dataset.value : null;
    render();
  });

  minus.addEventListener('click', () => {
    qty = Math.max(1, qty - qtyStep(qty));
    render();
  });
  plus.addEventListener('click', () => {
    qty = Math.min(2000, qty + qtyStep(qty));
    render();
  });

  render();
}
