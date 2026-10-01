import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { StoreContext } from '../storage/context';
import { CubeStore, memoryAdapter } from '../storage/store';
import { emptyData, type CubeData } from '../domain/types';
import { batch, meal, PROTEIN, STARCH, stocked } from '../test/fixtures';
import { localDate, nextMonthDate, parseDate } from '../domain/dates';
import { cookingSteps } from '../domain/cooking';
import { recipeById } from '../domain/recipes';

async function renderPage(route: string, data: CubeData = emptyData()) {
  const store = new CubeStore(memoryAdapter(data));
  await store.load();
  render(
    <StoreContext.Provider value={store}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </StoreContext.Provider>,
  );
  return store;
}

describe('phone pages', () => {
  it('opens the daily menu by default on phones', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(max-width: 700px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    try {
      await renderPage('/');
      expect(screen.getByRole('heading', { name: 'What’s on the menu?' })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('shows every meal component, deducts cubes, advances up next, and supports undo', async () => {
    const today = localDate();
    const user = userEvent.setup();
    const store = await renderPage(
      '/today',
      stocked({
        batches: [
          batch({ frozenOn: today, useBy: nextMonthDate(today) }),
          batch({ id: 'rice', recipeId: STARCH, frozenOn: today, useBy: nextMonthDate(today) }),
        ],
        meals: [
          meal({
            date: today,
            components: [
              { recipeId: PROTEIN, servings: 1 },
              { recipeId: STARCH, servings: 1 },
            ],
          }),
          meal({ id: 'dinner', date: today, slot: 'dinner' }),
        ],
      }),
    );
    const next = screen.getByRole('region', { name: 'Next meal' });
    expect(next).toHaveTextContent('Lunch · today');
    const lunch = screen.getAllByRole('article')[0]!;
    expect(within(lunch).getByRole('link', { name: recipeById(STARCH).name })).toBeInTheDocument();
    await user.click(within(lunch).getByRole('button', { name: 'Mark eaten' }));
    expect(store.getSnapshot().data.batches.map((batch) => batch.remaining)).toEqual([12, 12]);
    expect(next).toHaveTextContent('Dinner · today');
    await user.click(within(lunch).getByRole('button', { name: 'Undo eaten' }));
    expect(store.getSnapshot().data.batches.map((batch) => batch.remaining)).toEqual([14, 14]);
    expect(next).toHaveTextContent('Lunch · today');
    await store.flush();
  });
  it('finds the next planned day and prevents eating future or missing-stock meals', async () => {
    const today = localDate();
    const future = parseDate(today);
    future.setDate(future.getDate() + 1);
    const tomorrow = localDate(future);
    const user = userEvent.setup();
    const store = await renderPage('/today', { ...emptyData(), meals: [meal({ date: tomorrow })] });
    expect(
      screen.getByRole('heading', { name: 'Nothing planned for this day yet.' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View meal' }));
    expect(screen.getByLabelText('Menu date')).toHaveValue(tomorrow);
    expect(screen.queryByRole('button', { name: 'Mark eaten' })).not.toBeInTheDocument();
    expect(store.getSnapshot().data.meals[0]?.eatenAt).toBeUndefined();
    cleanup();
    await renderPage('/today', { ...emptyData(), meals: [meal({ date: today })] });
    expect(screen.getByRole('button', { name: 'Mark eaten' })).toBeDisabled();
    expect(screen.getByText(/Needs cooking:/)).toBeInTheDocument();
  });
  it('navigates dates across month boundaries and handles an invalid date link', async () => {
    const user = userEvent.setup();
    await renderPage('/today?date=not-a-date');
    expect(screen.getByLabelText('Menu date')).toHaveValue(localDate());
    fireEvent.change(screen.getByLabelText('Menu date'), { target: { value: '2027-01-31' } });
    await user.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getByLabelText('Menu date')).toHaveValue('2027-02-01');
    await user.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(screen.getByLabelText('Menu date')).toHaveValue('2027-01-31');
  });
  it('remembers cooking progress after reopening and keeps recipes separate', async () => {
    const user = userEvent.setup();
    await renderPage(`/cook/${PROTEIN}`);
    const firstIngredient = screen.getAllByRole('checkbox')[0]!;
    await user.click(firstIngredient);
    await user.click(screen.getByRole('button', { name: 'Start cooking' }));
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    cleanup();
    await renderPage(`/cook/${PROTEIN}`);
    expect(screen.getByText(/^STEP 2 OF/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ingredients' }));
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
    cleanup();
    await renderPage(`/cook/${STARCH}`);
    expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
    cleanup();
    await renderPage(`/cook/${PROTEIN}`);
    await user.click(screen.getByRole('button', { name: 'Start a new batch' }));
    expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Start cooking' }));
    expect(screen.getByText(/^STEP 1 OF/)).toBeInTheDocument();
  });
  it('finishes a recipe without inventing freezer stock and offers batch logging', async () => {
    const count = cookingSteps(
      recipeById(PROTEIN).sections.find((section) => section.title === 'Method')!.content,
    ).length;
    localStorage.setItem(
      `cube-kitchen:cook:${PROTEIN}`,
      JSON.stringify({ step: count - 1, view: 'Method' }),
    );
    const user = userEvent.setup();
    const store = await renderPage(`/cook/${PROTEIN}`);
    await user.click(screen.getByRole('button', { name: 'Finish cooking' }));
    expect(store.getSnapshot().data.batches).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'See freezing instructions' }));
    await user.click(screen.getByRole('button', { name: 'Log a frozen batch' }));
    expect(within(screen.getByRole('dialog')).getByLabelText('Recipe')).toHaveValue(PROTEIN);
  });
  it('handles missing recipes and damaged saved progress', async () => {
    await renderPage('/cook/unknown');
    expect(screen.getByRole('heading', { name: 'Recipe not found' })).toBeInTheDocument();
    cleanup();
    localStorage.setItem(`cube-kitchen:cook:${PROTEIN}`, 'broken');
    await renderPage(`/cook/${PROTEIN}`);
    expect(screen.getByRole('heading', { name: 'Get everything ready.' })).toBeInTheDocument();
  });
});
