// Brief de la demande de devis — pont entre les différents points de
// départ possibles (quiz, configurateur, panier, bon à tirer) et la page
// /demande-devis, qui l'affiche, laisse ajouter des précisions et envoie
// la demande. Un simple texte déjà mis en forme (mêmes lignes que
// l'ancien mailto:) plutôt qu'une structure de données : ces points de
// départ ont chacun leur propre représentation du projet (QuizState,
// SavedItem[]...), pas la peine de les faire toutes rentrer dans un même
// moule pour un texte qui n'est de toute façon qu'affiché puis envoyé.
const KEY = 'presstee:demande:brief';

export function setDemandeBrief(text: string): void {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // Stockage indisponible (navigation privée...) : la page /demande-devis
    // affichera son état vide plutôt que d'échouer.
  }
}

export function getDemandeBrief(): string {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}
