import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useCanvas } from "../hooks/useCanvas";
import { CanvasToolbar } from "../components/canvas/CanvasToolbar";
import { FrameShapeUtil } from "../shapes/FrameShape";
import { ArrowActionMenu } from "../components/canvas/ArrowActionMenu";

const customShapeUtils = [FrameShapeUtil];

export default function Canvas() {
  const { handleMount, handleImport, handleClear } = useCanvas();

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw 
        onMount={handleMount} 
        shapeUtils={customShapeUtils}
        persistenceKey="hack-western-canvas-v1"
      >
        <ArrowActionMenu />
      </Tldraw>
      <CanvasToolbar
        onClear={handleClear}
        onImport={handleImport}
      />
    </div>
  );
}
