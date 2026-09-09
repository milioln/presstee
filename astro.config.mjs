import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://presstee.fr',
  compressHTML: true,
  // L'ancienne adresse /personnalisateur redirige désormais au niveau du
  // serveur (public/.htaccess, RewriteRule), comme /configurateur et
  // /simulateur : un vrai 301 plutôt que la page intermédiaire que
  // générait cette redirection Astro (un <meta http-equiv="refresh">
  // sur de l'hébergement statique, plus faible pour transmettre le
  // référencement acquis par l'ancienne adresse).
  integrations: [
    sitemap({
      // Exclut les pages sans intérêt pour un moteur de recherche (données
      // client, outils propres au navigateur du visiteur) — même liste que
      // les pages marquées noindex dans Layout.astro.
      filter: (page) =>
        !/\/(panier|demande-devis|bon-a-tirer|mentions-legales|confidentialite|cgv)\/?$/.test(page) &&
        !/\/compte\//.test(page) &&
        !/\/(devis|facture)\//.test(page),
    }),
  ],
});
