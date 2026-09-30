import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { StoreContext } from '../storage/context';
import { CubeStore, memoryAdapter } from '../storage/store';
import { emptyData, type CubeData } from '../domain/types';
import { batch, meal, PROTEIN, stocked } from '../test/fixtures';
import { localDate, nextMonthDate } from '../domain/dates';

async function renderApp(route = '/', data: CubeData = emptyData()) {
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

describe('Cube Kitchen', () => {
  it('starts empty and logs a real batch with measured yield', async () => {
    const user = userEvent.setup();
    const store = await renderApp('/freezer');
    expect(
      screen.getByRole('heading', { name: 'Your next easy meal starts here.' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Freeze a batch' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Cubes frozen'), '14');
    await user.type(within(dialog).getByLabelText('Cubes per recipe serving'), '2');
    await user.type(within(dialog).getByLabelText('Freezer location'), 'Top drawer');
    await user.click(within(dialog).getByRole('button', { name: 'Add to freezer' }));
    expect(store.getSnapshot().data.batches[0]).toMatchObject({
      recipeId: PROTEIN,
      total: 14,
      remaining: 14,
      cubesPerServing: 2,
      location: 'Top drawer',
    });
    expect(screen.getByText('7 whole recipe servings')).toBeInTheDocument();
    await store.flush();
  });
  it('builds a monthly plan without creating stock or overwriting existing meals', async () => {
    const user = userEvent.setup();
    const store = await renderApp('/plan');
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(screen.getByRole('button', { name: 'Build monthly plan' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('People')).toHaveValue(1);
    expect(within(dialog).getByLabelText('Snack servings / person')).toHaveValue(2);
    await user.click(within(dialog).getByRole('button', { name: /Build plan ·/ }));
    expect(store.getSnapshot().data.meals.length).toBeGreaterThanOrEqual(112);
    expect(store.getSnapshot().data.batches).toEqual([]);
    expect(store.getSnapshot().data.meals.find((m) => m.slot === 'lunch')?.components).toHaveLength(
      3,
    );
    expect(
      screen.getByText('Chicken karahi', { selector: '.cooking-card h3 a' }),
    ).toBeInTheDocument();
    await store.flush();
  });
  it('deducts a meal when eaten and restores it on undo', async () => {
    const user = userEvent.setup();
    const today = localDate();
    const store = await renderApp(
      '/',
      stocked({
        batches: [batch({ frozenOn: today, useBy: nextMonthDate(today) })],
        meals: [meal({ date: today })],
      }),
    );
    await user.click(screen.getByRole('button', { name: /Lunch Chicken karahi/ }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark eaten' }),
    );
    expect(store.getSnapshot().data.batches[0]?.remaining).toBe(12);
    await user.click(screen.getByRole('button', { name: /Lunch · Eaten Chicken karahi/ }));
    await user.click(screen.getByRole('button', { name: 'Undo eaten & restore cubes' }));
    expect(store.getSnapshot().data.batches[0]?.remaining).toBe(14);
    await store.flush();
  });
  it('shows a missing-stock error without changing inventory', async () => {
    const user = userEvent.setup();
    const store = await renderApp('/', { ...emptyData(), meals: [meal({ date: localDate() })] });
    await user.click(screen.getByRole('button', { name: /Lunch Chicken karahi/ }));
    await user.click(screen.getByRole('button', { name: 'Mark eaten' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Not enough usable stock');
    expect(store.getSnapshot().data.meals[0]?.eatenAt).toBeUndefined();
  });
  it('searches the imported library and keeps saved recipes', async () => {
    const user = userEvent.setup();
    const store = await renderApp('/recipes');
    await user.type(screen.getByRole('textbox', { name: 'Search recipes' }), 'karahi');
    expect(screen.getByRole('link', { name: 'Chicken karahi' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Chicken karahi' }));
    expect(store.getSnapshot().data.favorites).toContain(PROTEIN);
    await user.click(screen.getByRole('link', { name: 'Chicken karahi' }));
    expect(screen.getByRole('heading', { name: 'Chicken karahi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reheat' })).toBeInTheDocument();
    expect(screen.getByText('A serving and a cube are different things.')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true'),
    );
    await store.flush();
  });
});
