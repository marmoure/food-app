import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { RecipeId } from '../domain/types';

export function RecipeLink({ id, children = 'Recipe' }: { id: RecipeId; children?: ReactNode }) {
  return (
    <Link className="linkbtn" to={`/recipes/${id}`}>
      {children}
    </Link>
  );
}
