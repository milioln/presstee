// Brief de la demande de devis — pont entre les différents points de
// départ possibles (quiz, configurateur, panier, bon à tirer) et la page
// /demande-devis, qui l'affiche, laisse ajouter des précisions et envoie
// la demande. Un simple texte déjà mis en forme (mêmes lignes que
// l'ancien mailto:) plutôt qu'une structure de données : ces points de
// départ ont chacun leur propre représentation du projet (QuizState,
// SavedItem[]...), pas la peine de les faire toutes rentrer dans un même
// moule pour un texte qui n'est de toute façon qu'affiché puis envoyé.
//
// Les visuels déposés voyagent à part, en data URL (Milio, 2026-09-09 :
// « il faut que dans le mail on voit ses designs joints ») — mailto: ne
// sait pas joindre de fichier, donc /demande-devis les propose en
// téléchargement, à joindre soi-même avant l'envoi.
const KEY = 'presstee:demande:brief';
const KEY_VISUELS = 'presstee:demande:visuels';

export interface DemandeVisuel {
  fileName: string;
  dataUrl: string;
}

export function setDemandeBrief(text: string, visuels: DemandeVisuel[] = []): void {
  try {
    sessionStorage.setItem(KEY, text);
    sessionStorage.setItem(KEY_VISUELS, JSON.stringify(visuels));
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé par de gros
    // visuels...) : la page /demande-devis affichera son état vide plutôt
    // que d'échouer.
  }
}

export function getDemandeBrief(): string {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function getDemandeVisuels(): DemandeVisuel[] {
  try {
    const raw = sessionStorage.getItem(KEY_VISUELS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
