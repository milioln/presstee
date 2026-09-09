// Silhouettes SVG et géométrie des vêtements — port direct de la V0.
// Les pourcentages x/y/w/h des zones d'impression sont liés aux tracés
// SVG eux-mêmes (pas des données métier) : ils restent ici. Les largeurs
// en cm viennent de src/config/parametres-metier.ts.
import { getZoneImpressionCm, type Emplacement, type Garment } from '../../config/parametres-metier';
import type { Coupe, Manche, Col } from './silhouettes';

export interface Variant {
  coupe: Coupe;
  manche: Manche;
  col: Col;
}

export const VARIANT_DEFAUT: Variant = { coupe: 'droite', manche: 'courte', col: 'rond' };

// Caractéristiques pertinentes par famille — une casquette n'a ni col ni
// manches, un sweat n'a pas de version manches courtes, une chemise a un
// col fixe (patte de boutonnage) donc pas de variante rond/V.
export const CARACTERISTIQUES: Record<Garment, { col?: Col[]; manche?: Manche[]; coupe?: Coupe[] }> = {
  tshirt: { col: ['rond', 'v'], manche: ['courte', 'longue'], coupe: ['droite', 'oversize'] },
  sweat: { coupe: ['droite', 'oversize'] },
  chemise: { manche: ['courte', 'longue'], coupe: ['droite', 'oversize'] },
  casquette: {},
};

const TEE_F = 'M148,54 L118,44 L52,92 L96,156 L122,136 L122,420 Q122,428 130,428 L270,428 Q278,428 278,420 L278,136 L304,156 L348,92 L282,44 L252,54 Q200,100 148,54 Z';
const TEE_B = 'M148,54 L118,44 L52,92 L96,156 L122,136 L122,420 Q122,428 130,428 L270,428 Q278,428 278,420 L278,136 L304,156 L348,92 L282,44 L252,54 Q200,78 148,54 Z';
const SW = 'M150,52 L112,42 L40,102 L88,170 L118,144 L118,390 L282,390 L282,144 L312,170 L360,102 L288,42 L250,52 Q200,98 150,52 Z';
const SW_HEM = 'M118,390 L282,390 L282,428 Q282,432 278,432 L122,432 Q118,432 118,428 Z';
const SH = 'M156,52 L120,44 L62,94 L102,152 L124,134 L124,424 Q124,430 130,430 L270,430 Q276,430 276,424 L276,134 L298,152 L338,94 L280,44 L244,52 L200,96 Z';
const CAP = 'M84,206 C84,118 136,62 200,62 C264,62 316,118 316,206 Z';
const CAP_BRIM = 'M74,204 C74,250 132,270 200,270 C268,270 326,250 326,204 Z';

interface FlatView {
  body: string;
  extra?: string;
  brim?: string;
  gap?: string;
  lines?: string[];
  collar?: string[];
  placket?: string;
  buttons?: number[];
  pocket?: string;
  dot?: [number, number];
}

interface PrintZone {
  flat: { x: number; y: number; w: number; h: number };
  worn: { x: number; y: number; w: number; h: number };
}

interface GarmentDef {
  name: string;
  icon: string;
  noCoeur?: boolean;
  noManche?: boolean;
  flat: [FlatView, FlatView];
  // Partiel plutôt que complet : ces zones flat/worn ne sont utilisées
  // par aucun code (vestiges de l'ancienne illustration à plat, avant le
  // vrai modèle 3D — cf. render.ts) ; pas besoin de les renseigner pour
  // les manches.
  print: Partial<Record<Emplacement, PrintZone>>;
}

