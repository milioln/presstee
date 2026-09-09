// Quiz guidé /commencer — seul parcours de vente rapide du site (le
// simulateur multi-produits qui vivait dans /personnaliser a été retiré :
// Milio, 2026-09, "il n'y a qu'un seul parcours de vente"). Réutilise le
// même moteur de recommandation et le même catalogue que le configurateur
// (personnalisateur/recommendation.ts, personnalisateur/catalogue-match.ts)
// plutôt que de dupliquer la logique — seule la présentation change (un
// écran à la fois). Le multiproduit (« Ajouter un autre produit ») est
// géré ici même, en accumulant des instantanés du produit courant.
import { reco, TECHS, type TechKey } from './personnalisateur/recommendation';
import { seedFromItem } from './personnalisateur/state';
import { getProfil, setProfil, type ProfilClient } from '../lib/profil-client';
import { catalogueColoris, coutBaseSupportUnique, getZoneImpressionCm, repartitionTaillesParDefaut, type Garment, type Emplacement } from '../config/parametres-metier';
import { LABELS_COUPE, LABELS_GENRE } from '../lib/produits-types';
import { grilleTarifaire, prixVente } from '../config/tarification';
import { COULEURS_OPTIONS, COUPES, GENRES, candidatsRef, qtyStep, palierPour } from './personnalisateur/catalogue-match';
import { siteConfig } from '../config/site';
import { initQuiz3d, updateQuiz3d } from './commencer-3d';
import type { TShirtCatalogue } from '../data/tshirts';

const GARMENT_LABELS: Record<Garment, string> = { tshirt: 'T-shirt', sweat: 'Sweat', chemise: 'Chemise', casquette: 'Casquette' };
const PLACES: Emplacement[] = ['face', 'coeur', 'dos', 'manche-droite', 'manche-gauche'];
const PLACE_LABEL: Record<Emplacement, string> = { face: 'Face', coeur: 'Cœur', dos: 'Dos', 'manche-droite': 'Manche droite', 'manche-gauche': 'Manche gauche' };

interface QuizState {
  profil: ProfilClient | null;
  garment: Garment;
  coupe: string | null;
  genre: string | null;
  color: { nom: string; hex: string };
  // Plusieurs emplacements à la fois (face + dos + manche...) — chacun se
  // chiffre comme un marquage à part, exactement comme dans le vrai
  // configurateur ("le recto-verso se chiffre comme deux marquages").
  places: Set<Emplacement>;
  couleurs: number | null;
  qty: number;
  selectedRef: string | null;
}

function nouveauProduit(): Omit<QuizState, 'profil'> {
  return {
    garment: 'tshirt',
    coupe: null,
    genre: null,
    color: catalogueColoris[0],
    places: new Set(['face']),
    couleurs: null,
    qty: 25,
    selectedRef: null,
  };
}

// Ajoute/retire un emplacement de la sélection (jamais en dessous d'un
// seul choisi).
function togglePlace(place: Emplacement): void {
  if (state.places.has(place)) {
    if (state.places.size > 1) state.places.delete(place);
    return;
  }
  state.places.add(place);
}

const state: QuizState = { profil: null, ...nouveauProduit() };
// Produits déjà validés dans cette session de quiz, en plus de celui en
// cours d'édition dans `state` — permet d'ajouter plusieurs produits sans
// repartir de zéro ni ouvrir un second outil.
const produits: QuizState[] = [];

type Screen = 'profil' | 'projet' | 'quantite' | 'resultat';
let order: Screen[] = ['profil', 'projet', 'quantite', 'resultat'];
let current = 0;
// Zone vers laquelle faire pivoter le modèle 3D au prochain render() —
// seulement quand un emplacement vient d'être ajouté (pas retiré), pour
// que le modèle montre bien la zone qu'on vient de choisir.
let pendingFocus: Emplacement | undefined;

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function pill(action: string, value: string, label: string, on: boolean, extra = ''): string {
  return `<button type="button" class="pill${on ? ' on' : ''}" data-action="${action}" data-value="${value}" ${extra}>${label}</button>`;
}

interface ProduitCalcule {
  techKey: TechKey;
  why: string;
  candidats: TShirtCatalogue[];
  ref: TShirtCatalogue | null;
  prixUnitaire: number;
  prixTotal: number;
}

