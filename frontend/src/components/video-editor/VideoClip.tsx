import type { FC } from "react";

// Video clip thumbnail component (clickable to open editor)
interface VideoClipProps {
  /** Unique identifier for this video clip */
  id: string;
  /** URL to the video file */
  videoUrl: string;
  /** Optional thumbnail/poster image URL (if not provided, first frame is used) */
  thumbnailUrl?: string;
  /** Duration in seconds */
  duration: number;
  /** Callback when clip is clicked - opens the editor */
  onClick: (clipId: string) => void;
  /** Optional title/name for the clip */
  title?: string;
}

// Format seconds to MM:SS or HH:MM:SS
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const VideoClip: FC<VideoClipProps> = ({
  id,
  videoUrl,
  thumbnailUrl,
  duration,
  onClick,
  title,
}) => {
  const handleClick = () => {
    onClick(id);
  };

  return (
    <div
      className="relative cursor-pointer rounded-lg overflow-hidden bg-black select-none transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      onClick={handleClick}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-gray-900">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            className="w-full h-full object-cover object-center block"
          />
        ) : (
          <video
            src={videoUrl}
            className="w-full h-full object-cover object-center block"
            muted
            preload="metadata"
          />
        )}

        {/* Overlay with play icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="white"
            className="transition-transform duration-200 ease-in-out hover:scale-110"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[12px] font-semibold rounded px-2 py-1 tabular-nums backdrop-blur-sm">
          {formatDuration(duration)}
        </div>
      </div>

      {/* Optional title */}
      {title && (
        <div className="mt-2 text-sm font-medium text-gray-800 truncate">
          {title}
        </div>
      )}
    </div>
  );
};

export default VideoClip;
