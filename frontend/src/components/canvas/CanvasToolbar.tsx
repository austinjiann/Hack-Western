import React, { useState } from "react";
import { Button, Flex, Tooltip } from "@radix-ui/themes";
import { Eraser, Image as ImageIcon, FileText, Video } from "lucide-react";
import { Editor } from "tldraw";
import { mergeVideosClient, downloadVideo, type VideoClip } from "../../utils/videoMergeUtils";

interface CanvasToolbarProps {
  onClear: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateGlobalContextFrame: () => void;
  editorRef: React.RefObject<Editor | null>;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onClear,
  onImport,
  onCreateGlobalContextFrame,
  editorRef,
}) => {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const handleMergeVideos = async () => {
    if (!editorRef.current) {
      alert("Editor not ready. Please wait a moment and try again.");
      return;
    }

    const editor = editorRef.current;

    // Collect all arrows with videos
    const arrows = editor.getCurrentPageShapes().filter(
      (s) => s.type === 'arrow' && s.meta?.videoUrl && s.meta?.status === 'done'
    );

    if (arrows.length === 0) {
      alert("No videos found. Please generate or add videos first.");
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
      alert(`Successfully merged ${clips.length} videos!`);
    } catch (error) {
      console.error("Merge failed:", error);
      alert(`Failed to merge videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMerging(false);
      setMergeProgress(0);
    }
  };

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <Flex 
        gap="3" 
        p="2" 
        className="bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Tooltip content="Clear Canvas">
            <Button variant="soft" color="red" onClick={onClear} style={{ cursor: 'pointer' }}>
                <Eraser size={16} />
                Clear
            </Button>
        </Tooltip>
        
        <Tooltip content="Import Image">
            <Button variant="surface" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                <ImageIcon size={16} />
                Import
                <input
                    type="file"
                    accept="image/*"
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        opacity: 0, 
                        cursor: 'pointer' 
                    }}
                    onChange={onImport}
                />
            </Button>
        </Tooltip>

        <Tooltip content="Create Global Context Frame">
            <Button variant="soft" color="blue" onClick={onCreateGlobalContextFrame} style={{ cursor: 'pointer' }}>
                <FileText size={16} />
                Global Context
            </Button>
        </Tooltip>

        <Tooltip content="Merge All Videos">
            <Button 
              variant="soft" 
              color="green" 
              onClick={handleMergeVideos} 
              disabled={isMerging}
              style={{ cursor: isMerging ? 'not-allowed' : 'pointer' }}
            >
                <Video size={16} />
                {isMerging ? `Merging... ${Math.round(mergeProgress * 100)}%` : 'Merge Videos'}
            </Button>
        </Tooltip>
      </Flex>
    </div>
  );
};
