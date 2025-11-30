import { useEffect } from "react";
import { useEditor } from "tldraw";
import { useFrameGraphContext } from "../../contexts/FrameGraphContext";

/**
 * Component that initializes and maintains the frame graph
 * Reconstructs the graph when the editor is ready and handles deletions
 */
export const FrameGraphInitializer = () => {
  const editor = useEditor();
  const frameGraph = useFrameGraphContext();

  useEffect(() => {
    if (!editor) return;

    // Reconstruct graph from existing frames and arrows
    frameGraph.reconstructGraph();
    console.log("Frame Graph Map (Initialized):", frameGraph.getGraph());

    // Register handler for frame deletions
    const unsubscribe = editor.sideEffects.registerBeforeDeleteHandler(
      "shape",
      (shape) => {
        if (shape.type === "aspect-frame") {
          frameGraph.removeFrameNode(shape.id);
          console.log(
            "Frame Graph Map (After Deletion):",
            frameGraph.getGraph(),
          );
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [editor, frameGraph]);

  return null;
};
