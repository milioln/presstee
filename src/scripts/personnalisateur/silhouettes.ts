// Système paramétrique de silhouettes à plat — col, manches et coupe.
// Construit des tracés SVG cohérents (mêmes conventions que la V0 :
// viewBox 400x460, fermoirs aux coutures) à partir de quelques tables de
// coordonnées, plutôt que de dessiner chaque combinaison séparément.
export type Coupe = 'droite' | 'oversize';
export type Manche = 'courte' | 'longue';
export type Col = 'rond' | 'v';

interface Pt {
  x: number;
  y: number;
}

interface FitParams {
  shoulderY: number;
  neckHalfW: number;
  tipOffX: number;
  tipOffY: number;
  armpitHalfW: number;
  armpitY: number;
  hemY: number;
  hemYOuter: number;
  hemHalfW: number;
}

// Coupe droite = numéros de la V0 d'origine (silhouette inchangée par
// défaut). Coupe oversize = épaules tombantes, emmanchure plus basse,
// carrure plus large, longueur augmentée.
const FIT: Record<Coupe, FitParams> = {
  droite: { shoulderY: 54, neckHalfW: 52, tipOffX: 30, tipOffY: 10, armpitHalfW: 78, armpitY: 136, hemY: 420, hemYOuter: 428, hemHalfW: 78 },
  oversize: { shoulderY: 60, neckHalfW: 60, tipOffX: 40, tipOffY: 6, armpitHalfW: 100, armpitY: 160, hemY: 436, hemYOuter: 444, hemHalfW: 104 },
};

interface SleeveCourteParams {
  outerDX: number;
  outerDY: number;
  hemDX: number;
  hemDY: number;
}
interface SleeveLongueParams {
  ctrlDX: number;
  ctrlDY: number;
  wristDX: number;
  wristDY: number;
  cuffW: number;
}

const SLEEVE_COURTE: Record<Coupe, SleeveCourteParams> = {
  droite: { outerDX: -66, outerDY: 48, hemDX: -22, hemDY: 112 },
  oversize: { outerDX: -80, outerDY: 52, hemDX: -30, hemDY: 126 },
};

const SLEEVE_LONGUE: Record<Coupe, SleeveLongueParams> = {
  droite: { ctrlDX: -48, ctrlDY: 156, wristDX: -58, wristDY: 316, cuffW: 38 },
  oversize: { ctrlDX: -60, ctrlDY: 170, wristDX: -64, wristDY: 330, cuffW: 46 },
};

const mirror = (p: Pt, axis = 200): Pt => ({ x: 2 * axis - p.x, y: p.y });
const fmt = (p: Pt) => `${p.x},${p.y}`;

function neckPoints(fit: FitParams): { neckL: Pt; neckR: Pt; tipL: Pt; tipR: Pt } {
  const neckL = { x: 200 - fit.neckHalfW, y: fit.shoulderY };
  const neckR = mirror(neckL);
  const tipL = { x: neckL.x - fit.tipOffX, y: neckL.y - fit.tipOffY };
  const tipR = mirror(tipL);
  return { neckL, neckR, tipL, tipR };
}

// Un bras est décrit par 2 ou 3 points relatifs à l'épaule (tip), du côté
// `sign` (+1 gauche, -1 droite). `forward` part de tip et rejoint
// l'emmanchure (armpit) ; `backward` fait le trajet inverse — utile car
// le tracé du buste traverse une manche dans un sens à gauche et dans
// l'autre à droite.
function sleevePoints(tip: Pt, coupe: Coupe, manche: Manche, sign: number): Pt[] {
  if (manche === 'courte') {
    const s = SLEEVE_COURTE[coupe];
    return [
      { x: tip.x + sign * s.outerDX, y: tip.y + s.outerDY },
      { x: tip.x + sign * s.hemDX, y: tip.y + s.hemDY },
    ];
  }
  const s = SLEEVE_LONGUE[coupe];
  const wristOuter = { x: tip.x + sign * s.wristDX, y: tip.y + s.wristDY };
  const wristInner = { x: wristOuter.x - sign * s.cuffW, y: wristOuter.y };
  return [wristOuter, wristInner];
}

