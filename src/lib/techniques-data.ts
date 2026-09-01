// Contenu des pages Guide — synthèse comparable par technique, utilisée
// par le tableau du hub et par le simulateur. Le texte détaillé de
// chaque fiche vit dans sa propre page (src/pages/techniques/*.astro).
export interface Technique {
  slug: string;
  techKey: 'serigraphie' | 'transfert-premium' | 'transfert-serigraphique' | null;
  nom: string;
  accroche: string;
  quantiteMin: string;
  facteurPrix: string;
  couleurs: string;
  prixRelatif: 1 | 2 | 3;
  durabilite: string;
  image: string | null;
}

export const TECHNIQUES: Technique[] = [
  {
    slug: 'serigraphie',
    techKey: 'serigraphie',
    nom: 'Sérigraphie',
    accroche: 'Le plus économique et le plus résistant, à partir d’une trentaine de pièces.',
    quantiteMin: 'Rentable à partir d’environ 30 pièces',
    facteurPrix: 'Le nombre de couleurs',
    couleurs: 'Aplats, jusqu’à 4-5 couleurs',
    prixRelatif: 1,
    durabilite: 'Très bonne — l’encre est absorbée dans la fibre',
    image: '/techniques/serigraphie-1.jpg',
  },
  {
    slug: 'transfert-premium',
    techKey: 'transfert-premium',
    nom: 'Transfert premium',
    accroche: 'Couleurs illimitées et dégradés, sans minimum de quantité.',
    quantiteMin: 'Aucun minimum, rentable dès 1 pièce',
    facteurPrix: 'La taille du visuel',
    couleurs: 'Illimitées, dégradés et photos possibles',
    prixRelatif: 2,
    durabilite: 'Bonne — le visuel est appliqué en surface',
    image: null,
  },
  {
    slug: 'transfert-serigraphique',
    techKey: 'transfert-serigraphique',
    nom: 'Transfert sérigraphique',
    accroche: 'Le rendu de la sérigraphie, sans calage sur la pièce, dès les petites séries.',
    quantiteMin: 'Rentable dès les petites séries',
    facteurPrix: 'Le nombre de couleurs',
    couleurs: 'Aplats, jusqu’à 4-5 couleurs',
    prixRelatif: 2,
    durabilite: 'Très bonne — proche de la sérigraphie directe',
    image: null,
  },
  {
    slug: 'broderie',
    techKey: null,
    nom: 'Broderie',
    accroche: 'Un rendu texturé et haut de gamme, pour les petits visuels.',
    quantiteMin: 'Adaptée à toutes les quantités',
    facteurPrix: 'Le nombre de points (taille et densité du visuel)',
    couleurs: 'Quelques couleurs de fil, sans dégradé',
    prixRelatif: 3,
    durabilite: 'Excellente — le fil est tissé dans la matière',
    image: '/techniques/broderie-1.jpg',
  },
];

export function getTechnique(slug: string): Technique | undefined {
  return TECHNIQUES.find((t) => t.slug === slug);
}