// Calcul partagé entre l'écran résultat (produit courant) et le
// récapitulatif des produits déjà ajoutés — une seule logique de
// recommandation/tarification, jamais deux qui pourraient diverger.
function calcProduit(p: QuizState): ProduitCalcule {
  const r = reco(p.couleurs, p.qty);
  const styles = new Set<string>();
  if (p.coupe) styles.add(p.coupe);
  if (p.genre) styles.add(p.genre);
  const candidatsTous = p.garment === 'tshirt' ? candidatsRef(styles) : [];
  const candidats = candidatsTous.slice(0, 3);
  const ref = candidats.find((c) => c.slug === p.selectedRef) ?? candidats[0] ?? null;
  const palier = palierPour(p.qty);
  const coutBase = ref ? ref.baseCost : coutBaseSupportUnique;
  const prixUnitaire = Math.round(prixVente(coutBase, palier.marge) * 100) / 100;
  const prixTotal = Math.round(prixUnitaire * p.qty * 100) / 100;
  return { techKey: r.k, why: r.why, candidats, ref, prixUnitaire, prixTotal };
}

function screenProfil(): string {
  return `<div class="qzStep">
    <h2>Vous êtes…</h2>
    <p class="qzHint">Pour mieux vous accompagner — ce choix ne vous prive de rien : vous gardez accès à tous les outils du site, quelle que soit votre réponse.</p>
    <div class="qzChoices qzChoices-big">
      <button type="button" class="qzBig" data-action="set-profil" data-value="particulier"><span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path></svg></span>Un particulier</button>
      <button type="button" class="qzBig" data-action="set-profil" data-value="entreprise"><span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"></rect><path d="M9 21v-4h6v4"></path><path d="M8 7h1M8 11h1M15 7h1M15 11h1"></path></svg></span>Une structure</button>
    </div>
  </div>`;
}

