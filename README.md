# Cube Kitchen

Manage ready-to-heat frozen cubes and plan a month of consumption. Built for one person eating
breakfast, lunch, dinner, and snacks, with editable household size and snack servings.

## Run

Requires Node 22+.

```bash
npm install
npm run dev
```

Open the URL Vite prints. The dev server also serves devices on your local network.

### Open on your phone

Keep `npm run dev` running on this computer and connect your phone to the same Wi-Fi.
Open the **Network** URL printed by Vite (for example `http://192.168.1.20:5173/today`)
in your phone browser. Use the computer's network address, not `localhost` on the phone.
The computer must stay awake and its firewall must allow port 5173 on your local network.

- **Today** (`/today`): the next uneaten meal from today onward, the selected day's full menu,
  reheating instructions, and mark eaten / undo. Use the arrows or date field to browse days.
- **Cook** (`/cook`): pick or resume a recipe, tick off ingredients, and follow large steps.
  Method, freezing, and reheating instructions are all available. Progress is saved per recipe
  on the device; **Start a new batch** clears that recipe's checklist and progress.

Phones open on Today by default. Both pages are also available on desktop. The phone's bottom
navigation keeps Today, Cook, My freezer, Monthly plan, and Recipe library within reach.
Recipe detail pages link directly to **Cook step by step**.

The menu and freezer use the shared project data while this server is running. Reload after
changes on another device; avoid editing on both devices at once. Cooking progress stays on
each device. Home-screen PWA installation requires HTTPS; ordinary browsing works over local HTTP.

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

Use **Theme** in the top bar (the palette icon on mobile) to choose Sage or Sand light themes,
Forest or Midnight dark themes, or System to follow your device. The choice applies immediately
and is remembered on this browser, separately from your kitchen data.

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
