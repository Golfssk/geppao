'use client';
import {createContext,useContext} from 'react';
import type {DraftScope} from '@/lib/planner/draft-scope';
export const PlannerDraftContext=createContext<{scope:DraftScope;available:boolean}|null>(null);
export function usePlannerDraftScope(){const value=useContext(PlannerDraftContext);if(!value)throw new Error('Planner draft scope is missing');return value.scope}
