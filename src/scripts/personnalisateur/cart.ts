// Panier et projets enregistrés — deux listes de calques distinctes,
// persistées dans le navigateur comme le reste de l'état :
// - le panier sert à regrouper plusieurs projets avant d'envoyer un
//   seul devis groupé ;
// - "mes projets" sert à mettre un brouillon de côté sans l'écraser en
//   démarrant un nouveau visuel (aujourd'hui, un seul projet "actif"
//   existe à la fois — commencer un nouveau visuel remplacerait le
//   précédent sans ça).
// Chaque entrée est un instantané (snapshot) : les prix sont figés au
// moment de l'ajout, pour que le panier n'affiche pas un total qui
// change silencieusement si les tarifs évoluent ensuite.
import { S, type Coloris, type Layer, type DesignHelp } from './state';
import { qtyTotal, prixUnitaire, prixTotal } from './derived';
import { activeTech } from './render';
import { TECHS, type TechKey } from './recommendation';
import { coutBaseSupportUnique, type Garment, type TailleCode } from '../../config/parametres-metier';
import { GARMENTS } from './garments';

export interface SavedItem {
  id: string;
  savedAt: number;
  garment: Garment;
  color: Coloris;
  layers: Layer[];
  sizeDist: Record<TailleCode, number>;
  tech: TechKey | 'auto';
  delai: 'standard' | 'express';
  techNom: string;
  qty: number;
  prixUnitaire: number;
  prixTotal: number;
  designHelp: DesignHelp;
  coutBase: number;
}

const CART_KEY = 'presstee:personnalisateur:panier';
const SAVED_KEY = 'presstee:personnalisateur:projets';

function readList(key: string): SavedItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: SavedItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé...) : on
    // n'interrompt jamais l'expérience pour une persistance qui échoue.
  }
}

export function getCart(): SavedItem[] {
  return readList(CART_KEY);
}

export function getSaved(): SavedItem[] {
  return readList(SAVED_KEY);
}

export function snapshotCurrent(): SavedItem {
  return {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
    garment: S.garment,
    color: S.color,
    layers: JSON.parse(JSON.stringify(S.layers)),
    sizeDist: { ...S.sizeDist },
    tech: S.tech,
    delai: S.delai,
    techNom: TECHS[activeTech()].n,
    qty: qtyTotal(),
    prixUnitaire: prixUnitaire(),
    prixTotal: prixTotal(),
    designHelp: { ...S.designHelp },
    coutBase: S.coutBase,
  };
}

export function addToCart(): SavedItem {
  const item = snapshotCurrent();
  const cart = getCart();
  cart.push(item);
  writeList(CART_KEY, cart);
  return item;
}

export function saveProject(): SavedItem {
  const item = snapshotCurrent();
  const saved = getSaved();
  saved.push(item);
  writeList(SAVED_KEY, saved);
  return item;
}

export function removeFromCart(id: string): void {
  writeList(CART_KEY, getCart().filter((i) => i.id !== id));
}

export function removeSaved(id: string): void {
  writeList(SAVED_KEY, getSaved().filter((i) => i.id !== id));
}

export function clearCart(): void {
  writeList(CART_KEY, []);
}

// L'appelant (main.ts) enregistre ici comment repeindre tout l'écran
// après un rechargement massif de S — ce module n'a pas à connaître le
// détail des fonctions de peinture pour éviter un couplage circulaire.
let onLoaded: () => void = () => {};
export function bindOnLoaded(fn: () => void): void {
  onLoaded = fn;
}

// Recharge un projet enregistré dans l'éditeur en cours — remplace
// entièrement l'état actif (calques, coloris, répartition, technique,
// délai) puis déclenche le repeint complet de l'écran.
export function loadSaved(id: string): void {
  const item = getSaved().find((i) => i.id === id);
  if (!item) return;
  S.garment = item.garment;
  S.color = item.color;
  S.layers = JSON.parse(JSON.stringify(item.layers));
  S.activeLayerId = S.layers[0]?.id ?? null;
  S.place = S.layers[0]?.place ?? 'face';
  S.sizeDist = { ...item.sizeDist };
  S.tech = item.tech;
  S.delai = item.delai;
  S.designHelp = { ...item.designHelp };
  // ?? plutôt qu'une affectation directe : un projet enregistré avant
  // l'ajout du champ coutBase (navigateur pas encore rechargé) n'en a
  // pas — retombe sur le coût générique plutôt que de casser le calcul.
  S.coutBase = item.coutBase ?? coutBaseSupportUnique;
  onLoaded();
}

