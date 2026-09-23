import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('Today', () => {
  it('shows the setup screen before the plan starts', () => {
    renderApp({ date: new Date(2026, 8, 22) });
    expect(screen.getByRole('heading', { name: /Week 1 starts Saturday/ })).toBeInTheDocument();
  });

  it("shows Monday's meals from the fridge", () => {
    renderApp({ date: new Date(2026, 8, 28) });
    expect(screen.getByRole('heading', { name: 'Monday: just reheat' })).toBeInTheDocument();
    const meals = screen.getByRole('region', { name: 'What you eat today' });
    expect(within(meals).getByText('Paprika chicken, potatoes & carrots')).toBeInTheDocument();
    expect(within(meals).getByText('Loubia with beef')).toBeInTheDocument();
    expect(
      within(meals).getByText(/With: Whole-wheat bread or a kesra wedge · Cucumber & tomato salad/),
    ).toBeInTheDocument();
  });

  it('reminds you on Wednesday to move tomorrow’s meals out of the freezer', () => {
    renderApp({ date: new Date(2026, 8, 30) });
    const jobs = screen.getByRole('region', { name: 'Jobs today' });
    expect(within(jobs).getByText(/move 2 things from the freezer/)).toBeInTheDocument();
  });
});

describe('Shopping', () => {
  it('saves ticks to the store', async () => {
    const user = userEvent.setup();
    const { store } = renderApp({ date: new Date(2026, 8, 26), route: '/shopping' });
    await user.click(screen.getByRole('checkbox', { name: /beef chunks/i }));
    expect(store.getSnapshot().data.checklists['2026-09-26']?.items['shop-0-0']).toBe(true);
    expect(screen.getByLabelText('1 of 30 done')).toBeInTheDocument();
  });

  it('switches weeks through the week switcher', async () => {
    const user = userEvent.setup();
    renderApp({ date: new Date(2026, 8, 26), route: '/shopping' });
    await user.click(screen.getByRole('button', { name: /Week 2/ }));
    expect(screen.getByRole('checkbox', { name: /Red lentils/ })).toBeInTheDocument();
  });
});

describe('Nutrition', () => {
  it('shows the day against the targets on Today', () => {
    renderApp({ date: new Date(2026, 8, 28) });
    const numbers = screen.getByRole('region', { name: "Today's numbers" });
    expect(
      within(numbers).getByRole('meter', { name: /^Calories: .* of 1,700 kcal/ }),
    ).toBeInTheDocument();
  });

  it('recalculates targets when the profile changes', async () => {
    const user = userEvent.setup();
    const { store } = renderApp({ date: new Date(2026, 8, 28), route: '/nutrition' });
    expect(screen.getByRole('heading', { name: '1,700 kcal · 130 g protein' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Goal'), 'maintain');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(store.getSnapshot().data.profile?.goal).toBe('maintain');
    expect(screen.getByRole('heading', { name: /^2,100 kcal/ })).toBeInTheDocument();
  });
});

describe('Freezer', () => {
  it('logs the Sunday batch once', async () => {
    const user = userEvent.setup();
    renderApp({ date: new Date(2026, 8, 27), route: '/freezer' });
    await user.click(screen.getByRole('button', { name: /Log Week 1 batch/ }));
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week 1 batch logged' })).toBeDisabled();
  });
});

describe('Recipes', () => {
  it('opens a recipe page', () => {
    renderApp({ date: new Date(2026, 8, 26), route: '/recipes/zitoune' });
    expect(
      screen.getByRole('heading', { name: 'Chicken with olives & mushrooms' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/pitted green olives/)).toBeInTheDocument();
  });

  it('shows how to eat a dish, its sides and how to thaw it', () => {
    renderApp({ date: new Date(2026, 8, 26), route: '/recipes/loubia' });
    const serve = screen.getByRole('region', { name: 'How to eat it' });
    expect(
      within(serve).getByRole('link', { name: 'Whole-wheat bread or a kesra wedge' }),
    ).toHaveAttribute('href', '/recipes/kesra');
    expect(within(serve).getByRole('heading', { name: 'From the freezer' })).toBeInTheDocument();
  });

  it('shows cutter prep and nutrition per portion', () => {
    renderApp({ date: new Date(2026, 8, 26), route: '/recipes/bolognese' });
    expect(screen.getAllByText('Small grater').length).toBeGreaterThan(0);
    expect(screen.getByText('Per portion:')).toBeInTheDocument();
  });

  it('marks tray bakes as fridge-only', () => {
    renderApp({ date: new Date(2026, 8, 26), route: '/recipes/paprika-tray' });
    expect(screen.getByRole('heading', { name: 'Fridge only' })).toBeInTheDocument();
  });

  it('handles an unknown recipe', () => {
    renderApp({ date: new Date(2026, 8, 26), route: '/recipes/pizza' });
    expect(screen.getByRole('heading', { name: 'Recipe not found' })).toBeInTheDocument();
  });
});
