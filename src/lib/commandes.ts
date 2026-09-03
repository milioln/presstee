// Lecture des commandes (devis/factures) depuis public/api/commandes.php
// — appelée UNIQUEMENT au build (getStaticPaths de src/pages/devis/[numero]
// et facture/[numero]), jamais depuis le navigateur : le site reste
// statique, seule la génération se met à jour à chaque déploiement (voir
// design_handoff_devis_facture/README.md, étape 4). Créer un nouveau
// devis/facture nécessite donc de redéployer pour que sa page apparaisse.
//
// PUBLIC_API_BASE permet de pointer un serveur PHP local pendant le
// développement (ex. `php -S localhost:8099 -t dist/` après un build) ;
// en CI/production, aucune variable définie → on retombe sur import.meta.env.SITE
// (https://presstee.fr, déjà configuré dans astro.config.mjs).
import type { Garment, Emplacement, TailleCode } from '../config/parametres-metier';

export interface MarquageCommande {
  technique: string;
  nbCouleurs: number;
  emplacement: Emplacement;
  visuelUrl: string | null;
}

export interface LigneCommandeData {
  garment: Garment;
  support: string;
  coloris: { nom: string; hex: string };
  tailles: Partial<Record<TailleCode, number>>;
  quantite: number;
  marquages: MarquageCommande[];
}

export interface FraisCommandeData {
  libelle: string;
  detail: string;
  quantite: number;
  prixUnitaireHT: number;
}

export interface Commande {
  numero: string;
  type: 'devis' | 'facture';
  dateEmission: string;
  dateEcheance: string;
  objet: string;
  client: { nom: string; adresse: string[]; contact: string | null };
  lignes: LigneCommandeData[];
  frais: FraisCommandeData[];
}

export async function fetchCommandes(type: 'devis' | 'facture'): Promise<Commande[]> {
  const base = import.meta.env.PUBLIC_API_BASE || import.meta.env.SITE;
  const url = `${base}/api/commandes.php?type=${type}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as Commande[];
  } catch {
    // API indisponible au moment du build (base pas encore créée,
    // serveur local pas lancé...) : aucune page générée plutôt qu'un
    // build cassé — cf. seedFromItem/loadState, même philosophie de
    // dégradation silencieuse qu'ailleurs dans le projet.
    return [];
  }
}
