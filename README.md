# Sunday Kitchen

A weekly batch-cooking system for one person: **shop Saturday, cook for about 2½ hours on Sunday,
then only reheat Monday to Friday.** It includes a four-week rotation of mild, halal Algerian dishes,
shopping lists, a step-by-step Sunday session, and a freezer tracker.

## Run it

Requires Node 22+.

```bash
npm install
npm run dev
```

Open the URL Vite prints. To use it on your phone on the same Wi-Fi, run `npm run dev -- --host` and
open the network URL.

## Install it on your phone

Build and host it anywhere that serves static files over HTTPS (e.g. Netlify, Vercel, Cloudflare
Pages, GitHub Pages):

```bash
npm run build   # output in dist/
```

Configure the host to serve `index.html` for unknown paths (SPA fallback), because the app uses
normal URLs like `/shopping`. Then open it on your phone and choose **Add to Home screen**. It works
offline after the first visit.

## What's where

| Screen      | What it does                                                          |
| ----------- | --------------------------------------------------------------------- |
| Today       | Today's meals, where each comes from (fridge/freezer), today's jobs   |
| Week plan   | The whole week at a glance, per rotation week                         |
| Sunday cook | Timed checklist for the cooking session + what goes in fridge/freezer |
| Shopping    | Saturday list with ticks                                              |
| Recipes     | All recipes with ingredients, steps, storage and reheating            |
| Freezer     | Portions in stock, oldest first, and light-week suggestion            |
| Start here  | One-time setup checklist, food safety, heartburn notes                |

## Data

Ticks and freezer stock are saved in this browser only (localStorage), so they don't sync between
devices yet. Storage sits behind `StorageAdapter` (`src/storage/adapters.ts`), so adding a backend is
one new adapter.

## Development

```bash
npm run check        # typecheck + lint + tests
npm run test:watch
npm run format
```

See [CLAUDE.md](CLAUDE.md) for architecture and conventions.

## Ideas for next steps

- Sync between phone and computer (Supabase, or a small API + SQLite)
- Edit and add your own recipes in the app
- Scale portions up or down and have shopping lists follow
- Combined shopping list totals across recipes
- Weekly review: rate dishes and swap out the ones you don't like
