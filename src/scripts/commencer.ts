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
import { emplacementsValides } from './personnalisateur/garments';
import { catalogueColoris, coutBaseSupportUnique, getZoneImpressionCm, repartitionTaillesParDefaut, TAILLES, PLACE_LABEL, type Garment, type Emplacement, type TailleCode } from '../config/parametres-metier';
import { LABELS_COUPE, LABELS_GENRE } from '../lib/produits-types';
import { grilleTarifaire, prixVente } from '../config/tarification';
import { COULEURS_OPTIONS, COUPES, GENRES, candidatsRef, qtyStep, palierPour } from './personnalisateur/catalogue-match';
import { setDemandeBrief } from '../lib/demande-brief';
import { initQuiz3d, updateQuiz3d } from './commencer-3d';
import type { TShirtCatalogue } from '../data/tshirts';

const GARMENT_LABELS: Record<Garment, string> = { tshirt: 'T-shirt', sweat: 'Sweat', chemise: 'Chemise', polo: 'Polo', casquette: 'Casquette' };

interface VisuelImporte {
  dataUrl: string;
  fileName: string;
  vector: boolean;
  natW: number;
  natH: number;
  // Nombre de couleurs de CE visuel précis — demandé au moment de
  // l'import plutôt que via la question générale "Nombre de couleurs du
  // visuel" (Milio, 2026-09-09 : avoir un vrai fichier ET répondre "je ne
  // sais pas" au nombre de couleurs n'a pas de sens, les deux se
  // contredisent). Nul tant que l'utilisateur n'a pas encore répondu.
  colors: number | null;
}

// Un coloris de textile et la quantité commandée dans ce coloris — un
// produit peut cumuler plusieurs lots (Milio, 2026-09-09 : « il faut que
// tu acceptes plusieurs coloris de textile, configurables par coloris »).
// La technique et le prix à la pièce restent uniques pour le produit (même
// marquage, seul le tissu change de teinte) ; seul le nombre de pièces
// varie d'un lot à l'autre.
interface ColorLot {
  color: { nom: string; hex: string };
  qty: number;
}

interface QuizState {
  garment: Garment;
  coupe: string | null;
  genre: string | null;
  colorLots: ColorLot[];
  // Coloris actuellement affiché sur le modèle 3D — le dernier touché,
  // pas toujours colorLots[0] : sans ça, choisir un 2e ou 3e coloris ne
  // se voyait jamais sur le modèle, toujours figé sur le premier ajouté
  // (Milio, 2026-09-09 : « pouvoir voir le rendu de la couleur du
  // textile dès l'étape 1 »).
  previewHex: string;
  // Plusieurs emplacements à la fois (face + dos + manche...) — chacun se
  // chiffre comme un marquage à part, exactement comme dans le vrai
  // configurateur ("le recto-verso se chiffre comme deux marquages").
  places: Set<Emplacement>;
  couleurs: number | null;
  selectedRef: string | null;
  // Un visuel importé par emplacement choisi (facultatif — sans fichier,
  // le nombre de couleurs saisi juste au-dessus nourrit quand même la
  // recommandation, notre équipe accompagne la création).
  visuels: Partial<Record<Emplacement, VisuelImporte>>;
}

const REPARTITION_TOTAL = TAILLES.reduce((s, t) => s + repartitionTaillesParDefaut[t], 0);

// Adapte la répartition par défaut (qui totalise 30) à la quantité
// réellement choisie dans le quiz, sinon la quantité affichée et
// chiffrée pendant le quiz (ex. 250 pièces) disparaissait silencieusement
// une fois dans le configurateur — repartitionTaillesParDefaut y reprend
// toujours le dessus (30 pièces), quel que soit ce qui a été demandé.
function sizeDistForQty(qty: number): Record<TailleCode, number> {
  const ratio = qty / REPARTITION_TOTAL;
  const dist = {} as Record<TailleCode, number>;
  let attribue = 0;
  for (const t of TAILLES) {
    dist[t] = Math.round(repartitionTaillesParDefaut[t] * ratio);
    attribue += dist[t];
  }
  // Le rounding par taille peut légèrement dériver du total demandé —
  // on rattrape l'écart sur "M", la taille la plus représentée par défaut.
  dist.M = Math.max(0, dist.M + (qty - attribue));
  return dist;
}

function qtyTotal(p: QuizState): number {
  return p.colorLots.reduce((s, l) => s + l.qty, 0);
}

