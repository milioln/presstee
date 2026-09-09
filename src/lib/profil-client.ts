// Profil déclaré par le visiteur (particulier / professionnel) — un
// simple signal de navigation pour adapter l'ordre des contenus (secteurs
// mis en avant, champs de contact), pas une donnée de compte. Persisté en
// localStorage comme le reste de l'état du site (cart.ts, simulateur.ts).
export type ProfilClient = 'particulier' | 'entreprise';

const KEY = 'presstee:profil-client';

export function getProfil(): ProfilClient | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'particulier' || v === 'entreprise' ? v : null;
  } catch {
    return null;
  }
}

export function setProfil(p: ProfilClient): void {
  try {
    localStorage.setItem(KEY, p);
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé...) : on
    // n'interrompt jamais l'expérience pour une persistance qui échoue.
  }
  // Les sections déjà affichées sur la page (ex. SectorSelector) écoutent
  // cet évènement pour se retrier sans rechargement, plutôt qu'une
  // relecture périodique du storage.
  document.dispatchEvent(new CustomEvent<ProfilClient>('presstee:profil-client', { detail: p }));
}
