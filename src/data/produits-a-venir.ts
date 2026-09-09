// Familles de textile pas encore en ligne (seuls les t-shirts le sont,
// cf. src/pages/produits/t-shirts/). Une page par famille plutôt qu'un
// lien mort : le visiteur qui cherche « polo brodé personnalisé » sait
// que Presstee couvre ce besoin, même si le catalogue en ligne n'y est
// pas encore. Reprend les mêmes intitulés que /produits (familles).
export interface ProduitAVenir {
	slug: string;
	nom: string;
	desc: string;
}

export const PRODUITS_A_VENIR: ProduitAVenir[] = [
	{ slug: 'polos', nom: 'Polos', desc: 'Piqué coton, broderie poitrine.' },
	{ slug: 'sweats', nom: 'Sweats', desc: 'Crewneck, capuche et zippés.' },
	{ slug: 'chemises', nom: 'Chemises', desc: 'Coupes ajustées, marquage discret.' },
	{ slug: 'tote-bags', nom: 'Tote bags', desc: 'Comme le reste de la bagagerie (sacs à dos, sacs de sport), les tote bags rejoindront le catalogue une fois les fournisseurs choisis.' },
];

export function getProduitAVenir(slug: string): ProduitAVenir | undefined {
	return PRODUITS_A_VENIR.find((p) => p.slug === slug);
}
