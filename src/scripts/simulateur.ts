// Simulateur de projet — estimation multi-produits, multi-visuels.
// Plus poussé que l'ancien TechSimulator (une seule question de
// couleurs/quantité) : plusieurs produits, chacun avec son propre
// support/style/quantité/coloris et un ou plusieurs visuels, chacun
// recommandé et chiffré indépendamment — même moteur que le
// configurateur (reco()) et la même tarification que partout ailleurs
// sur le site (prixVente + palier).
//
// Toutes les interactions sont des clics (pastilles, compteur +/-,
// pas de champ texte à valeur variable) : un seul ré-rendu complet de
// la liste à chaque changement est donc sûr, sans risque de perdre le
// focus d'un champ en cours de saisie — même approche que
// cart-ui.ts/personnalisateur (rendu complet + délégation d'événements
// sur un conteneur stable, plutôt qu'un correctif fin du DOM).
import { reco, TECHS, type TechKey } from './personnalisateur/recommendation';
import { PALIERS_TARIF, prixVente } from '../config/tarification';
import { coutBaseSupportUnique, catalogueColoris, repartitionTaillesParDefaut, type Garment } from '../config/parametres-metier';
import { seedFromItem } from './personnalisateur/state';
import { LABELS_COUPE, LABELS_MANCHES, LABELS_GENRE, LABELS_GAMME_PRIX, inferCoupe, inferGammePrix, inferResponsable, type Coupe, type Manches, type Genre, type GammePrix } from '../lib/produits-types';
import { TSHIRTS, type TShirtCatalogue } from '../data/tshirts';
import { getTechnique } from '../lib/techniques-data';
import { siteConfig } from '../config/site';

type Statut = 'fourni' | 'en_cours' | 'conseil';
type Format = 'petit' | 'moyen' | 'grand';

interface Visuel {
  id: string;
  statut: Statut;
  format: Format;
  couleurs: number | null;
}

interface Produit {
  id: string;
  garment: Garment;
  styles: Set<string>;
  quantite: number;
  coloris: { nom: string; hex: string };
  refProduit: string | null;
  visuels: Visuel[];
}

let seq = 0;
const nextId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

function nouveauVisuel(): Visuel {
  return { id: nextId(), statut: 'fourni', format: 'moyen', couleurs: null };
}

function nouveauProduit(): Produit {
  return {
    id: nextId(),
    garment: 'tshirt',
    styles: new Set(),
    quantite: 25,
    coloris: catalogueColoris[0],
    refProduit: null,
    visuels: [nouveauVisuel()],
  };
}

const state: { produits: Produit[] } = { produits: [nouveauProduit()] };

// Sauvegarde locale explicite (bouton "Sauvegarder"/"Mettre en attente"),
// jamais automatique : on ne veut pas figer un brouillon à chaque clic,
// seulement quand le client le demande. Les Set ne se sérialisent pas en
// JSON — on les convertit en tableau à l'écriture et on les reconstruit
// à la lecture.
const SIM_SAVE_KEY = 'presstee:simulateur:sauvegarde';

function persistProduits(): void {
  try {
    const serialisable = state.produits.map((p) => ({ ...p, styles: [...p.styles] }));
    localStorage.setItem(SIM_SAVE_KEY, JSON.stringify(serialisable));
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé...) : on
    // n'interrompt jamais l'expérience pour une persistance qui échoue.
  }
}

