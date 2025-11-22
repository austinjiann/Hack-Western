import { useCallback, useRef } from "react";
import {
  Editor,
  TLShapePartial,
  createShapeId,
  TLShapeId,
  TLImageAsset,
  AssetRecordType,
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
    // Initialize with one frame
    createFrame(editor);
  }, [createFrame]);

  return {
    handleMount,
    handleImport,
    handleClear,
  };
};
