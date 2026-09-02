// Paramètres métier du personnalisateur — TOUTES les valeurs ci-dessous
// sont des hypothèses de travail de la V0, pas des vérités commerciales
// (document de passage, section 7). Ne jamais les dupliquer en dur dans
// un composant : toujours importer depuis ce fichier.
//
// Écart constaté à signaler à Milio : le tableau de la section 7 donne un
// jeu de largeurs génériques (face t-shirt 28 cm, cœur 10 cm, casquette
// 12 cm, dos 30 cm) alors que la maquette V0 fonctionnelle encode des
// largeurs différenciées par vêtement (ex. chemise : face 9 cm, dos
// 26 cm). On a gardé ici les valeurs réellement utilisées par la V0
// (règle 1 : la V0 fait foi), en attendant que Milio confirme lesquelles
// sont correctes et fournisse les vraies données fournisseur.

export type Garment = 'tshirt' | 'sweat' | 'chemise' | 'casquette';
export type Emplacement = 'face' | 'coeur' | 'dos';

// Les zones d'impression varient aussi selon la taille du vêtement
// (section 7) : la clé "unique" est un placeholder tant qu'une seule
// valeur est disponible par emplacement. Ajouter "S" | "M" | "L"... ici
// le jour où les largeurs par taille seront fournies.
type Taille = 'unique';

export const zonesImpressionCm: Record<Garment, Record<Emplacement, Record<Taille, number>>> = {
  tshirt: {
    face: { unique: 28 },
    coeur: { unique: 10 },
    dos: { unique: 30 },
  },
  sweat: {
    face: { unique: 26 },
    coeur: { unique: 10 },
    dos: { unique: 30 },
  },
  chemise: {
    face: { unique: 9 },
    coeur: { unique: 9 },
    dos: { unique: 26 },
  },
  casquette: {
    face: { unique: 12 },
    coeur: { unique: 12 }, // sans effet : le cœur est désactivé sur casquette
    dos: { unique: 9 },
  },
};

export function getZoneImpressionCm(garment: Garment, emplacement: Emplacement, taille: Taille = 'unique'): number {
  return zonesImpressionCm[garment][emplacement][taille];
}

// Seuils de recommandation sérigraphie vs transfert — à recaler sur le
// coût réel de calage (section 7).
export const seuils = {
  quantitePiecesSerigraphie: 30,
  couleursSerigraphieSousLeSeuilQuantite: 4,
  couleursSerigraphieAuDessusDuSeuilQuantite: 6,
};

// Délais annoncés — à confirmer selon la charge atelier (section 7).
export const delais = {
  standardJoursOuvres: 10,
  expressJoursOuvres: 5,
};

// Coût fournisseur de base du support unique du personnalisateur —
// PROVISOIRE. Le personnalisateur ne modélise pour l'instant qu'un seul
// produit générique ("T-shirt col rond unisexe, 180 g/m²") ; il sera
// décliné par référence réelle du catalogue quand celles-ci auront
// chacune leur propre coût (voir src/data/tshirts.ts pour le modèle à
// terme). Valeur reprise telle quelle de la maquette validée.
export const coutBaseSupportUnique = 4.1;

export type TailleCode = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export const TAILLES: TailleCode[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const repartitionTaillesParDefaut: Record<TailleCode, number> = { XS: 0, S: 6, M: 10, L: 8, XL: 4, XXL: 2 };

// Catalogue coloris — 10 teintes génériques, à remplacer par les vrais
// coloris des références fournisseur (section 7).
export const catalogueColoris = [
  { nom: 'Blanc', hex: '#FFFFFF' },
  { nom: 'Gris chiné', hex: '#C8C8CE' },
  { nom: 'Noir', hex: '#1B1B1F' },
  { nom: 'Bleu marine', hex: '#20304F' },
  { nom: 'Indigo Presstee', hex: '#9d83cf' },
  { nom: 'Jaune Presstee', hex: '#ffd77a' },
  { nom: 'Rouge', hex: '#BF3B32' },
  { nom: 'Vert bouteille', hex: '#1F5A4A' },
  { nom: 'Bleu ciel', hex: '#93BFE6' },
  { nom: 'Sable', hex: '#E4D6BD' },
];
