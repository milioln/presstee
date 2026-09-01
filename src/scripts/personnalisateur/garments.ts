// Silhouettes SVG et géométrie des vêtements — port direct de la V0.
// Les pourcentages x/y/w/h des zones d'impression sont liés aux tracés
// SVG eux-mêmes (pas des données métier) : ils restent ici. Les largeurs
// en cm viennent de src/config/parametres-metier.ts.
import { getZoneImpressionCm, type Emplacement, type Garment } from '../../config/parametres-metier';
import { teeLikeBody, chemiseBody, hemBand, sweatHemInfo, type Coupe, type Manche, type Col } from './silhouettes';

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

const SKIN = '#E7C3A0';
const HAIR = '#3B3242';
const NEUTRE = '#D8D6DE';
const BUST = 'M164,178 L136,170 L74,214 L114,274 L142,254 L142,442 L258,442 L258,254 L286,274 L326,214 L264,170 L236,178 Q200,208 164,178 Z';
const BUST_LONG = 'M164,178 L134,168 L66,220 L112,290 L142,262 L142,442 L258,442 L258,262 L288,290 L334,220 L266,168 L236,178 Q200,208 164,178 Z';
// Buste porté, coupe oversize : carrure et torse élargis (mêmes écarts
// que BUST_LONG vs BUST, appliqués à un tour de buste plus large).
const BUST_OVERSIZE = 'M156,178 L124,168 L60,216 L100,278 L126,256 L126,442 L274,442 L274,256 L300,278 L340,216 L276,168 L244,178 Q200,212 156,178 Z';
const BUST_LONG_OVERSIZE = 'M156,178 L122,166 L52,222 L98,294 L126,264 L126,442 L274,442 L274,264 L302,294 L348,222 L278,166 L244,178 Q200,212 156,178 Z';
const ARM_L = 'M114,274 L100,442 L142,442 L142,258 Z';
const ARM_R = 'M286,274 L300,442 L258,442 L258,258 Z';
const ARM_WAVE = 'M286,266 L330,176 Q338,162 325,155 Q311,148 304,162 L260,248 Z';

export function bustSVG(g: Garment, side: 0 | 1, color: string, dark: boolean, variant: Variant = VARIANT_DEFAUT): string {
  const seam = dark ? 'rgba(255,255,255,.30)' : 'rgba(23,19,31,.16)';
  const edge = dark ? 'rgba(255,255,255,.16)' : 'rgba(23,19,31,.13)';
  const cap = g === 'casquette';
  // Le sweat est toujours manches longues ; le t-shirt et la chemise
  // suivent le choix de manches courant.
  const long = g === 'sweat' || variant.manche === 'longue';
  const oversize = g !== 'casquette' && variant.coupe === 'oversize';
  const body = cap ? NEUTRE : color;
  const wear = oversize ? (long ? BUST_LONG_OVERSIZE : BUST_OVERSIZE) : long ? BUST_LONG : BUST;
  let s = `<svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  if (side === 1) {
    s += `<circle cx="200" cy="112" r="47" fill="${HAIR}"/>`;
  } else {
    s += `<circle cx="200" cy="112" r="47" fill="${SKIN}"/>`;
    s += `<path d="M154,108 Q157,60 200,60 Q243,60 246,108 Q233,82 200,82 Q167,82 154,108 Z" fill="${HAIR}"/>`;
    s += `<circle cx="184" cy="116" r="4.5" fill="${HAIR}"/><circle cx="216" cy="116" r="4.5" fill="${HAIR}"/>`;
    s += `<path d="M186,134 Q200,146 214,134" fill="none" stroke="${HAIR}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  s += `<path d="M180,148 L220,148 L220,186 L180,186 Z" fill="${SKIN}"/>`;
  if (cap) {
    s += `<path d="M152,112 C152,64 174,42 200,42 C226,42 248,64 248,112 Z" fill="${color}" stroke="${edge}" stroke-width="2"/>`;
    s +=
      side === 0
        ? `<path d="M142,110 C142,134 170,144 200,144 C230,144 258,134 258,110 Z" fill="${color}" stroke="${edge}" stroke-width="2"/>`
        : `<path d="M176,92 L224,92 L224,112 L176,112 Z" fill="${seam}"/>`;
    s += `<circle cx="200" cy="46" r="6" fill="${seam}"/>`;
  }
  const waving = side === 0 && !cap;
  s += `<path d="${ARM_L}" fill="${long ? color : SKIN}"/>`;
  s += `<path d="${waving ? ARM_WAVE : ARM_R}" fill="${long ? color : SKIN}"/>`;
  if (waving) s += `<circle cx="330" cy="150" r="17" fill="${SKIN}"/>`;
  if (!long) {
    s += `<circle cx="120" cy="446" r="15" fill="${SKIN}"/>`;
    if (!waving) s += `<circle cx="280" cy="446" r="15" fill="${SKIN}"/>`;
  }
  s += `<path d="${wear}" fill="${body}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>`;
  const neckXin = oversize ? 156 : 164;
  const neckXout = oversize ? 244 : 236;
  const isV = g === 'tshirt' && variant.col === 'v';
  const neckStroke =
    side === 0
      ? isV
        ? `M${neckXin},178 L200,${oversize ? 218 : 214} L${neckXout},178`
        : `M${neckXin},178 Q200,${oversize ? 212 : 208} ${neckXout},178`
      : `M${neckXin},178 Q200,${oversize ? 196 : 192} ${neckXout},178`;
  s += `<path d="${neckStroke}" fill="none" stroke="${cap ? 'rgba(23,19,31,.16)' : seam}" stroke-width="3" stroke-linecap="round"/>`;
  if (g === 'chemise') {
    const chinY = oversize ? 218 : 214;
    const peakY = chinY - 48;
    s += `<path d="M${neckXin},178 L200,${chinY} L${neckXin + 14},${peakY} Z" fill="${body}" stroke="${seam}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<path d="M${neckXout},178 L200,${chinY} L${neckXout - 14},${peakY} Z" fill="${body}" stroke="${seam}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<path d="M191,${chinY - 8} L191,442 M209,${chinY - 8} L209,442" fill="none" stroke="${seam}" stroke-width="2"/>`;
    [250, 300, 350, 400].forEach((cy) => (s += `<circle cx="200" cy="${cy}" r="4" fill="${seam}"/>`));
  }
  return s + `</svg>`;
}

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
  flat: [FlatView, FlatView];
  print: Record<Emplacement, PrintZone>;
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

