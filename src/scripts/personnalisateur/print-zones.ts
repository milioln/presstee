// Zones d'impression et échelle de texture — SOURCE UNIQUE, réutilisée par
// les trois instances du modèle 3D (configurateur : render.ts/drag3d.ts ;
// vignette d'accueil : hero/tshirt-hero.ts ; modèle du quiz :
// commencer-3d.ts). Auparavant dupliqué dans les trois fichiers ; les trois
// pointent maintenant ici pour ne plus jamais diverger (demande Milio,
// 2026-09-09 : « déduplique-moi les constantes »).
//
// Calibré empiriquement sur l'atlas de texture (patron à plat 2048×2048)
// en affichant une grille de repères sur le modèle chargé et en relevant
// où ils tombent sur le tissu — voir l'historique détaillé des réglages
// dans l'ancien render.ts (conservé dans git) : "coeur" recalé le
// 2026-09-03, "face"/"dos" élargis le 2026-09-04, manches ajoutées le
// 2026-09-08.
//
// "coeur" recalé une seconde fois le 2026-09-09 (Milio : « la zone cœur
// n'est pas la bonne, tu as fait une zone verticale, il faut une zone
// horizontale, on est bien sur du dix par huit ») : l'ancien rectangle
// (130×280) était portrait alors que la zone doit être une carte de
// visite à l'horizontale, ratio 10×8 cm. Repris à 210×168 (même ratio
// 1,25), centre conservé (695, 890) pour ne pas redéplacer la zone déjà
// validée sur le buste.
import type { Emplacement } from '../../config/parametres-metier';

export const TEXTURE_SIZE = 2048;

export const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
  face: { x: 324, y: 210, w: 580, h: 750 },
  coeur: { x: 590, y: 806, w: 210, h: 168 },
  dos: { x: 1238, y: 210, w: 580, h: 750 },
  'manche-droite': { x: 750, y: 1325, w: 480, h: 195 },
  'manche-gauche': { x: 1360, y: 1325, w: 540, h: 195 },
};

// Tous les panneaux sont inversés verticalement dans l'atlas — vérifié
// empiriquement pour les manches avec un repère directionnel (une lettre
// asymétrique) le 2026-09-08 : jamais fier d'une lecture rapide sur la
// surface courbe, toujours revérifier avec un mot lisible sous plusieurs
// angles.
export const PANEL_SCALE: Record<Emplacement, { x: number; y: number }> = {
  face: { x: 1, y: -1 },
  coeur: { x: 1, y: -1 },
  dos: { x: 1, y: -1 },
  'manche-droite': { x: 1, y: -1 },
  'manche-gauche': { x: 1, y: -1 },
};
