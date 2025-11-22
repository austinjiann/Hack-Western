import { Editor, Tldraw, TLShapePartial, createShapeId } from "tldraw";
import { get, set, clear } from "idb-keyval";
import "tldraw/tldraw.css";
import DimensionSelect from "../components/Dimensions";
import { useRef, useState } from "react";

export default function Canvas() {
  const editorRef = useRef<Editor | null>(null);
  const [showDimensions, setShowDimensions] = useState(false);

  const createDimensionShape = (
    editor: Editor,
    dims: { width: number; height: number }
  ) => {
    const shapeId = createShapeId();
    const shape: TLShapePartial = {
      id: shapeId,
      type: "geo",
      x: 100,
      y: 100,
      props: {
        geo: "rectangle",
        w: dims.width,
        h: dims.height,
      },
    };
    editor.createShapes([shape]);
  };

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    get("shapes").then((storedShapes) => {
      if (storedShapes?.length) {
        editor.createShapes(storedShapes);
      } else {
        get("project-dimensions").then((storedDims) => {
          if (!storedDims) {
            setShowDimensions(true);
            return;
          }
          createDimensionShape(editor, storedDims);
        });
      }
    });

    editor.store.listen(
      () => {
        const shapes = editor.getCurrentPageShapesSorted();
        set("shapes", shapes);
      },
      { source: "user", scope: "document" }
    );

    editor.store.listen(
  async () => {
    if (!editorRef.current) return;
    
    const shapes = editorRef.current.getCurrentPageShapesSorted();
    
    // Save shapes to IndexedDB
    await set("shapes", shapes);

    // Log current shapes
    console.log("Current shapes:", shapes);

    // Log what’s actually in IndexedDB
    const storedShapes = await get("shapes");
    console.log("Shapes in IndexedDB:", storedShapes);
  },
  { source: "user", scope: "document" }
);

  };

  const handleClear = async () => {
    if (!editorRef.current) return;
    const shapes = editorRef.current.getCurrentPageShapesSorted();
    editorRef.current.deleteShapes(shapes.map((s) => s.id));
    await clear();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editorRef.current) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          editorRef.current!.createShapes(data);
          set("shapes", data);
        }
      } catch (err) {
        console.error("Invalid JSON file", err);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectDimensions = async (dims: {
    width: number;
    height: number;
  }) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const shapes = editor.getCurrentPageShapesSorted();

    if (shapes.length === 0) {
      // No shapes yet → create the first rectangle
      const shapeId = createShapeId();
      const shape: TLShapePartial = {
        id: shapeId,
        type: "geo",
        x: 100,
        y: 100,
        props: { geo: "rectangle", w: dims.width, h: dims.height },
      };
      editor.createShapes([shape]);
    } else {
      // Update all existing shapes
      const updatedShapes = shapes.map((s) => {
        if (!s.props) return s;
        return { ...s, props: { ...s.props, w: dims.width, h: dims.height } };
      });
      editor.updateShapes(updatedShapes);
    }

    await set("project-dimensions", dims);
    setShowDimensions(false);
  };
  

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw onMount={handleMount} />

      {/* Buttons */}
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
        <button onClick={() => setShowDimensions(true)}>Dimensions</button>

        <label
          style={{
            display: "inline-block",
            padding: "0 10px",
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Upload
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* Slide-down Dimensions - Rendered LAST to be on top */}
      {showDimensions && (
        <DimensionSelect
          onSelect={handleSelectDimensions}
          onClose={() => setShowDimensions(false)}
        />
      )}
    </div>
  );
}
