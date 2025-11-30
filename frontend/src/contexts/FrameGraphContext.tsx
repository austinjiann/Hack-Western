import React, { createContext, useContext } from "react";
import { Editor, TLShapeId } from "tldraw";
import { useFrameGraph } from "../hooks/useFrameGraph";
import { FrameNode } from "../types/frameGraph";

interface FrameGraphContextType {
  addFrameNode: (
    frameId: TLShapeId,
    arrowId: TLShapeId | null,
    parentId: TLShapeId | null,
  ) => void;
  removeFrameNode: (frameId: TLShapeId) => void;
  getRootFrames: () => FrameNode[];
  getEndFrames: () => FrameNode[];
  getFramePath: (frameId: TLShapeId) => FrameNode[];
  getFrameDescendants: (frameId: TLShapeId) => FrameNode[];
  getBranchIndex: (parentId: TLShapeId, childId: TLShapeId) => number | null;
  reconstructGraph: () => void;
  getGraph: () => Record<string, any>;
}

const FrameGraphContext = createContext<FrameGraphContextType | null>(null);

export const FrameGraphProvider: React.FC<{
  editor: Editor | null;
  children: React.ReactNode;
}> = ({ editor, children }) => {
  const frameGraph = useFrameGraph(editor);

  return (
    <FrameGraphContext.Provider value={frameGraph}>
      {children}
    </FrameGraphContext.Provider>
  );
};

export const useFrameGraphContext = () => {
  const context = useContext(FrameGraphContext);
  return context; // Return null if not available (e.g., during SVG export)
};
