import type { Annotation, Rect } from './types';

const PALETTE = ['#22d3ee', '#f472b6', '#a3e635', '#facc15', '#fb923c', '#a78bfa'];

export interface AnnotationState {
  items: Annotation[];
  selectedId: string | null;
  /** Running count used for default labels/colours, so they stay stable after deletes. */
  created: number;
}

export const initialAnnotationState: AnnotationState = { items: [], selectedId: null, created: 0 };

export type AnnotationAction =
  | { type: 'add'; id: string; rect: Rect }
  | { type: 'select'; id: string | null }
  | { type: 'setRect'; id: string; rect: Rect }
  | { type: 'rename'; id: string; label: string }
  | { type: 'delete'; id: string }
  | { type: 'clear' };

export function annotationReducer(state: AnnotationState, action: AnnotationAction): AnnotationState {
  switch (action.type) {
    case 'add': {
      const n = state.created + 1;
      const annotation: Annotation = {
        ...action.rect,
        id: action.id,
        label: `Box ${n}`,
        color: PALETTE[(n - 1) % PALETTE.length],
      };
      return { items: [...state.items, annotation], selectedId: action.id, created: n };
    }
    case 'select':
      return { ...state, selectedId: action.id };
    case 'setRect':
      return {
        ...state,
        items: state.items.map((a) => (a.id === action.id ? { ...a, ...action.rect } : a)),
      };
    case 'rename':
      return {
        ...state,
        items: state.items.map((a) => (a.id === action.id ? { ...a, label: action.label } : a)),
      };
    case 'delete':
      return {
        ...state,
        items: state.items.filter((a) => a.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case 'clear':
      return { ...state, items: [], selectedId: null };
  }
}
