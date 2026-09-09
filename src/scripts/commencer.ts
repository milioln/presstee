// Quiz guidé /commencer — « Trois questions, une recommandation claire,
// puis direction le configurateur déjà pré-rempli » (promesse déjà
// écrite en page d'accueil, tenue ici). Réutilise le même moteur de
// recommandation et le même catalogue que le simulateur
// (personnalisateur/recommendation.ts, personnalisateur/catalogue-match.ts)
// plutôt que de dupliquer la logique — seule la présentation change (un
// écran à la fois, plutôt qu'un long formulaire).
import { reco, TECHS } from './personnalisateur/recommendation';
import { seedFromItem } from './personnalisateur/state';
import { getProfil, setProfil, type ProfilClient } from '../lib/profil-client';
import { catalogueColoris, coutBaseSupportUnique, repartitionTaillesParDefaut, type Garment } from '../config/parametres-metier';
import { LABELS_COUPE, LABELS_GENRE } from '../lib/produits-types';
import { grilleTarifaire, prixVente } from '../config/tarification';
import { COULEURS_OPTIONS, COUPES, GENRES, candidatsRef, qtyStep, palierPour } from './personnalisateur/catalogue-match';

const GARMENT_LABELS: Record<Garment, string> = { tshirt: 'T-shirt', sweat: 'Sweat', chemise: 'Chemise', casquette: 'Casquette' };

interface QuizState {
  profil: ProfilClient | null;
  garment: Garment;
  coupe: string | null;
  genre: string | null;
  color: { nom: string; hex: string };
  couleurs: number | null;
  qty: number;
  selectedRef: string | null;
}

const state: QuizState = {
  profil: null,
  garment: 'tshirt',
  coupe: null,
  genre: null,
  color: catalogueColoris[0],
  couleurs: null,
  qty: 25,
  selectedRef: null,
};

type Screen = 'profil' | 'projet' | 'quantite' | 'resultat';
let order: Screen[] = ['profil', 'projet', 'quantite', 'resultat'];
let current = 0;

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function pill(action: string, value: string, label: string, on: boolean): string {
  return `<button type="button" class="pill${on ? ' on' : ''}" data-action="${action}" data-value="${value}">${label}</button>`;
}

function screenProfil(): string {
  return `<div class="qzStep">
    <h2>Vous êtes…</h2>
    <p class="qzHint">Pour vous montrer ce qui compte vraiment.</p>
    <div class="qzChoices qzChoices-big">
      <button type="button" class="qzBig" data-action="set-profil" data-value="particulier"><span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path></svg></span>Un particulier</button>
      <button type="button" class="qzBig" data-action="set-profil" data-value="entreprise"><span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"></rect><path d="M9 21v-4h6v4"></path><path d="M8 7h1M8 11h1M15 7h1M15 11h1"></path></svg></span>Une structure</button>
    </div>
  </div>`;
}

function screenProjet(): string {
  return `<div class="qzStep">
    <h2>Votre projet</h2>
    <p class="qzHint">Question 1 sur 3</p>
    <div class="qzField">
      <span class="qzLabel">Type de textile</span>
      <div class="pills">${(Object.keys(GARMENT_LABELS) as Garment[]).map((g) => pill('set-garment', g, GARMENT_LABELS[g], state.garment === g)).join('')}</div>
    </div>
    <div class="qzField">
      <span class="qzLabel">Coupe <span class="qzOptional">(optionnel)</span></span>
      <div class="pills">${COUPES.map((c) => pill('set-coupe', c, LABELS_COUPE[c], state.coupe === c)).join('')}</div>
    </div>
    <div class="qzField">
      <span class="qzLabel">Public <span class="qzOptional">(optionnel)</span></span>
      <div class="pills">${GENRES.map((g) => pill('set-genre', g, LABELS_GENRE[g], state.genre === g)).join('')}</div>
    </div>
    <div class="qzField">
      <span class="qzLabel">Couleur du textile</span>
      <div class="swatches">${catalogueColoris.map((c) => `<button type="button" class="sw${c.hex === state.color.hex ? ' on' : ''}" data-action="set-color" data-value="${c.hex}" style="background:${c.hex}" aria-label="${c.nom}"></button>`).join('')}</div>
    </div>
  </div>`;
}