function sleeveCtrl(tip: Pt, coupe: Coupe, sign: number): Pt {
  const s = SLEEVE_LONGUE[coupe];
  return { x: tip.x + sign * s.ctrlDX, y: tip.y + s.ctrlDY };
}

function sleeveForward(tip: Pt, armpit: Pt, coupe: Coupe, manche: Manche, sign: number): string {
  const [a, b] = sleevePoints(tip, coupe, manche, sign);
  if (manche === 'courte') return `L${fmt(a)} L${fmt(b)} L${fmt(armpit)}`;
  return `Q${fmt(sleeveCtrl(tip, coupe, sign))} ${fmt(a)} L${fmt(b)} L${fmt(armpit)}`;
}

function sleeveBackward(armpit: Pt, tip: Pt, coupe: Coupe, manche: Manche, sign: number): string {
  const [a, b] = sleevePoints(tip, coupe, manche, sign);
  if (manche === 'courte') return `L${fmt(b)} L${fmt(a)} L${fmt(tip)}`;
  return `L${fmt(b)} L${fmt(a)} Q${fmt(sleeveCtrl(tip, coupe, sign))} ${fmt(tip)}`;
}

function necklineCurve(fit: FitParams, col: Col, isBack: boolean): string {
  // Le dos reste toujours discrètement arrondi, même sur un col V —
  // c'est aussi le cas sur un vrai vêtement.
  if (isBack || col === 'rond') {
    const depth = isBack ? 24 : 46;
    return `Q200,${fit.shoulderY + depth}`;
  }
  return `L200,${fit.shoulderY + 80}`;
}

function ribbingAccent(fit: FitParams, col: Col, isBack: boolean): string {
  const { neckL, neckR } = neckPoints(fit);
  const inL = { x: neckL.x + 10, y: neckL.y + 10 };
  const inR = { x: neckR.x - 10, y: neckR.y + 10 };
  if (isBack || col === 'rond') {
    const depth = (isBack ? 24 : 46) - 6;
    return `M${fmt(inL)} Q200,${fit.shoulderY + depth} ${fmt(inR)}`;
  }
  const v = { x: 200, y: fit.shoulderY + 70 };
  return `M${fmt(inL)} L${fmt(v)} L${fmt(inR)}`;
}

// Silhouette t-shirt / sweat (même famille de patron : col rond ou V,
// manches courtes ou longues, coupe droite ou oversize). `hemOverride`
// permet au sweat de raccourcir le corps pour laisser place à la bande
// de bord-côte (hemBand) sans dupliquer toute la géométrie des manches.
export function teeLikeBody(
  coupe: Coupe,
  manche: Manche,
  col: Col,
  side: 0 | 1,
  hemOverride?: { hemY: number; hemYOuter: number }
): { body: string; lines: string[] } {
  const fit = FIT[coupe];
  const { neckL, neckR, tipL, tipR } = neckPoints(fit);
  const armpitL: Pt = { x: 200 - fit.armpitHalfW, y: fit.armpitY };
  const armpitR = mirror(armpitL);
  const hemY = hemOverride?.hemY ?? fit.hemY;
  const hemYOuter = hemOverride?.hemYOuter ?? fit.hemYOuter;
  const hemTopL: Pt = { x: 200 - fit.hemHalfW, y: hemY };
  const hemTopR = mirror(hemTopL);
  const hemCornerL: Pt = { x: hemTopL.x + 8, y: hemYOuter };
  const hemCornerR = mirror(hemCornerL);
  const isBack = side === 1;

  const d =
    `M${fmt(neckL)} L${fmt(tipL)} ` +
    `${sleeveForward(tipL, armpitL, coupe, manche, 1)} ` +
    `L${fmt(hemTopL)} Q${fmt(hemCornerL)} ${fmt(hemCornerL)} L${fmt(hemTopR)} Q${fmt(hemCornerR)} ${fmt(hemCornerR)} L${fmt(armpitR)} ` +
    `${sleeveBackward(armpitR, tipR, coupe, manche, -1)} ` +
    `L${fmt(neckR)} ${necklineCurve(fit, col, isBack)} ${fmt(neckL)} Z`;

  const lines = [ribbingAccent(fit, col, isBack), `M${fmt(armpitL)} L${armpitL.x},${armpitL.y + 14}`, `M${fmt(armpitR)} L${armpitR.x},${armpitR.y + 14}`];

  return { body: d, lines };
}

