// Grille de marge du catalogue produits — PROVISOIRE. Seul le palier
// 25-49 pièces (43% de marge nette) a été donné par Milio ; les autres
// paliers sont une courbe dégressive déduite de ce seul point (marge
// plus confortable sur petite quantité, qui coûte plus cher à traiter
// à l'unité ; marge resserrée sur gros volume pour rester compétitif).
// À confirmer avec Milio avant toute mise en ligne réelle.
//
// Prix de vente = coût fournisseur / (1 - marge). Les coûts eux-mêmes
// viennent des tarifs publics Transfertpress relevés le 2026-09-01 —
// pas les tarifs professionnels réels de Presstee, qui n'a pas encore
// d'accord fournisseur signé (voir reference/catalogue-source/).
export interface PalierTarif {
  min: number;
  max: number | null;
  label: string;
  marge: number;
}

export const PALIERS_TARIF: PalierTarif[] = [
  { min: 1, max: 9, label: '1 à 9', marge: 0.55 },
  { min: 10, max: 24, label: '10 à 24', marge: 0.5 },
  { min: 25, max: 49, label: '25 à 49', marge: 0.43 },
  { min: 50, max: 99, label: '50 à 99', marge: 0.38 },
  { min: 100, max: 249, label: '100 à 250', marge: 0.32 },
  { min: 250, max: 500, label: '250 à 500', marge: 0.26 },
];

export function prixVente(coutBase: number, marge: number): number {
  return coutBase / (1 - marge);
}

export function grilleTarifaire(coutBase: number): { label: string; min: number; max: number | null; prixUnitaire: number }[] {
  return PALIERS_TARIF.map((p) => ({
    label: p.label,
    min: p.min,
    max: p.max,
    prixUnitaire: Math.round(prixVente(coutBase, p.marge) * 100) / 100,
  }));
}

export function prixAPartirDe(coutBase: number): number {
  return grilleTarifaire(coutBase)[0].prixUnitaire;
}
