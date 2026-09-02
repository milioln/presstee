// État partagé du personnalisateur + persistance locale (nouveauté V1,
// document de passage section 6 : "Persistance du projet en cours dans
// le navigateur, pour ne rien perdre au rafraîchissement").
import { catalogueColoris, repartitionTaillesParDefaut, type Garment, type Emplacement, type TailleCode } from '../../config/parametres-metier';
import type { TechKey } from './recommendation';
import { VARIANT_DEFAUT } from './garments';
import type { Coupe, Manche, Col } from './silhouettes';

export type Coloris = { nom: string; hex: string };

export interface PersonnalisateurState {
  garment: Garment;
  place: Emplacement;
  color: Coloris;
  coupe: Coupe;
  manche: Manche;
  col: Col;
  img: string | null;
  fileName: string;
  vector: boolean;
  natW: number;
  natH: number;
  colors: number | null;
  dom: [number, number, number] | null;
  x: number;
  y: number;
  w: number;
  rot: number;
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
  img: null,
  fileName: '',
  vector: false,
  natW: 0,
  natH: 0,
  colors: null,
  dom: null,
  x: 0.5,
  y: 0.5,
  w: 0.62,
  rot: 0,
  sizeDist: { ...repartitionTaillesParDefaut },
  tech: 'auto',
  delai: 'standard',
};

const STORAGE_KEY = 'presstee:personnalisateur:v1';

// Champs persistés : uniquement ce qui décrit le projet du client.
// natW/natH/colors/dom repartent à zéro au rechargement : ils sont
// recalculés par l'analyse du fichier.
type Persisted = Pick<
  PersonnalisateurState,
  'garment' | 'place' | 'coupe' | 'manche' | 'col' | 'img' | 'fileName' | 'vector' | 'x' | 'y' | 'w' | 'rot' | 'sizeDist' | 'tech' | 'delai'
> & {
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
      img: S.img,
      fileName: S.fileName,
      vector: S.vector,
      x: S.x,
      y: S.y,
      w: S.w,
      rot: S.rot,
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
    if (typeof p.img === 'string') S.img = p.img;
    if (typeof p.fileName === 'string') S.fileName = p.fileName;
    if (typeof p.vector === 'boolean') S.vector = p.vector;
    if (typeof p.x === 'number') S.x = p.x;
    if (typeof p.y === 'number') S.y = p.y;
    if (typeof p.w === 'number') S.w = p.w;
    if (typeof p.rot === 'number') S.rot = p.rot;
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
