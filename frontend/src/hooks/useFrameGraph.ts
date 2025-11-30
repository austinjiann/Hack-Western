import { useCallback, useRef, useEffect } from "react";
import { Editor, TLShapeId } from "tldraw";
import { FrameNode, FrameGraph } from "../types/frameGraph";

/**
 * Hook for managing the frame graph structure
 * Tracks relationships between frames through arrows
 */
export const useFrameGraph = (editor: Editor | null) => {
  const graphRef = useRef<FrameGraph>(new Map());

  /**
   * Creates a new frame node in the graph
   */
  const addFrameNode = useCallback(
    (
      frameId: TLShapeId,
      arrowId: TLShapeId | null,
      parentId: TLShapeId | null,
    ) => {
      if (!editor) return;

      // Create the new node
      const newNode: FrameNode = {
        frameId,
        arrowId,
        parentId,
        children: new Map(),
      };

      graphRef.current.set(frameId, newNode);

      // If there's a parent, add this frame as a child
      if (parentId) {
        const parentNode = graphRef.current.get(parentId);
        if (parentNode) {
          // Get the next available branch index
          const branchIndex = parentNode.children.size;
          parentNode.children.set(branchIndex, frameId);
        } else {
          // Parent doesn't exist yet, create it as a root
          const parentNode: FrameNode = {
            frameId: parentId,
            arrowId: null,
            parentId: null,
            children: new Map(),
          };
          parentNode.children.set(0, frameId);
          graphRef.current.set(parentId, parentNode);
        }
      }
    },
    [editor],
  );

  /**
   * Removes a frame node and updates parent's children
   */
  const removeFrameNode = useCallback((frameId: TLShapeId) => {
    const node = graphRef.current.get(frameId);
    if (!node) return;

    // Remove from parent's children
    if (node.parentId) {
      const parentNode = graphRef.current.get(node.parentId);
      if (parentNode) {
        // Find and remove this frame from parent's children
        for (const [index, childId] of parentNode.children.entries()) {
          if (childId === frameId) {
            parentNode.children.delete(index);
            break;
          }
        }
      }
    }

    // Remove all children recursively
    for (const childId of node.children.values()) {
      removeFrameNode(childId);
    }

    // Remove the node itself
    graphRef.current.delete(frameId);
  }, []);

  /**
   * Gets all root frames (frames with no parent)
   */
  const getRootFrames = useCallback((): FrameNode[] => {
    return Array.from(graphRef.current.values()).filter(
      (node) => node.parentId === null,
    );
  }, []);

  /**
   * Gets all end frames (frames with no children)
   */
  const getEndFrames = useCallback((): FrameNode[] => {
    return Array.from(graphRef.current.values()).filter(
      (node) => node.children.size === 0,
    );
  }, []);

  /**
   * Gets the path from root to a specific frame
   */
  const getFramePath = useCallback((frameId: TLShapeId): FrameNode[] => {
    const path: FrameNode[] = [];
    let currentId: TLShapeId | null = frameId;

    while (currentId) {
      const node = graphRef.current.get(currentId);
      if (!node) break;
      path.unshift(node);
      currentId = node.parentId;
    }

    return path;
  }, []);

  /**
   * Gets all descendants of a frame
   */
  const getFrameDescendants = useCallback((frameId: TLShapeId): FrameNode[] => {
    const descendants: FrameNode[] = [];
    const node = graphRef.current.get(frameId);
    if (!node) return descendants;

    const traverse = (currentNode: FrameNode) => {
      for (const childId of currentNode.children.values()) {
        const childNode = graphRef.current.get(childId);
        if (childNode) {
          descendants.push(childNode);
          traverse(childNode);
        }
      }
    };

    traverse(node);
    return descendants;
  }, []);

  /**
   * Gets the branch index for a child frame
   */
  const getBranchIndex = useCallback(
    (parentId: TLShapeId, childId: TLShapeId): number | null => {
      const parentNode = graphRef.current.get(parentId);
      if (!parentNode) return null;

      for (const [index, id] of parentNode.children.entries()) {
        if (id === childId) return index;
      }
      return null;
    },
    [],
  );

  /**
   * Reconstructs the graph from existing frames and arrows in the editor
   */
  const reconstructGraph = useCallback(() => {
    if (!editor) return;

    graphRef.current.clear();

    // Get all frames
    const frames = editor
      .getCurrentPageShapes()
      .filter((s) => s.type === "aspect-frame");

    // Get all arrows
    const arrows = editor
      .getCurrentPageShapes()
      .filter((s) => s.type === "arrow");

    // First, create nodes for all frames (as roots initially)
    for (const frame of frames) {
      if (!graphRef.current.has(frame.id)) {
        graphRef.current.set(frame.id, {
          frameId: frame.id,
          arrowId: null,
          parentId: null,
          children: new Map(),
        });
      }
    }

    // Then, process arrows to establish relationships
    for (const arrow of arrows) {
      const bindings = editor.getBindingsInvolvingShape(arrow.id);
      const startBinding = bindings.find(
        (b: any) => b.fromId === arrow.id && b.props.terminal === "start",
      );
      const endBinding = bindings.find(
        (b: any) => b.fromId === arrow.id && b.props.terminal === "end",
      );

      if (startBinding && endBinding) {
        const parentId = (startBinding as any).toId;
        const childId = (endBinding as any).toId;

        const parentNode = graphRef.current.get(parentId);
        const childNode = graphRef.current.get(childId);

        if (parentNode && childNode) {
          // Update child node
          childNode.parentId = parentId;
          childNode.arrowId = arrow.id;

          // Update parent node - add child with next available index
          const branchIndex = parentNode.children.size;
          parentNode.children.set(branchIndex, childId);
        }
      }
    }
  }, [editor]);

  /**
   * Gets the current graph as a plain object for logging
   */
  const getGraph = useCallback((): Record<string, any> => {
    const graphObj: Record<string, any> = {};
    for (const [frameId, node] of graphRef.current.entries()) {
      graphObj[frameId] = {
        frameId: node.frameId,
        arrowId: node.arrowId,
        parentId: node.parentId,
        children: Array.from(node.children.entries()).map(
          ([index, childId]) => ({
            index,
            frameId: childId,
          }),
        ),
      };
    }
    return graphObj;
  }, []);

  // Reconstruct graph when editor changes
  useEffect(() => {
    if (editor) {
      reconstructGraph();
    }
  }, [editor, reconstructGraph]);

  return {
    addFrameNode,
    removeFrameNode,
    getRootFrames,
    getEndFrames,
    getFramePath,
    getFrameDescendants,
    getBranchIndex,
    reconstructGraph,
    getGraph,
  };
};
