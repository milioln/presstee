// Mise en correspondance projet → catalogue — extrait de simulateur.ts
// pour être partagé avec le quiz guidé (commencer.ts), qui a besoin de
// la même logique de filtrage/tri sans dupliquer le catalogue ni les
// seuils de recommandation.
import { PALIERS_TARIF, prixVente } from '../../config/tarification';
import { LABELS_COUPE, LABELS_MANCHES, LABELS_GENRE, LABELS_GAMME_PRIX, inferCoupe, inferGammePrix, inferResponsable, type Coupe, type Manches, type Genre, type GammePrix } from '../../lib/produits-types';
import { TSHIRTS, type TShirtCatalogue } from '../../data/tshirts';

export const COULEURS_OPTIONS: { value: number | null; label: string }[] = [
  { value: 1, label: '1 couleur' },
  { value: 3, label: '2 à 4' },
  { value: 6, label: '5 à 8' },
  { value: 12, label: 'Dégradés / photo' },
  { value: null, label: 'Je ne sais pas' },
];

export const COUPES: Coupe[] = ['rond', 'v', 'oversize', 'autre'];
export const MANCHES_OPTIONS: Manches[] = ['courtes', 'longues', 'sans-manches'];
export const GENRES: Genre[] = ['homme', 'femme', 'enfant', 'unisexe'];
export const GAMMES: GammePrix[] = ['petit-prix', 'qualite-prix', 'premium'];

export function qtyStep(qty: number): number {
  if (qty < 20) return 1;
  if (qty < 100) return 5;
  return 10;
}

export function palierPour(qty: number) {
  return PALIERS_TARIF.find((p) => qty >= p.min && (p.max == null || qty <= p.max)) ?? PALIERS_TARIF[PALIERS_TARIF.length - 1];
}

// Catégorisation identique à /produits (coupe déduite du modèle, gamme de
// prix déduite du prix au plus petit palier, textile responsable détecté
// dans la composition).
export function coupeDe(t: TShirtCatalogue): Coupe {
  return inferCoupe(t.model, t.col);
}
export function gammeDe(t: TShirtCatalogue): GammePrix {
  return inferGammePrix(Math.round(prixVente(t.baseCost, PALIERS_TARIF[0].marge) * 100) / 100);
}

export function styleLabel(key: string): string {
  if (key in LABELS_COUPE) return LABELS_COUPE[key as Coupe];
  if (key in LABELS_MANCHES) return LABELS_MANCHES[key as Manches];
  if (key in LABELS_GENRE) return LABELS_GENRE[key as Genre];
  if (key in LABELS_GAMME_PRIX) return LABELS_GAMME_PRIX[key as GammePrix];
  if (key === 'responsable') return 'Bio / recyclé';
  return key;
}

// Filtre le catalogue t-shirt (seul type de textile avec un vrai
// catalogue de références pour l'instant) selon un jeu de styles
// sélectionnés — même logique côté simulateur et côté quiz.
export function candidatsRef(styles: Set<string>): TShirtCatalogue[] {
  const coupesSel = COUPES.filter((c) => styles.has(c));
  const manchesSel = MANCHES_OPTIONS.filter((m) => styles.has(m));
  const genresSel = GENRES.filter((g) => styles.has(g));
  const gammesSel = GAMMES.filter((g) => styles.has(g));
  const responsableSel = styles.has('responsable');
  return TSHIRTS.filter((t) => {
    if (coupesSel.length && !coupesSel.includes(coupeDe(t))) return false;
    if (manchesSel.length && !manchesSel.includes(t.manches)) return false;
    if (genresSel.length && !genresSel.includes(t.genre)) return false;
    if (gammesSel.length && !gammesSel.includes(gammeDe(t))) return false;
    if (responsableSel && !inferResponsable(t.detail)) return false;
    return true;
  }).sort((a, b) => a.baseCost - b.baseCost);
}
