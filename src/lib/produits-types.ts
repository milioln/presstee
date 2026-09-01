export type Genre = 'homme' | 'femme' | 'enfant' | 'unisexe';
export type Manches = 'courtes' | 'longues' | 'sans-manches';
export type Col = 'rond' | 'v' | 'mandarin' | 'polo';
export type Coupe = 'rond' | 'v' | 'oversize' | 'autre';
export type GammePrix = 'petit-prix' | 'qualite-prix' | 'premium';
export type TypeTextile = 't-shirts' | 'sweats' | 'polos' | 'chemises' | 'casquettes' | 'bagagerie';

export const LABELS_COUPE: Record<Coupe, string> = {
  rond: 'Col rond',
  v: 'Col V',
  oversize: 'Oversize',
  autre: 'Autre',
};

export const LABELS_GAMME_PRIX: Record<GammePrix, string> = {
  'petit-prix': 'Petit prix',
  'qualite-prix': 'Qualité/prix',
  premium: 'Premium',
};

// Sous forme adjective ("oversized", "loose"...) plutôt que col V/rond :
// l'ampleur de la coupe prime sur l'encolure dans le classement.
export function inferCoupe(model: string, col: Col): Coupe {
  const m = model.toLowerCase();
  if (/oversize|oversized|huge|heavy oversize|loose fit|heavy loose/.test(m)) return 'oversize';
  if (col === 'v') return 'v';
  if (col === 'rond') return 'rond';
  return 'autre';
}

// Paliers sur le prix unitaire à la plus petite quantité (1-9 pièces) —
// seuils choisis pour répartir le catalogue en trois tiers à peu près
// égaux (voir analyse de la distribution des prix, ~49/50/46 sur 145
// t-shirts). Provisoire, comme le reste de la grille tarifaire.
export function inferGammePrix(prixUnitaire: number): GammePrix {
  if (prixUnitaire < 7) return 'petit-prix';
  if (prixUnitaire < 12) return 'qualite-prix';
  return 'premium';
}

// Détecte les matières bio, recyclées ou labellisées à partir du texte
// de composition (ex. "certifié biologique", "polyester recyclé",
// "certifié RCS", "Better Cotton").
export function inferResponsable(detail: string): boolean {
  return /biologique|\bbio\b|organique|recycl|\brcs\b|better cotton/i.test(detail);
}

export const LABELS_TYPE_TEXTILE: Record<TypeTextile, string> = {
  't-shirts': 'T-shirts',
  sweats: 'Sweats',
  polos: 'Polos',
  chemises: 'Chemises',
  casquettes: 'Casquettes',
  bagagerie: 'Bagagerie',
};

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
