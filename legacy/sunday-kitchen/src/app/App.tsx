import { Route, Routes } from 'react-router';
import { FreezerView } from '../features/freezer/FreezerView';
import { NutritionView } from '../features/nutrition/NutritionView';
import { RecipeDetailView } from '../features/recipes/RecipeDetailView';
import { RecipesView } from '../features/recipes/RecipesView';
import { ShoppingView } from '../features/shopping/ShoppingView';
import { StartView } from '../features/start/StartView';
import { SundayView } from '../features/sunday/SundayView';
import { TodayView } from '../features/today/TodayView';
import { WeekView } from '../features/week/WeekView';
import { Layout } from './Layout';
import { NotFound } from './NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayView />} />
        <Route path="week" element={<WeekView />} />
        <Route path="sunday" element={<SundayView />} />
        <Route path="shopping" element={<ShoppingView />} />
        <Route path="recipes" element={<RecipesView />} />
        <Route path="recipes/:id" element={<RecipeDetailView />} />
        <Route path="nutrition" element={<NutritionView />} />
        <Route path="freezer" element={<FreezerView />} />
        <Route path="start" element={<StartView />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
