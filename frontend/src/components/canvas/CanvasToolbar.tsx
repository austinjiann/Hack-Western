import React, { useState } from "react";
import { Button, Flex, Tooltip, Spinner } from "@radix-ui/themes";
import { Eraser, Video } from "lucide-react";
import { Editor } from "tldraw";
import { toast } from "sonner";
import { useFrameGraphContext } from "../../contexts/FrameGraphContext";
import { apiFetch } from "../../utils/api";

interface CanvasToolbarProps {
  onClear: () => void;
  editorRef: React.RefObject<Editor | null>;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onClear,
  editorRef,
}) => {
  const frameGraph = useFrameGraphContext();
  const [isMerging, setIsMerging] = useState(false);

  const handleMergeVideos = async () => {
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
    // The path is ordered from root to selected frame, so videoUrls will be in correct order
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

    if (videoUrls.length < 2) {
      toast.error("At least 2 videos are required for merging.");
      return;
    }

    // Call backend API to merge videos
    setIsMerging(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

    try {
      const response = await apiFetch(`${backendUrl}/api/jobs/video/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_urls: videoUrls }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const mergedVideoUrl = result.video_url;

      if (!mergedVideoUrl) {
        throw new Error("No video URL returned from server");
      }

      toast.success(`Successfully merged ${videoUrls.length} videos!`);
      console.log("Merged video URL:", mergedVideoUrl);
      
      // Download the merged video
      try {
        const videoResponse = await fetch(mergedVideoUrl);
        const videoBlob = await videoResponse.blob();
        const url = window.URL.createObjectURL(videoBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `merged-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Video downloaded successfully!");
      } catch (downloadError) {
        console.error("Error downloading video:", downloadError);
        toast.error("Video merged but download failed. You can access it at the URL in the console.");
      }
      
    } catch (error) {
      console.error("Error merging videos:", error);
      toast.error(`Failed to merge videos: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsMerging(false);
    }
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
            disabled={isMerging}
            style={{ cursor: isMerging ? "not-allowed" : "pointer" }}
            className="backdrop-blur-sm bg-white/50 hover:bg-white/80 transition-all"
          >
            {isMerging ? (
              <Spinner size="1" />
            ) : (
              <Video size={16} />
            )}
            {isMerging ? "Merging..." : "Merge Videos"}
          </Button>
        </Tooltip>
      </Flex>
    </div>
  );
};
