// Aperçu automatique du bon à tirer — recréation de BAT.dc.html (dossier
// de référence BAt/ fourni par Milio), généré entièrement côté client à
// partir du panier, juste après validation dans le configurateur.
//
// Ce n'est volontairement PAS le bon à tirer définitif et numéroté que
// l'atelier enverra pour signature avant production (le site est
// statique, sans backend de commandes côté client — cf. le choix déjà
// fait pour devis/facture) : c'est un aperçu instantané de ce qui serait
// produit, pour que le client vérifie visuel/coloris/emplacement/tailles
// avant même d'envoyer sa demande. Les blocs "décision" et "signature"
// du gabarit de référence sont donc remplacés par un appel à l'action
// vers l'envoi du devis, plutôt que reproduits tels quels : les faire
// figurer ici donnerait l'illusion à tort d'un engagement de production.
import type { SavedItem } from './cart';
import type { Layer } from './state';
import { GARMENTS } from './garments';
import { getZoneImpressionCm, type Emplacement } from '../../config/parametres-metier';
import { lum } from './color-utils';

const PLACE_LABEL: Record<Emplacement, string> = { face: 'Face', coeur: 'Cœur', dos: 'Dos' };
const PLACE_NOTE: Record<Emplacement, string> = {
  face: 'Centré, sous l’encolure',
  coeur: 'Emplacement cœur, côté porteur gauche',
  dos: 'Centré au dos',
};
// Zone d'impression en % de la boîte d'aperçu (x/y/w/h = position et
// taille de la zone complète dans laquelle le visuel peut être déplacé)
// et largeur du visuel en % de la boîte quand layer.w = 1 (100 % de la
// zone d'impression réelle). layer.x/y (0-1, position dans la zone) et
// layer.rot (degrés) — les réglages faits par le client sur le modèle
// 3D — servent à calculer la position et la rotation réelles du visuel
// affiché ici, pas seulement sa taille : cf. positionInZone ci-dessous.
interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
  maxWidthPct: number;
}

function positionInZone(zone: Zone, layer: Layer): { cx: number; cy: number; w: number } {
  return {
    cx: zone.x + zone.w * layer.x,
    cy: zone.y + zone.h * layer.y,
    w: zone.maxWidthPct * layer.w,
  };
}

// Boîte illustrative par emplacement (mêmes proportions que BAt/BAT.dc.html) :
// une approximation de la vraie zone d'impression du modèle 3D, pas une
// reproduction pixel — cf. commentaire de tête. Sert de repli tant
// qu'aucune vraie photo n'existe pour la combinaison garment/coloris
// (cf. PHOTO_MOCKUPS ci-dessous).
const PLACE_ZONE: Record<Emplacement, Zone> = {
  face: { x: 13, y: 7, w: 74, h: 49, maxWidthPct: 74 },
  coeur: { x: 22, y: 9, w: 30, h: 25, maxWidthPct: 30 },
  dos: { x: 15, y: 8, w: 70, h: 51, maxWidthPct: 70 },
};

// Vraies photos du textile porté, fournies par Milio, sur lesquelles le
// visuel choisi est composé automatiquement à l'emplacement ET à la
// position (x/y/rotation) réels choisis par le client — un aperçu bien
// plus parlant que la boîte colorée stylisée. Clé "garment:hex" : une
// seule existe pour l'instant (t-shirt coloris Sable), donc toute autre
// combinaison retombe sur PLACE_ZONE plutôt que d'afficher cette photo
// dans la mauvaise teinte. x/y/w/h/maxWidthPct sont calibrés à l'œil sur
// cette photo précise (zone où le visuel peut être déplacé, en % de
// l'image) — à recalibrer si la photo change.
interface PhotoMockup {
  src: string;
  places: Partial<Record<Emplacement, Zone>>;
}
const PHOTO_MOCKUPS: Record<string, PhotoMockup> = {
  'tshirt:#E4D6BD': {
    src: '/personnalisateur/mockups/tshirt-sable-face.jpg',
    places: {
      face: { x: 33, y: 28, w: 34, h: 40, maxWidthPct: 24 },
      coeur: { x: 55, y: 32, w: 18, h: 16, maxWidthPct: 9.5 },
    },
  },
};

