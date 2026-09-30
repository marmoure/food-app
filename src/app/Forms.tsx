import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { localDate, nextMonthDate, daysInMonth, monthName, shortDate } from '../domain/dates';
import { RECIPES, recipeById, ROLE_NAMES } from '../domain/recipes';
import {
  allocateMeal,
  consumeMeal,
  generateMonth,
  mealNutrition,
  undoMeal,
  type Palette,
} from '../domain/planner';
import {
  SLOTS,
  SLOT_NAMES,
  type Component,
  type CubeData,
  type Settings,
  type Slot,
} from '../domain/types';
import { useStore } from '../storage/context';
import { parseData } from '../storage/schema';

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Please check the form and try again.';

export function BatchForm({
  recipeId,
  batchId,
  close,
}: {
  recipeId?: string;
  batchId?: string;
  close: () => void;
}) {
  const { data, update } = useStore();
  const existing = data.batches.find((batch) => batch.id === batchId);
  const [selected, setSelected] = useState(
    existing?.recipeId ?? recipeId ?? 'chicken-chicken-karahi',
  );
  const recipe = recipeById(selected);
  const [error, setError] = useState('');
  const [frozenOn, setFrozenOn] = useState(existing?.frozenOn ?? localDate());
  const [useBy, setUseBy] = useState(existing?.useBy ?? nextMonthDate(frozenOn));
  const used = data.meals
    .flatMap((meal) => meal.allocations ?? [])
    .filter((allocation) => allocation.batchId === batchId)
    .reduce((sum, a) => sum + a.cubes, 0);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      update((state) => {
        if (existing)
          return {
            ...state,
            batches: state.batches.map((batch) =>
              batch.id === existing.id
                ? {
                    ...batch,
                    remaining: Number(form.get('remaining')),
                    useBy,
                    location: String(form.get('location')).trim(),
                    notes: String(form.get('notes')).trim(),
                  }
                : batch,
            ),
          };
        const total = Number(form.get('total'));
        return {
          ...state,
          batches: [
            ...state.batches,
            {
              id: crypto.randomUUID(),
              recipeId: selected,
              total,
              remaining: total,
              cubesPerServing: Number(form.get('cubesPerServing')),
              mouldMl: Number(form.get('mouldMl')),
              frozenOn,
              useBy,
              location: String(form.get('location')).trim(),
              notes: String(form.get('notes')).trim(),
            },
          ],
        };
      });
      close();
    } catch (error) {
      setError(errorText(error));
    }
  }
  return (
    <Modal title={existing ? 'Manage batch' : 'Freeze a new batch'} close={close}>
      <form onSubmit={submit} className="form-body">
        <p className="muted">
          {existing
            ? 'Keep your freezer count accurate after using or discarding cubes.'
            : 'Cook, pack, and count your cubes. Add only the food you have actually frozen.'}
        </p>
        <label>
          Recipe
          <select
            value={selected}
            disabled={!!existing}
            onChange={(event) => setSelected(event.target.value)}
          >
            {RECIPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-note">
          <Icon name="cube" />
          <span>
            This recipe makes <strong>{recipe.portions} recipe servings</strong>. Count the actual
            cubes after packing; a serving can fill several molds.
          </span>
        </div>
        {existing ? (
          <label>
            Cubes remaining
            <input
              name="remaining"
              type="number"
              min="0"
              max={existing.total - used}
              step="1"
              defaultValue={existing.remaining}
              required
            />
            <span className="field-help">
              {existing.total} originally frozen · {used} eaten through the plan. Set to 0 to finish
              or discard this batch.
            </span>
          </label>
        ) : (
          <div className="form-grid">
            <label>
              Cubes frozen
              <input
                type="number"
                name="total"
                min="1"
                max="100000"
                placeholder="e.g. 14"
                required
              />
            </label>
            <label>
              Cubes per recipe serving
              <input
                type="number"
                name="cubesPerServing"
                min="1"
                max="100"
                placeholder="e.g. 2"
                required
              />
            </label>
            <label>
              Mold size
              <select name="mouldMl" key={selected} defaultValue={recipe.mouldMl}>
                <option value="125">125 ml</option>
                <option value="250">250 ml</option>
                <option value="500">500 ml</option>
              </select>
            </label>
            <label>
              Frozen on
              <input
                type="date"
                value={frozenOn}
                max={localDate()}
                required
                onChange={(event) => {
                  setFrozenOn(event.target.value);
                  if (event.target.value) setUseBy(nextMonthDate(event.target.value));
                }}
              />
            </label>
          </div>
        )}
        <div className="form-grid">
          <label>
            Use by
            <input
              type="date"
              value={useBy}
              min={frozenOn}
              required
              onChange={(event) => setUseBy(event.target.value)}
            />
          </label>
          <label>
            Freezer location
            <input
              name="location"
              maxLength={100}
              placeholder="e.g. Top drawer"
              defaultValue={existing?.location ?? ''}
            />
          </label>
        </div>
        <label>
          Label / notes
          <textarea
            name="notes"
            maxLength={1000}
            rows={2}
            placeholder="Anything to remember about this batch"
            defaultValue={existing?.notes ?? ''}
          />
        </label>
        <p className="field-help">
          Use-by defaults to one month from freezing, following your recipe library’s rotation
          guide.
        </p>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            <Icon name="cube" />
            {existing ? 'Save batch' : 'Add to freezer'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function MealForm({
  date: initialDate,
  slot: initialSlot = 'lunch',
  mealId,
  close,
}: {
  date: string;
  slot?: Slot;
  mealId?: string;
  close: () => void;
}) {
  const { data, update } = useStore();
  const existing = data.meals.find((meal) => meal.id === mealId);
  const [date, setDate] = useState(existing?.date ?? initialDate);
  const [slot, setSlot] = useState(existing?.slot ?? initialSlot);
  const [components, setComponents] = useState<Component[]>(
    existing?.components ?? [
      {
        recipeId:
          initialSlot === 'breakfast'
            ? 'breakfast-baked-oatmeal'
            : initialSlot === 'snacks'
              ? 'snacks-carrot-halwa'
              : 'chicken-chicken-karahi',
        servings: data.settings.people,
      },
    ],
  );
  const [error, setError] = useState('');
  const nutrition = mealNutrition(components);
  const allocation = allocateMeal(
    data.batches,
    components,
    date < localDate() ? localDate() : date,
  );
  const run = (action: (state: CubeData) => CubeData, finish = true) => {
    try {
      update(action);
      setError('');
      if (finish) close();
    } catch (error) {
      setError(errorText(error));
    }
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    run((state) => {
      if (
        state.meals.some((meal) => meal.date === date && meal.slot === slot && meal.id !== mealId)
      )
        throw new Error('This meal slot is already planned. Open that meal to edit it.');
      const meal = { id: mealId ?? crypto.randomUUID(), date, slot, components };
      return {
        ...state,
        meals: mealId
          ? state.meals.map((entry) => (entry.id === mealId ? meal : entry))
          : [...state.meals, meal],
      };
    });
  }
  return (
    <Modal
      title={existing?.eatenAt ? 'Meal eaten' : existing ? 'Your cube combination' : 'Plan a meal'}
      close={close}
    >
      <form onSubmit={submit} className="form-body">
        <div className="form-grid">
          <label>
            Date
            <input
              type="date"
              required
              value={date}
              disabled={!!existing?.eatenAt}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            Meal
            <select
              value={slot}
              disabled={!!existing?.eatenAt}
              onChange={(event) => setSlot(event.target.value as Slot)}
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {SLOT_NAMES[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="section-label">
          BUILD YOUR BOWL <span>Total recipe servings for your household</span>
        </div>
        {components.map((component, index) => (
          <div className="component-row" key={index}>
            <label>
              Component {index + 1}
              <select
                disabled={!!existing?.eatenAt}
                value={component.recipeId}
                onChange={(event) =>
                  setComponents((all) =>
                    all.map((c, i) => (i === index ? { ...c, recipeId: event.target.value } : c)),
                  )
                }
              >
                {RECIPES.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} · {ROLE_NAMES[recipe.slot]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Servings
              <input
                aria-label={`Servings for component ${index + 1}`}
                type="number"
                min="1"
                max="200"
                required
                disabled={!!existing?.eatenAt}
                value={component.servings || ''}
                onChange={(event) =>
                  setComponents((all) =>
                    all.map((c, i) =>
                      i === index ? { ...c, servings: Number(event.target.value) } : c,
                    ),
                  )
                }
              />
            </label>
            {!existing?.eatenAt && (
              <button
                type="button"
                className="icon-button remove-component"
                disabled={components.length === 1}
                aria-label={`Remove component ${index + 1}`}
                onClick={() => setComponents((all) => all.filter((_, i) => i !== index))}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        ))}
        {!existing?.eatenAt && components.length < 20 && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setComponents((all) => [
                ...all,
                {
                  recipeId: all.length === 1 ? 'starches-lime-coriander-rice' : 'veg-ratatouille',
                  servings: data.settings.people,
                },
              ])
            }
          >
            <Icon name="plus" size={16} />
            Add a component
          </button>
        )}
        <div className="nutrition-strip">
          <strong>{Math.round(nutrition.kcal)} kcal</strong>
          <span>{nutrition.protein.toFixed(1)} g protein</span>
          <span>Whole meal · estimated</span>
        </div>
        {existing?.eatenAt ? (
          <div className="form-note">
            <Icon name="check" />
            <span>
              Eaten on {shortDate(existing.eatenAt)}. Cubes have been deducted from your freezer.
            </span>
          </div>
        ) : (
          <div className="form-note">
            <Icon name="freezer" />
            <span>
              {allocation.missing.length
                ? `${allocation.missing.reduce((sum, c) => sum + c.servings, 0)} component serving(s) still need cooking.`
                : `${allocation.allocations.reduce((sum, a) => sum + a.cubes, 0)} cubes available for this meal.`}{' '}
              Other planned meals may also need this stock. The monthly calendar accounts for those
              reservations.
            </span>
          </div>
        )}
        {(existing?.allocations ?? allocation.allocations).length > 0 && (
          <div className="meal-pick-list">
            <h3>{existing?.eatenAt ? 'Cubes used' : 'Pick from your freezer'}</h3>
            {(existing?.allocations ?? allocation.allocations).map((pick, index) => {
              const batch = data.batches.find((batch) => batch.id === pick.batchId);
              if (!batch) return null;
              return (
                <div key={`${pick.batchId}-${index}`}>
                  <Icon name="cube" size={16} />
                  <span>
                    <strong>
                      {pick.cubes} cubes · {recipeById(batch.recipeId).name}
                    </strong>
                    <small>
                      {batch.location || 'Location not set'} · frozen {shortDate(batch.frozenOn)}
                    </small>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="meal-recipe-links">
          {components.map((component, index) => (
            <Link key={index} to={`/recipes/${component.recipeId}`} onClick={close}>
              Reheat {recipeById(component.recipeId).name}
              <Icon name="arrow" size={14} />
            </Link>
          ))}
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          {existing?.eatenAt ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => run((state) => undoMeal(state, existing.id))}
            >
              Undo eaten & restore cubes
            </button>
          ) : (
            <>
              {existing && (
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() =>
                    run((state) => ({
                      ...state,
                      meals: state.meals.filter((m) => m.id !== existing.id),
                    }))
                  }
                >
                  Remove
                </button>
              )}
              <button className="button primary" type="submit">
                Save meal
              </button>
              {existing && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={
                    date > localDate() ||
                    JSON.stringify(components) !== JSON.stringify(existing.components) ||
                    date !== existing.date ||
                    slot !== existing.slot
                  }
                  title={
                    date > localDate()
                      ? 'Available on the planned day'
                      : 'Deduct this meal from your freezer'
                  }
                  onClick={() => run((state) => consumeMeal(state, existing.id, localDate()))}
                >
                  <Icon name="check" />
                  Mark eaten
                </button>
              )}
            </>
          )}
        </footer>
      </form>
    </Modal>
  );
}

const DEFAULT_PALETTE: Palette = {
  protein: ['chicken-chicken-karahi', 'beef-beef-goulash', 'chicken-chicken-korma'],
  starch: ['starches-lime-coriander-rice', 'starches-sweet-potato-mash'],
  veg: ['veg-ratatouille', 'veg-glazed-carrots'],
  breakfast: ['breakfast-baked-oatmeal', 'breakfast-frittata-squares'],
  snack: ['snacks-carrot-halwa', 'snacks-apple-crumble'],
};
export function GenerateForm({ month, close }: { month: string; close: () => void }) {
  const { data, update } = useStore();
  const [settings, setSettings] = useState<Settings>(data.settings);
  const [start, setStart] = useState(localDate().startsWith(month) ? localDate() : `${month}-01`);
  const [palette, setPalette] = useState<Palette>(
    () =>
      Object.fromEntries(
        Object.entries(DEFAULT_PALETTE).map(([role, defaults]) => {
          const preferred = [
            ...new Set([
              ...data.batches.filter((b) => b.remaining > 0).map((b) => b.recipeId),
              ...data.favorites,
            ]),
          ].filter((id) => recipeById(id).slot === role);
          return [role, preferred.length ? preferred.slice(0, 4) : defaults];
        }),
      ) as unknown as Palette,
  );
  const [error, setError] = useState('');
  const groups = (Object.keys(palette) as (keyof Palette)[]).filter((role) =>
    role === 'breakfast'
      ? settings.slots.includes('breakfast')
      : role === 'snack'
        ? settings.slots.includes('snacks')
        : settings.slots.some((s) => s === 'lunch' || s === 'dinner'),
  );
  const slotsToFill = daysInMonth(month)
    .filter((date) => date >= start)
    .reduce(
      (count, date) =>
        count +
        settings.slots.filter((slot) => !data.meals.some((m) => m.date === date && m.slot === slot))
          .length,
      0,
    );
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      update((state) => generateMonth(state, month, start, settings, palette));
      close();
    } catch (error) {
      setError(errorText(error));
    }
  }
  return (
    <Modal title={`Build your ${monthName(month)} plan`} close={close} wide>
      <form onSubmit={submit} className="form-body">
        <p className="muted">
          Rotate your chosen recipes through the month. Lunch and dinner combine protein, starch,
          and vegetables. Existing meals stay in place.
        </p>
        <div className="generator-layout">
          <div>
            <div className="form-grid">
              <label>
                People
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.people || ''}
                  required
                  onChange={(event) =>
                    setSettings({ ...settings, people: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Snack servings / person
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.snackServings || ''}
                  required
                  onChange={(event) =>
                    setSettings({ ...settings, snackServings: Number(event.target.value) })
                  }
                />
              </label>
            </div>
            <label>
              Start from
              <input
                type="date"
                value={start}
                min={`${month}-01`}
                max={daysInMonth(month).at(-1)}
                required
                onChange={(event) => setStart(event.target.value)}
              />
            </label>
            <fieldset>
              <legend>Include each day</legend>
              {SLOTS.map((slot) => (
                <label className="check-label" key={slot}>
                  <input
                    type="checkbox"
                    checked={settings.slots.includes(slot)}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        slots: event.target.checked
                          ? SLOTS.filter((s) => settings.slots.includes(s) || s === slot)
                          : settings.slots.filter((s) => s !== slot),
                      })
                    }
                  />
                  {SLOT_NAMES[slot]}
                </label>
              ))}
            </fieldset>
            <div className="form-note">
              <Icon name="calendar" />
              <span>
                <strong>{slotsToFill} empty slots</strong> will be filled. Unstocked servings appear
                in your cooking list.
              </span>
            </div>
            <p className="field-help">
              Each component is one recipe serving per person. Edit individual meals to change
              portions or add components. This is a recipe rotation, not a nutrition target.
            </p>
          </div>
          <div className="palette-groups">
            {groups.map((role) => (
              <section className="palette-group" key={role}>
                <h3>
                  <span className={`role-dot role-${role}`} />
                  {ROLE_NAMES[role]}
                </h3>
                <div className="selected-recipes">
                  {palette[role].map((id) => (
                    <span key={id}>
                      {recipeById(id).name}
                      <button
                        type="button"
                        aria-label={`Remove ${recipeById(id).name}`}
                        onClick={() =>
                          setPalette({ ...palette, [role]: palette[role].filter((r) => r !== id) })
                        }
                      >
                        <Icon name="close" size={13} />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  aria-label={`Add ${ROLE_NAMES[role]} recipe`}
                  value=""
                  onChange={(event) => {
                    if (event.target.value)
                      setPalette({ ...palette, [role]: [...palette[role], event.target.value] });
                  }}
                >
                  <option value="">+ Choose {(ROLE_NAMES[role] ?? role).toLowerCase()}</option>
                  {RECIPES.filter(
                    (recipe) => recipe.slot === role && !palette[role].includes(recipe.id),
                  ).map((recipe) => (
                    <option value={recipe.id} key={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </section>
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={slotsToFill === 0} type="submit">
            <Icon name="sparkles" />
            Build plan · {slotsToFill} slots
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function SettingsForm({ close }: { close: () => void }) {
  const { data, update } = useStore();
  const [error, setError] = useState('');
  const [pending, setPending] = useState<CubeData | null>(null);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `cube-kitchen-${localDate()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Modal title="Your kitchen data" close={close}>
      <div className="form-body">
        <p>
          Your freezer and monthly plans are saved on this device and in the project folder when the
          app’s server is available.
        </p>
        <div className="settings-summary">
          <span>
            <strong>{data.batches.length}</strong> batches
          </span>
          <span>
            <strong>{data.meals.length}</strong> planned & eaten meals
          </span>
          <span>
            <strong>{data.favorites.length}</strong> saved recipes
          </span>
        </div>
        <button className="button secondary" onClick={download}>
          <Icon name="download" />
          Export backup
        </button>
        <hr />
        <label>
          Restore a Cube Kitchen backup
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (event) => {
              setPending(null);
              setError('');
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const parsed: unknown = JSON.parse(await file.text());
                const next = parseData(parsed);
                if (!next)
                  throw new Error('This is not a valid Cube Kitchen backup. Nothing has changed.');
                setPending(next);
              } catch (error) {
                setError(errorText(error));
              }
            }}
          />
        </label>
        {pending && (
          <div className="form-note">
            <div>
              <p>
                This backup contains <strong>{pending.batches.length} batches</strong> and{' '}
                <strong>{pending.meals.length} meals</strong>. Restoring replaces your current cube
                data.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  update(() => pending);
                  close();
                }}
              >
                Replace data with this backup
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <p className="field-help">
          Your original Sunday Kitchen data is preserved separately. The recipe library is a local
          snapshot; refresh it with the project’s import command.
        </p>
      </div>
    </Modal>
  );
}
