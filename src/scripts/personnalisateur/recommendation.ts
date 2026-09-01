// Recommandation de technique — port direct de la V0, seuils extraits
// vers src/config/parametres-metier.ts.
import { seuils } from '../../config/parametres-metier';

export type TechKey = 'serigraphie' | 'transfert-premium' | 'transfert-serigraphique';

export const TECHS: Record<TechKey, { n: string; d: string; good: string }> = {
  serigraphie: {
    n: 'Sérigraphie',
    d: 'Une encre poussée à travers un écran, une couleur par écran. Le rendu le plus dense et le plus durable au lavage.',
    good: 'Séries à partir d’une trentaine de pièces, visuels en aplats jusqu’à 4 ou 5 couleurs.',
  },
  'transfert-premium': {
    n: 'Transfert premium',
    d: 'Impression numérique du visuel puis pose à chaud. Couleurs illimitées, dégradés et photos possibles.',
    good: 'Petites séries, visuels complexes, personnalisation à l’unité.',
  },
  'transfert-serigraphique': {
    n: 'Transfert sérigraphique',
    d: 'Le visuel est sérigraphié sur un support puis transféré à chaud sur le vêtement. Rendu proche de la sérigraphie sans calage sur la pièce.',
    good: 'Petites et moyennes séries, textiles techniques, emplacements difficiles d’accès.',
  },
};

export interface Reco {
  k: TechKey;
  why: string;
}

export function reco(colors: number | null, qty: number): Reco {
  if (colors == null) {
    return { k: 'transfert-premium', why: 'Aucun visuel analysé pour l’instant. Le transfert premium reste le choix qui convient dans tous les cas.' };
  }
  const { quantitePiecesSerigraphie: seuilQty, couleursSerigraphieSousLeSeuilQuantite: seuilCouleursBas, couleursSerigraphieAuDessusDuSeuilQuantite: seuilCouleursHaut } = seuils;
  if (colors <= seuilCouleursBas && qty >= seuilQty) {
    return {
      k: 'serigraphie',
      why: `${colors} couleur${colors > 1 ? 's' : ''} et ${qty} pièces : les frais d’écran sont amortis, la sérigraphie devient la plus économique et la plus résistante au lavage.`,
    };
  }
  if (colors <= seuilCouleursHaut && qty < seuilQty) {
    return {
      k: 'transfert-serigraphique',
      why: `${colors} couleurs pour seulement ${qty} pièces : trop peu pour amortir les écrans. Le transfert sérigraphique garde un rendu très proche sans frais de calage.`,
    };
  }
  if (colors <= seuilCouleursHaut) {
    return {
      k: 'transfert-serigraphique',
      why: `${colors} couleurs : plutôt que de multiplier les écrans, le transfert sérigraphique conserve la tenue avec un seul passage.`,
    };
  }
  return {
    k: 'transfert-premium',
    why: `Visuel riche en nuances (${colors >= 12 ? 'plus de 12' : colors} teintes détectées) : seul le transfert premium le reproduit fidèlement.`,
  };
}
