import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useCanvas } from "../hooks/useCanvas";
import { CanvasToolbar } from "../components/canvas/CanvasToolbar";
import { FrameShapeUtil } from "../shapes/FrameShape";

const customShapeUtils = [FrameShapeUtil];

export default function Canvas() {
  const { handleMount, handleImport, handleClear } = useCanvas();

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw onMount={handleMount} shapeUtils={customShapeUtils} />
      <CanvasToolbar
        onClear={handleClear}
        onImport={handleImport}
      />
    </div>
  );
}