function summarizeItem(item: SavedItem, index?: number): string {
  const sizes = Object.entries(item.sizeDist)
    .filter(([, n]) => (n as number) > 0)
    .map(([taille, n]) => `${taille}: ${n}`)
    .join(', ');
  const dh = item.designHelp;
  const wantsDesignHelp = item.layers.length === 0 && (dh.colors != null || dh.format || dh.notes);
  const besoinQualite = item.layers.some((l) => l.qualiteAssistance);
  const lines = [
    index != null ? `Projet ${index + 1}` : null,
    `- Support : ${GARMENTS[item.garment].name}`,
    `- Coloris : ${item.color.nom}`,
    `- Technique : ${item.techNom}`,
    `- Tailles : ${sizes || 'non renseignées'} (${item.qty} pièce${item.qty > 1 ? 's' : ''})`,
    `- Délai : ${item.delai === 'express' ? 'Express (5 jours ouvrés)' : 'Standard (10 jours ouvrés)'}`,
    `- Estimation : ${item.prixUnitaire.toFixed(2).replace('.', ',')} € / pièce, soit ${item.prixTotal.toFixed(2).replace('.', ',')} € au total`,
    item.layers.length === 0 ? "- Visuel : pas encore de fichier — le client souhaite un accompagnement design" : null,
    wantsDesignHelp && dh.colors != null ? `  · Couleurs souhaitées : ${dh.colors >= 12 ? '12 et plus / dégradé' : dh.colors}` : null,
    wantsDesignHelp && dh.format ? `  · Format ou emplacement : ${dh.format}` : null,
    wantsDesignHelp && dh.notes ? `  · Description : ${dh.notes}` : null,
    // Le client a coché "laissez-nous nous en occuper" sur un avertissement
    // de résolution basse plutôt que d'être bloqué (Milio, 2026-09-09).
    besoinQualite ? '- ⚠ Résolution à vérifier : le client nous laisse améliorer le fichier avant impression.' : null,
  ].filter((l): l is string => l != null);
  return lines.join('\n');
}

// Le brief affiché sur /demande-devis, plutôt qu'un mailto: ouvert
// directement au clic (Milio, 2026-09-09 : voir le projet, ajouter des
// précisions, une référence de bon de commande et une date souhaitée
// avant d'envoyer). L'envoi lui-même reste un mailto: — un vrai
// formulaire vers un backend reste volontairement hors de portée tant
// que le SIRET n'est pas renseigné (cf. config/site.ts) : mailto: ne
// dépend d'aucun serveur ni d'aucune collecte de données côté site.
export function briefForCurrent(): string {
  return summarizeItem(snapshotCurrent());
}

export function briefForCart(): string {
  return briefForItems(getCart());
}

// Sous-ensemble explicite du panier (ex. un seul article visé depuis
// l'aperçu du bon à tirer, /bon-a-tirer?id=...) — même gabarit que
// briefForCart, sans dépendre de tout le panier.
export function briefForItems(items: SavedItem[]): string {
  return items.map((it, i) => summarizeItem(it, items.length > 1 ? i : undefined)).join('\n\n');
}

// Visuels déposés, à proposer en téléchargement sur /demande-devis
// (Milio, 2026-09-09 — mailto: ne sait pas les joindre lui-même).
export function visuelsForCurrent(): { fileName: string; dataUrl: string }[] {
  return S.layers.map((l) => ({ fileName: l.fileName, dataUrl: l.img }));
}

export function visuelsForCart(): { fileName: string; dataUrl: string }[] {
  return visuelsForItems(getCart());
}

export function visuelsForItems(items: SavedItem[]): { fileName: string; dataUrl: string }[] {
  return items.flatMap((it) => it.layers.map((l) => ({ fileName: l.fileName, dataUrl: l.img })));
}