function screenQuantite(): string {
  return `<div class="qzStep">
    <h2>Quantité et visuel</h2>
    <p class="qzHint">Question 2 sur 3 — deux petites choses, sur un seul écran</p>
    <div class="qzField">
      <span class="qzLabel">Quantité</span>
      <div class="qtyStepper">
        <button type="button" class="btn-icon" data-action="qty-step" data-delta="-1" aria-label="Diminuer">−</button>
        <span class="qtyStepper-val">${state.qty} pièce${state.qty > 1 ? 's' : ''}</span>
        <button type="button" class="btn-icon" data-action="qty-step" data-delta="1" aria-label="Augmenter">+</button>
      </div>
    </div>
    <div class="qzField">
      <span class="qzLabel">Nombre de couleurs du visuel</span>
      <div class="pills">${COULEURS_OPTIONS.map((o) => pill('set-couleurs', o.value == null ? '' : String(o.value), o.label, state.couleurs === o.value)).join('')}</div>
    </div>
  </div>`;
}

function screenResultat(): string {
  const r = reco(state.couleurs, state.qty);
  const tech = TECHS[r.k];
  const styles = new Set<string>();
  if (state.coupe) styles.add(state.coupe);
  if (state.genre) styles.add(state.genre);
  const candidatsTous = state.garment === 'tshirt' ? candidatsRef(styles) : [];
  // Trois propositions à prix croissant plutôt qu'une seule référence
  // imposée — la composition (coton/polyester/mélange...) est souvent
  // déterminante pour le client, elle doit être visible sans poser une
  // 4e question.
  const candidats = candidatsTous.slice(0, 3);
  if (!state.selectedRef || !candidats.some((c) => c.slug === state.selectedRef)) {
    state.selectedRef = candidats[0]?.slug ?? null;
  }
  const ref = candidats.find((c) => c.slug === state.selectedRef) ?? null;
  const palier = palierPour(state.qty);
  const coutBase = ref ? ref.baseCost : coutBaseSupportUnique;
  const prixUnitaire = Math.round(prixVente(coutBase, palier.marge) * 100) / 100;
  const prixTotal = Math.round(prixUnitaire * state.qty * 100) / 100;
  const grille = grilleTarifaire(coutBase);

  return `<div class="qzStep qzStep-resultat">
    <span class="qzResultBadge">Votre recommandation</span>
    <h2>${tech.n}</h2>
    <p class="qzWhy">${r.why}</p>

    <div class="qzResultCard">
      <svg class="qzResultShirt" viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M148,54 L118,44 L52,92 L96,156 L122,136 L122,420 Q122,428 130,428 L270,428 Q278,428 278,420 L278,136 L304,156 L348,92 L282,44 L252,54 Q200,100 148,54 Z" fill="${state.color.hex}" stroke="var(--ligne)" stroke-width="6" />
      </svg>
      <div class="qzResultBody">
        <span class="qzResultRef">${ref ? `${ref.brand} ${ref.model}` : `${GARMENT_LABELS[state.garment]} · ${state.color.nom}`}</span>
        ${ref ? `<span class="qzResultMatiere">${ref.detail}</span>` : ''}
        <span class="qzResultPrix">${fmtPrice(prixUnitaire)} <span>/ pièce</span></span>
        <span class="qzResultTotal">Soit environ ${fmtPrice(prixTotal)} pour ${state.qty} pièce${state.qty > 1 ? 's' : ''}</span>
      </div>
    </div>

    ${candidats.length > 1 ? `<div class="qzField">
      <span class="qzLabel">Autres références possibles <span class="qzOptional">— composition, prix</span></span>
      <div class="refList">
        ${candidats.map((c) => `<button type="button" class="refRow${c.slug === state.selectedRef ? ' on' : ''}" data-action="select-ref" data-value="${c.slug}">
          <span class="refRow-name"><b>${c.brand}</b> ${c.model}<br /><span class="qzOptional">${c.detail}</span></span>
          <span class="refRow-meta">${c.grammage}</span>
          <span class="refRow-price">${fmtPrice(Math.round(prixVente(c.baseCost, palier.marge) * 100) / 100)} <span>/ pièce</span></span>
        </button>`).join('')}
      </div>
    </div>` : ''}

    ${candidatsTous.length === 0 && state.garment === 'tshirt' ? `<p class="qzHint">Aucune référence ne correspond exactement à ces filtres — estimation générique ci-dessus. <a href="/produits/t-shirts">Voir tout le catalogue →</a></p>` : ''}

    <details class="qzGrille">
      <summary>Voir le prix par palier de quantité</summary>
      <div class="qzGrilleRows">
        ${grille.map((p) => `<div class="qzGrilleRow"><span>${p.label} pièces</span><b>${fmtPrice(p.prixUnitaire)}</b></div>`).join('')}
      </div>
    </details>

    <div class="qzResultActions">
      <button type="button" class="btn" id="qzGo3d">Configurer ce projet en 3D</button>
      <a class="btn btn-outline" href="/personnaliser?mode=estimation" id="qzGoEstimation">Voir une estimation plus détaillée</a>
    </div>
  </div>`;
}

