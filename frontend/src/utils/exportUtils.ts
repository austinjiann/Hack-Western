import { Editor, TLShapeId, Box } from "tldraw";

export const exportFrame = async (editor: Editor, frameId: TLShapeId) => {
  const frame = editor.getShape(frameId);
  if (!frame) return;

  // Get all children of the frame
  const childIds = editor.getSortedChildIdsForParent(frameId);

  // If no children, maybe we still want to export the empty frame?
  // Or maybe we want to export shapes that overlap?
  // For now, let's trust the container behavior and export children.
  // If the user hasn't dropped anything in, it might be empty.

  // We also need to define the bounds.
  const frameProps = frame.props as { w: number; h: number };
  const bounds = new Box(frame.x, frame.y, frameProps.w, frameProps.h);

  try {
    // We export the children.
    // Note: toImage expects ids of shapes to export.
    // If we pass childIds, tldraw will export them.
    // We should also check if we need to include the frame itself?
    // Usually frames are just containers and we don't want the border in the export?
    // The user said "screenshot functionality for the frames".
    // If the frame has a background or border they want, we should include it.
    // But our custom frame has a border in the component, which might not be captured by toImage if it's just an HTML container?
    // Tldraw's toImage captures SVG/Canvas. Custom HTML shapes are tricky.
    // However, the standard 'geo' rectangle was used before.
    // Now we have a custom shape. Custom shapes with HTML content might not export well with `toImage` unless they implement `toSvg`.
    // Wait, `FrameShapeUtil` extends `BaseBoxShapeUtil`.
    // If we don't implement `toSvg`, tldraw might not know how to render it for export.

    // Let's look at the previous implementation in useCanvas.ts.
    // It used `editor.toImage(shapeIdsToExport, ...)`
    // And `shapeIdsToExport` were "all shapes except frames".
    // And the frame was a 'geo' shape (rectangle).

    // Now our frame is a custom 'aspect-frame'.
    // If we want to export the CONTENT, we pass the children IDs.
    // If we want the background, we might need a background shape.

    // Let's try exporting just the children first.
    const idsToExport = childIds.length > 0 ? childIds : [];

    if (idsToExport.length === 0) {
      console.warn("Frame is empty");
      // If empty, maybe we just export the bounds?
      // But toImage needs at least one shape?
      // If we pass empty array, it might fail or return empty.
      return;
    }

    const result = await editor.toImage(idsToExport, {
      format: "png",
      bounds,
      padding: 0,
      background: true, // This adds the default background color of the page
    });

    if (result?.blob) {
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `frame-export-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Export failed:", err);
  }
};
