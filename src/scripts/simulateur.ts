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
import { coutBaseSupportUnique, catalogueColoris, type Garment } from '../config/parametres-metier';
import { LABELS_COUPE, LABELS_MANCHES, LABELS_GENRE, LABELS_GAMME_PRIX, type Coupe, type Manches, type Genre, type GammePrix } from '../lib/produits-types';
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
    visuels: [nouveauVisuel()],
  };
}

const state: { produits: Produit[] } = { produits: [nouveauProduit()] };

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
  prixUnitaireSupport: number;
  prixTotalSupport: number;
  visuels: VisuelCalcule[];
  prixTotalProduit: number;
}

function calculerProduit(p: Produit): ProduitCalcule {
  const palier = palierPour(p.quantite);
  const prixPiece = prixVente(coutBaseSupportUnique, palier.marge);
  const nbLignes = 1 + p.visuels.length;
  const prixParLigne = Math.round((prixPiece / nbLignes) * 100) / 100;

  const visuels: VisuelCalcule[] = p.visuels.map((v) => {
    const r = reco(v.couleurs, p.quantite);
    return { ...v, techKey: r.k, why: r.why, prixUnitaire: prixParLigne, prixTotal: Math.round(prixParLigne * p.quantite * 100) / 100 };
  });

  return {
    produit: p,
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
      <span class="visuelReco-tech">${tech.n}</span>
      <span class="visuelReco-why">${vc.why}</span>
      <span class="visuelReco-prix">${fmtPrice(vc.prixTotal)} <span>pour ${p.quantite} pièce${p.quantite > 1 ? 's' : ''}</span></span>
    </div>
  </div>`;
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

    <div class="supportLine">
      <span class="supportLine-nom">${GARMENT_LABELS[p.garment]} vierge · ${p.coloris.nom}</span>
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

function resumeMail(): string {
  const lignes: string[] = [];
  let totalQty = 0;
  let total = 0;
  state.produits.forEach((p, i) => {
    const pc = calculerProduit(p);
    totalQty += p.quantite;
    total += pc.prixTotalProduit;
    const stylesTxt = p.styles.size ? [...p.styles].map(styleLabel).join(', ') : 'non précisé';
    lignes.push(`Produit ${i + 1} — ${GARMENT_LABELS[p.garment]} (${stylesTxt})
- Coloris : ${p.coloris.nom}
- Quantité : ${p.quantite} pièce${p.quantite > 1 ? 's' : ''}
- Sous-total estimé : ${fmtPrice(pc.prixTotalProduit)}`);
    pc.visuels.forEach((vc, j) => {
      lignes.push(`  · Visuel ${j + 1} : ${STATUT_LABELS[vc.statut]} · ${FORMAT_LABELS[vc.format]} · ${vc.couleurs == null ? 'nombre de couleurs à définir' : `${vc.couleurs} couleur${vc.couleurs > 1 ? 's' : ''}`} → ${TECHS[vc.techKey].n} (${fmtPrice(vc.prixTotal)})`);
    });
  });
  lignes.push(`\nTotal estimé : ${totalQty} pièce${totalQty > 1 ? 's' : ''} au total, ${fmtPrice(total)}.`);
  return `Bonjour,\n\nSuite à ma simulation sur presstee.fr, voici mon projet :\n\n${lignes.join('\n\n')}\n\nMerci de me recontacter pour affiner ce devis.`;
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

  el('simSend').addEventListener('click', () => {
    const url = `mailto:${siteConfig.email}?subject=${encodeURIComponent('Demande de devis — simulation presstee.fr')}&body=${encodeURIComponent(resumeMail())}`;
    window.location.href = url;
  });

  render();
}
