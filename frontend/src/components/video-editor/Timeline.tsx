import type { FC } from "react";
import { useState, useRef, useEffect } from "react";

// Timeline component with draggable playhead
interface TimelineProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total video duration in seconds */
  duration: number;
  /** Callback when user seeks to a new time (click or drag) */
  onSeek: (time: number) => void;
  /** Optional trim end time (for visual indicator) */
  trimEnd?: number;
  /** Whether trim mode is active (clicking sets trim end) */
  isTrimMode?: boolean;
  /** Callback when trim end is set (in trim mode) */
  onTrimPointSet?: (time: number) => void;
  /** Optional className for custom styling */
  className?: string;
}

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const Timeline: FC<TimelineProps> = ({
  currentTime,
  duration,
  onSeek,
  trimEnd,
  isTrimMode = false,
  onTrimPointSet,
  className = "",
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate time markers (every 10 seconds, plus start and end)
  const timeMarkers: number[] = [];
  if (duration > 0) {
    // Always show start marker
    timeMarkers.push(0);

    // Add markers - reduce density based on duration
    const markerInterval = duration > 60 ? duration / 4 : duration / 3; // 4 intervals for long videos, 3 for short
    for (let time = markerInterval; time < duration; time += markerInterval) {
      timeMarkers.push(time);
    }

    // Always show end marker (if not already included)
    if (duration % 10 !== 0) {
      timeMarkers.push(duration);
    }
  }

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Convert mouse X position to time value
  const getTimeFromPosition = (clientX: number): number => {
    const timeline = timelineRef.current;
    if (!timeline || duration === 0) return 0;

    // Get timeline's position and width relative to viewport
    const rect = timeline.getBoundingClientRect();
    const x = clientX - rect.left; // X position relative to timeline
    const percentage = Math.max(0, Math.min(1, x / rect.width)); // Clamp between 0 and 1

    return percentage * duration;
  };

  // Start dragging playhead
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle timeline click (seek or set trim end)
  const handleTimelineClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("timeline-playhead")) {
      return;
    }

    const time = getTimeFromPosition(e.clientX);

    if (isTrimMode && onTrimPointSet) {
      // Set trim end only
      onTrimPointSet(time);
    } else {
      onSeek(time);
    }
  };

  // Handle drag operations
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = getTimeFromPosition(e.clientX);
      onSeek(time);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onSeek, duration]);

  // Calculate trim indicator positions
  const trimEndPosition =
    trimEnd !== undefined ? (trimEnd / duration) * 100 : null;

  return (
    <div
      className={`relative w-full h-[30px] py-2 cursor-pointer select-none ${
        isTrimMode ? "timeline-trim-mode" : ""
      } ${className}`}
      ref={timelineRef}
      onClick={handleTimelineClick}
    >
      {/* Timeline track */}
      <div
        className={`relative w-full h-1 bg-gray-200 rounded mt-5 ${
          isTrimMode ? "bg-gray-100 cursor-crosshair" : ""
        }`}
      >
        {/* Trim region */}
        {trimEndPosition !== null && (
          <>
            <div
              className="absolute top-0 h-full bg-blue-200 rounded pointer-events-none"
              style={{
                left: "0%",
                width: `${trimEndPosition}%`,
              }}
            />
            <div
              className="absolute -top-2 z-30 pointer-events-none"
              style={{
                left: `${trimEndPosition}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-md mx-auto" />
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-blue-600 font-semibold text-[10px] whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-gray-200">
                End
              </div>
            </div>
          </>
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 z-20 cursor-grab"
          style={{
            left: `${playheadPosition}%`,
            transform: "translateX(-50%)",
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-600 rounded" />
          <div className="absolute left-1/2 -top-1 transform -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow-md transition-transform duration-100 hover:scale-125" />
        </div>
      </div>

      {/* Time markers */}
      <div className="absolute top-0 left-0 right-0 h-5">
        {timeMarkers.map((time) => (
          <div
            key={time}
            className="absolute top-0 transform -translate-x-1/2 h-full"
            style={{ left: `${(time / duration) * 100}%` }}
          >
            <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-500" />
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-600 text-[10px] font-medium tabular-nums whitespace-nowrap">
              {formatTime(time)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
