// État partagé du personnalisateur + persistance locale (nouveauté V1,
// document de passage section 6 : "Persistance du projet en cours dans
// le navigateur, pour ne rien perdre au rafraîchissement").
//
// Le visuel n'est plus unique : plusieurs calques (logo + texte, texte
// recto + texte dos...) peuvent coexister, chacun avec sa propre
// position/taille/rotation et son propre emplacement (face/cœur/dos).
import { catalogueColoris, repartitionTaillesParDefaut, coutBaseSupportUnique, type Garment, type Emplacement, type TailleCode } from '../../config/parametres-metier';
import type { TechKey } from './recommendation';
import { VARIANT_DEFAUT } from './garments';
import type { Coupe, Manche, Col } from './silhouettes';

export type Coloris = { nom: string; hex: string };

// Un coloris de textile et SA propre répartition de tailles (Milio,
// 2026-09-09 : « pouvoir régler précisément la répartition des tailles
// selon le coloris à l'étape de la configuration ») — jusqu'ici le
// configurateur n'avait qu'un seul coloris et une seule répartition pour
// tout le projet ; commander plusieurs coloris dans des proportions
// différentes (ex. 20 blancs en L/XL, 10 noirs en S/M) n'était pas
// possible. S.color/S.sizeDist restent les champs "en cours d'édition" —
// toujours le MÊME objet sizeDist qu'un des lots ci-dessous (jamais une
// copie), pour que modifier S.sizeDist[t] mette directement à jour le
// bon lot sans code de synchronisation séparé (cf. switchColorLot).
export interface ColorLot {
  color: Coloris;
  sizeDist: Record<TailleCode, number>;
}

export interface Layer {
  id: string;
  place: Emplacement;
  img: string;
  fileName: string;
  vector: boolean;
  // Couleur connue avec certitude (visuel généré par le mode Texte) :
  // court-circuite l'analyse pixel, cf. file-analysis.ts.
  knownColor: string | null;
  natW: number;
  natH: number;
  colors: number | null;
  dom: [number, number, number] | null;
  colorSwatches: string[] | null;
  // L'utilisateur a retiré une teinte détectée à tort (file-analysis.ts
  // ne doit alors plus écraser la correction en ré-échantillonnant
  // l'image à chaque passage par syncEditor(), y compris au rechargement
  // de la page).
  colorsEdited?: boolean;
  x: number;
  y: number;
  w: number;
  rot: number;
  // Le client accepte que l'atelier améliore la résolution de ce fichier
  // plutôt que de bloquer sa commande sur un avertissement de qualité
  // (Milio, 2026-09-09 : « qu'elle ne soit pas bloquée, elle peut
  // continuer le processus de commande et après nous on corrige ça »).
  qualiteAssistance?: boolean;
}

// Le client n'a pas encore de visuel : plutôt que de bloquer la
// commande, il peut décrire son projet pour que l'équipe le crée. Le
// nombre de couleurs saisi ici nourrit quand même la recommandation de
// technique (cf. derived.ts, totalColors()) — format/notes restent de
// l'information libre à l'attention de l'atelier, sans effet sur le prix.
export interface DesignHelp {
  colors: number | null;
  format: string;
  notes: string;
}

// Confirmation client du bon à tirer (vue "Bon à tirer" du viewer,
// configurateur.astro) : une signature du projet au moment de la
// confirmation, comparée à la volée à une signature recalculée sur
// l'état courant pour savoir si la confirmation est encore valable ou
// si le projet a changé depuis (cf. bat-view.ts).
export interface BATConfirmation {
  at: number;
  signature: string;
}

export interface PersonnalisateurState {
  garment: Garment;
  place: Emplacement;
  // Coloris et répartition "en cours d'édition" — toujours ceux du lot
  // actif dans colorLots (cf. switchColorLot). Laissés à plat plutôt que
  // remplacés par un simple accesseur : tout le code existant qui lit ou
  // modifie S.color/S.sizeDist continue de fonctionner sans changement.
  color: Coloris;
  sizeDist: Record<TailleCode, number>;
  colorLots: ColorLot[];
  coupe: Coupe;
  manche: Manche;
  col: Col;
  layers: Layer[];
  activeLayerId: string | null;
  tech: TechKey | 'auto';
  delai: 'standard' | 'express';
  designHelp: DesignHelp;
  batConfirme: BATConfirmation | null;
  // Coût fournisseur de base utilisé pour le prix affiché (cf. derived.ts,
  // prixUnitaire()) — par défaut le coût générique du personnalisateur,
  // mais seedFromItem() le remplace par le coût réel de la référence
  // choisie en amont (quiz) quand il y en a une, pour que le prix ne
  // change jamais entre le quiz et le configurateur (Milio, 2026-09-09 :
  // « le prix, il faut qu'il soit le même partout »).
  coutBase: number;
}

