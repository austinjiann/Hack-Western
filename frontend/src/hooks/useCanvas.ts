import { useCallback, useRef } from "react";
import {
  Editor,
  TLShapePartial,
  createShapeId,
  TLShapeId,
  TLImageAsset,
  AssetRecordType,
  Box,
} from "tldraw";
import { seedDefaultCanvas } from "../utils/canvasDefaults";

export const useCanvas = () => {
  const editorRef = useRef<Editor | null>(null);
  const frameIdsRef = useRef<Map<string, TLShapeId[]>>(new Map());

  const FRAME_WIDTH = 1920;
  const FRAME_HEIGHT = 1080;

  const getPageFrameIds = useCallback((editor: Editor) => {
    const pageId = editor.getCurrentPageId();
    if (!pageId) {
      return { pageId: null as string | null, ids: [] as TLShapeId[] };
    }

    let ids = frameIdsRef.current.get(pageId);
    if (!ids) {
      ids = [];
      frameIdsRef.current.set(pageId, ids);
    }

    return { pageId, ids };
  }, []);

  const createFrame = useCallback(
    (editor: Editor, position?: { x: number; y: number }) => {
      const shapeId = createShapeId();
      const { ids } = getPageFrameIds(editor);

      const lastFrame =
        ids.length > 0 ? editor.getShape(ids[ids.length - 1]) : null;

      // Calculate position based on the last frame's actual width if it exists
      const lastFrameWidth =
        lastFrame && "w" in lastFrame.props
          ? (lastFrame.props.w as number)
          : FRAME_WIDTH;

      const x =
        position?.x ?? (lastFrame ? lastFrame.x + lastFrameWidth + 50 : 100);
      const y = position?.y ?? (lastFrame ? lastFrame.y : 400);

      const shape: TLShapePartial = {
        id: shapeId,
        type: "aspect-frame",
        x,
        y,
        props: {
          w: FRAME_WIDTH,
          h: FRAME_HEIGHT,
          name: "16:9 Frame",
          backgroundColor: "#ffffff",
        },
      };

      editor.createShapes([shape]);
      ids.push(shapeId);

      return shapeId;
    },
    [getPageFrameIds],
  );

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editorRef.current) return;
      const file = e.target.files?.[0];
      if (!file) return;

      const editor = editorRef.current;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;

        const img = new Image();
        img.onload = () => {
          const assetId = AssetRecordType.createId();

          const asset: TLImageAsset = {
            id: assetId,
            type: "image",
            typeName: "asset",
            props: {
              name: file.name,
              src: dataUrl,
              w: img.width,
              h: img.height,
              mimeType: file.type,
              isAnimated: false,
            },
            meta: {},
          };

          editor.createAssets([asset]);

          const { ids } = getPageFrameIds(editor);
          const firstFrame = ids.length > 0 ? editor.getShape(ids[0]) : null;

          const x = firstFrame ? firstFrame.x + 50 : 150;
          const y = firstFrame ? firstFrame.y + 50 : 150;

          const shapeId = createShapeId();
          const shape: TLShapePartial = {
            id: shapeId,
            type: "image",
            x,
            y,
            props: {
              assetId,
              w: img.width,
              h: img.height,
            },
          };

          editor.createShapes([shape]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [getPageFrameIds],
  );

  const focusCameraOnFrame = useCallback(
    (editor: Editor, frameId: TLShapeId, opts?: { immediate?: boolean }) => {
      const frame = editor.getShape(frameId);
      if (!frame) return;

      const frameBounds = editor.getShapePageBounds(frameId);
      if (!frameBounds) return;

      // Get all seeded tutorial shapes (those with the seed meta tag)
      const tutorialShapes = editor
        .getCurrentPageShapes()
        .filter((s) => s.meta?.seedTag === "flowboard-default-seed-v1");

      // Calculate bounds that include both frame and tutorial content
      let combinedBounds = frameBounds.clone();
      tutorialShapes.forEach((shape) => {
        const shapeBounds = editor.getShapePageBounds(shape.id);
        if (shapeBounds) {
          combinedBounds = combinedBounds.expand(shapeBounds);
        }
      });

      const size = Math.max(combinedBounds.width, combinedBounds.height);
      const padding = size > 0 ? size * 0.02 : 32; // Reduced padding for closer zoom
      const paddedBounds = combinedBounds.clone().expandBy(padding);
      const moveOptions = opts?.immediate
        ? { immediate: true }
        : { animation: { duration: 360 } };

      editor.zoomToBounds(paddedBounds, moveOptions);
    },
    [],
  );

  const ensureTutorialLayout = useCallback(
    (editor: Editor, focusOpts?: { immediate?: boolean }) => {
      const { ids } = getPageFrameIds(editor);
      let targetFrameId = ids.find((id) => editor.getShape(id)) ?? null;
      if (!targetFrameId) {
        targetFrameId = createFrame(editor);
      }
      if (targetFrameId) {
        seedDefaultCanvas(editor, targetFrameId);
        focusCameraOnFrame(editor, targetFrameId, focusOpts);
      }
    },
    [createFrame, focusCameraOnFrame, getPageFrameIds],
  );

  const handleClear = useCallback(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const { pageId, ids } = getPageFrameIds(editor);
    const firstFrameId = ids[0];
    const shapes = editor.getCurrentPageShapesSorted();

    // Get children of the first frame to delete them
    const firstFrameChildren = firstFrameId
      ? editor.getSortedChildIdsForParent(firstFrameId)
      : [];

    const shapesToDelete = shapes
      .filter((s) => s.id !== firstFrameId)
      .map((s) => s.id);

    // Delete all shapes except the first frame
    editor.deleteShapes(shapesToDelete);

    // Also delete children of the first frame
    if (firstFrameChildren.length > 0) {
      editor.deleteShapes(firstFrameChildren);
    }

    if (pageId) {
      frameIdsRef.current.set(pageId, firstFrameId ? [firstFrameId] : []);
    }

    ensureTutorialLayout(editor);
  }, [ensureTutorialLayout, getPageFrameIds]);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      editor.updateInstanceState({ isGridMode: true });

      // Check if any frames already exist in the editor to prevent duplicates in Strict Mode
      const existingFrames = editor
        .getCurrentPageShapes()
        .filter((s) => s.type === "aspect-frame");

      if (existingFrames.length === 0) {
        createFrame(editor);
      } else {
        const pageId = editor.getCurrentPageId();
        if (pageId) {
          frameIdsRef.current.set(
            pageId,
            existingFrames.map((s) => s.id),
          );
        }

        // Migration: Update existing frames to include new properties if missing
        const framesToUpdate = existingFrames.filter((frame) => {
          const props = frame.props as any;
          return (
            !props.name || !props.backgroundColor || props.opacity === undefined
          );
        });

        if (framesToUpdate.length > 0) {
          editor.updateShapes(
            framesToUpdate.map((frame) => ({
              id: frame.id,
              type: "aspect-frame" as const,
              props: {
                ...frame.props,
                name: (frame.props as any).name || "16:9 Frame",
                backgroundColor:
                  (frame.props as any).backgroundColor || "#ffffff",
                opacity: (frame.props as any).opacity ?? 1,
              },
            })),
          );
        }

        // Migration: Unlock all arrows so they can be deleted
        const arrows = editor
          .getCurrentPageShapes()
          .filter((s) => s.type === "arrow");
        const lockedArrows = arrows.filter((a) => a.isLocked);
        if (lockedArrows.length > 0) {
          editor.updateShapes(
            lockedArrows.map((a) => ({
              id: a.id,
              type: "arrow",
              isLocked: false,
            })),
          );
        }
      }

      // Register side effect to prevent frame overlap and lock arrow movement
      editor.sideEffects.registerBeforeChangeHandler("shape", (prev, next) => {
        // Arrow Logic: Prevent individual movement
        if (next.type === "arrow") {
          const selectedIds = editor.getSelectedShapeIds();
          if (selectedIds.includes(next.id)) {
            // Check if any connected shape (frame) is also selected
            const bindings = editor.getBindingsInvolvingShape(next.id);
            const connectedIds = bindings.map((b: any) =>
              b.fromId === next.id ? b.toId : b.fromId,
            );

            const isConnectedShapeSelected = connectedIds.some((id: any) =>
              selectedIds.includes(id),
            );

            if (!isConnectedShapeSelected) {
              // Arrow is selected but no connected shape is selected
              // Block the change to prevent individual movement/editing
              return prev;
            }
          }
          return next;
        }

        if (next.type !== "aspect-frame") return next;

        // Only check if position changed
        if (prev.x === next.x && prev.y === next.y) return next;

        const nextProps = next.props as { w: number; h: number };
        const nextBounds = new Box(next.x, next.y, nextProps.w, nextProps.h);

        const others = editor
          .getCurrentPageShapes()
          .filter((s) => s.type === "aspect-frame" && s.id !== next.id);

        for (const other of others) {
          const otherProps = other.props as { w: number; h: number };
          const otherW = otherProps.w || FRAME_WIDTH;
          const otherH = otherProps.h || FRAME_HEIGHT;
          const otherBounds = new Box(other.x, other.y, otherW, otherH);

          if (nextBounds.collides(otherBounds)) {
            // Collision detected, block the move
            return prev;
          }
        }

        return next;
      });

      // Register side effect to delete arrows when connected frame is deleted
      editor.sideEffects.registerBeforeDeleteHandler("shape", (shape) => {
        if (shape.type === "aspect-frame") {
          // Find all arrows on the page
          const arrows = editor
            .getCurrentPageShapes()
            .filter((s) => s.type === "arrow");

          const arrowsToDelete: TLShapeId[] = [];

          for (const arrow of arrows) {
            const bindings = editor.store
              .allRecords()
              .filter(
                (r) =>
                  r.typeName === "binding" &&
                  r.type === "arrow" &&
                  (r as any).fromId === arrow.id,
              );

            const isConnected = bindings.some(
              (b) => (b as any).toId === shape.id,
            );
            if (isConnected) {
              arrowsToDelete.push(arrow.id);
            }
          }

          if (arrowsToDelete.length > 0) {
            editor.deleteShapes(arrowsToDelete);
          }
        }
      });

      // Register after delete handler to restore bindings if shapes still exist
      // This prevents unbinding arrows by dragging them
      editor.sideEffects.registerAfterDeleteHandler("binding", (binding) => {
        if (binding.type === "arrow") {
          const arrowId = (binding as any).fromId;
          const targetId = (binding as any).toId;

          const arrow = editor.getShape(arrowId);
          const target = editor.getShape(targetId);

          // If both shapes still exist, this was likely an accidental unbind (e.g. dragging handle)
          if (arrow && target) {
            // Restore the binding
            editor.createBinding(binding as any);
          }
        }
      });

      // Register listener to select frame when clicking on its children
      editor.sideEffects.registerAfterChangeHandler(
        "instance_page_state",
        (prev, next) => {
          if (prev.pageId !== next.pageId) {
            ensureTutorialLayout(editor, { immediate: true });
          }
          return next;
        },
      );
      ensureTutorialLayout(editor, { immediate: true });
    },
    [createFrame, ensureTutorialLayout],
  );

  return {
    handleMount,
    handleImport,
    handleClear,
    editorRef, // Expose editor ref for components outside Tldraw context
  };
};
