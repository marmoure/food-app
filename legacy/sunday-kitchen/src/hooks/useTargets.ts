import { useMemo } from 'react';
import { type Targets, targetsFor } from '../domain/nutrition/targets';
import { useAppData } from '../storage/context';
import { profileOf } from '../storage/selectors';

export function useTargets(): Targets {
  const profile = profileOf(useAppData());
  return useMemo(() => targetsFor(profile), [profile]);
}
