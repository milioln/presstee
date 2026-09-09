import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://presstee.fr',
  compressHTML: true,
  redirects: {
    '/personnalisateur': '/personnaliser',
  },
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
