import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { Annotation } from './types';

interface AnnotationListProps {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function AnnotationList({
  annotations,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onClear,
}: AnnotationListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Selecting a box on the canvas scrolls its row into view.
  useEffect(() => {
    if (!selectedId) return;
    listRef.current
      ?.querySelector(`[data-id="${CSS.escape(selectedId)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <section aria-label="Annotations" className="flex h-full flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold">
          Annotations <span className="text-neutral-400">({annotations.length})</span>
        </h2>
        {annotations.length > 0 && (
          <button onClick={onClear} className="text-sm text-red-300 hover:text-red-200">
            Clear all
          </button>
        )}
      </header>

      {annotations.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-neutral-400">
          No boxes yet. Drag on the photo to draw one.
        </p>
      ) : (
        <ul ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {annotations.map((a) => {
            const selected = a.id === selectedId;
            return (
              <li
                key={a.id}
                data-id={a.id}
                onClick={() => onSelect(a.id)}
                className={`flex items-center gap-2 rounded-xl p-2 ${
                  selected ? 'bg-white/15 ring-1 ring-white/40' : 'bg-white/5'
                }`}
              >
                <span className="size-3 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                {/* text-base avoids iOS auto-zoom on focus */}
                <input
                  value={a.label}
                  onChange={(e) => onRename(a.id, e.target.value)}
                  onFocus={() => onSelect(a.id)}
                  placeholder="Untitled"
                  aria-label="Annotation label"
                  className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 text-base outline-none focus:bg-white/10"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(a.id);
                  }}
                  aria-label={`Delete ${a.label || 'annotation'}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-300 hover:bg-white/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
