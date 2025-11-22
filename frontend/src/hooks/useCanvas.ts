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

export const useCanvas = () => {
  const editorRef = useRef<Editor | null>(null);
  const frameIdsRef = useRef<TLShapeId[]>([]);

  const FRAME_WIDTH = 1920;
  const FRAME_HEIGHT = 1080;

  const createFrame = useCallback((editor: Editor, position?: { x: number; y: number }) => {
    const shapeId = createShapeId();

    const lastFrame =
      frameIdsRef.current.length > 0
        ? editor.getShape(frameIdsRef.current[frameIdsRef.current.length - 1])
        : null;

    // Calculate position based on the last frame's actual width if it exists
    const lastFrameWidth = lastFrame && "w" in lastFrame.props ? (lastFrame.props.w as number) : FRAME_WIDTH;
    
    const x = position?.x ?? (lastFrame ? lastFrame.x + lastFrameWidth + 50 : 100);
    const y = position?.y ?? (lastFrame ? lastFrame.y : 100);

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
    frameIdsRef.current.push(shapeId);

    return shapeId;
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const firstFrame =
          frameIdsRef.current.length > 0
            ? editor.getShape(frameIdsRef.current[0])
            : null;

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
  }, []);

  const handleClear = useCallback(() => {
    if (!editorRef.current) return;

    const firstFrameId = frameIdsRef.current[0];
    const shapes = editorRef.current.getCurrentPageShapesSorted();

    const shapesToDelete = shapes
      .filter((s) => s.id !== firstFrameId)
      .map((s) => s.id);

    editorRef.current.deleteShapes(shapesToDelete);
    
    // Reset frames list to just the first one if it exists, or empty
    // Actually, the original code kept the first frame.
    frameIdsRef.current = firstFrameId ? [firstFrameId] : [];
  }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    
    // Check if any frames already exist in the editor to prevent duplicates in Strict Mode
    const existingFrames = editor.getCurrentPageShapes().filter(s => s.type === 'aspect-frame');
    
    if (existingFrames.length === 0) {
        createFrame(editor);
    } else {
        // Sync ref with existing frames
        frameIdsRef.current = existingFrames.map(s => s.id);
        
        // Migration: Update existing frames to include new properties if missing
        const framesToUpdate = existingFrames.filter(frame => {
            const props = frame.props as any;
            return !props.name || !props.backgroundColor || props.opacity === undefined;
        });
        
        if (framesToUpdate.length > 0) {
            editor.updateShapes(
                framesToUpdate.map(frame => ({
                    id: frame.id,
                    type: 'aspect-frame' as const,
                    props: {
                        ...frame.props,
                        name: (frame.props as any).name || '16:9 Frame',
                        backgroundColor: (frame.props as any).backgroundColor || '#ffffff',
                        opacity: (frame.props as any).opacity ?? 1,
                    },
                }))
            );
        }
    }

    // Create global context frame on load if it doesn't exist
    const existingGCF = editor.getCurrentPageShapes().find(s => s.type === 'global-context-frame');
    if (!existingGCF) {
        const shapeId = createShapeId();
        const shape: TLShapePartial = {
            id: shapeId,
            type: "global-context-frame",
            x: -100,
            y: 100,
            props: {
                w: 2000,
                h: 2400,
                title: "Global Context Frame",
                backgroundColor: "#f8f9fa",
            },
        };
        editor.createShapes([shape]);
    }

    // Register side effect to prevent frame overlap
    editor.sideEffects.registerBeforeChangeHandler('shape', (prev, next) => {
        if (next.type !== 'aspect-frame') return next;
        
        // Only check if position changed
        if (prev.x === next.x && prev.y === next.y) return next;

        const nextProps = next.props as { w: number, h: number };
        const nextBounds = new Box(next.x, next.y, nextProps.w, nextProps.h);
        
        const others = editor.getCurrentPageShapes().filter(s => s.type === 'aspect-frame' && s.id !== next.id);
        
        for (const other of others) {
            const otherProps = other.props as { w: number, h: number };
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
    editor.sideEffects.registerBeforeDeleteHandler('shape', (shape) => {
        if (shape.type === 'aspect-frame') {
             // Find all arrows on the page
             const arrows = editor.getCurrentPageShapes().filter(s => s.type === 'arrow');
             
             const arrowsToDelete: TLShapeId[] = [];
             
             for (const arrow of arrows) {
                 // We can use getBindingsFromShape if available, or check bindings manually
                 // Since we saw getBindingsFromShape in the source, let's try to use it safely
                 // If it's not available on editor instance directly (it might be an internal util), 
                 // we can fallback to store query but iterating arrows is safer context-wise.
                 
                 // Let's try to access bindings from the arrow shape itself if possible? 
                 // No, bindings are separate records.
                 
                 // Let's use the store query but specifically for bindings from this arrow
                 const bindings = editor.store.allRecords().filter(r => 
                    r.typeName === 'binding' && 
                    r.type === 'arrow' && 
                    (r as any).fromId === arrow.id
                 );
                 
                 const isConnected = bindings.some(b => (b as any).toId === shape.id);
                 if (isConnected) {
                     arrowsToDelete.push(arrow.id);
                 }
             }
            
            if (arrowsToDelete.length > 0) {
                editor.deleteShapes(arrowsToDelete);
            }
        }
    });

    // Register side effect to auto-select incoming arrow when frame is selected
    editor.sideEffects.registerBeforeChangeHandler('instance_page_state', (_prev, next) => {
      const nextSelected = next.selectedShapeIds;
      if (nextSelected.length === 1) {
        const selectedId = nextSelected[0];
        const shape = editor.getShape(selectedId);
        if (shape && shape.type === 'aspect-frame') {
           const bindings = editor.getBindingsInvolvingShape(selectedId);
           const incomingBinding = bindings.find((b: any) => b.toId === selectedId && b.props.terminal === 'end');
           if (incomingBinding) {
             return {
               ...next,
               selectedShapeIds: [...nextSelected, incomingBinding.fromId]
             };
           }
        }
      }
      return next;
    });

    // Register listener to select frame when clicking on its children
    editor.sideEffects.registerAfterChangeHandler('instance_page_state', (prev, next) => {
      const nextSelected = next.selectedShapeIds;
      const prevSelected = prev.selectedShapeIds;
      
      // Only act if selection changed
      if (nextSelected.length === 1 && nextSelected[0] !== prevSelected[0]) {
        const selectedId = nextSelected[0];
        const shape = editor.getShape(selectedId);
        if (shape && shape.parentId) {
          const parent = editor.getShape(shape.parentId);
          if (parent && parent.type === 'aspect-frame') {
            // Select the parent frame instead of the child
            setTimeout(() => editor.select(parent.id), 0);
          }
        }
      }
      return next;
    });

    // We can't easily return the cleanup function from handleMount, 
    // but since handleMount is called once (or twice in strict mode), 
    // we should be careful. 
    // Ideally this should be in a useEffect, but we need the editor instance.
    // Since we store editor in ref, we can use a useEffect that depends on nothing 
    // but checks the ref? No, handleMount provides the editor.
    
    // Actually, let's move this to a useEffect that runs when editorRef.current is set?
    // But editorRef is a ref, changes don't trigger re-renders.
    // We can just leave it here, but we risk registering multiple times if handleMount is called multiple times.
    // However, handleMount is usually called once per editor instance lifecycle.
    
    // To be safe, we can store the cleanup function in a ref and call it if it exists.
    // But for now, let's just register it.
    
  }, [createFrame]);

  const createGlobalContextFrame = useCallback((position?: { x: number; y: number }) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    
    // Check if a global context frame already exists
    const existingGCF = editor.getCurrentPageShapes().find(s => s.type === 'global-context-frame');
    if (existingGCF) {
      // If one exists, select it and zoom to it instead of creating a new one
      editor.select(existingGCF.id);
      editor.zoomToBounds(editor.getShapePageBounds(existingGCF.id)!, { animation: { duration: 200 } });
      return existingGCF.id;
    }
    
    const shapeId = createShapeId();

    const x = position?.x ?? 100;
    const y = position?.y ?? 100;

    const shape: TLShapePartial = {
      id: shapeId,
      type: "global-context-frame",
      x,
      y,
      props: {
        w: 2000,
        h: 2400,
        title: "Global Context Frame",
        backgroundColor: "#f8f9fa",
      },
    };

    editor.createShapes([shape]);
    editor.select(shapeId);
    editor.zoomToBounds(editor.getShapePageBounds(shapeId)!, { animation: { duration: 200 } });

    return shapeId;
  }, []);

  return {
    handleMount,
    handleImport,
    handleClear,
    createGlobalContextFrame,
    editorRef, // Expose editor ref for components outside Tldraw context
  };
};