// Coloris "principal" d'un produit — utilisé partout où un seul aperçu
// suffit (silhouette du résultat, pastille du récap) : le premier lot
// choisi, dans l'ordre où il a été ajouté.
function primaryColor(p: QuizState): { nom: string; hex: string } {
  return p.colorLots[0].color;
}

// Lien vers /produits/t-shirts pré-filtré sur les mêmes critères que le
// quiz (Milio, 2026-09-09 : « une possibilité de voir les autres
// textiles qui correspondent au filtre ») — même mécanisme de filtre que
// la page catalogue elle-même, pas de logique de filtrage dupliquée ici.
function catalogueFilterUrl(p: QuizState): string {
  const params = new URLSearchParams();
  if (p.coupe) params.set('coupe', p.coupe);
  if (p.genre) params.set('genre', p.genre);
  const qs = params.toString();
  return `/produits/t-shirts${qs ? `?${qs}` : ''}`;
}

// Nombre de couleurs à retenir pour la recommandation de technique — dès
// qu'au moins un visuel est importé, sa propre réponse fait foi (sommée
// entre emplacements, comme totalColors() dans le vrai configurateur :
// chaque emplacement se calage/coloris indépendamment). La question
// générale "Nombre de couleurs du visuel" ne sert plus qu'en l'absence de
// tout fichier — dès qu'un fichier existe, elle disparaît de l'écran
// (cf. screenQuantite) pour ne jamais laisser co-exister un fichier réel
// et un "je ne sais pas" qui le contredirait.
function effectiveColors(p: QuizState): number | null {
  const visuels = Object.values(p.visuels).filter((v): v is VisuelImporte => !!v);
  if (visuels.length === 0) return p.couleurs;
  return visuels.reduce((s, v) => s + (v.colors ?? 1), 0);
}

function nouveauProduit(): QuizState {
  return {
    garment: 'tshirt',
    coupe: null,
    genre: null,
    colorLots: [{ color: catalogueColoris[0], qty: 25 }],
    previewHex: catalogueColoris[0].hex,
    places: new Set(['face']),
    couleurs: null,
    selectedRef: null,
    visuels: {},
  };
}

// Ajoute/retire un emplacement de la sélection (jamais en dessous d'un
// seul choisi). Retirer un emplacement efface aussi le visuel importé
// pour cette zone — sans ça, la ligne d'import disparaît de l'écran 2
// (filtrée sur les emplacements choisis) mais le fichier restait quand
// même envoyé comme calque au configurateur, une zone qu'on venait
// pourtant de désélectionner.
function togglePlace(place: Emplacement): void {
  if (state.places.has(place)) {
    if (state.places.size > 1) {
      state.places.delete(place);
      delete state.visuels[place];
    }
    return;
  }
  state.places.add(place);
  maybeShowCombo();
}

// Ajoute/retire un coloris de la sélection (jamais en dessous d'un seul
// choisi) — nouveau lot à 25 pièces par défaut, aligné sur la quantité de
// départ d'un produit.
function toggleColor(hex: string): void {
  const idx = state.colorLots.findIndex((l) => l.color.hex === hex);
  if (idx >= 0) {
    if (state.colorLots.length > 1) {
      state.colorLots.splice(idx, 1);
      state.previewHex = state.colorLots[0].color.hex;
    }
    return;
  }
  const color = catalogueColoris.find((c) => c.hex === hex);
  if (color) {
    state.colorLots.push({ color, qty: 25 });
    state.previewHex = hex;
  }
}

const state: QuizState = nouveauProduit();
// Produits déjà validés dans cette session de quiz, en plus de celui en
// cours d'édition dans `state` — permet d'ajouter plusieurs produits sans
// repartir de zéro ni ouvrir un second outil.
const produits: QuizState[] = [];

type Screen = 'projet' | 'quantite' | 'resultat';
const order: Screen[] = ['projet', 'quantite', 'resultat'];
let current = 0;
// Zone vers laquelle faire pivoter le modèle 3D au prochain render() —
// posé à chaque clic sur une pastille d'emplacement (ajout ou retrait) :
// on montre toujours la zone qu'on vient de toucher, qu'elle finisse
// sélectionnée ou non, plutôt que de laisser la caméra sur une zone
// qu'on ne regarde plus.
let pendingFocus: Emplacement | undefined;

// Petit clin d'œil ponctuel (pas de système à points) quand tous les
// emplacements disponibles pour le vêtement courant sont sélectionnés à
// la fois — se réarme si on redescend en dessous, pour rejouer si on
// atteint la combinaison complète une seconde fois plus tard.
let comboShown = false;
function maybeShowCombo(): void {
  const max = emplacementsValides(state.garment).length;
  if (max <= 1) return;
  if (state.places.size >= max) {
    if (!comboShown) {
      comboShown = true;
      showToast('✦ Combo complet — tous les emplacements sélectionnés');
    }
  } else {
    comboShown = false;
  }
}

