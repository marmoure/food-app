# Sunday Kitchen

A personal weekly food system for one person: shop Saturday, batch-cook Sunday, reheat Monday–Friday.
Vite + React 19 + TypeScript, installable as a PWA. Data is stored in the browser for now.

## Who it's for (drives all food content)

- 30, lives alone in Algeria, works 9–5 from home plus a side hustle: **no cooking on weekdays**.
- **Halal.** No pork, no alcohol in cooking.
- **No raw onion or raw garlic.** They may only be grated/chopped into long-cooked sauces, and are always optional.
- **No vinegar** (no vinaigrettes). Dressings are olive oil + salt, or yogurt-mint.
- **Nothing spicy (gets heartburn).** Sweet paprika only. No harissa or chili. Keep tomato and lemon low.
- Equipment: MasterPro multicooker (pressure, slow cook, air fryer), gas stove, gas oven, fridge, shelved freezer.
- Ingredients must be easy to buy at Algerian markets (e.g. frik, cachir nature, deglet nour dates, kesra).

`src/domain/data.test.ts` enforces part of this. Keep it passing when adding recipes.

## Commands

```bash
npm run dev          # dev server
npm run check        # typecheck + lint + tests (run before calling work done)
npm run test:watch
npm run build        # typecheck + production build (+ PWA icons from public/icon.svg)
npm run format
```

## Architecture

```
src/
  domain/     Pure TS, no React: types, recipe data, 4-week rotation, calendar maths,
              meal planning (plan.ts), Sunday session (sunday.ts), freezer rules. Unit-tested.
  storage/    AppData schema + parser, StorageAdapter interface (localStorage now),
              AppStore (immutable snapshots, ordered saves), React context/hooks, selectors.
  hooks/      useToday (pinnable via TodayContext for tests), usePosition, useSelectedWeek (?week=1..4).
  components/ Small shared UI (SourceChip, CheckItem, WeekSwitcher, ...).
  features/   One folder per screen: today, week, sunday, shopping, recipes, freezer, start.
  app/        Layout (header + tabs), routes.
  styles/     tokens.css (light/dark design tokens), global.css.
legacy/       The original single-file HTML artifact, kept for reference only.
```

## Conventions

- Business rules go in `src/domain` as pure functions with tests. Components only render.
- Dates are **local calendar dates**. Use the `calendar.ts` helpers, never `toISOString()`.
- Plan weeks run **Saturday→Friday**. `PLAN_START` is Sat 2026-09-26. Rotation = planWeek mod 4.
- Persisted ids must stay stable: checklist item ids (`shop-<section>-<item>`, `sun-<step>`, setup ids),
  week keys (`YYYY-MM-DD` of the Saturday), `RecipeId`s. Renaming one silently loses saved ticks.
  If the schema has to change, bump `AppData.version` and add a migration in `storage/schema.ts`.
- All storage goes through `StorageAdapter`. To add cloud sync, implement a new adapter; the UI shouldn't change.
- Colors only through CSS tokens in `tokens.css`, and both themes must work.
- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TS 7 yet.