function restoreProduits(): boolean {
  try {
    const raw = localStorage.getItem(SIM_SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return false;
    state.produits = parsed.map((p: any) => ({ ...p, styles: new Set<string>(p.styles ?? []) }));
    return true;
  } catch {
    return false;
  }
}

// Petite silhouette générique (même tracé que la fiche produit
// /produits/t-shirts/[slug]) — sert de case photo tant qu'aucune vraie
// photo n'existe pour chaque référence du catalogue.
const TEE_PATH = 'M148,54 L118,44 L52,92 L96,156 L122,136 L122,420 Q122,428 130,428 L270,428 Q278,428 278,420 L278,136 L304,156 L348,92 L282,44 L252,54 Q200,100 148,54 Z';
const refThumb = `<span class="refRow-thumb"><svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${TEE_PATH}" fill="currentColor"/></svg></span>`;

const GARMENT_LABELS: Record<Garment, string> = { tshirt: 'T-shirt', sweat: 'Sweat', chemise: 'Chemise', casquette: 'Casquette' };
const FORMAT_LABELS: Record<Format, string> = { petit: 'Petit · 10×10 cm max', moyen: 'Moyen · format A4', grand: 'Grand · format A3' };
const STATUT_LABELS: Record<Statut, string> = { fourni: "J'ai mon visuel", en_cours: 'En cours de création', conseil: 'Conseillez-moi' };
const COULEURS_OPTIONS: { value: number | null; label: string }[] = [
  { value: 1, label: '1 couleur' },
  { value: 3, label: '2 à 4' },
  { value: 6, label: '5 à 8' },
  { value: 12, label: 'Dégradés / photo' },
  { value: null, label: 'Je ne sais pas' },
];

const COUPES: Coupe[] = ['rond', 'v', 'oversize', 'autre'];
const MANCHES_OPTIONS: Manches[] = ['courtes', 'longues', 'sans-manches'];
const GENRES: Genre[] = ['homme', 'femme', 'enfant', 'unisexe'];
const GAMMES: GammePrix[] = ['petit-prix', 'qualite-prix', 'premium'];

function qtyStep(qty: number): number {
  if (qty < 20) return 1;
  if (qty < 100) return 5;
  return 10;
}

function palierPour(qty: number) {
  return PALIERS_TARIF.find((p) => qty >= p.min && (p.max == null || qty <= p.max)) ?? PALIERS_TARIF[PALIERS_TARIF.length - 1];
}

// Catégorisation identique à /produits (coupe déduite du modèle, gamme de
// prix déduite du prix au plus petit palier, textile responsable détecté
// dans la composition) — pour filtrer le catalogue avec les mêmes pastilles
// de style que ce produit du simulateur.
function coupeDe(t: TShirtCatalogue): Coupe {
  return inferCoupe(t.model, t.col);
}
function gammeDe(t: TShirtCatalogue): GammePrix {
  return inferGammePrix(Math.round(prixVente(t.baseCost, PALIERS_TARIF[0].marge) * 100) / 100);
}

// Seul le type "t-shirt" a un catalogue réel pour l'instant (comme sur
// /produits, sweats/polos/chemises/casquettes sont "bientôt disponibles") :
// pour les autres types de textile, on reste sur l'estimation générique.
function candidatsRef(p: Produit): TShirtCatalogue[] {
  if (p.garment !== 'tshirt') return [];
  const coupesSel = COUPES.filter((c) => p.styles.has(c));
  const manchesSel = MANCHES_OPTIONS.filter((m) => p.styles.has(m));
  const genresSel = GENRES.filter((g) => p.styles.has(g));
  const gammesSel = GAMMES.filter((g) => p.styles.has(g));
  const responsableSel = p.styles.has('responsable');
  return TSHIRTS.filter((t) => {
    if (coupesSel.length && !coupesSel.includes(coupeDe(t))) return false;
    if (manchesSel.length && !manchesSel.includes(t.manches)) return false;
    if (genresSel.length && !genresSel.includes(t.genre)) return false;
    if (gammesSel.length && !gammesSel.includes(gammeDe(t))) return false;
    if (responsableSel && !inferResponsable(t.detail)) return false;
    return true;
  }).sort((a, b) => a.baseCost - b.baseCost);
}

const fmtPriceIntl = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
function fmtPrice(n: number): string {
  return fmtPriceIntl.format(n);
}

interface VisuelCalcule extends Visuel {
  techKey: TechKey;
  why: string;
  prixUnitaire: number;
  prixTotal: number;
}

interface ProduitCalcule {
  produit: Produit;
  ref: TShirtCatalogue | null;
  prixUnitaireSupport: number;
  prixTotalSupport: number;
  visuels: VisuelCalcule[];
  prixTotalProduit: number;
}

function calculerProduit(p: Produit): ProduitCalcule {
  const ref = p.refProduit ? TSHIRTS.find((t) => t.slug === p.refProduit) ?? null : null;
  const coutBase = ref ? ref.baseCost : coutBaseSupportUnique;
  const palier = palierPour(p.quantite);
  const prixPiece = prixVente(coutBase, palier.marge);
  const nbLignes = 1 + p.visuels.length;
  const prixParLigne = Math.round((prixPiece / nbLignes) * 100) / 100;

  const visuels: VisuelCalcule[] = p.visuels.map((v) => {
    const r = reco(v.couleurs, p.quantite);
    return { ...v, techKey: r.k, why: r.why, prixUnitaire: prixParLigne, prixTotal: Math.round(prixParLigne * p.quantite * 100) / 100 };
  });

  return {
    produit: p,
    ref,
    prixUnitaireSupport: prixParLigne,
    prixTotalSupport: Math.round(prixParLigne * p.quantite * 100) / 100,
    visuels,
    prixTotalProduit: Math.round(prixPiece * p.quantite * 100) / 100,
  };
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function styleLabel(key: string): string {
  if (key in LABELS_COUPE) return LABELS_COUPE[key as Coupe];
  if (key in LABELS_MANCHES) return LABELS_MANCHES[key as Manches];
  if (key in LABELS_GENRE) return LABELS_GENRE[key as Genre];
  if (key in LABELS_GAMME_PRIX) return LABELS_GAMME_PRIX[key as GammePrix];
  if (key === 'responsable') return 'Bio / recyclé';
  return key;
}

function pillsHtml(options: { value: string; label: string }[], selected: (v: string) => boolean, action: string, produitId: string, extra = ''): string {
  return options
    .map((o) => `<button type="button" class="pill${selected(o.value) ? ' on' : ''}" data-action="${action}" data-produit="${produitId}" data-value="${o.value}" ${extra}>${o.label}</button>`)
    .join('');
}

function visuelCard(p: Produit, vc: VisuelCalcule, index: number, retirable: boolean): string {
  const tech = TECHS[vc.techKey];
  const techImg = getTechnique(vc.techKey)?.image ?? null;
  return `<div class="visuelCard">
    <div class="visuelCard-head">
      <span class="visuelCard-num">Visuel ${index + 1}</span>
      ${retirable ? `<button type="button" class="linkBtn danger" data-action="remove-visuel" data-produit="${p.id}" data-visuel="${vc.id}">Retirer</button>` : ''}
    </div>
    <div class="simField">
      <span class="simField-label">Votre visuel</span>
      <div class="pills">${(['fourni', 'en_cours', 'conseil'] as Statut[]).map((s) => `<button type="button" class="pill${vc.statut === s ? ' on' : ''}" data-action="set-statut" data-produit="${p.id}" data-visuel="${vc.id}" data-value="${s}">${STATUT_LABELS[s]}</button>`).join('')}</div>
    </div>
    <div class="simField">
      <span class="simField-label">Format</span>
      <div class="pills">${(['petit', 'moyen', 'grand'] as Format[]).map((f) => `<button type="button" class="pill${vc.format === f ? ' on' : ''}" data-action="set-format" data-produit="${p.id}" data-visuel="${vc.id}" data-value="${f}">${FORMAT_LABELS[f]}</button>`).join('')}</div>
    </div>
    <div class="simField">
      <span class="simField-label">Nombre de couleurs</span>
      <div class="pills">${COULEURS_OPTIONS.map((o) => `<button type="button" class="pill${vc.couleurs === o.value ? ' on' : ''}" data-action="set-couleurs" data-produit="${p.id}" data-visuel="${vc.id}" data-value="${o.value ?? ''}">${o.label}</button>`).join('')}</div>
    </div>
    <div class="visuelReco">
      ${techImg ? `<img class="visuelReco-img" src="${techImg}" alt="" loading="lazy" />` : ''}
      <div class="visuelReco-body">
        <span class="visuelReco-tech">${tech.n}</span>
        <span class="visuelReco-why">${vc.why}</span>
      </div>
      <span class="visuelReco-prix">${fmtPrice(vc.prixTotal)} <span>pour ${p.quantite} pièce${p.quantite > 1 ? 's' : ''}</span></span>
    </div>
  </div>`;
}

function refListHtml(p: Produit): string {
  if (p.garment !== 'tshirt') {
    return `<p class="refNote">Références précises bientôt disponibles pour ce type de textile — estimation générique utilisée en attendant.</p>`;
  }
  const candidats = candidatsRef(p);
  const palier = palierPour(p.quantite);
  if (candidats.length === 0) {
    return `<p class="refNote">Aucune référence ne correspond à ces filtres pour l'instant — estimation générique utilisée.</p>`;
  }
  const generique = `<button type="button" class="refRow refRow-generic${!p.refProduit ? ' on' : ''}" data-action="set-ref" data-produit="${p.id}" data-value="">
    <span class="refRow-name">Estimation générique (sans référence précise)</span>
    <span class="refRow-price">${fmtPrice(Math.round(prixVente(coutBaseSupportUnique, palier.marge) * 100) / 100)} <span>/ pièce</span></span>
  </button>`;
  const rows = candidats.map((t) => {
    const prix = Math.round(prixVente(t.baseCost, palier.marge) * 100) / 100;
    return `<button type="button" class="refRow${p.refProduit === t.slug ? ' on' : ''}" data-action="set-ref" data-produit="${p.id}" data-value="${t.slug}">
      ${refThumb}
      <span class="refRow-name"><b>${t.brand}</b> ${t.model}</span>
      <span class="refRow-meta">${t.grammage}</span>
      <span class="refRow-price">${fmtPrice(prix)} <span>/ pièce</span></span>
    </button>`;
  }).join('');
  return `<div class="refList">${generique}${rows}</div>`;
}

function produitCard(pc: ProduitCalcule, index: number, retirable: boolean): string {
  const p = pc.produit;
  return `<div class="produitCard">
    <div class="produitCard-head">
      <h3>Produit ${index + 1}</h3>
      ${retirable ? `<button type="button" class="linkBtn danger" data-action="remove-produit" data-produit="${p.id}">Retirer ce produit</button>` : ''}
    </div>

    <div class="simField">
      <span class="simField-label">Type de textile</span>
      <div class="pills">${pillsHtml((Object.keys(GARMENT_LABELS) as Garment[]).map((g) => ({ value: g, label: GARMENT_LABELS[g] })), (v) => v === p.garment, 'set-garment', p.id)}</div>
    </div>

    <div class="simField">
      <span class="simField-label">Style <span class="simField-hint">plusieurs choix possibles</span></span>
      <div class="styleGroups">
        <div class="pills">${pillsHtml(COUPES.map((c) => ({ value: c, label: LABELS_COUPE[c] })), (v) => p.styles.has(v), 'toggle-style', p.id)}</div>
        <div class="pills">${pillsHtml(MANCHES_OPTIONS.map((m) => ({ value: m, label: LABELS_MANCHES[m] })), (v) => p.styles.has(v), 'toggle-style', p.id)}</div>
        <div class="pills">${pillsHtml(GENRES.map((g) => ({ value: g, label: LABELS_GENRE[g] })), (v) => p.styles.has(v), 'toggle-style', p.id)}</div>
        <div class="pills">${pillsHtml(GAMMES.map((g) => ({ value: g, label: LABELS_GAMME_PRIX[g] })), (v) => p.styles.has(v), 'toggle-style', p.id)}</div>
        <div class="pills">${pillsHtml([{ value: 'responsable', label: '🌱 Bio / recyclé' }], (v) => p.styles.has(v), 'toggle-style', p.id)}</div>
      </div>
    </div>

    <div class="simField">
      <span class="simField-label">Quantité</span>
      <div class="qtyStepper">
        <button type="button" class="btn-icon" data-action="qty-step" data-produit="${p.id}" data-delta="-1" aria-label="Diminuer">−</button>
        <span class="qtyStepper-val">${p.quantite} pièce${p.quantite > 1 ? 's' : ''}</span>
        <button type="button" class="btn-icon" data-action="qty-step" data-produit="${p.id}" data-delta="1" aria-label="Augmenter">+</button>
      </div>
    </div>

    <div class="simField">
      <span class="simField-label">Couleur du textile</span>
      <div class="swatches">${catalogueColoris.map((c) => `<button type="button" class="sw${c.hex === p.coloris.hex ? ' on' : ''}" data-action="set-couleris" data-produit="${p.id}" data-value="${c.hex}" style="background:${c.hex}" aria-label="${c.nom}"></button>`).join('')}</div>
    </div>

    <div class="simField">
      <span class="simField-label">Référence produit <span class="simField-hint">optionnel — prix réel du modèle si choisi</span></span>
      ${refListHtml(p)}
    </div>

    <div class="supportLine">
      <span class="supportLine-nom">${pc.ref ? `${pc.ref.brand} ${pc.ref.model}` : `${GARMENT_LABELS[p.garment]} vierge`} · ${p.coloris.nom}</span>
      <span class="supportLine-prix">${fmtPrice(pc.prixTotalSupport)} <span>pour ${p.quantite} pièce${p.quantite > 1 ? 's' : ''}</span></span>
    </div>

    <div class="simField">
      <span class="simField-label">Visuels sur ce produit</span>
      <div class="visuelList">${pc.visuels.map((vc, i) => visuelCard(p, vc, i, pc.visuels.length > 1)).join('')}</div>
      <button type="button" class="mini-btn" data-action="add-visuel" data-produit="${p.id}">+ Ajouter un visuel sur ce produit</button>
    </div>

    <div class="produitCard-total">
      <span>Sous-total pour ce produit</span>
      <b>${fmtPrice(pc.prixTotalProduit)}</b>
    </div>
  </div>`;
}

function resumeMail(mode: 'devis' | 'commande' | 'attente'): string {
  const lignes: string[] = [];
  let totalQty = 0;
  let total = 0;
  state.produits.forEach((p, i) => {
    const pc = calculerProduit(p);
    totalQty += p.quantite;
    total += pc.prixTotalProduit;
    const stylesTxt = p.styles.size ? [...p.styles].map(styleLabel).join(', ') : 'non précisé';
    lignes.push(`Produit ${i + 1} — ${GARMENT_LABELS[p.garment]} (${stylesTxt})
- Référence : ${pc.ref ? `${pc.ref.brand} ${pc.ref.model}` : 'à définir avec vous'}
- Coloris : ${p.coloris.nom}
- Quantité : ${p.quantite} pièce${p.quantite > 1 ? 's' : ''}
- Sous-total estimé : ${fmtPrice(pc.prixTotalProduit)}`);
    pc.visuels.forEach((vc, j) => {
      lignes.push(`  · Visuel ${j + 1} : ${STATUT_LABELS[vc.statut]} · ${FORMAT_LABELS[vc.format]} · ${vc.couleurs == null ? 'nombre de couleurs à définir' : `${vc.couleurs} couleur${vc.couleurs > 1 ? 's' : ''}`} → ${TECHS[vc.techKey].n} (${fmtPrice(vc.prixTotal)})`);
    });
  });
  lignes.push(`\nTotal estimé : ${totalQty} pièce${totalQty > 1 ? 's' : ''} au total, ${fmtPrice(total)}.`);

  const intro = mode === 'commande'
    ? 'Suite à ma simulation sur presstee.fr, je souhaite passer commande pour le projet suivant :'
    : mode === 'devis'
    ? 'Suite à ma simulation sur presstee.fr, je souhaite un devis pour le projet suivant :'
    : "Suite à ma simulation sur presstee.fr, voici mon projet — je ne suis pas encore prêt(e) à commander, merci de le garder de côté et de me recontacter :";
  const closing = mode === 'commande'
    ? 'Merci de me recontacter pour finaliser cette commande.'
    : mode === 'devis'
    ? 'Merci de me recontacter pour affiner ce devis.'
    : 'Merci de me recontacter quand vous le pourrez pour en discuter.';
  return `Bonjour,\n\n${intro}\n\n${lignes.join('\n\n')}\n\n${closing}`;
}

function render(): void {
  const list = el('produitsList');
  const calculs = state.produits.map((p) => calculerProduit(p));
  list.innerHTML = calculs.map((pc, i) => produitCard(pc, i, state.produits.length > 1)).join('');

  const totalQty = state.produits.reduce((s, p) => s + p.quantite, 0);
  const total = calculs.reduce((s, pc) => s + pc.prixTotalProduit, 0);
  el('simCount').textContent = `${state.produits.length} produit${state.produits.length > 1 ? 's' : ''}`;
  el('simQty').textContent = `${totalQty} pièce${totalQty > 1 ? 's' : ''} au total`;
  el('simTotal').textContent = fmtPrice(total);
}

function findProduit(id: string): Produit | undefined {
  return state.produits.find((p) => p.id === id);
}
function findVisuel(p: Produit, id: string): Visuel | undefined {
  return p.visuels.find((v) => v.id === id);
}

export function bindSimulateur(): void {
  el('produitsList').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
    if (!b) return;
    const action = b.dataset.action!;
    const produit = findProduit(b.dataset.produit!);
    if (!produit) return;

    switch (action) {
      case 'set-garment':
        produit.garment = b.dataset.value as Garment;
        produit.refProduit = null;
        break;
      case 'set-ref':
        produit.refProduit = b.dataset.value || null;
        break;
      case 'toggle-style': {
        const v = b.dataset.value!;
        if (produit.styles.has(v)) produit.styles.delete(v);
        else produit.styles.add(v);
        break;
      }
      case 'qty-step': {
        const delta = +b.dataset.delta! * qtyStep(produit.quantite);
        produit.quantite = Math.max(1, Math.min(2000, produit.quantite + delta));
        break;
      }
      case 'set-couleris':
        produit.coloris = catalogueColoris.find((c) => c.hex === b.dataset.value) ?? produit.coloris;
        break;
      case 'remove-produit':
        state.produits = state.produits.filter((p) => p.id !== produit.id);
        break;
      case 'add-visuel':
        produit.visuels.push(nouveauVisuel());
        break;
      case 'remove-visuel':
        produit.visuels = produit.visuels.filter((v) => v.id !== b.dataset.visuel);
        break;
      case 'set-statut':
      case 'set-format':
      case 'set-couleurs': {
        const visuel = findVisuel(produit, b.dataset.visuel!);
        if (!visuel) return;
        if (action === 'set-statut') visuel.statut = b.dataset.value as Statut;
        if (action === 'set-format') visuel.format = b.dataset.value as Format;
        if (action === 'set-couleurs') visuel.couleurs = b.dataset.value ? +b.dataset.value : null;
        break;
      }
    }
    render();
  });

  el('addProduit').addEventListener('click', () => {
    state.produits.push(nouveauProduit());
    render();
  });

  function feedback(msg: string): void {
    const box = el('simFeedback');
    box.textContent = msg;
    box.style.display = 'block';
  }

  el('simCommander').addEventListener('click', () => {
    const url = `mailto:${siteConfig.email}?subject=${encodeURIComponent('Commande — simulation presstee.fr')}&body=${encodeURIComponent(resumeMail('commande'))}`;
    window.location.href = url;
  });

  el('simSauvegarder').addEventListener('click', () => {
    persistProduits();
    feedback('Simulation sauvegardée sur cet appareil — retrouvez-la en revenant sur cette page. Votre demande de devis part par e-mail.');
    const url = `mailto:${siteConfig.email}?subject=${encodeURIComponent('Demande de devis — simulation presstee.fr')}&body=${encodeURIComponent(resumeMail('devis'))}`;
    window.location.href = url;
  });

  el('simAttente').addEventListener('click', () => {
    persistProduits();
    feedback('Projet mis de côté et sauvegardé sur cet appareil.');
    const url = `mailto:${siteConfig.email}?subject=${encodeURIComponent('Projet en attente — simulation presstee.fr')}&body=${encodeURIComponent(resumeMail('attente'))}`;
    window.location.href = url;
  });

  // Passerelle vers le mode 3D : sème le configurateur avec le premier
  // produit de la simulation (garment/coloris/quantité — pas de calque
  // réel, la simulation ne connaît qu'une description du visuel voulu),
  // puis délègue le changement de mode à personnaliser-mode.ts via un
  // évènement plutôt qu'un import direct, pour ne pas coupler ce module
  // à la page qui l'héberge.
  el('simPersonnaliser').addEventListener('click', (e) => {
    e.preventDefault();
    const produit = state.produits[0];
    if (produit) {
      const visuel = produit.visuels[0];
      seedFromItem({
        garment: produit.garment,
        color: produit.coloris,
        layers: [],
        sizeDist: { ...repartitionTaillesParDefaut },
        tech: 'auto',
        delai: 'standard',
        designHelp: { colors: visuel?.couleurs ?? null, format: '', notes: '' },
      });
    }
    document.dispatchEvent(new CustomEvent('presstee:seed-3d'));
  });

  el('simReset').addEventListener('click', () => {
    try {
      localStorage.removeItem(SIM_SAVE_KEY);
    } catch {
      // Stockage indisponible : rien à faire de plus, on repart quand même à zéro.
    }
    state.produits = [nouveauProduit()];
    el('simRestoreNote').style.display = 'none';
    render();
  });

  if (restoreProduits()) {
    el('simRestoreNote').style.display = 'flex';
  }
  render();
}