function photoMockupFor(item: SavedItem, place: Emplacement): { mockup: PhotoMockup; zone: Zone } | null {
  const mockup = PHOTO_MOCKUPS[`${item.garment}:${item.color.hex}`];
  const zone = mockup?.places[place];
  return mockup && zone ? { mockup, zone } : null;
}

function estClair(hex: string): boolean {
  return lum(hex) > 0.6;
}

function fmtPrice(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} €`;
}

function sizesLabel(sizeDist: SavedItem['sizeDist']): string {
  const parts = Object.entries(sizeDist)
    .filter(([, n]) => (n as number) > 0)
    .map(([t, n]) => `${t}·${n}`);
  return parts.length ? parts.join(' ') : 'non renseignées';
}

function layerVisu(item: SavedItem, layer: Layer): string {
  const zoneCm = getZoneImpressionCm(item.garment, layer.place);
  const largeurCm = Math.round(layer.w * zoneCm * 10) / 10;
  const cotes = `<div class="bat-cotes">
    <span class="tick"></span><span class="trait"></span>
    <span class="val">largeur ${largeurCm} cm</span>
    <span class="trait"></span><span class="tick"></span>
  </div>`;

  const photo = photoMockupFor(item, layer.place);
  if (photo) {
    const pos = positionInZone(photo.zone, layer);
    return `<div class="bat-visu bat-visu-photo">
    <img class="bat-visu-photo-bg" src="${photo.mockup.src}" alt="Textile porté" />
    ${layer.img ? `<img class="bat-visu-img" src="${layer.img}" alt="Visuel à valider" style="left:${pos.cx}%;top:${pos.cy}%;width:${pos.w}%;transform:translate(-50%,-50%) rotate(${layer.rot}deg)" />` : ''}
    <span class="bat-visu-pos bat-visu-pos-photo">${PLACE_NOTE[layer.place]}</span>
  </div>
  ${cotes}`;
  }

  const zone = PLACE_ZONE[layer.place];
  const pos = positionInZone(zone, layer);
  const bg = item.color.hex;
  const border = estClair(bg) ? 'var(--ligne)' : bg;
  return `<div class="bat-visu" style="background:${bg};border-color:${border}">
    <div class="bat-visu-collar"></div>
    <div class="bat-visu-zone" style="left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%"></div>
    ${layer.img ? `<img class="bat-visu-img" src="${layer.img}" alt="Visuel à valider" style="left:${pos.cx}%;top:${pos.cy}%;width:${pos.w}%;transform:translate(-50%,-50%) rotate(${layer.rot}deg)" />` : ''}
    <span class="bat-visu-pos" style="color:${estClair(bg) ? 'var(--bat-accent)' : '#fff'};left:10px;${layer.place === 'coeur' ? 'bottom:10px' : 'top:22px'}">${PLACE_NOTE[layer.place]}</span>
  </div>
  ${cotes}`;
}

export function pieceCard(item: SavedItem, index: number): string {
  const garmentName = GARMENTS[item.garment].name;
  const badges = item.layers.length ? [...new Set(item.layers.map((l) => PLACE_LABEL[l.place]))].join(' + ') : 'Accompagnement design';
  const visuHtml = item.layers.length
    ? item.layers.map((l) => layerVisu(item, l)).join('<div style="height:6px"></div>')
    : `<div class="bat-visu" style="background:var(--lavande);border-color:var(--ligne)">
        <div class="bat-visu-zone vide" style="width:60%;height:70%;margin:auto">Visuel à fournir — accompagnement design demandé</div>
      </div>`;
  const fichiers = item.layers.length ? item.layers.map((l) => l.fileName).join(', ') : '—';
  return `<div class="bat-piece">
    <div class="bat-piece-head">
      <span class="titre">Pièce ${index + 1} — ${garmentName}</span>
      <div class="bat-piece-badges"><span class="bat-piece-badge">${badges}</span></div>
    </div>
    ${visuHtml}
    <div class="bat-info">
      <span class="label">Support</span><span>${garmentName}</span>
      <span class="label">Coloris</span><span>${item.color.nom}</span>
      <span class="label">Technique</span><span>${item.techNom}</span>
      <span class="label">Tailles</span><span>${sizesLabel(item.sizeDist)} (${item.qty} pièce${item.qty > 1 ? 's' : ''})</span>
      <span class="label">Fichier</span><span>${fichiers}</span>
    </div>
  </div>`;
}

export interface BATOptions {
  emailContact: string;
  telephoneContact?: string | null;
}

export function buildBATHtml(items: SavedItem[], opts: BATOptions): string {
  const totalQty = items.reduce((s, it) => s + it.qty, 0);
  const totalPrice = items.reduce((s, it) => s + it.prixTotal, 0);
  const dateLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return `<table class="sheet">
  <tbody><tr><td class="sheet-cell">
    <div class="doc">
      <img class="watermark" src="/logo/presstee-icone.svg" alt="" aria-hidden="true" />

      <div class="doc-head">
        <img class="logo" src="/logo/presstee-horizontal.svg" alt="Presstee" />
        <div class="doc-head-right">
          <span class="badge">Aperçu du bon à tirer</span>
          <div class="dates">
            <span>Généré le</span><span class="val">${dateLabel}</span>
            <span>Pièces</span><span class="val">${totalQty}</span>
            <span>Ordre de prix</span><span class="val">${fmtPrice(totalPrice)}</span>
          </div>
        </div>
      </div>

      <div class="carte carte-client">
        <div class="surtitre">Aperçu automatique</div>
        <div class="nom">${items.length} pièce${items.length > 1 ? 's' : ''} dans votre panier</div>
        <div class="adresse">Généré directement depuis vos choix, sans intervention de notre équipe. Vos coordonnées nous seront demandées à l'envoi du devis ou de la commande.</div>
      </div>

      <div class="avertir">
        <span class="label">À vérifier</span>
        <span class="valeur">Visuel, orthographe, coloris, dimensions et emplacement de chaque pièce</span>
      </div>

      <div class="bat-pieces">
        ${items.map((it, i) => pieceCard(it, i)).join('')}
      </div>

      <div class="bat-controle-wrap">
        <div class="bat-controle">
          <div class="surtitre">Points à contrôler</div>
          <div class="bat-check">
            <div class="bat-check-row"><span class="bat-check-box"></span>Orthographe et contenu du texte</div>
            <div class="bat-check-row"><span class="bat-check-box"></span>Couleurs du visuel et coloris du textile</div>
            <div class="bat-check-row"><span class="bat-check-box"></span>Dimensions et emplacement sur la pièce</div>
            <div class="bat-check-row"><span class="bat-check-box"></span>Répartition des tailles et quantités</div>
          </div>
        </div>
        <div class="bat-savoir">
          <div class="titre">Bon à savoir</div>
          <div class="texte">Les couleurs affichées à l'écran ne sont pas contractuelles : une légère variation est possible à l'impression comme sur le fil. Les cotes sont données à ± 3 mm. Ceci est un aperçu automatique — le bon à tirer définitif, à signer avant lancement en production, vous sera envoyé par notre équipe après votre demande.</div>
        </div>
      </div>
    </div>
  </td></tr></tbody>
  <tfoot><tr><td class="sheet-cell sheet-cell-foot">
    <div class="doc-foot">
      <span>Presstee · Angoulême, Charente · ${opts.emailContact} · Aperçu automatique, non contractuel</span>
      <span class="numero-foot">Aperçu du ${dateLabel}</span>
    </div>
  </td></tr></tfoot>
  </table>`;
}
