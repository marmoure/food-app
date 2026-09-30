# Cube Kitchen

Ready-to-heat frozen cube inventory and monthly consumption planning. The user's current goal
replaces the old weekly Sunday Kitchen system. Defaults: one person, breakfast, lunch, dinner,
and daily snacks. Lunch and dinner combine protein, starch and vegetable recipe servings.

## Source of recipes

Use `/home/z/Documents/projects/frozen-goods/library`. The app imports 294 active `freezer_format:
cubes` recipes, their local photos and source attribution. Do not change the external library as a
side effect of app changes. `npm run import:recipes` refreshes the checked-in snapshot; archived
formats are excluded. Preserve the library's adaptations, quantities, and per-serving nutrition.

Recipe servings are distinct from physical cubes. The user measures and logs actual cube yield
and cubes per serving. Never infer cube count from the library's serving count or convert mold ml
to grams. The planner is a recipe rotation, not a nutritional prescription.

## Architecture

- `src/domain/`: types, local calendar dates, imported recipes, pure inventory/plan calculations.
- `src/storage/`: strict versioned validation, ordered saves, browser/project adapters, React context.
- `src/app/`: overview, freezer, calendar/agenda, recipe library/detail, batch/meal/planner forms.
- `src/components/`: shared icons, accessible modal, recipe cards, safe limited Markdown rendering.
- `src/data/`: generated recipe and source metadata. Change the importer/source, not these files.
- `src/styles/`: global responsive styles and light/dark CSS tokens.
- `server/data-api.ts`: `/api/cubes`, atomic project saves in dev and preview.
- `tools/import-library.mjs`: dependency-free source import.
- `legacy/sunday-kitchen/`: archived prior source including pre-existing uncommitted changes.

## Inventory and planning rules

- Dates use local `YYYY-MM-DD` calendar values. Never derive a calendar day from `toISOString()`.
- Cubes and servings are positive integers; remaining stock can be zero. Each batch records its own
  measured cubes/serving. Incomplete servings stay in stock and are not silently rounded up.
- Planning reserves stock without decrementing it. Allocate chronologically across _all_ months,
  using earliest use-by, then oldest freeze date. A cube cannot cover two meals.
- A batch must be frozen by the consumption day and not past its use-by date. For an overdue meal,
  use today's usable stock rather than pretending expired cubes are still available.
- Marking eaten is atomic: all components must be available or no cubes are deducted. Eaten meals
  cannot be edited; undo restores the recorded batch allocations. Future meals cannot be eaten.
- Generation fills empty slots only. Manual edits and eaten meals stay intact.
- The app starts empty. Never seed fake stock or plans into the user's data.

## Data preservation

New data: browser `cube-kitchen:v1`, `data/cube-kitchen.json`, `data/cube-status.md`. The previous
`sunday-kitchen` key/files remain untouched. Do not reinterpret old portion inventory as cube counts.
Do not edit saved files while the app is open. Export/restore validates before writing and previews
replacement. Invalid persisted data must not silently reset the user's kitchen.

## Verification

Run `npm run check` and `npm run build` before finishing. Test business rules and meaningful user
flows, especially consumption, expiry, duplicate reservations, repeated generation and save failures.
The API tests bind a temporary local port. For visual checks, use a dedicated browser profile and
`tools/browser-check.mjs`; it intercepts project data writes. Keep generated test stock out of `data/`.