const initialSizeDist = { ...repartitionTaillesParDefaut };

export const S: PersonnalisateurState = {
  garment: 'tshirt',
  place: 'face',
  color: catalogueColoris[0],
  sizeDist: initialSizeDist,
  colorLots: [{ color: catalogueColoris[0], sizeDist: initialSizeDist }],
  coupe: VARIANT_DEFAUT.coupe,
  manche: VARIANT_DEFAUT.manche,
  col: VARIANT_DEFAUT.col,
  layers: [],
  activeLayerId: null,
  tech: 'auto',
  delai: 'standard',
  designHelp: { colors: null, format: '', notes: '' },
  batConfirme: null,
  coutBase: coutBaseSupportUnique,
};

// Bascule le coloris "en cours d'édition" (S.color/S.sizeDist) sur un
// lot déjà présent, sans en créer un nouveau — utilisé quand on reclique
// une pastille déjà sélectionnée (cf. main.ts, addColorLot).
export function switchColorLot(hex: string): void {
  const lot = S.colorLots.find((l) => l.color.hex === hex);
  if (!lot) return;
  S.color = lot.color;
  S.sizeDist = lot.sizeDist;
}

// Ajoute un nouveau coloris à commander (répartition par défaut,
// modifiable ensuite panneau "5") ou bascule dessus s'il y est déjà.
export function addColorLot(color: Coloris): void {
  if (S.colorLots.some((l) => l.color.hex === color.hex)) {
    switchColorLot(color.hex);
    return;
  }
  const sizeDist = { ...repartitionTaillesParDefaut };
  S.colorLots.push({ color, sizeDist });
  S.color = color;
  S.sizeDist = sizeDist;
}

// Retire un coloris de la commande — jamais le dernier restant (un
// projet a toujours au moins un coloris). Si c'était celui affiché,
// bascule sur le premier lot restant.
export function removeColorLot(hex: string): void {
  if (S.colorLots.length <= 1) return;
  const idx = S.colorLots.findIndex((l) => l.color.hex === hex);
  if (idx < 0) return;
  S.colorLots.splice(idx, 1);
  if (S.color.hex === hex) {
    S.color = S.colorLots[0].color;
    S.sizeDist = S.colorLots[0].sizeDist;
  }
}

let layerSeq = 0;

export function activeLayer(): Layer | null {
  return S.layers.find((l) => l.id === S.activeLayerId) || null;
}

export function createLayer(partial: { img: string; fileName: string; vector: boolean; knownColor?: string | null }): Layer {
  layerSeq += 1;
  return {
    id: `l${Date.now().toString(36)}${layerSeq}`,
    place: S.place,
    img: partial.img,
    fileName: partial.fileName,
    vector: partial.vector,
    knownColor: partial.knownColor ?? null,
    natW: 0,
    natH: 0,
    colors: null,
    dom: null,
    colorSwatches: null,
    x: 0.5,
    y: 0.5,
    w: 0.78,
    rot: 0,
  };
}

export const STORAGE_KEY = 'presstee:personnalisateur:v2';

export interface PersistedColorLot {
  colorIndex: number;
  sizeDist: Record<TailleCode, number>;
}

export type Persisted = Pick<PersonnalisateurState, 'garment' | 'place' | 'coupe' | 'manche' | 'col' | 'layers' | 'activeLayerId' | 'tech' | 'delai' | 'designHelp' | 'batConfirme' | 'coutBase'> & {
  colorLots: PersistedColorLot[];
  activeColorHex: string;
};

export function saveState(): void {
  try {
    const colorLots: PersistedColorLot[] = S.colorLots.map((lot) => ({
      colorIndex: Math.max(0, catalogueColoris.findIndex((c) => c.hex === lot.color.hex)),
      sizeDist: lot.sizeDist,
    }));
    const payload: Persisted = {
      garment: S.garment,
      place: S.place,
      coupe: S.coupe,
      manche: S.manche,
      col: S.col,
      colorLots,
      activeColorHex: S.color.hex,
      layers: S.layers,
      activeLayerId: S.activeLayerId,
      tech: S.tech,
      delai: S.delai,
      designHelp: S.designHelp,
      batConfirme: S.batConfirme,
      coutBase: S.coutBase,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé...) : on
    // n'interrompt jamais l'expérience pour une persistance qui échoue.
  }
}

