// Contenu des pages Guide — synthèse comparable par technique, utilisée
// par le tableau du hub et par le simulateur. Le texte détaillé de
// chaque fiche vit dans sa propre page (src/pages/techniques/*.astro).
//
// Images des 4 techniques fournies par Milio (photos d'atelier Presstee
// réelles, nommées pour le référencement).
export interface Technique {
  slug: string;
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
    nom: 'Sérigraphie',
    accroche: 'Le plus économique et le plus résistant, à partir de 25 pièces.',
    quantiteMin: 'Rentable à partir de 25 pièces',
    facteurPrix: 'Le nombre de couleurs',
    couleurs: 'Aplats, jusqu’à 4 couleurs',
    prixRelatif: 1,
    durabilite: 'Très bonne — l’encre est absorbée dans la fibre',
    image: '/techniques/atelier-serigraphie-textile-presstee.jpg',
  },
  {
    slug: 'transfert-quadrichromie',
    nom: 'Transfert quadrichromie',
    accroche: 'Couleurs illimitées et dégradés, sans minimum de quantité.',
    quantiteMin: 'Aucun minimum, rentable dès 1 pièce',
    facteurPrix: 'La taille du visuel',
    couleurs: 'Illimitées (quadrichromie), dégradés et photos possibles',
    prixRelatif: 2,
    durabilite: 'Bonne — le visuel est appliqué en surface',
    image: '/techniques/atelier-transfert-quadrichromie-dtf-presstee.jpg',
  },
  {
    slug: 'transfert-monochrome',
    nom: 'Transfert monochrome',
    accroche: 'Une seule couleur, sans minimum de quantité, sous le seuil de rentabilité de la sérigraphie.',
    quantiteMin: 'Aucun minimum, intéressant sous 25 pièces',
    facteurPrix: 'La taille du visuel',
    couleurs: 'Une seule couleur',
    prixRelatif: 2,
    durabilite: 'Très bonne — proche de la sérigraphie directe',
    image: '/techniques/atelier-transfert-monochrome-presstee.jpg',
  },
  {
    slug: 'broderie',
    nom: 'Broderie',
    accroche: 'Un rendu texturé et haut de gamme, pour un logo simple à partir de 10 pièces.',
    quantiteMin: 'Rentable à partir de 10 pièces',
    facteurPrix: 'Le nombre de points (taille et densité du visuel)',
    couleurs: 'Jusqu’à 8 couleurs de fil, sans dégradé',
    prixRelatif: 3,
    durabilite: 'Excellente — le fil est tissé dans la matière',
    image: '/techniques/broderie-1.jpg',
  },
];

export function getTechnique(slug: string): Technique | undefined {
  return TECHNIQUES.find((t) => t.slug === slug);
}
