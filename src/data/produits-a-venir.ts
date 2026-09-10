// Familles de textile pas encore en ligne (seuls les t-shirts le sont,
// cf. src/pages/produits/t-shirts/). Une page par famille plutôt qu'un
// lien mort : le visiteur qui cherche « polo brodé personnalisé » sait
// que Presstee couvre ce besoin, même si le catalogue en ligne n'y est
// pas encore. Un paragraphe distinct par famille (Milio, 2026-09-10) —
// pas la même phrase recopiée quatre fois avec juste le nom qui change.
export interface ProduitAVenir {
	slug: string;
	nom: string;
	// Résumé court — méta description de la page.
	desc: string;
	// Texte affiché sur la page, propre à cette famille.
	paragraphe: string;
}

export const PRODUITS_A_VENIR: ProduitAVenir[] = [
	{
		slug: 'polos',
		nom: 'Polos',
		desc: 'Polo piqué coton personnalisable, brodé sur le cœur.',
		paragraphe:
			"Le polo piqué coton reste la référence pour une tenue professionnelle sobre — plus habillé qu'un t-shirt, plus confortable au quotidien qu'une chemise. Il se marque presque toujours par broderie sur le cœur, plus durable qu'un marquage imprimé sur ce type de maille.",
	},
	{
		slug: 'sweats',
		nom: 'Sweats',
		desc: 'Sweat molleton personnalisable, crewneck, capuche ou zippé.',
		paragraphe:
			"Le sweat molleton est la pièce la plus demandée pour une promo ou une intégration : un gros visuel en sérigraphie bien mis en valeur, et un vêtement que la plupart des gens gardent longtemps après l'événement. Crewneck, à capuche ou zippé rejoindront le catalogue ensemble.",
	},
	{
		slug: 'chemises',
		nom: 'Chemises',
		desc: 'Chemise personnalisable, coupe ajustée, marquage discret.',
		paragraphe:
			"La chemise personnalisée convient aux tenues où la sobriété prime — restauration, commerce, image de marque face à la clientèle. Le marquage y est presque toujours discret, un petit logo brodé pensé pour durer autant que le vêtement plutôt que pour se voir de loin.",
	},
	{
		slug: 'tote-bags',
		nom: 'Tote bags',
		desc: 'Tote bag personnalisable, en sérigraphie ou en transfert.',
		paragraphe:
			"Le tote bag est souvent la pièce la plus simple à transformer en petit produit vendu en caisse plutôt qu'offert : peu coûteux à l'achat, un grand format qui met bien en valeur un visuel imprimé, et une durée de vie qui prolonge le marquage bien au-delà d'un seul événement.",
	},
];

export function getProduitAVenir(slug: string): ProduitAVenir | undefined {
	return PRODUITS_A_VENIR.find((p) => p.slug === slug);
}
