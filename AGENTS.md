# Project Instructions

## Project overview

- This is a Statamic 6 and Laravel 13 website. Page content lives in `content/`, and Antlers templates live in `resources/views/`.
- Tailwind CSS 4 and Vite build the styles. The main stylesheet is `resources/css/site.css`.
- The project palette uses red accents, black text, and white surfaces. Theme colors are configured in `resources/css/site.css`.
- The project uses the Statamic Peak starter kit. Check existing partials, fieldsets, and page builder patterns before changing shared components.

## Change guidelines

- The primary project language is English. Write new content, interface text, code comments, and documentation in English unless the owner explicitly requests another language.
- Follow the existing Laravel, Statamic, Antlers, and Tailwind conventions.
- For new Statamic pages, add an entry under `content/collections/pages/` and update `content/trees/collections/pages.yaml` when the page should appear in the page structure.
- Add page templates under `resources/views/`. Follow the existing component or partial structure for reusable UI.
- Do not add a live catalog, cart, checkout, payment, or external integrations without the owner's request. Clearly identify sample products and prices as examples.
- Do not commit secrets or personal data. Do not edit `.env`; document required variables in `.env.example` without secrets.
- Keep changes focused and avoid rewriting existing content without a reason.

## Verification

- Run `npm run build` when CSS or JavaScript changes need a production build check.
- For PHP changes, use relevant Artisan commands or existing tests when needed.
- Avoid running tests or builds for small copy or visual changes when they are not needed.
