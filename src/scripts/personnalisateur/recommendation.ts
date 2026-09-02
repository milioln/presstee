// Recommandation de technique — seuils extraits vers
// src/config/parametres-metier.ts. Règles confirmées par Milio
// (2026-09-02) : sérigraphie à partir de 25 pièces et jusqu'à 4
// couleurs ; broderie à partir de 10 pièces et jusqu'à 8 couleurs de
// fil ; transfert monochrome pour l'aplat unique hors zone
// sérigraphie ; transfert quadrichromie en repli pour tout le reste
// (dégradés/photos, ou quantité/couleurs hors zone des trois autres).
import { seuils } from '../../config/parametres-metier';

export type TechKey = 'serigraphie' | 'transfert-monochrome' | 'transfert-quadrichromie' | 'broderie';

export const TECHS: Record<TechKey, { n: string; d: string; good: string }> = {
  serigraphie: {
    n: 'Sérigraphie',
    d: 'Une encre poussée à travers un écran, une couleur par écran. Le rendu le plus dense et le plus durable au lavage.',
    good: 'Séries à partir de 25 pièces, visuels en aplats jusqu’à 4 couleurs.',
  },
  'transfert-monochrome': {
    n: 'Transfert monochrome',
    d: 'Un visuel en une seule couleur, imprimé puis posé à chaud. Rendu proche de la sérigraphie, sans minimum de quantité.',
    good: 'Petites séries en une seule couleur, en dessous du seuil de rentabilité de la sérigraphie.',
  },
  'transfert-quadrichromie': {
    n: 'Transfert quadrichromie',
    d: 'Impression numérique du visuel en quadrichromie puis pose à chaud. Couleurs illimitées, dégradés et photos possibles.',
    good: 'Petites séries, visuels complexes ou très colorés, personnalisation à l’unité.',
  },
  broderie: {
    n: 'Broderie',
    d: 'Un fil tissé directement dans la matière. Le rendu le plus texturé et le plus durable, pour un logo simple.',
    good: 'À partir de 10 pièces, jusqu’à 8 couleurs de fil, sur un textile assez épais (180 g/m² mini).',
  },
};

export interface Reco {
  k: TechKey;
  why: string;
}

export function reco(colors: number | null, qty: number): Reco {
  if (colors == null) {
    return { k: 'transfert-quadrichromie', why: 'Aucun visuel analysé pour l’instant. Le transfert quadrichromie reste le choix qui convient dans tous les cas.' };
  }
  const { quantitePiecesSerigraphie, couleursMaxSerigraphie, quantitePiecesBroderie, couleursMaxBroderie } = seuils;

  if (colors <= couleursMaxSerigraphie && qty >= quantitePiecesSerigraphie) {
    return {
      k: 'serigraphie',
      why: `${colors} couleur${colors > 1 ? 's' : ''} et ${qty} pièces : les frais d’écran sont amortis, la sérigraphie devient la plus économique et la plus résistante au lavage.`,
    };
  }
  if (colors === 1) {
    return {
      k: 'transfert-monochrome',
      why: `Une seule couleur pour ${qty} pièce${qty > 1 ? 's' : ''} : en dessous de ${quantitePiecesSerigraphie} pièces, le transfert monochrome revient moins cher que la sérigraphie sans frais de calage.`,
    };
  }
  if (colors <= couleursMaxBroderie && qty >= quantitePiecesBroderie) {
    return {
      k: 'broderie',
      why: `${colors} couleurs de fil pour ${qty} pièces : la broderie tient ce nombre de couleurs et offre le rendu le plus durable, sans les frais de calage de la sérigraphie.`,
    };
  }
  return {
    k: 'transfert-quadrichromie',
    why: colors > couleursMaxBroderie
      ? `${colors >= 12 ? 'Plus de 12' : colors} teintes détectées : au-delà de ${couleursMaxBroderie} couleurs, seul le transfert quadrichromie le reproduit fidèlement, quelle que soit la quantité.`
      : `${qty} pièces, ${colors} couleurs : trop peu de pièces pour la sérigraphie ou la broderie (${quantitePiecesBroderie} pièces mini). Le transfert quadrichromie reste rentable sans minimum.`,
  };
}
