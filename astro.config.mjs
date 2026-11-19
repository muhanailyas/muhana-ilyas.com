// Astro configuration for muhana-ilyas.com
// Static output only: the whole site is plain HTML/CSS files, so it can be hosted anywhere for free.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  // Change this if you use a different domain. Used for sitemap, RSS and social previews.
  site: 'https://muhana-ilyas.com',
  trailingSlash: 'ignore',
  integrations: [
    // The admin panel is excluded from the sitemap.
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
  markdown: {
    // $inline$ and $$display$$ LaTeX in blog posts and project pages
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    // Code blocks follow light/dark mode automatically
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