function isLayer(v: unknown): v is Layer {
  return !!v && typeof v === 'object' && typeof (v as Layer).id === 'string' && typeof (v as Layer).img === 'string';
}

export function loadState(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as Partial<Persisted>;
    if (!p || typeof p !== 'object') return false;
    if (p.garment) S.garment = p.garment;
    if (p.place) S.place = p.place;
    if (p.coupe) S.coupe = p.coupe;
    if (p.manche) S.manche = p.manche;
    if (p.col) S.col = p.col;
    if (Array.isArray(p.colorLots) && p.colorLots.length) {
      const lots: ColorLot[] = p.colorLots
        .filter((l): l is PersistedColorLot => !!l && typeof l === 'object' && !!catalogueColoris[l.colorIndex])
        .map((l) => ({ color: catalogueColoris[l.colorIndex], sizeDist: { ...repartitionTaillesParDefaut, ...l.sizeDist } }));
      if (lots.length) {
        S.colorLots = lots;
        const active = lots.find((l) => l.color.hex === p.activeColorHex) ?? lots[0];
        S.color = active.color;
        S.sizeDist = active.sizeDist;
      }
    }
    if (Array.isArray(p.layers)) S.layers = p.layers.filter(isLayer);
    if (typeof p.activeLayerId === 'string' || p.activeLayerId === null) S.activeLayerId = p.activeLayerId;
    if (p.tech) S.tech = p.tech;
    if (p.delai) S.delai = p.delai;
    if (p.designHelp && typeof p.designHelp === 'object') Object.assign(S.designHelp, p.designHelp);
    if (p.batConfirme && typeof p.batConfirme === 'object') S.batConfirme = p.batConfirme;
    if (typeof p.coutBase === 'number') S.coutBase = p.coutBase;
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Écrit directement le stockage du projet en cours à partir d'un
// article externe (panier), sans passer par S — utilisé par la page
// /panier pour "Modifier" un article : on sème le stockage puis on
// navigue vers /configurateur, qui le charge normalement au
// démarrage via loadState(). coupe/manche/col ne font pas partie d'un
// article de panier (toujours VARIANT_DEFAUT tant qu'un seul produit
// est modélisé) : on les régénère ici plutôt que de les stocker en double.
export function seedFromItem(item: {
  garment: Garment;
  // Un ou plusieurs coloris, chacun avec sa propre répartition de
  // tailles (Milio, 2026-09-09) — le quiz peut désormais transmettre
  // plusieurs coloris (state.colorLots), chacun avec la quantité
  // choisie pour lui, répartie en tailles via sizeDistForQty().
  colorLots: { color: Coloris; sizeDist: Record<TailleCode, number> }[];
  layers: Layer[];
  tech: TechKey | 'auto';
  delai: 'standard' | 'express';
  designHelp?: DesignHelp;
  // Emplacement choisi en amont (ex. dans le quiz) sans qu'un calque
  // réel n'existe encore — sert de repère par défaut jusqu'à ce que le
  // client dépose un visuel.
  place?: Emplacement;
  // Coût réel de la référence choisie en amont (ex. dans le quiz), pour
  // que le prix affiché dans le configurateur soit exactement celui déjà
  // vu — sans ça, S.coutBase retombait sur le coût générique du
  // personnalisateur (coutBaseSupportUnique) quelle que soit la
  // référence réellement choisie, et le prix pouvait changer entre le
  // quiz et le configurateur.
  coutBase?: number;
}): void {
  try {
    const colorLots: PersistedColorLot[] = item.colorLots.map((lot) => ({
      colorIndex: Math.max(0, catalogueColoris.findIndex((c) => c.hex === lot.color.hex)),
      sizeDist: lot.sizeDist,
    }));
    const payload: Persisted = {
      garment: item.garment,
      place: item.layers[0]?.place ?? item.place ?? 'face',
      coupe: VARIANT_DEFAUT.coupe,
      manche: VARIANT_DEFAUT.manche,
      col: VARIANT_DEFAUT.col,
      colorLots,
      activeColorHex: item.colorLots[0].color.hex,
      layers: item.layers,
      activeLayerId: item.layers[0]?.id ?? null,
      tech: item.tech,
      delai: item.delai,
      designHelp: item.designHelp ?? { colors: null, format: '', notes: '' },
      // Repart sans confirmation : "Modifier" charge un article déjà
      // ajouté au panier, potentiellement modifié depuis sa confirmation
      // (si elle avait eu lieu) — mieux vaut la redemander que la
      // reporter à tort sur un projet qui a pu changer entretemps.
      batConfirme: null,
      coutBase: item.coutBase ?? coutBaseSupportUnique,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}
