export type Genre = 'homme' | 'femme' | 'enfant' | 'unisexe';
export type Manches = 'courtes' | 'longues' | 'sans-manches';
export type Col = 'rond' | 'v' | 'mandarin' | 'polo';

export const LABELS_GENRE: Record<Genre, string> = {
  homme: 'Homme',
  femme: 'Femme',
  enfant: 'Enfant',
  unisexe: 'Unisexe',
};

export const LABELS_MANCHES: Record<Manches, string> = {
  courtes: 'Manches courtes',
  longues: 'Manches longues',
  'sans-manches': 'Sans manches',
};

export const LABELS_COL: Record<Col, string> = {
  rond: 'Col rond',
  v: 'Col V',
  mandarin: 'Col mandarin',
  polo: 'Col polo',
};
