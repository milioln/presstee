// Icônes en SVG inline plutôt qu'en caractère Unicode (ex. "⤢") : un
// glyphe Unicode dépend de la police du système et peut ne pas exister
// dans le jeu de police du navigateur/appareil de l'utilisateur, auquel
// cas le bouton semble vide et donc introuvable. Un SVG s'affiche à
// l'identique partout.
export const CROP_ICON_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/></svg>';
