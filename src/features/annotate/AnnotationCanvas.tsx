import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Box } from 'konva/lib/shapes/Transformer';
import { Layer, Rect as KonvaRect, Stage, Text, Transformer } from 'react-konva';
import { useElementSize } from '../../hooks/useElementSize';
import { clamp, clampPoint, rectFromPoints, toNormalized, toPixels } from './geometry';
import type { Annotation, Point, Rect } from './types';

/** Smallest box (on screen) that counts as a deliberate drag rather than a tap. */
const MIN_BOX_PX = 12;
/** Extra invisible hit area around resize anchors so they are easy to grab by touch. */
const ANCHOR_HIT_PX = 24;

interface AnnotationCanvasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
  selectedId: string | null;
  onCreate: (rect: Rect) => void;
  onSelect: (id: string | null) => void;
  onChangeRect: (id: string, rect: Rect) => void;
}

/**
 * Konva-based annotation surface.
 * - Konva handles hit-testing, dragging and resize handles (Transformer), with touch support.
 * - We keep the source of truth in normalised coordinates and convert to pixels per render.
 */
export function AnnotationCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  annotations,
  selectedId,
  onCreate,
  onSelect,
  onChangeRect,
}: AnnotationCanvasProps) {
  const [containerRef, container] = useElementSize<HTMLDivElement>();
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef(new Map<string, Konva.Rect>());
  const [draft, setDraft] = useState<{ start: Point; rect: Rect } | null>(null);

  // Fit the image inside the container ("contain"). The <img> and the Konva stage share
  // this exact box, so normalised annotations line up at any size or orientation.
  const scale = Math.min(container.width / imageWidth, container.height / imageHeight);
  const size = { width: imageWidth * scale, height: imageHeight * scale };

  // Attach the Transformer (resize handles) to the selected box.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedId ? shapeRefs.current.get(selectedId) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, annotations, size.width, size.height]);

  function pointerPosition(e: KonvaEventObject<PointerEvent>): Point | null {
    const pos = e.target.getStage()?.getPointerPosition();
    return pos ? { x: pos.x / size.width, y: pos.y / size.height } : null;
  }

  // --- Drawing new boxes (on empty stage area) -------------------------------------------

  function handlePointerDown(e: KonvaEventObject<PointerEvent>) {
    if (draft) return; // ignore a second finger mid-gesture
    if (e.evt.pointerType === 'mouse' && e.evt.button !== 0) return;

    const target = e.target;
    if (target.hasName('annotation')) {
      onSelect(target.id()); // Konva takes care of the drag itself
      return;
    }
    if (target !== target.getStage()) return; // e.g. a Transformer anchor

    onSelect(null);
    const p = pointerPosition(e);
    if (p) setDraft({ start: clampPoint(p), rect: { x: p.x, y: p.y, w: 0, h: 0 } });
  }

  function handlePointerMove(e: KonvaEventObject<PointerEvent>) {
    if (!draft) return;
    const p = pointerPosition(e);
    if (p) setDraft({ ...draft, rect: rectFromPoints(draft.start, p) });
  }

  function finishDraft() {
    if (!draft) return;
    const { w, h } = draft.rect;
    if (w * size.width >= MIN_BOX_PX && h * size.height >= MIN_BOX_PX) onCreate(draft.rect);
    setDraft(null);
  }

  // --- Moving / resizing existing boxes --------------------------------------------------

  function handleDragMove(id: string, node: Konva.Rect) {
    onChangeRect(
      id,
      toNormalized({ x: node.x(), y: node.y(), width: node.width(), height: node.height() }, size),
    );
  }

  /** The Transformer resizes via scale; fold it back into width/height so strokes don't stretch. */
  function handleTransform(id: string, node: Konva.Rect) {
    const next = {
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
    };
    node.scale({ x: 1, y: 1 });
    onChangeRect(id, toNormalized(next, size));
  }

  /** Keeps resizing inside the image and above the minimum size. */
  function boundBox(oldBox: Box, newBox: Box): Box {
    const inside =
      newBox.x >= -0.5 &&
      newBox.y >= -0.5 &&
      newBox.x + newBox.width <= size.width + 0.5 &&
      newBox.y + newBox.height <= size.height + 0.5;
    const bigEnough = newBox.width >= MIN_BOX_PX && newBox.height >= MIN_BOX_PX;
    return inside && bigEnough ? newBox : oldBox;
  }

  function setCursor(e: KonvaEventObject<MouseEvent>, cursor: string) {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = cursor;
  }

  // Draw the selected box last so it sits on top of overlapping boxes.
  const ordered = [
    ...annotations.filter((a) => a.id !== selectedId),
    ...annotations.filter((a) => a.id === selectedId),
  ];

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {scale > 0 && (
        <div
          className="absolute touch-none"
          style={{
            width: size.width,
            height: size.height,
            left: (container.width - size.width) / 2,
            top: (container.height - size.height) / 2,
          }}
        >
          <img
            src={imageUrl}
            alt="Photo being annotated"
            draggable={false}
            className="block h-full w-full select-none"
          />
          <Stage
            width={size.width}
            height={size.height}
            className="absolute inset-0 cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDraft}
            onPointerLeave={finishDraft}
            onPointerCancel={() => setDraft(null)}
          >
            <Layer>
              {ordered.map((a) => {
                const px = toPixels(a, size);
                const selected = a.id === selectedId;
                return (
                  <KonvaRect
                    key={a.id}
                    id={a.id}
                    name="annotation"
                    ref={(node) => {
                      if (node) shapeRefs.current.set(a.id, node);
                      else shapeRefs.current.delete(a.id);
                    }}
                    {...px}
                    fill={`${a.color}${selected ? '33' : '1a'}`}
                    stroke={a.color}
                    strokeWidth={selected ? 3 : 2}
                    strokeScaleEnabled={false}
                    draggable
                    dragBoundFunc={(pos) => ({
                      x: clamp(pos.x, 0, size.width - px.width),
                      y: clamp(pos.y, 0, size.height - px.height),
                    })}
                    onDragMove={(e) => handleDragMove(a.id, e.target as Konva.Rect)}
                    onTransform={(e) => handleTransform(a.id, e.target as Konva.Rect)}
                    onMouseEnter={(e) => setCursor(e, 'move')}
                    onMouseLeave={(e) => setCursor(e, 'crosshair')}
                  />
                );
              })}

              {/* Labels are drawn separately and ignore input, so they never block dragging. */}
              {annotations.map((a) => {
                const px = toPixels(a, size);
                return (
                  <Text
                    key={`label-${a.id}`}
                    x={px.x + 4}
                    y={px.y > 18 ? px.y - 16 : px.y + 4}
                    text={a.label || 'Untitled'}
                    fontSize={13}
                    fontStyle="bold"
                    fill={a.color}
                    shadowColor="black"
                    shadowBlur={3}
                    shadowOpacity={1}
                    listening={false}
                  />
                );
              })}

              {draft && (
                <KonvaRect
                  {...toPixels(draft.rect, size)}
                  fill="rgba(255,255,255,0.1)"
                  stroke="white"
                  strokeWidth={2}
                  dash={[6, 4]}
                  listening={false}
                />
              )}

              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                flipEnabled={false}
                keepRatio={false}
                ignoreStroke
                anchorSize={14}
                anchorCornerRadius={7}
                anchorStroke="white"
                anchorFill="white"
                borderStroke="white"
                borderDash={[4, 4]}
                anchorStyleFunc={(anchor) => anchor.hitStrokeWidth(ANCHOR_HIT_PX)}
                boundBoxFunc={boundBox}
              />
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  );
}
