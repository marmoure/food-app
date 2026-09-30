import { Link } from 'react-router';
import { ROLE_NAMES } from '../domain/recipes';
import type { Recipe } from '../domain/types';
import { useStore } from '../storage/context';
import { Icon } from './Icon';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { data, update } = useStore();
  const favorite = data.favorites.includes(recipe.id);
  return (
    <article className="recipe-card">
      <Link to={`/recipes/${recipe.id}`} tabIndex={-1} aria-hidden="true" className="recipe-photo">
        {recipe.image ? (
          <img src={recipe.image} alt="" loading="lazy" />
        ) : (
          <Icon name="cube" size={48} />
        )}
        <span className={`tag role-${recipe.slot}`}>{ROLE_NAMES[recipe.slot]}</span>
      </Link>
      <button
        className={`favorite ${favorite ? 'is-favorite' : ''}`}
        aria-label={`${favorite ? 'Unsave' : 'Save'} ${recipe.name}`}
        aria-pressed={favorite}
        onClick={() =>
          update((state) => ({
            ...state,
            favorites: favorite
              ? state.favorites.filter((id) => id !== recipe.id)
              : [...state.favorites, recipe.id],
          }))
        }
      >
        <Icon name="heart" size={18} />
      </button>
      <div className="recipe-card-body">
        <p className="eyebrow">{recipe.cuisine}</p>
        <h3>
          <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
        </h3>
        <div className="recipe-card-footer">
          <span>
            {recipe.kcal} kcal <span className="dot">·</span> {recipe.protein} g protein
          </span>
          <span>{recipe.mouldMl} ml</span>
        </div>
      </div>
    </article>
  );
}
