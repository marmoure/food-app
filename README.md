# Cube Kitchen

Manage ready-to-heat frozen cubes and plan a month of consumption. Built for one person eating
breakfast, lunch, dinner, and snacks, with editable household size and snack servings.

## Run

Requires Node 22+.

```bash
npm install
npm run dev
```

Open the URL Vite prints. `npm run dev -- --host` also serves devices on your local network.

## Use the app

1. **Recipe library:** browse all 294 active cube recipes from `frozen-goods`. Filter by role,
   category or cuisine/name search; save favorites. Recipe pages include the local adaptations,
   ingredients, method, freezing, reheating, source credits, and available source videos.
2. **My freezer:** log an actually frozen batch. Enter actual cube count, cubes per recipe serving,
   mold size, freeze date, use-by date and location. Update remaining counts after discarding or
   using cubes outside the plan. Finished batches remain available through the history filter.
3. **Monthly plan:** select a month and build a rotation from chosen protein, starch, vegetable,
   breakfast and snack recipes. Defaults are one person, three meals, and two snack servings per
   day. Existing slots are preserved. Add, edit or remove individual uneaten meals as needed.
4. **Cook for the month:** the plan compares demand against usable stock and lists missing recipe
   servings and full batch counts. Log new batches as you freeze them; coverage recalculates.
5. **Eat:** open today's meal and mark it eaten to deduct the correct number of cubes. Undo returns
   them to their original batches if the meal was marked by mistake.

A recipe serving can occupy several mold cavities. Nutrition uses the library's recipe-serving
figures; the app never assumes that one cube equals one serving. Only complete labeled servings
are allocated. Partial leftovers remain visible in stock. Use-by defaults to one calendar month
from freezing, following the library's rotation guide; it can be edited.

The app starts with empty stock and no plan. The planner is a recipe rotation, not a calorie-target
optimizer. Recipe nutrition is an ingredient estimate; portions can be edited per meal.

## Recipe source

The source library is read without modifying it:

```text
/home/z/Documents/projects/frozen-goods/library
```

The imported snapshot, recipe Markdown, and original-source photos are bundled with this project,
so the original path is not required when running or deploying the app. Refresh the snapshot with:

```bash
npm run import:recipes
# Or import another checkout:
npm run import:recipes -- /path/to/frozen-goods/library
```

Archived recipes are excluded. Photos and videos show source versions, which can differ from the
local cube adaptations. Attribution links are shown on recipe pages.

## Saved data

- Browser: `localStorage['cube-kitchen:v1']` (versioned and timestamped).
- Dev/preview server: `data/cube-kitchen.json` and readable `data/cube-status.md`.
- Backup & restore: available in the footer and kitchen profile menu. Import previews the contents
  before replacing current cube data.

Changes save to the device and project when available; the status reports which copies succeeded.
The newest valid copy is loaded when the app opens. Static hosting and offline use keep a device
copy. This is not live collaborative sync; reload before switching devices, and avoid simultaneous
editing on multiple devices. Do not manually edit project data while the app is open.

Original Sunday Kitchen source and uncommitted edits are preserved in `legacy/sunday-kitchen/`.
Its original saved files and browser storage key are left intact. The new schema does not migrate
old weekly portions into cube counts because their physical yield is unknown.

## Build and checks

```bash
npm run check        # TypeScript, ESLint, domain/storage/UI/API tests
npm run build        # production build in dist/ + installable PWA
npm run preview      # preview build, including project-folder data saves
```

The API tests use a temporary local HTTP server and need permission to open a localhost port.
Static hosting requires an SPA fallback to `index.html`. Install over HTTPS for PWA support.
The app and recipe text are cached for offline use; photos/downloads are cached as visited.

`tools/browser-check.mjs` checks desktop and mobile layouts plus the batch → plan → eat/undo flow.
It requires Vite on port 5173 and a dedicated headless Chrome instance on debugging port 9225.
It intercepts the data API and uses an isolated test profile, so it never writes project data.
Screenshots are written to `/tmp/cube-kitchen-*.png`.