function screenProjet(): string {
  return `<div class="qzStep">
    <h2>Votre projet</h2>
    <p class="qzHint">Question 1 sur 3 — le modèle 3D à droite reflète vos choix ; cliquez directement dessus pour choisir l'emplacement.</p>
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
    <div class="qzField">
      <span class="qzLabel">Emplacement du visuel <span class="qzOptional">plusieurs choix possibles</span></span>
      <div class="pills">${PLACES.map((p) => pill('toggle-place', p, `${PLACE_LABEL[p]} · ${getZoneImpressionCm(state.garment, p)} cm max`, state.places.has(p))).join('')}</div>
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

function produitMiniRow(p: QuizState, index: number): string {
  const c = calcProduit(p);
  return `<div class="qzMiniRow">
    <span class="qzMiniRow-sw" style="background:${p.color.hex}" aria-hidden="true"></span>
    <span class="qzMiniRow-name">${c.ref ? `${c.ref.brand} ${c.ref.model}` : GARMENT_LABELS[p.garment]} · ${p.qty} pièce${p.qty > 1 ? 's' : ''}</span>
    <span class="qzMiniRow-prix">${fmtPrice(c.prixTotal)}</span>
    <button type="button" class="qzMiniRow-remove" data-action="remove-produit" data-value="${index}" aria-label="Retirer ce produit">×</button>
  </div>`;
}

function screenResultat(): string {
  const c = calcProduit(state);
  const tech = TECHS[c.techKey];
  const palier = palierPour(state.qty);
  const grille = grilleTarifaire(c.ref ? c.ref.baseCost : coutBaseSupportUnique);

  if (!state.selectedRef || !c.candidats.some((x) => x.slug === state.selectedRef)) {
    state.selectedRef = c.candidats[0]?.slug ?? null;
  }

  const totalGeneral = produits.reduce((s, p) => s + calcProduit(p).prixTotal, 0) + c.prixTotal;

  return `<div class="qzStep qzStep-resultat">
    ${produits.length > 0 ? `<div class="qzMiniList">
      <span class="qzLabel">Déjà ajoutés (${produits.length})</span>
      ${produits.map((p, i) => produitMiniRow(p, i)).join('')}
    </div>` : ''}

    <span class="qzResultBadge">Votre recommandation</span>
    <h2>${tech.n}</h2>
    <p class="qzWhy">${c.why}</p>

    <div class="qzResultCard">
      <svg class="qzResultShirt" viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M148,54 L118,44 L52,92 L96,156 L122,136 L122,420 Q122,428 130,428 L270,428 Q278,428 278,420 L278,136 L304,156 L348,92 L282,44 L252,54 Q200,100 148,54 Z" fill="${state.color.hex}" stroke="var(--ligne)" stroke-width="6" />
      </svg>
      <div class="qzResultBody">
        <span class="qzResultRef">${c.ref ? `${c.ref.brand} ${c.ref.model}` : `${GARMENT_LABELS[state.garment]} · ${state.color.nom}`}</span>
        ${c.ref ? `<span class="qzResultMatiere">${c.ref.detail}</span>` : ''}
        <span class="qzResultPrix">${fmtPrice(c.prixUnitaire)} <span>/ pièce</span></span>
        <span class="qzResultTotal">Soit environ ${fmtPrice(c.prixTotal)} pour ${state.qty} pièce${state.qty > 1 ? 's' : ''}</span>
      </div>
    </div>

    ${c.candidats.length > 1 ? `<div class="qzField">
      <span class="qzLabel">Autres références possibles <span class="qzOptional">— composition, prix</span></span>
      <div class="refList">
        ${c.candidats.map((r) => `<button type="button" class="refRow${r.slug === state.selectedRef ? ' on' : ''}" data-action="select-ref" data-value="${r.slug}">
          <span class="refRow-name"><b>${r.brand}</b> ${r.model}<br /><span class="qzOptional">${r.detail}</span></span>
          <span class="refRow-meta">${r.grammage}</span>
          <span class="refRow-price">${fmtPrice(Math.round(prixVente(r.baseCost, palier.marge) * 100) / 100)} <span>/ pièce</span></span>
        </button>`).join('')}
      </div>
    </div>` : ''}

    ${c.candidats.length === 0 && state.garment === 'tshirt' ? `<p class="qzHint">Aucune référence ne correspond exactement à ces filtres — estimation générique ci-dessus. <a href="/produits/t-shirts">Voir tout le catalogue →</a></p>` : ''}

    <details class="qzGrille">
      <summary>Voir le prix par palier de quantité</summary>
      <div class="qzGrilleRows">
        ${grille.map((p) => `<div class="qzGrilleRow"><span>${p.label} pièces</span><b>${fmtPrice(p.prixUnitaire)}</b></div>`).join('')}
      </div>
    </details>

    ${produits.length > 0 ? `<div class="qzGrandTotal"><span>Total pour ${produits.length + 1} produits</span><b>${fmtPrice(totalGeneral)}</b></div>` : ''}

    <div class="qzResultActions">
      <button type="button" class="btn btn-outline" id="qzAddProduit">+ Ajouter un autre produit</button>
      <button type="button" class="btn" id="qzGo3d">Configurer ce projet en 3D</button>
      <button type="button" class="btn btn-outline" id="qzGoDevis">Demander un devis${produits.length > 0 ? ' pour tout' : ''}</button>
    </div>
  </div>`;
}

function resumeMail(): string {
  const tous = [...produits, state];
  const lignes = tous.map((p, i) => {
    const c = calcProduit(p);
    return `Produit ${i + 1} — ${c.ref ? `${c.ref.brand} ${c.ref.model}` : GARMENT_LABELS[p.garment]} (${TECHS[c.techKey].n})
- Coloris : ${p.color.nom}
- Emplacement${p.places.size > 1 ? 's' : ''} : ${[...p.places].map((pl) => PLACE_LABEL[pl]).join(', ')}
- Quantité : ${p.qty} pièce${p.qty > 1 ? 's' : ''}
- Sous-total estimé : ${fmtPrice(c.prixTotal)}`;
  });
  const total = tous.reduce((s, p) => s + calcProduit(p).prixTotal, 0);
  return `Bonjour,\n\nSuite au quiz sur presstee.fr, je souhaite un devis pour le projet suivant :\n\n${lignes.join('\n\n')}\n\nTotal estimé : ${fmtPrice(total)}.\n\nMerci de me recontacter pour finaliser ce devis.`;
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

  // Le modèle 3D n'accompagne que la question "projet" (support, coloris,
  // emplacement) — pas les autres écrans, qui n'ont rien à y montrer.
  el('qzLayout').classList.toggle('has3d', screen === 'projet');
  if (screen === 'projet') updateQuiz3d(state.color.hex, state.places, pendingFocus);
  pendingFocus = undefined;

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
        place: [...state.places][0],
      });
      window.location.href = '/personnaliser?mode=3d';
    });
    el('qzAddProduit').addEventListener('click', () => {
      produits.push({ ...state, color: { ...state.color }, places: new Set(state.places) });
      Object.assign(state, nouveauProduit());
      current = order.indexOf('projet');
      render();
      window.scrollTo({ top: el('qzLayout').getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
    });
    el('qzGoDevis').addEventListener('click', () => {
      const url = `mailto:${siteConfig.email}?subject=${encodeURIComponent('Demande de devis — quiz presstee.fr')}&body=${encodeURIComponent(resumeMail())}`;
      window.location.href = url;
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

  void initQuiz3d((place) => {
    togglePlace(place);
    pendingFocus = place;
    render();
  });

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
      case 'toggle-place':
        togglePlace(value as Emplacement);
        pendingFocus = value as Emplacement;
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
      case 'remove-produit':
        produits.splice(+value, 1);
        break;
    }
    render();
  });

  el('qzPrev').addEventListener('click', () => goTo(-1));
  el('qzNext').addEventListener('click', () => goTo(1));

  render();
}
