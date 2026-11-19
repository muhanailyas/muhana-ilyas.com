# muhana-ilyas.com

Personal academic website of Muhana Fawwazy Ilyas. Static site built with [Astro](https://astro.build), edited through [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin`. No database and no paid services.

- **Setting it up:** [docs/DEPLOY.md](docs/DEPLOY.md)
- **Editing content:** [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md)
- **Atlas page:** [docs/ATLAS-GO-LIVE.md](docs/ATLAS-GO-LIVE.md)

## Folder structure

```
content/                  everything editable in /admin (one folder per collection)
  settings/               site.json (name, bio, links, menu), contact.json, cv.json
  news/  publications/  projects/  repositories/  teaching/  blog/
  atlas/atlas.md          Atlas page text and "coming soon / live" switch
public/
  admin/                  admin panel (index.html + config.yml)
  uploads/images, files/  images and PDFs uploaded from the admin panel
  katex/                  maths fonts for blog posts
  favicon.svg, og-default.png, robots.txt
src/
  content.config.ts       field definitions checked at build time
  layouts/Base.astro      page frame (head, header, footer)
  components/             Header, Footer, Seo, Email (spam-protected), PubEntry, PubScripts
  pages/                  one file per page or page type
  lib/                    site settings, BibTeX reader/writer, publication helpers
  styles/global.css       all styling; colours are defined at the top
scripts/import-orcid.mjs  adds new papers from ORCID (also runs monthly via GitHub Actions)
.github/workflows/        ORCID import; optional Hostinger upload
```

## Design

Proportions follow the al-folio layout of constantine-cooke.com: an 800px column, 16px body text at weight 300, a 40px name heading (light first names, bold surname) and 32px light section titles.

- **Colours:** white, black, red links `#ca3737` (`#ef7d7d` in dark mode for contrast) and navy teal `#032f3c` for the journal badges and the profile tile. All are variables at the top of `src/styles/global.css`.
- **Body font:** the visitor's system font, with nothing to download: SF Pro on Mac and iPhone, Segoe UI on Windows, Roboto on Android and ChromeOS.
- **Header font:** Neue Montreal once its files are uploaded and switched on (see ADMIN-GUIDE.md). Until then it uses the system font.

## For developers

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs dist/
```

Requires Node.js 22.23 or newer (Astro 7).
