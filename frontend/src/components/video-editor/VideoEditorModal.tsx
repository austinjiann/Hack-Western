import type { FC } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, Button, Flex, Text, IconButton, Box } from "@radix-ui/themes";
import { Play, Pause, X, Scissors, Trash2 } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import Timeline from "./Timeline";

interface VideoEditorModalProps {
  /** Whether the modal is currently open/visible */
  isOpen: boolean;
  /** Video clip data */
  videoClip: {
    id: string;
    videoUrl: string;
    duration: number;
    title?: string;
    trimEnd?: number;
  };
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when delete action is triggered */
  onDelete?: (clipId: string) => void;
  /** Callback when trim action is triggered (only end time, optional new video URL) */
  onTrim?: (clipId: string, endTime: number, newVideoUrl?: string) => void;
}

const VideoEditorModal: FC<VideoEditorModalProps> = ({
  isOpen,
  videoClip,
  onClose,
  onDelete,
  onTrim,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(videoClip.duration || 0);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [isTrimMode, setIsTrimMode] = useState(false);
  const [tempTrimEnd, setTempTrimEnd] = useState<number | undefined>(
    videoClip.trimEnd,
  );

  // Calculate effective duration (accounting for trim end only)
  // Only use videoClip.trimEnd (applied trim), not tempTrimEnd (preview)
  const effectiveDuration =
    videoClip.trimEnd !== undefined ? videoClip.trimEnd : actualDuration;

  // Close modal on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Reset video state when modal opens or video changes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setTempTrimEnd(videoClip.trimEnd);
    }
  }, [isOpen, videoClip.id, videoClip.trimEnd]);

  const handlePlayPauseChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // const handleTimeUpdate = useCallback((time: number) => {
  //   setCurrentTime(time);
  // }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    // VideoPlayer reports effective duration (trimEnd if set, otherwise full duration)
    // Store it - this is what we'll use for display
    setActualDuration(newDuration);
  }, []);

  // Handle timeline seek (clamps to effective duration or preview trim end in trim mode)
  const handleSeek = useCallback(
    (time: number) => {
      // In trim mode, allow seeking up to tempTrimEnd for preview
      // Otherwise, clamp to applied trimEnd or actualDuration
      const maxTime = isTrimMode
        ? tempTrimEnd !== undefined
          ? tempTrimEnd
          : actualDuration
        : videoClip.trimEnd !== undefined
          ? videoClip.trimEnd
          : actualDuration;
      const clampedTime = Math.max(0, Math.min(time, maxTime));
      setCurrentTime(clampedTime);
    },
    [isTrimMode, tempTrimEnd, videoClip.trimEnd, actualDuration],
  );

  const handlePlayPauseClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDelete = () => {
    onDelete?.(videoClip.id);
    onClose();
  };

  const handleTrim = () => {
    if (isTrimMode) {
      // Apply trim - only end time
      // Store trim metadata - the video player will handle displaying correctly
      // The video will stop at trimEnd and display the correct duration
      if (
        tempTrimEnd !== undefined &&
        tempTrimEnd > 0 &&
        tempTrimEnd <= actualDuration
      ) {
        onTrim?.(videoClip.id, tempTrimEnd);
      }
      setIsTrimMode(false);
    } else {
      // Enter trim mode - initialize with current trim end or full duration
      setTempTrimEnd(videoClip.trimEnd || actualDuration);
      setIsTrimMode(true);
    }
  };

  const handleTrimPointSet = (time: number) => {
    // Only allow setting trim end (must be between 0 and actualDuration)
    const clampedTime = Math.max(0, Math.min(time, actualDuration));
    setTempTrimEnd(clampedTime);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(videoClip.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = videoClip.id
        ? `flowboard-clip-${videoClip.id}.mp4`
        : `flowboard-clip.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download video:", error);
    }
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        style={{
          maxWidth: "80vw",
          maxHeight: "80vh",
          width: "80vw",
          height: "80vh",
          padding: 0,
          background: "rgba(245, 247, 250, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          overflow: "hidden",
        }}
      >
        <Dialog.Title className="sr-only">Video Editor</Dialog.Title>
        <Flex direction="column" style={{ height: "100%" }}>
          {/* Close button - floating */}
          <Dialog.Close>
            <IconButton
              size="3"
              variant="ghost"
              style={{
                cursor: "pointer",
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 10,
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: "50%",
              }}
            >
              <X size={20} />
            </IconButton>
          </Dialog.Close>

          {/* Body */}
          <Flex
            direction="row"
            gap="4"
            p="4"
            style={{ flex: 1, overflow: "hidden" }}
          >
            {/* Video Preview */}
            <Box
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              <VideoPlayer
                videoUrl={videoClip.videoUrl}
                isPlaying={isPlaying}
                currentTime={currentTime}
                playbackRate={1.0}
                trimEnd={videoClip.trimEnd} // Only use applied trim, not preview
                onPlayPauseChange={handlePlayPauseChange}
                onTimeUpdate={(time) => {
                  // In trim mode, allow full video playback for preview
                  // Otherwise, clamp to applied trim
                  const maxTime = isTrimMode
                    ? actualDuration // Allow full playback in trim mode
                    : videoClip.trimEnd !== undefined
                      ? videoClip.trimEnd
                      : actualDuration;
                  const clampedTime = Math.min(time, maxTime);
                  setCurrentTime(clampedTime);
                }}
                onDurationChange={handleDurationChange}
                videoRef={videoElementRef}
              />
            </Box>

            {/* Controls Container - Right Side */}
            <Flex
              direction="column"
              gap="3"
              style={{
                width: "320px",
                background: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {/* Buttons at top */}
              <Flex direction="column" gap="2">
                <Button
                  variant="soft"
                  size="3"
                  onClick={handleDownload}
                  style={{
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    width: "100%",
                    background: "rgba(34, 197, 94, 0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </Button>
                <Button
                  variant="soft"
                  size="3"
                  onClick={handleTrim}
                  color={isTrimMode ? "blue" : undefined}
                  style={{
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    width: "100%",
                    background: isTrimMode
                      ? "rgba(59, 130, 246, 0.2)"
                      : "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Scissors size={18} />
                  {isTrimMode ? "Apply Trim" : "Trim End"}
                </Button>
                <Button
                  variant="soft"
                  size="3"
                  color="red"
                  onClick={handleDelete}
                  style={{
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    width: "100%",
                    background: "rgba(239, 68, 68, 0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Trash2 size={18} />
                  Delete
                </Button>
              </Flex>

              {/* Timeline */}
              <Box>
                <Timeline
                  currentTime={currentTime}
                  duration={actualDuration}
                  onSeek={handleSeek}
                  trimEnd={isTrimMode ? tempTrimEnd : videoClip.trimEnd}
                  isTrimMode={isTrimMode}
                  onTrimPointSet={handleTrimPointSet}
                />
              </Box>

              {/* Playback Controls */}
              <Flex
                direction="column"
                align="center"
                gap="3"
                style={{ marginTop: "auto" }}
              >
                <IconButton
                  size="4"
                  onClick={handlePlayPauseClick}
                  style={{
                    cursor: "pointer",
                    background: "rgba(102, 126, 234, 0.2)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "#667eea",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                    border: "1px solid rgba(102, 126, 234, 0.3)",
                  }}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                </IconButton>
                <Text
                  size="3"
                  weight="medium"
                  style={{
                    fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
                    color: "#1a1a1a",
                  }}
                >
                  {formatTime(currentTime)} /{" "}
                  {formatTime(
                    isTrimMode && tempTrimEnd !== undefined
                      ? tempTrimEnd
                      : effectiveDuration,
                  )}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default VideoEditorModal;