// Bande de bord-côte au bas d'un sweat (ajoutée sous un torse raccourci).
export function hemBand(coupe: Coupe): string {
  const fit = FIT[coupe];
  const topY = fit.hemY - 30;
  const halfW = fit.hemHalfW;
  const bottomY = fit.hemYOuter;
  return `M${200 - halfW},${topY} L${200 + halfW},${topY} L${200 + halfW},${bottomY - 4} Q${200 + halfW},${bottomY} ${200 + halfW - 4},${bottomY} L${200 - halfW + 4},${bottomY} Q${200 - halfW},${bottomY} ${200 - halfW},${bottomY - 4} Z`;
}

export function sweatHemInfo(coupe: Coupe): { hemY: number; hemYOuter: number; halfW: number } {
  const fit = FIT[coupe];
  return { hemY: fit.hemY - 30, hemYOuter: fit.hemYOuter, halfW: fit.hemHalfW };
}

// Silhouette chemise : col ouvert fixe (pas de variante rond/V), manches
// et coupe paramétrables, avec col, patte de boutonnage et poche avant.
export function chemiseBody(coupe: Coupe, manche: Manche, side: 0 | 1): { body: string; collar: string[]; placket?: string; buttons: number[]; pocket?: string } {
  const fit = FIT[coupe];
  const { neckL, neckR, tipL, tipR } = neckPoints(fit);
  const armpitL: Pt = { x: 200 - fit.armpitHalfW, y: fit.armpitY };
  const armpitR = mirror(armpitL);
  const hemTopL: Pt = { x: 200 - fit.hemHalfW, y: fit.hemY };
  const hemTopR = mirror(hemTopL);
  const hemCornerL: Pt = { x: hemTopL.x + 8, y: fit.hemYOuter };
  const hemCornerR = mirror(hemCornerL);
  const chin: Pt = { x: 200, y: fit.shoulderY + 44 };

  const body =
    `M${fmt(neckL)} L${fmt(tipL)} ` +
    `${sleeveForward(tipL, armpitL, coupe, manche, 1)} ` +
    `L${fmt(hemTopL)} Q${fmt(hemCornerL)} ${fmt(hemCornerL)} L${fmt(hemTopR)} Q${fmt(hemCornerR)} ${fmt(hemCornerR)} L${fmt(armpitR)} ` +
    `${sleeveBackward(armpitR, tipR, coupe, manche, -1)} ` +
    `L${fmt(neckR)} L${fmt(chin)} L${fmt(neckL)} Z`;

  const peakL: Pt = { x: neckL.x + 16, y: fit.shoulderY - 12 };
  const peakR = mirror(peakL);
  const collar = [`M${fmt(neckL)} L${fmt(chin)} L${fmt(peakL)} Z`, `M${fmt(neckR)} L${fmt(chin)} L${fmt(peakR)} Z`];

  if (side === 1) {
    return { body, collar: [], buttons: [] };
  }

  const placketTop = fit.shoulderY + 32;
  const placketBottom = fit.hemYOuter;
  const buttonCount = 6;
  const buttons: number[] = [];
  for (let i = 0; i < buttonCount; i++) {
    buttons.push(Math.round(placketTop + 44 + (i * (placketBottom - placketTop - 90)) / (buttonCount - 1)));
  }
  const placket = `M191,${placketTop} L191,${placketBottom} L209,${placketBottom} L209,${placketTop} Z`;
  const pocketX = armpitL.x + 22;
  const pocketY = armpitL.y + 18;
  const pocket = `M${pocketX},${pocketY} L${pocketX + 40},${pocketY} L${pocketX + 40},${pocketY + 44} L${pocketX + 20},${pocketY + 56} L${pocketX},${pocketY + 44} Z`;

  return { body, collar, placket, buttons, pocket };
}