export const GARMENTS: Record<Garment, GarmentDef> = {
  tshirt: {
    name: 'T-shirt',
    icon: TEE_F,
    flat: [
      { body: TEE_F, lines: ['M148,54 Q200,100 252,54', 'M158,64 Q200,94 242,64', 'M122,136 L122,150', 'M278,136 L278,150'] },
      { body: TEE_B, lines: ['M148,54 Q200,78 252,54', 'M122,136 L122,150', 'M278,136 L278,150'] },
    ],
    print: {
      face: { flat: { x: 33, y: 25, w: 34, h: 35 }, worn: { x: 39, y: 50, w: 22, h: 24 } },
      coeur: { flat: { x: 53, y: 30, w: 13, h: 11 }, worn: { x: 53, y: 51, w: 11, h: 10 } },
      dos: { flat: { x: 33, y: 22, w: 34, h: 38 }, worn: { x: 39, y: 47, w: 22, h: 26 } },
    },
  },
  sweat: {
    name: 'Sweat',
    icon: SW,
    flat: [
      { body: SW, extra: SW_HEM, lines: ['M150,52 Q200,98 250,52', 'M160,62 Q200,90 240,62', 'M118,390 L282,390'] },
      { body: SW, extra: SW_HEM, lines: ['M150,52 Q200,76 250,52', 'M118,390 L282,390'] },
    ],
    print: {
      face: { flat: { x: 35, y: 29, w: 30, h: 30 }, worn: { x: 39, y: 52, w: 22, h: 22 } },
      coeur: { flat: { x: 54, y: 32, w: 12, h: 10 }, worn: { x: 53, y: 53, w: 11, h: 9 } },
      dos: { flat: { x: 33, y: 25, w: 34, h: 36 }, worn: { x: 39, y: 50, w: 22, h: 24 } },
    },
  },
  chemise: {
    name: 'Chemise',
    icon: SH,
    flat: [
      {
        body: SH,
        lines: ['M124,134 L124,150', 'M276,134 L276,150'],
        collar: ['M156,52 L200,96 L172,42 Z', 'M244,52 L200,96 L228,42 Z'],
        placket: 'M191,84 L191,430 L209,430 L209,84 Z',
        buttons: [130, 180, 230, 280, 330, 380],
        pocket: 'M146,152 L186,152 L186,196 L166,208 L146,196 Z',
      },
      { body: SH, lines: ['M124,126 L276,126', 'M124,134 L124,150', 'M276,134 L276,150'] },
    ],
    print: {
      face: { flat: { x: 53, y: 28, w: 14, h: 12 }, worn: { x: 54, y: 52, w: 11, h: 10 } },
      coeur: { flat: { x: 53, y: 28, w: 14, h: 12 }, worn: { x: 54, y: 52, w: 11, h: 10 } },
      dos: { flat: { x: 33, y: 24, w: 34, h: 34 }, worn: { x: 39, y: 48, w: 22, h: 24 } },
    },
  },
  casquette: {
    name: 'Casquette',
    icon: CAP,
    noCoeur: true,
    noManche: true,
    flat: [
      { body: CAP, brim: CAP_BRIM, lines: ['M200,62 L200,206', 'M142,72 C122,118 118,164 120,206', 'M258,72 C278,118 282,164 280,206'], dot: [200, 68] },
      { body: CAP, lines: ['M200,62 L200,150', 'M142,72 C122,118 118,164 120,206', 'M258,72 C278,118 282,164 280,206'], gap: 'M166,150 L234,150 L234,206 L166,206 Z', dot: [200, 68] },
    ],
    print: {
      face: { flat: { x: 34, y: 21, w: 32, h: 18 }, worn: { x: 41, y: 13, w: 18, h: 9 } },
      coeur: { flat: { x: 34, y: 21, w: 32, h: 18 }, worn: { x: 41, y: 13, w: 18, h: 9 } },
      dos: { flat: { x: 37, y: 24, w: 26, h: 13 }, worn: { x: 43, y: 15, w: 14, h: 7 } },
    },
  },
};

export function zoneCm(garment: Garment, emplacement: Emplacement): number {
  return getZoneImpressionCm(garment, emplacement);
}

const TOUS_EMPLACEMENTS: Emplacement[] = ['face', 'coeur', 'dos', 'manche-droite', 'manche-gauche'];

// Emplacements réellement proposables pour un vêtement — dérivé de
// GARMENTS[garment].noCoeur/.noManche (déjà la source utilisée par
// place() dans derived.ts pour rabattre silencieusement une sélection
// invalide sur "face") plutôt que d'inventer une deuxième liste qui
// pourrait diverger. Sert au quiz et au configurateur pour ne plus
// PROPOSER une zone qui de toute façon ne s'appliquerait pas (Milio,
// 2026-09-09 : « si c'est une casquette, il ne faut pas mettre cœur »).
export function emplacementsValides(garment: Garment): Emplacement[] {
  const g = GARMENTS[garment];
  return TOUS_EMPLACEMENTS.filter((e) => !(g.noCoeur && e === 'coeur') && !(g.noManche && (e === 'manche-droite' || e === 'manche-gauche')));
}
