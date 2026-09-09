import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://presstee.fr',
  compressHTML: true,
  redirects: {
    '/personnalisateur': '/personnaliser',
  },
});
