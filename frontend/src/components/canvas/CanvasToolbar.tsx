import React from "react";
import { Button, Flex, Tooltip } from "@radix-ui/themes";
import { Eraser, Video } from "lucide-react";
import { Editor } from "tldraw";
import { toast } from "sonner";
import { useFrameGraphContext } from "../../contexts/FrameGraphContext";

interface CanvasToolbarProps {
  onClear: () => void;
  editorRef: React.RefObject<Editor | null>;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onClear,
  editorRef,
}) => {
  const frameGraph = useFrameGraphContext();

  const handleMergeVideos = () => {
    if (!editorRef.current) {
      toast.error("Editor not ready. Please wait a moment and try again.");
      return;
    }

    const editor = editorRef.current;

    // Get selected shapes
    const selectedIds = editor.getSelectedShapeIds();
    
    // Find the selected frame
    const selectedFrame = selectedIds
      .map((id) => editor.getShape(id))
      .find((shape) => shape?.type === "aspect-frame");

    if (!selectedFrame) {
      toast.error("Please select a frame to merge videos from.");
      return;
    }

    // Get the path from root to the selected frame (reverse traversal)
    const path = frameGraph.getFramePath(selectedFrame.id);

    if (path.length === 0) {
      toast.error("No path found for the selected frame.");
      return;
    }

    // Collect video URLs from arrows in the path
    const videoUrls: string[] = [];

    // Traverse the path (skip the root frame, start from the first child)
    for (let i = 1; i < path.length; i++) {
      const node = path[i];
      
      // Get the arrow for this node
      if (node.arrowId) {
        const arrow = editor.getShape(node.arrowId);
        if (arrow && arrow.type === "arrow") {
          const videoUrl = arrow.meta?.videoUrl as string | undefined;
          if (videoUrl && arrow.meta?.status === "done") {
            videoUrls.push(videoUrl);
          }
        }
      }
    }

    if (videoUrls.length === 0) {
      toast.error("No videos found in the path from root to selected frame.");
      return;
    }

    // Log the array of video URLs
    console.log("Video URLs for merging:", videoUrls);
    toast.success(`Found ${videoUrls.length} video${videoUrls.length === 1 ? "" : "s"} to merge.`);
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
      <Flex
        gap="3"
        p="2"
        className="rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl bg-white/40"
      >
        <Tooltip content="Clear Canvas">
          <Button
            variant="surface"
            color="red"
            onClick={onClear}
            style={{ cursor: "pointer" }}
            className="backdrop-blur-sm bg-white/50 hover:bg-white/80 transition-all"
          >
            <Eraser size={16} />
            Clear
          </Button>
        </Tooltip>

        <Tooltip content="Merge Videos from Selected Frame">
          <Button
            variant="surface"
            color="green"
            onClick={handleMergeVideos}
            style={{ cursor: "pointer" }}
            className="backdrop-blur-sm bg-white/50 hover:bg-white/80 transition-all"
          >
            <Video size={16} />
            Merge Videos
          </Button>
        </Tooltip>
      </Flex>
    </div>
  );
};
