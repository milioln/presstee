// État partagé du personnalisateur + persistance locale (nouveauté V1,
// document de passage section 6 : "Persistance du projet en cours dans
// le navigateur, pour ne rien perdre au rafraîchissement").
//
// Le visuel n'est plus unique : plusieurs calques (logo + texte, texte
// recto + texte dos...) peuvent coexister, chacun avec sa propre
// position/taille/rotation et son propre emplacement (face/cœur/dos).
import { catalogueColoris, repartitionTaillesParDefaut, type Garment, type Emplacement, type TailleCode } from '../../config/parametres-metier';
import type { TechKey } from './recommendation';
import { VARIANT_DEFAUT } from './garments';
import type { Coupe, Manche, Col } from './silhouettes';

export type Coloris = { nom: string; hex: string };

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
  x: number;
  y: number;
  w: number;
  rot: number;
}

export interface PersonnalisateurState {
  garment: Garment;
  place: Emplacement;
  color: Coloris;
  coupe: Coupe;
  manche: Manche;
  col: Col;
  layers: Layer[];
  activeLayerId: string | null;
  sizeDist: Record<TailleCode, number>;
  tech: TechKey | 'auto';
  delai: 'standard' | 'express';
}

export const S: PersonnalisateurState = {
  garment: 'tshirt',
  place: 'face',
  color: catalogueColoris[0],
  coupe: VARIANT_DEFAUT.coupe,
  manche: VARIANT_DEFAUT.manche,
  col: VARIANT_DEFAUT.col,
  layers: [],
  activeLayerId: null,
  sizeDist: { ...repartitionTaillesParDefaut },
  tech: 'auto',
  delai: 'standard',
};

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
    w: 0.62,
    rot: 0,
  };
}

export const STORAGE_KEY = 'presstee:personnalisateur:v2';

export type Persisted = Pick<PersonnalisateurState, 'garment' | 'place' | 'coupe' | 'manche' | 'col' | 'layers' | 'activeLayerId' | 'sizeDist' | 'tech' | 'delai'> & {
  colorIndex: number;
};

export function saveState(): void {
  try {
    const colorIndex = Math.max(0, catalogueColoris.findIndex((c) => c.hex === S.color.hex));
    const payload: Persisted = {
      garment: S.garment,
      place: S.place,
      coupe: S.coupe,
      manche: S.manche,
      col: S.col,
      colorIndex,
      layers: S.layers,
      activeLayerId: S.activeLayerId,
      sizeDist: S.sizeDist,
      tech: S.tech,
      delai: S.delai,
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
    if (typeof p.colorIndex === 'number' && catalogueColoris[p.colorIndex]) S.color = catalogueColoris[p.colorIndex];
    if (Array.isArray(p.layers)) S.layers = p.layers.filter(isLayer);
    if (typeof p.activeLayerId === 'string' || p.activeLayerId === null) S.activeLayerId = p.activeLayerId;
    if (p.sizeDist && typeof p.sizeDist === 'object') Object.assign(S.sizeDist, p.sizeDist);
    if (p.tech) S.tech = p.tech;
    if (p.delai) S.delai = p.delai;
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
// navigue vers /personnalisateur, qui le charge normalement au
// démarrage via loadState(). coupe/manche/col ne font pas partie d'un
// article de panier (toujours VARIANT_DEFAUT tant qu'un seul produit
// est modélisé) : on les régénère ici plutôt que de les stocker en double.
export function seedFromItem(item: {
  garment: Garment;
  color: Coloris;
  layers: Layer[];
  sizeDist: Record<TailleCode, number>;
  tech: TechKey | 'auto';
  delai: 'standard' | 'express';
}): void {
  try {
    const colorIndex = Math.max(0, catalogueColoris.findIndex((c) => c.hex === item.color.hex));
    const payload: Persisted = {
      garment: item.garment,
      place: item.layers[0]?.place ?? 'face',
      coupe: VARIANT_DEFAUT.coupe,
      manche: VARIANT_DEFAUT.manche,
      col: VARIANT_DEFAUT.col,
      colorIndex,
      layers: item.layers,
      activeLayerId: item.layers[0]?.id ?? null,
      sizeDist: item.sizeDist,
      tech: item.tech,
      delai: item.delai,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}
