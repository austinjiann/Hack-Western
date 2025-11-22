import { Editor, Tldraw, TLShapePartial, createShapeId, TLShapeId, Box, TLImageAsset, AssetRecordType } from "tldraw";
import { get, set } from "idb-keyval";
import "tldraw/tldraw.css";
import { useRef } from "react";

export default function Canvas() {
  const editorRef = useRef<Editor | null>(null);
  const frameIdsRef = useRef<TLShapeId[]>([]);

  const FRAME_WIDTH = 1920;
  const FRAME_HEIGHT = 1080;

  // Log all IndexedDB contents
  const logIDB = async () => {
    const shapes = await get("shapes");
    const frameIds = await get("frameIds");
    console.log("=== IndexedDB Contents ===");
    console.log("shapes:", shapes);
    console.log("frameIds:", frameIds);
    console.log("==========================");
  };

  const createFrame = (
    editor: Editor,
    position?: { x: number; y: number }
  ) => {
    const shapeId = createShapeId();
    
    const lastFrame = frameIdsRef.current.length > 0
      ? editor.getShape(frameIdsRef.current[frameIdsRef.current.length - 1])
      : null;
    
    const x = position?.x ?? (lastFrame ? lastFrame.x + FRAME_WIDTH + 50 : 100);
    const y = position?.y ?? (lastFrame ? lastFrame.y : 100);

    const shape: TLShapePartial = {
      id: shapeId,
      type: "geo",
      x,
      y,
      isLocked: true,
      props: {
        geo: "rectangle",
        w: FRAME_WIDTH,
        h: FRAME_HEIGHT,
        fill: "none",
        dash: "solid",
        size: "xl",
      },
    };
    
    editor.createShapes([shape]);
    frameIdsRef.current.push(shapeId);
    set("frameIds", frameIdsRef.current);
    logIDB();
    
    return shapeId;
  };

  const updateAllFrames = (editor: Editor) => {
    const updates = frameIdsRef.current
      .map((id) => {
        const shape = editor.getShape(id);
        if (!shape) return null;
        return {
          id,
          type: "geo",
          props: { w: FRAME_WIDTH, h: FRAME_HEIGHT },
        };
      })
      .filter(Boolean) as TLShapePartial[];

    if (updates.length > 0) {
      editor.updateShapes(updates);
    }
  };

  // Export as PNG (works with images)
  const handleExport = async () => {
    if (!editorRef.current || frameIdsRef.current.length === 0) {
      console.warn("No frames to export");
      return;
    }

    const editor = editorRef.current;
    const lastFrameId = frameIdsRef.current[frameIdsRef.current.length - 1];
    const frame = editor.getShape(lastFrameId);
    
    if (!frame) {
      console.warn("Frame not found");
      return;
    }

    const allShapes = editor.getCurrentPageShapesSorted();
    const shapeIdsToExport = allShapes
      .filter((s) => !frameIdsRef.current.includes(s.id))
      .map((s) => s.id);

    if (shapeIdsToExport.length === 0) {
      console.warn("No shapes to export (only frame exists)");
      return;
    }

    const frameProps = frame.props as { w: number; h: number };
    const bounds = new Box(frame.x, frame.y, frameProps.w, frameProps.h);

    try {
      // Use toImage for PNG export (captures raster images properly)
      const result = await editor.toImage(shapeIdsToExport, {
        format: "png",
        bounds,
        padding: 0,
        background: true,
      });

      if (result?.blob) {
        // Create download link
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        console.log("Exported PNG:", { 
          blob: result.blob, 
          width: result.width, 
          height: result.height 
        });
        
        // To send to server:
        // const formData = new FormData();
        // formData.append('image', result.blob, 'export.png');
        // await fetch('/api/upload', { method: 'POST', body: formData });
        
        return result.blob;
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Handle image upload
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editorRef.current) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const editor = editorRef.current;

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const assetId = AssetRecordType.createId();
        
        // Create the asset
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

        // Get the first frame position to place image inside it
        const firstFrame = frameIdsRef.current.length > 0
          ? editor.getShape(frameIdsRef.current[0])
          : null;

        const x = firstFrame ? firstFrame.x + 50 : 150;
        const y = firstFrame ? firstFrame.y + 50 : 150;

        // Create image shape
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
        logIDB();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    Promise.all([
      get("shapes"),
      get("frameIds"),
    ]).then(([storedShapes, storedFrameIds]) => {
      if (storedFrameIds?.length) {
        frameIdsRef.current = storedFrameIds;
      }

      if (storedShapes?.length) {
        editor.createShapes(storedShapes);
        updateAllFrames(editor);
      } else {
        createFrame(editor);
      }

      logIDB();
    });

    editor.store.listen(
      async () => {
        if (!editorRef.current) return;
        const shapes = editorRef.current.getCurrentPageShapesSorted();
        await set("shapes", shapes);
      },
      { source: "user", scope: "document" }
    );
  };

  const handleClear = async () => {
    if (!editorRef.current) return;
    
    const firstFrameId = frameIdsRef.current[0];
    const shapes = editorRef.current.getCurrentPageShapesSorted();
    
    const shapesToDelete = shapes
      .filter((s) => s.id !== firstFrameId)
      .map((s) => s.id);
    
    editorRef.current.deleteShapes(shapesToDelete);
    
    frameIdsRef.current = firstFrameId ? [firstFrameId] : [];
    
    const firstFrame = firstFrameId ? editorRef.current.getShape(firstFrameId) : null;
    await set("shapes", firstFrame ? [firstFrame] : []);
    await set("frameIds", frameIdsRef.current);
    
    logIDB();
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw onMount={handleMount} />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          zIndex: 10,
        }}
      >
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleExport}>Export</button>
        <button onClick={logIDB}>Log IDB</button>
        
        <label
          style={{
            padding: "4px 12px",
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Import Image
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </label>
      </div>
    </div>
  );
}