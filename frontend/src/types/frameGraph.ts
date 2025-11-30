import { TLShapeId } from "tldraw";

/**
 * Represents a node in the frame graph structure
 * Each frame in the canvas has a corresponding FrameNode that tracks
 * its relationships with other frames through arrows
 */
export interface FrameNode {
  /** The frame's shape ID */
  frameId: TLShapeId;
  /** The arrow ID that created this frame (null for root frames) */
  arrowId: TLShapeId | null;
  /** The parent frame ID (null for root frames) */
  parentId: TLShapeId | null;
  /** Indexed children - Map<branchIndex, childFrameId> */
  children: Map<number, TLShapeId>;
}

/**
 * Frame graph structure - Map of frameId to FrameNode
 */
export type FrameGraph = Map<TLShapeId, FrameNode>;
