# Sunday Kitchen

A personal weekly food system for one person: shop Saturday, batch-cook Sunday, reheat Monday–Friday.
Vite + React 19 + TypeScript, installable as a PWA. Data is stored in the browser for now.

## Who it's for (drives all food content)

- 30, male, 176 cm, 81 kg, lives alone in Algeria, works 9–5 from home plus a side hustle: **no cooking on weekdays**.
- **Goal: lose fat slowly.** Targets come from `src/domain/nutrition/targets.ts` (Mifflin-St Jeor, ~20% deficit):
  about **1,700 kcal, 130 g protein, 30 g+ fibre** a day. He can edit his profile in the app.
- **Halal.** No pork, no alcohol in cooking.
- **No raw onion or raw garlic.** They may only be grated/chopped into long-cooked sauces, and are always optional.
- **No vinegar** (no vinaigrettes). Dressings are olive oil + salt, or yogurt-mint.
- **Nothing spicy (gets heartburn).** Sweet paprika only. No harissa or chili. Keep tomato and lemon low.
- **Doesn't like chorba frik.** Not tied to Algerian food: anything filling, healthy and freezer-friendly works.
- Equipment: MasterPro multicooker (pressure, slow cook, air fryer), gas stove, gas oven, fridge, shelved freezer,
  **electric vegetable cutter** with 5 heads: big slicer, small slicer, shredder, big grater, small grater.
  Recipes list their `cutter` jobs, and the Sunday session preps all vegetables in one cutter step.
- Ingredients must be easy to buy at Algerian markets (e.g. cachir, deglet nour dates, kesra, pain complet).

Tests enforce part of this: `src/domain/data.test.ts` (banned ingredients, food links, cutter) and
`src/domain/nutrition/nutrition.test.ts` (every Sun–Thu of every week within ~10% of the calorie target,
protein ≥ 85% of target, fibre ≥ 20 g, fat in range). Change recipes, portions or plates → keep these passing.

## Nutrition model

- Ingredient lines link to `FOODS` (per 100 g) as `[qty, item, foodId, grams]`. A recipe's serving = batch ÷ `serves`.
- `ServeGuide.plate` = sides the plan counts (with `amounts`); `sides` = other options (not counted).
- A `MealSlot` is counted from its `recipeId` (+ plate, × `servings`) and/or `extras`. Slots with neither
  (free night, "any freezer meal") are uncounted and the UI shows the calories left for them.

## Extra recipes

- Recipes not in `ROTATION` are **extras** (`PLAN_RECIPE_IDS` in `rotation.ts`), shown under Recipes → Extras.
  `nutrition.test.ts` keeps each extra's plate within the kcal/protein range of the plan dishes of its kind.
- The user may report an ingredient he can't find. Then remove **every recipe that uses it**: grep the item
  text and its `FOODS` id, delete the recipe from `RECIPE_IDS`, `RECIPES` and `SERVE_GUIDES`, drop any
  `Side.recipeId` pointing at it, and remove the food if nothing else uses it. A rotation dish needs a
  replacement (and its week's shopping list updated) instead of a plain deletion.

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