function render(): void {
  const screen = order[current];
  el('qzScreen').innerHTML =
    screen === 'profil' ? screenProfil() :
    screen === 'projet' ? screenProjet() :
    screen === 'quantite' ? screenQuantite() :
    screenResultat();

  const dots = el('qzProgress');
  const visibleSteps: Screen[] = ['projet', 'quantite', 'resultat'];
  dots.innerHTML = visibleSteps.map((s) => `<span class="qzDot${order[current] === s ? ' on' : ''}${visibleSteps.indexOf(order[current] as Screen) > visibleSteps.indexOf(s) ? ' done' : ''}"></span>`).join('');
  dots.style.display = screen === 'profil' ? 'none' : 'flex';

  el('qzNav').style.display = screen === 'projet' || screen === 'quantite' ? 'flex' : 'none';
  el<HTMLButtonElement>('qzPrev').disabled = current === 0;
  el<HTMLButtonElement>('qzNext').textContent = screen === 'quantite' ? 'Voir ma recommandation' : 'Suivant';

  if (screen === 'resultat') {
    el('qzGo3d').addEventListener('click', () => {
      seedFromItem({
        garment: state.garment,
        color: state.color,
        layers: [],
        sizeDist: { ...repartitionTaillesParDefaut },
        tech: 'auto',
        delai: 'standard',
        designHelp: { colors: state.couleurs, format: '', notes: '' },
      });
      window.location.href = '/personnaliser?mode=3d';
    });
  }
}

function goTo(delta: number): void {
  current = Math.max(0, Math.min(order.length - 1, current + delta));
  render();
}

export function initCommencer(): void {
  // Le profil est sauté d'emblée s'il est déjà connu (venant de l'accueil
  // ou d'une visite précédente) — pas la peine de reposer la question.
  const knownProfil = getProfil();
  if (knownProfil) {
    state.profil = knownProfil;
    order = order.filter((s) => s !== 'profil');
  }

  el('qzScreen').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
    if (!b) return;
    const action = b.dataset.action!;
    const value = b.dataset.value ?? '';
    switch (action) {
      case 'set-profil':
        state.profil = value as ProfilClient;
        setProfil(state.profil);
        goTo(1);
        return;
      case 'set-garment':
        state.garment = value as Garment;
        break;
      case 'set-coupe':
        state.coupe = state.coupe === value ? null : value;
        break;
      case 'set-genre':
        state.genre = state.genre === value ? null : value;
        break;
      case 'set-color':
        state.color = catalogueColoris.find((c) => c.hex === value) ?? state.color;
        break;
      case 'set-couleurs':
        state.couleurs = value === '' ? null : +value;
        break;
      case 'qty-step': {
        const delta = +b.dataset.delta! * qtyStep(state.qty);
        state.qty = Math.max(1, Math.min(2000, state.qty + delta));
        break;
      }
      case 'select-ref':
        state.selectedRef = value;
        break;
    }
    render();
  });

  el('qzPrev').addEventListener('click', () => goTo(-1));
  el('qzNext').addEventListener('click', () => goTo(1));

  render();
}