export interface View {
  label: string;
  kind: 'flat' | 'worn';
  side: 0 | 1;
}

export const VIEWS: View[] = [
  { label: 'Face', kind: 'flat', side: 0 },
  { label: 'Dos', kind: 'flat', side: 1 },
  { label: 'Porté face', kind: 'worn', side: 0 },
  { label: 'Porté dos', kind: 'worn', side: 1 },
];

export function zoneCm(garment: Garment, emplacement: Emplacement): number {
  return getZoneImpressionCm(garment, emplacement);
}

// Calcule la vue à plat pour la famille et la variante (col/manches/coupe)
// choisies. La casquette n'a pas de variante : elle garde son tracé fixe.
function flatViewFor(g: Garment, side: 0 | 1, variant: Variant): FlatView {
  if (g === 'casquette') return GARMENTS.casquette.flat[side];

  if (g === 'chemise') {
    const r = chemiseBody(variant.coupe, variant.manche, side);
    return { body: r.body, collar: r.collar, placket: r.placket, buttons: r.buttons, pocket: r.pocket };
  }

  if (g === 'sweat') {
    // Un sweat est toujours manches longues et col rond, quel que soit
    // le dernier choix fait sur un t-shirt (S.manche/S.col persistent
    // entre familles, mais ne s'appliquent pas toutes aux deux).
    const hem = sweatHemInfo(variant.coupe);
    const r = teeLikeBody(variant.coupe, 'longue', 'rond', side, hem);
    const seamLine = `M${200 - hem.halfW},${hem.hemY} L${200 + hem.halfW},${hem.hemY}`;
    return { body: r.body, extra: hemBand(variant.coupe), lines: [...r.lines, seamLine] };
  }

  // tshirt
  const r = teeLikeBody(variant.coupe, variant.manche, variant.col, side);
  return { body: r.body, lines: r.lines };
}

export function flatSVG(g: Garment, side: 0 | 1, color: string, dark: boolean, variant: Variant = VARIANT_DEFAUT): string {
  const v = flatViewFor(g, side, variant);
  const seam = dark ? 'rgba(255,255,255,.30)' : 'rgba(23,19,31,.16)';
  const edge = dark ? 'rgba(255,255,255,.16)' : 'rgba(23,19,31,.13)';
  let s = `<svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  if (v.brim) s += `<path d="${v.brim}" fill="${color}" stroke="${edge}" stroke-width="2"/>`;
  s += `<path d="${v.body}" fill="${color}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>`;
  if (v.extra) s += `<path d="${v.extra}" fill="${color}" stroke="${edge}" stroke-width="2"/>`;
  if (v.gap) s += `<path d="${v.gap}" fill="${seam}"/>`;
  (v.collar || []).forEach((d) => (s += `<path d="${d}" fill="${color}" stroke="${seam}" stroke-width="2" stroke-linejoin="round"/>`));
  if (v.placket) s += `<path d="${v.placket}" fill="none" stroke="${seam}" stroke-width="2"/>`;
  if (v.pocket) s += `<path d="${v.pocket}" fill="none" stroke="${seam}" stroke-width="2" stroke-linejoin="round"/>`;
  (v.buttons || []).forEach((cy) => (s += `<circle cx="200" cy="${cy}" r="4" fill="${seam}"/>`));
  (v.lines || []).forEach((d) => (s += `<path d="${d}" fill="none" stroke="${seam}" stroke-width="2.5" stroke-linecap="round"/>`));
  if (v.dot) s += `<circle cx="${v.dot[0]}" cy="${v.dot[1]}" r="7" fill="${seam}"/>`;
  return s + `</svg>`;
}
