import { useEffect, useReducer } from 'react';
import { Camera, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { CapturedPhoto } from '../../types/photo';
import { AnnotationCanvas } from './AnnotationCanvas';
import { AnnotationList } from './AnnotationList';
import { annotationReducer, initialAnnotationState } from './annotationReducer';
import { downloadJson, toExportJson } from './exportAnnotations';

interface AnnotateScreenProps {
  photo: CapturedPhoto;
  onNewPhoto: () => void;
}

export function AnnotateScreen({ photo, onNewPhoto }: AnnotateScreenProps) {
  const [{ items, selectedId }, dispatch] = useReducer(annotationReducer, initialAnnotationState);

  // Keyboard shortcuts (desktop): Delete/Backspace removes, Escape deselects.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') dispatch({ type: 'select', id: null });
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        dispatch({ type: 'delete', id: selectedId });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  function handleNewPhoto() {
    if (items.length === 0 || window.confirm('Discard this photo and its annotations?')) onNewPhoto();
  }

  function handleClear() {
    if (window.confirm(`Delete all ${items.length} annotations?`)) dispatch({ type: 'clear' });
  }

  function handleExport() {
    downloadJson(toExportJson(items, photo.width, photo.height), 'annotations.json');
  }

  const hint = selectedId
    ? 'Drag the box to move it, drag a handle to resize.'
    : 'Drag on the photo to draw a box. Tap a box to select it.';

  return (
    // Portrait: list as a bottom panel. Landscape (rotated phones, tablets, desktop): sidebar.
    <div className="flex h-full flex-col bg-black landscape:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <Button size="sm" onClick={handleNewPhoto}>
            <Camera className="size-4" /> New photo
          </Button>
          <Button size="sm" onClick={handleExport} disabled={items.length === 0}>
            <Download className="size-4" /> Export JSON
          </Button>
        </header>

        <div className="min-h-0 flex-1 px-3 pb-2">
          <AnnotationCanvas
            imageUrl={photo.url}
            imageWidth={photo.width}
            imageHeight={photo.height}
            annotations={items}
            selectedId={selectedId}
            onCreate={(rect) => dispatch({ type: 'add', id: crypto.randomUUID(), rect })}
            onSelect={(id) => dispatch({ type: 'select', id })}
            onChangeRect={(id, rect) => dispatch({ type: 'setRect', id, rect })}
          />
        </div>

        <p className="px-4 pb-2 text-center text-xs text-neutral-400">{hint}</p>
      </div>

      <aside className="h-[38%] shrink-0 border-t border-white/10 pb-[env(safe-area-inset-bottom)] landscape:h-auto landscape:w-72 landscape:border-t-0 landscape:border-l landscape:pr-[env(safe-area-inset-right)] lg:landscape:w-80">
        <AnnotationList
          annotations={items}
          selectedId={selectedId}
          onSelect={(id) => dispatch({ type: 'select', id })}
          onRename={(id, label) => dispatch({ type: 'rename', id, label })}
          onDelete={(id) => dispatch({ type: 'delete', id })}
          onClear={handleClear}
        />
      </aside>
    </div>
  );
}
