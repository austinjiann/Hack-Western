import React, { useState } from "react";
import { Button, Flex, Tooltip } from "@radix-ui/themes";
import { Eraser, Video } from "lucide-react";
import { Editor } from "tldraw";
import { toast } from "sonner";
import {
  mergeVideosClient,
  downloadVideo,
  type VideoClip,
} from "../../utils/videoMergeUtils";

interface CanvasToolbarProps {
  onClear: () => void;
  editorRef: React.RefObject<Editor | null>;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onClear,
  editorRef,
}) => {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const handleMergeVideos = async () => {
    if (!editorRef.current) {
      toast.error("Editor not ready. Please wait a moment and try again.");
      return;
    }

    const editor = editorRef.current;

    // Collect all arrows with videos
    const arrows = editor
      .getCurrentPageShapes()
      .filter(
        (s) =>
          s.type === "arrow" && s.meta?.videoUrl && s.meta?.status === "done",
      );

    if (arrows.length === 0) {
      toast.error("No videos found. Please generate or add videos first.");
      return;
    }

    // Sort arrows by their position (left to right, top to bottom)
    const sortedArrows = [...arrows].sort((a, b) => {
      const aBounds = editor.getShapePageBounds(a.id);
      const bBounds = editor.getShapePageBounds(b.id);
      if (!aBounds || !bBounds) return 0;
      if (Math.abs(aBounds.y - bBounds.y) > 50) {
        // Different rows - sort by Y
        return aBounds.y - bBounds.y;
      }
      // Same row - sort by X
      return aBounds.x - bBounds.x;
    });

    // Convert arrows to video clips
    const clips: VideoClip[] = sortedArrows.map((arrow) => ({
      videoUrl: arrow.meta?.videoUrl as string,
      trimEnd: arrow.meta?.trimEnd as number | undefined,
      duration: arrow.meta?.duration as number | undefined,
    }));

    setIsMerging(true);
    setMergeProgress(0);

    try {
      const mergedBlob = await mergeVideosClient(clips, (progress) => {
        setMergeProgress(progress);
      });

      // Download the merged video
      downloadVideo(mergedBlob, `merged-video-${Date.now()}.webm`);
      toast.success(
        `Successfully merged ${clips.length} video${clips.length === 1 ? "" : "s"}!`,
      );
    } catch (error) {
      console.error("Merge failed:", error);
      toast.error(
        `Failed to merge videos: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsMerging(false);
      setMergeProgress(0);
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

        <Tooltip content="Merge All Videos">
          <Button
            variant="surface"
            color="green"
            onClick={handleMergeVideos}
            disabled={isMerging}
            style={{ cursor: isMerging ? "not-allowed" : "pointer" }}
            className="backdrop-blur-sm bg-white/50 hover:bg-white/80 transition-all"
          >
            <Video size={16} />
            {isMerging
              ? `Merging... ${Math.round(mergeProgress * 100)}%`
              : "Merge Videos"}
          </Button>
        </Tooltip>
      </Flex>
    </div>
  );
};