function showToast(text: string): void {
  const toast = document.createElement('div');
  toast.className = 'eggToast';
  toast.textContent = text;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => toast.classList.remove('show'), 2200);
  window.setTimeout(() => toast.remove(), 2700);
}

// Clin d'œil : franchir un palier tarifaire en augmentant la quantité
// (Milio, 2026-09-09, menu d'easter eggs validé) — se base sur le vrai
// palier (palierPour) plutôt qu'un chiffre rond arbitraire, et peut se
// redéclencher à chaque nouveau palier atteint dans la même session.
function checkPalierEgg(before: number, after: number): void {
  if (after <= before) return;
  if (palierPour(after).label !== palierPour(before).label) {
    showToast('Palier suivant débloqué.');
  }
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function pill(action: string, value: string, label: string, on: boolean, extra = ''): string {
  return `<button type="button" class="pill${on ? ' on' : ''}" data-action="${action}" data-value="${value}" aria-pressed="${on}" ${extra}>${label}</button>`;
}

interface ProduitCalcule {
  techKey: TechKey;
  why: string;
  candidats: TShirtCatalogue[];
  ref: TShirtCatalogue | null;
  prixUnitaire: number;
  prixTotal: number;
  qty: number;
}

// Calcul partagé entre l'écran résultat (produit courant) et le
// récapitulatif des produits déjà ajoutés — une seule logique de
// recommandation/tarification, jamais deux qui pourraient diverger. Le
// palier de prix se calcule sur le total toutes couleurs confondues (même
// technique, même référence, un seul calage quel que soit le nombre de
// teintes de tissu commandées).
function calcProduit(p: QuizState): ProduitCalcule {
  const qty = qtyTotal(p);
  const r = reco(effectiveColors(p), qty);
  const styles = new Set<string>();
  if (p.coupe) styles.add(p.coupe);
  if (p.genre) styles.add(p.genre);
  const candidatsTous = p.garment === 'tshirt' ? candidatsRef(styles) : [];
  const candidats = candidatsTous.slice(0, 3);
  const ref = candidats.find((c) => c.slug === p.selectedRef) ?? candidats[0] ?? null;
  const palier = palierPour(qty);
  const coutBase = ref ? ref.baseCost : coutBaseSupportUnique;
  const prixUnitaire = Math.round(prixVente(coutBase, palier.marge) * 100) / 100;
  const prixTotal = Math.round(prixUnitaire * qty * 100) / 100;
  return { techKey: r.k, why: r.why, candidats, ref, prixUnitaire, prixTotal, qty };
}

function screenProjet(): string {
  const placesDispo = emplacementsValides(state.garment);
  return `<div class="qzStep">
    <h2>Votre projet</h2>
    <p class="qzHint">Question 1 sur 3.${produits.length === 0 ? ' Besoin de plusieurs produits ? Vous pourrez en ajouter d\'autres à la fin.' : ''}</p>
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
      <span class="qzLabel">Coloris du textile <span class="qzOptional">plusieurs choix possibles</span></span>
      <div class="swatches">${catalogueColoris.map((c) => {
        const on = state.colorLots.some((l) => l.color.hex === c.hex);
        return `<button type="button" class="sw${on ? ' on' : ''}" data-action="toggle-color" data-value="${c.hex}" style="background:${c.hex}" aria-label="${c.nom}" aria-pressed="${on}"></button>`;
      }).join('')}</div>
    </div>
    <div class="qzField">
      <span class="qzLabel">Emplacement du visuel <span class="qzOptional">plusieurs choix possibles</span></span>
      <div class="pills">${placesDispo.map((p) => pill('toggle-place', p, `${PLACE_LABEL[p]} · ${getZoneImpressionCm(state.garment, p)} cm max`, state.places.has(p))).join('')}</div>
    </div>
  </div>`;
}

// Sans l'option "Je ne sais pas" : une fois un vrai fichier déposé, la
// question doit avoir une réponse plutôt que de rester compatible avec
// un "je ne sais pas" qui contredirait le fichier fourni.
const COULEURS_OPTIONS_FICHIER = COULEURS_OPTIONS.filter((o) => o.value != null);

function visuelRowHtml(place: Emplacement): string {
  const v = state.visuels[place];
  if (v) {
    return `<div class="qzVisuelRow qzVisuelRow-filled">
      <img class="qzVisuelRow-thumb" src="${v.dataUrl}" alt="" />
      <span class="qzVisuelRow-place">${PLACE_LABEL[place]}</span>
      <span class="qzVisuelRow-name">${v.fileName}</span>
      <button type="button" class="qzVisuelRow-remove" data-action="remove-visuel" data-value="${place}" aria-label="Retirer ce visuel">×</button>
    </div>
    <div class="qzVisuelColors">
      <span class="qzVisuelColors-label">Couleurs de ce visuel</span>
      <div class="pills pills-sm">${COULEURS_OPTIONS_FICHIER.map((o) => `<button type="button" class="pill${v.colors === o.value ? ' on' : ''}" data-action="set-visuel-couleurs" data-value="${place}:${o.value}" aria-pressed="${v.colors === o.value}">${o.label}</button>`).join('')}</div>
    </div>`;
  }
  return `<label class="qzVisuelRow qzVisuelRow-empty">
    <span class="qzVisuelRow-place">${PLACE_LABEL[place]}</span>
    <span class="qzVisuelRow-upload">+ Importer un fichier</span>
    <input type="file" class="qzVisuelFile" data-place="${place}" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden />
  </label>`;
}

function colorQtyRowHtml(lot: ColorLot): string {
  return `<div class="qzColorQtyRow">
    <span class="qzColorQtyRow-sw" style="background:${lot.color.hex}" aria-hidden="true"></span>
    <span class="qzColorQtyRow-name">${lot.color.nom}</span>
    <div class="qtyStepper qtyStepper-sm">
      <button type="button" class="btn-icon" data-action="qty-step-color" data-value="${lot.color.hex}" data-delta="-1" aria-label="Diminuer la quantité en ${lot.color.nom}">−</button>
      <span class="qtyStepper-val">${lot.qty} pièce${lot.qty > 1 ? 's' : ''}</span>
      <button type="button" class="btn-icon" data-action="qty-step-color" data-value="${lot.color.hex}" data-delta="1" aria-label="Augmenter la quantité en ${lot.color.nom}">+</button>
    </div>
  </div>`;
}

function screenQuantite(): string {
  const total = qtyTotal(state);
  const hasVisuels = Object.keys(state.visuels).length > 0;
  return `<div class="qzStep">
    <h2>Quantité et visuel</h2>
    <p class="qzHint">Question 2 sur 3 — combien de pièces dans chaque coloris choisi, et votre visuel par emplacement</p>
    <div class="qzField">
      <span class="qzLabel">Quantité par coloris</span>
      <div class="qzColorQtyList">${state.colorLots.map(colorQtyRowHtml).join('')}</div>
      ${state.colorLots.length > 1 ? `<p class="qzHint" style="margin:8px 0 0">Total : ${total} pièce${total > 1 ? 's' : ''}</p>` : ''}
    </div>
    ${hasVisuels ? '' : `<div class="qzField">
      <span class="qzLabel">Nombre de couleurs du visuel</span>
      <div class="pills">${COULEURS_OPTIONS.map((o) => pill('set-couleurs', o.value == null ? '' : String(o.value), o.label, state.couleurs === o.value)).join('')}</div>
    </div>`}
    <div class="qzField">
      <span class="qzLabel">Votre visuel <span class="qzOptional">par emplacement choisi, facultatif</span></span>
      <div class="qzVisuelList">${[...state.places].map((p) => visuelRowHtml(p)).join('')}</div>
      <p class="qzHint" style="margin:8px 0 0">${hasVisuels ? 'Chaque visuel importé demande son propre nombre de couleurs, juste au-dessus de son emplacement.' : 'Pas encore de fichier ? Pas de souci, nous vous accompagnons pour le créer — ça ne bloque pas votre commande.'}</p>
    </div>
  </div>`;
}

function produitMiniRow(p: QuizState, index: number): string {
  const c = calcProduit(p);
  const nbVisuels = Object.keys(p.visuels).length;
  const colorsLabel = p.colorLots.length > 1 ? `${p.colorLots.length} coloris` : p.colorLots[0].color.nom;
  return `<div class="qzMiniRow">
    <div class="qzMiniRow-head">
      <span class="qzMiniRow-sw" style="background:${primaryColor(p).hex}" aria-hidden="true"></span>
      <span class="qzMiniRow-name">${c.ref ? `${c.ref.brand} ${c.ref.model}` : GARMENT_LABELS[p.garment]}</span>
      <span class="qzMiniRow-prix">${fmtPrice(c.prixTotal)}</span>
      <button type="button" class="qzMiniRow-remove" data-action="remove-produit" data-value="${index}" aria-label="Retirer ce produit">×</button>
    </div>
    <div class="qzMiniRow-details">${colorsLabel} · ${c.qty} pièce${c.qty > 1 ? 's' : ''} · ${[...p.places].map((pl) => PLACE_LABEL[pl]).join(', ')} · ${nbVisuels ? `${nbVisuels} visuel${nbVisuels > 1 ? 's' : ''} importé${nbVisuels > 1 ? 's' : ''}` : 'visuel à définir'}</div>
  </div>`;
}

// Rappel persistant des produits déjà ajoutés — affiché en haut de
// chaque écran dès qu'on a commencé un 2e produit (pas seulement sur le
// résultat final), pour ne jamais perdre de vue le détail (quantité,
// couleur, emplacements, visuel) de ce qui est déjà pris en compte.
function dejaAjoutesHtml(): string {
  if (produits.length === 0) return '';
  return `<div class="qzMiniList">
    <span class="qzLabel">Déjà ajouté${produits.length > 1 ? 's' : ''} (${produits.length})</span>
    ${produits.map((p, i) => produitMiniRow(p, i)).join('')}
  </div>`;
}

function screenResultat(): string {
  const c = calcProduit(state);
  const tech = TECHS[c.techKey];
  const palier = palierPour(c.qty);
  const grille = grilleTarifaire(c.ref ? c.ref.baseCost : coutBaseSupportUnique);
  const primaire = primaryColor(state);
  const nbCouleurs = effectiveColors(state);

  if (!state.selectedRef || !c.candidats.some((x) => x.slug === state.selectedRef)) {
    state.selectedRef = c.candidats[0]?.slug ?? null;
  }

  const totalGeneral = produits.reduce((s, p) => s + calcProduit(p).prixTotal, 0) + c.prixTotal;

  // Le produit passe devant la technique (Milio, 2026-09-15 : « recommande
  // le t-shirt en premier ») — la technique de marquage reste conseillée
  // juste en dessous, mais en retrait (petit label + texte, plus de gros
  // titre ni de badge) pour ne pas perdre le client dans deux
  // recommandations mises sur le même plan.
  return `<div class="qzStep qzStep-resultat">
    <span class="qzResultBadge">Votre recommandation</span>
    <h2>${c.ref ? `${c.ref.brand} ${c.ref.model}` : `${GARMENT_LABELS[state.garment]} · ${primaire.nom}`}</h2>

    <div class="qzResultCard">
      <svg class="qzResultShirt" viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M148,54 L118,44 L52,92 L96,156 L122,136 L122,420 Q122,428 130,428 L270,428 Q278,428 278,420 L278,136 L304,156 L348,92 L282,44 L252,54 Q200,100 148,54 Z" fill="${primaire.hex}" stroke="var(--ligne)" stroke-width="6" />
      </svg>
      <div class="qzResultBody">
        <span class="qzResultPrix">${fmtPrice(c.prixUnitaire)} <span>/ pièce</span></span>
        <span class="qzResultTotal">Soit environ ${fmtPrice(c.prixTotal)} pour ${c.qty} pièce${c.qty > 1 ? 's' : ''}</span>
        <div class="qzResultSpecs">
          ${c.ref ? `<span><b>Grammage</b> ${c.ref.grammage}</span>` : ''}
          ${c.ref ? (/^composition/i.test(c.ref.detail) ? `<span>${c.ref.detail}</span>` : `<span><b>Composition</b> ${c.ref.detail}</span>`) : ''}
          <span><b>Couleurs du visuel</b> ${nbCouleurs != null ? nbCouleurs : 'à définir'}</span>
        </div>
      </div>
    </div>

    <details class="qzGrille">
      <summary>Prix par palier de quantité</summary>
      <div class="qzGrilleRows">
        ${grille.map((p) => `<div class="qzGrilleRow"><span>${p.label} pièces</span><b>${fmtPrice(p.prixUnitaire)}</b></div>`).join('')}
      </div>
    </details>

    ${state.colorLots.length > 1 ? `<div class="qzColorBreakdown">${state.colorLots.map((l) => `<span><span class="qzColorBreakdown-sw" style="background:${l.color.hex}"></span>${l.color.nom} × ${l.qty}</span>`).join('')}</div>` : ''}

    ${c.candidats.length > 0 ? `<div class="qzField">
      <div class="qzRefHead">
        <span class="qzLabel">Références conseillées</span>
        ${c.candidats.length > 1 ? `<button type="button" class="qzCompareBtn" id="qzCompareOpen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="18" rx="1.5" /><rect x="14" y="3" width="7" height="12" rx="1.5" /></svg>
          Comparer
        </button>` : ''}
      </div>
      <div class="refList">
        ${c.candidats.map((r) => `<button type="button" class="refRow${r.slug === state.selectedRef ? ' on' : ''}" data-action="select-ref" data-value="${r.slug}">
          <span class="refRow-name"><b>${r.brand}</b> ${r.model}<br /><span class="qzOptional">${r.grammage} · ${r.detail}</span></span>
          <span class="refRow-price">${fmtPrice(Math.round(prixVente(r.baseCost, palier.marge) * 100) / 100)} <span>/ pièce</span></span>
        </button>`).join('')}
      </div>
    </div>` : ''}

    ${c.candidats.length === 0 && state.garment === 'tshirt' ? `<p class="qzHint">Aucune référence ne correspond exactement à ces filtres — estimation générique ci-dessus. <a href="${catalogueFilterUrl(state)}">Voir le catalogue filtré →</a></p>` : ''}
    ${c.candidats.length > 0 && state.garment === 'tshirt' ? `<p class="qzHint"><a href="${catalogueFilterUrl(state)}">Voir plus de t-shirts qui correspondent →</a></p>` : ''}

    ${c.candidats.length > 1 ? `<div class="comparemodal" id="qzCompareModal">
      <div class="comparemodal-inner">
        <button type="button" class="comparemodal-close" id="qzCompareClose" aria-label="Fermer">×</button>
        <h3>Comparer les références</h3>
        <div class="comparemodal-scroll">
          <table id="compareTable">
            <thead><tr><th></th>${c.candidats.map((r) => `<th>${r.brand}<br />${r.model}</th>`).join('')}</tr></thead>
            <tbody>
              <tr><th scope="row">Grammage</th>${c.candidats.map((r) => `<td>${r.grammage}</td>`).join('')}</tr>
              <tr><th scope="row">Composition</th>${c.candidats.map((r) => `<td>${r.detail}</td>`).join('')}</tr>
              <tr><th scope="row">Prix / pièce</th>${c.candidats.map((r) => `<td><b>${fmtPrice(Math.round(prixVente(r.baseCost, palier.marge) * 100) / 100)}</b></td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>` : ''}

    <div class="qzTechNote">
      <span class="qzLabel">Technique de marquage conseillée</span>
      <p><b>${tech.n}</b> — ${c.why}</p>
    </div>

    ${produits.length > 0 ? `<div class="qzGrandTotal"><span>Total pour ${produits.length + 1} produits</span><b>${fmtPrice(totalGeneral)}</b></div>` : ''}

    <div class="qzResultActions">
      <button type="button" class="btn btn-outline" id="qzAddProduit">+ Ajouter un autre produit</button>
      <button type="button" class="btn" id="qzGo3d">Configurer ce projet en 3D</button>
      <button type="button" class="btn btn-outline" id="qzGoDevis">Demander un devis${produits.length > 0 ? ' pour tout' : ''}</button>
    </div>
  </div>`;
}

// Brief affiché sur /demande-devis (Milio, 2026-09-09) — juste les
// lignes du projet, sans formule de politesse : la page compose son
// propre message final avec ce brief, les précisions éventuelles, la
// référence de bon de commande et la date souhaitée.
function briefText(): string {
  const tous = [...produits, state];
  const lignes = tous.map((p, i) => {
    const c = calcProduit(p);
    const nbVisuels = Object.keys(p.visuels).length;
    const filtres = [p.coupe ? LABELS_COUPE[p.coupe as keyof typeof LABELS_COUPE] : null, p.genre ? LABELS_GENRE[p.genre as keyof typeof LABELS_GENRE] : null].filter((f): f is string => !!f);
    return `Produit ${i + 1} — ${c.ref ? `${c.ref.brand} ${c.ref.model}` : GARMENT_LABELS[p.garment]} (${TECHS[c.techKey].n})
- Textile : ${GARMENT_LABELS[p.garment]}${filtres.length ? ` · ${filtres.join(' · ')}` : ''}
- Coloris : ${p.colorLots.map((l) => `${l.color.nom} (${l.qty} pièce${l.qty > 1 ? 's' : ''})`).join(', ')}
- Emplacement${p.places.size > 1 ? 's' : ''} : ${[...p.places].map((pl) => PLACE_LABEL[pl]).join(', ')}
- Visuel : ${nbVisuels ? `${nbVisuels} fichier${nbVisuels > 1 ? 's' : ''} joint${nbVisuels > 1 ? 's' : ''} (à télécharger et joindre ci-dessus)` : 'pas encore fourni — accompagnement souhaité'}
- Quantité totale : ${c.qty} pièce${c.qty > 1 ? 's' : ''}
- Sous-total estimé : ${fmtPrice(c.prixTotal)}`;
  });
  const total = tous.reduce((s, p) => s + calcProduit(p).prixTotal, 0);
  return `${lignes.join('\n\n')}\n\nTotal estimé : ${fmtPrice(total)}.`;
}

// Visuels déposés dans le quiz, à proposer en téléchargement sur
// /demande-devis (Milio, 2026-09-09 : « ses designs joints »).
function briefVisuels(): { fileName: string; dataUrl: string }[] {
  const tous = [...produits, state];
  return tous.flatMap((p) => Object.values(p.visuels).filter((v): v is VisuelImporte => !!v).map((v) => ({ fileName: v.fileName, dataUrl: v.dataUrl })));
}

function render(): void {
  const screen = order[current];
  const screenHtml =
    screen === 'projet' ? screenProjet() :
    screen === 'quantite' ? screenQuantite() :
    screenResultat();
  el('qzScreen').innerHTML = dejaAjoutesHtml() + screenHtml;

  const dots = el('qzProgress');
  const visibleSteps: Screen[] = ['projet', 'quantite', 'resultat'];
  dots.innerHTML = visibleSteps.map((s) => `<span class="qzDot${order[current] === s ? ' on' : ''}${visibleSteps.indexOf(order[current] as Screen) > visibleSteps.indexOf(s) ? ' done' : ''}"></span>`).join('');

  el('qzNav').style.display = screen === 'projet' || screen === 'quantite' ? 'flex' : 'none';
  el<HTMLButtonElement>('qzPrev').disabled = current === 0;
  el<HTMLButtonElement>('qzNext').textContent = screen === 'quantite' ? 'Voir ma recommandation' : 'Suivant';

  // Le modèle 3D n'accompagne que la question "projet" (support, coloris,
  // emplacement) — pas les autres écrans, qui n'ont rien à y montrer.
  el('qzLayout').classList.toggle('has3d', screen === 'projet');
  if (screen === 'projet') updateQuiz3d(state.previewHex, state.places, state.garment, pendingFocus);
  pendingFocus = undefined;

  if (screen === 'resultat') {
    // Les 3 références restent toujours affichées (Milio, 2026-09-15 :
    // « toujours présenter les trois t-shirts, pas mettre qu'un seul » —
    // revient sur le comparateur replié par défaut d'un précédent essai) ;
    // le bouton "Comparer" ouvre juste le détail côte à côte, même
    // principe que le comparateur de /produits/t-shirts (produits.css).
    document.getElementById('qzCompareOpen')?.addEventListener('click', () => {
      document.getElementById('qzCompareModal')?.classList.add('open');
    });
    document.getElementById('qzCompareClose')?.addEventListener('click', () => {
      document.getElementById('qzCompareModal')?.classList.remove('open');
    });
    document.getElementById('qzCompareModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove('open');
    });
    el('qzGo3d').addEventListener('click', () => {
      // Un calque réel par visuel importé (un par emplacement), sinon le
      // configurateur démarre à vide sur l'emplacement choisi — dans les
      // deux cas, ne jamais perdre ce qui a été renseigné dans le quiz.
      const layers = Object.entries(state.visuels).map(([place, v], i) => ({
        id: `q${Date.now().toString(36)}${i}`,
        place: place as Emplacement,
        img: v.dataUrl,
        fileName: v.fileName,
        vector: v.vector,
        knownColor: null,
        natW: v.natW,
        natH: v.natH,
        colors: null,
        dom: null,
        colorSwatches: null,
        x: 0.5,
        y: 0.5,
        w: 0.78,
        rot: 0,
      }));
      const c = calcProduit(state);
      seedFromItem({
        garment: state.garment,
        // Chaque coloris choisi dans le quiz garde sa propre quantité,
        // répartie en tailles indépendamment des autres (Milio,
        // 2026-09-09 : « régler précisément la répartition des tailles
        // selon le coloris »).
        colorLots: state.colorLots.map((lot) => ({ color: lot.color, sizeDist: sizeDistForQty(lot.qty) })),
        layers,
        tech: 'auto',
        delai: 'standard',
        designHelp: { colors: state.couleurs, format: '', notes: '' },
        place: [...state.places][0],
        // Coût réel de la référence retenue plutôt que le coût générique du
        // configurateur, pour que le prix ne change pas en changeant de page
        // (Milio, 2026-09-09 : « le prix, il faut qu'il soit le même partout »).
        coutBase: c.ref ? c.ref.baseCost : coutBaseSupportUnique,
      });
      window.location.href = '/personnaliser';
    });
    el('qzAddProduit').addEventListener('click', () => {
      produits.push({ ...state, colorLots: state.colorLots.map((l) => ({ ...l })), places: new Set(state.places), visuels: { ...state.visuels } });
      Object.assign(state, nouveauProduit());
      comboShown = false;
      current = order.indexOf('projet');
      render();
      window.scrollTo({ top: el('qzLayout').getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
    });
    el('qzGoDevis').addEventListener('click', () => {
      setDemandeBrief(briefText(), briefVisuels());
      window.location.href = '/demande-devis';
    });
  }
}

function goTo(delta: number): void {
  current = Math.max(0, Math.min(order.length - 1, current + delta));
  render();
}

export function initCommencer(): void {
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
      case 'set-garment': {
        state.garment = value as Garment;
        // Un changement de vêtement peut rendre certains emplacements déjà
        // choisis impossibles (ex. "Cœur" sur une casquette) — on les
        // retire, avec leur visuel importé, plutôt que de les garder
        // sélectionnés sans effet (Milio, 2026-09-09 : « si c'est une
        // casquette, il ne faut pas mettre cœur »).
        const valides = new Set(emplacementsValides(state.garment));
        for (const p of [...state.places]) {
          if (!valides.has(p)) {
            state.places.delete(p);
            delete state.visuels[p];
          }
        }
        if (state.places.size === 0) state.places.add(valides.values().next().value as Emplacement);
        comboShown = false;
        break;
      }
      case 'set-coupe':
        state.coupe = state.coupe === value ? null : value;
        break;
      case 'set-genre':
        state.genre = state.genre === value ? null : value;
        break;
      case 'toggle-color':
        toggleColor(value);
        break;
      case 'toggle-place':
        togglePlace(value as Emplacement);
        pendingFocus = value as Emplacement;
        break;
      case 'set-couleurs':
        state.couleurs = value === '' ? null : +value;
        break;
      case 'qty-step-color': {
        const lot = state.colorLots.find((l) => l.color.hex === value);
        if (lot) {
          const before = qtyTotal(state);
          const delta = +b.dataset.delta! * qtyStep(lot.qty);
          lot.qty = Math.max(1, Math.min(2000, lot.qty + delta));
          checkPalierEgg(before, qtyTotal(state));
        }
        break;
      }
      case 'select-ref':
        state.selectedRef = value;
        break;
      case 'remove-produit':
        produits.splice(+value, 1);
        break;
      case 'remove-visuel':
        delete state.visuels[value as Emplacement];
        break;
      case 'set-visuel-couleurs': {
        const [place, colorsStr] = value.split(':');
        const v = state.visuels[place as Emplacement];
        if (v) v.colors = +colorsStr;
        break;
      }
    }
    render();
  });

  // Import de fichier — délégation sur "change" (pas "click", géré
  // nativement par le <label> qui enveloppe chaque <input type=file>) :
  // lit l'image pour connaître ses dimensions réelles avant de l'enrôler
  // comme calque, comme le fait le vrai configurateur au dépôt d'un
  // fichier (file-input.ts).
  el('qzScreen').addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches('.qzVisuelFile')) return;
    const file = input.files?.[0];
    const place = input.dataset.place as Emplacement;
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      showToast(`Impossible de lire « ${file.name} » — réessayez ou choisissez un autre fichier.`);
    };
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const vector = file.type === 'image/svg+xml';
      if (vector) {
        state.visuels[place] = { dataUrl, fileName: file.name, vector, natW: 0, natH: 0, colors: null };
        render();
        return;
      }
      const img = new Image();
      img.onerror = () => {
        showToast(`« ${file.name} » ne semble pas être une image valide.`);
      };
      img.onload = () => {
        state.visuels[place] = { dataUrl, fileName: file.name, vector, natW: img.naturalWidth, natH: img.naturalHeight, colors: null };
        // Clin d'œil : un visuel parfaitement carré déposé sur le cœur —
        // proportions déjà connues à cet instant, sans coût de calcul
        // supplémentaire (Milio, 2026-09-09, menu d'easter eggs validé).
        if (place === 'coeur' && img.naturalWidth === img.naturalHeight) {
          showToast('Comme un vrai badge.');
        }
        render();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });

  el('qzPrev').addEventListener('click', () => goTo(-1));
  el('qzNext').addEventListener('click', () => goTo(1));

  render();
}
