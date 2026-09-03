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
// Boîte illustrative par emplacement (mêmes proportions que BAt/BAT.dc.html) :
// une mise en page stylisée, pas une reproduction pixel du positionnement
// réel choisi dans le configurateur — cf. commentaire de tête.
const PLACE_BOX: Record<Emplacement, { width: string; height: string; margin: string }> = {
  face: { width: '74%', height: '96px', margin: '14px auto 0' },
  coeur: { width: '30%', height: '48px', margin: '18px auto 0 22%' },
  dos: { width: '70%', height: '100px', margin: '16px auto 0' },
};

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
  const box = PLACE_BOX[layer.place];
  const zoneCm = getZoneImpressionCm(item.garment, layer.place);
  const largeurCm = Math.round(layer.w * zoneCm * 10) / 10;
  const bg = item.color.hex;
  const border = estClair(bg) ? 'var(--ligne)' : bg;
  return `<div class="bat-visu" style="background:${bg};border-color:${border}">
    <div class="bat-visu-collar"></div>
    <div class="bat-visu-zone" style="width:${box.width};height:${box.height};margin:${box.margin}">
      ${layer.img ? `<img src="${layer.img}" alt="Visuel à valider" />` : ''}
    </div>
    <span class="bat-visu-pos" style="color:${estClair(bg) ? 'var(--indigo)' : '#fff'};left:10px;${layer.place === 'coeur' ? 'bottom:10px' : 'top:22px'}">${PLACE_NOTE[layer.place]}</span>
  </div>
  <div class="bat-cotes">
    <span class="tick"></span><span class="trait"></span>
    <span class="val">largeur ${largeurCm} cm</span>
    <span class="trait"></span><span class="tick"></span>
  </div>`;
}

function pieceCard(item: SavedItem, index: number): string {
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
