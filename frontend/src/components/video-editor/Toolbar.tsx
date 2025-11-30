import type { FC } from "react";
import { useState, useEffect } from "react";

interface ToolbarProps {
  onSplit?: () => void;
  onSpeedChange?: (speed: number) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onTrim?: () => void;
  onCrop?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  selectedClipId?: string | null;
  currentSpeed?: number;
  isSaving?: boolean;
}

const SPEED_OPTIONS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x (Normal)" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
  { value: 4, label: "4x" },
];

const Toolbar: FC<ToolbarProps> = ({
  onSplit,
  onSpeedChange,
  onDelete,
  onDuplicate,
  onTrim,
  onCrop,
  onSave,
  onDownload,
  selectedClipId,
  currentSpeed = 1,
  isSaving = false,
}) => {
  const [speed, setSpeed] = useState(currentSpeed);

  useEffect(() => {
    setSpeed(currentSpeed);
  }, [currentSpeed]);

  // Don't show toolbar if no clip is selected
  if (!selectedClipId) {
    return null;
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
      <div className="flex items-center gap-1">
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-900 text-sm font-medium font-sans hover:bg-gray-100 active:scale-95 active:bg-black/10"
          onClick={onSplit}
          title="Split clip at playhead"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 3v18M3 12h18" />
          </svg>
          <span>Split</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <select
            className="appearance-none bg-transparent border-none text-gray-900 text-sm font-medium font-sans pr-5 min-w-[100px] hover:text-blue-600 focus:text-blue-600"
            value={speed}
            onChange={handleSpeedChange}
            title="Change playback speed"
          >
            {SPEED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      <div className="flex items-center gap-1">
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-900 text-sm font-medium font-sans hover:bg-gray-100 active:scale-95 active:bg-black/10"
          onClick={onTrim}
          title="Trim clip"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 3l18 18M9 3v6m6-6v6M3 9h6m-6 6h6m6 0h6" />
          </svg>
          <span>Trim</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-900 text-sm font-medium font-sans hover:bg-gray-100 active:scale-95 active:bg-black/10"
          onClick={onCrop}
          title="Crop clip"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2H4a2 2 0 0 0-2 2v2m20 0V4a2 2 0 0 0-2-2h-2m0 20h2a2 2 0 0 0 2-2v-2M2 18v2a2 2 0 0 0 2 2h2" />
          </svg>
          <span>Crop</span>
        </button>
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      <div className="flex items-center gap-1">
        {onSave && (
          <button
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium font-sans ${
              isSaving
                ? "bg-gray-200 text-gray-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
            onClick={onSave}
            disabled={isSaving}
            title="Save edits (export video)"
          >
            {isSaving ? (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="animate-spin"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    strokeDasharray="60"
                    strokeDashoffset="30"
                  />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save</span>
              </>
            )}
          </button>
        )}

        {onDownload && (
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium font-sans bg-brand-pink/50 hover:bg-brand-pink/60 active:scale-95 active:bg-brand-pink/70"
            onClick={onDownload}
            title="Download video"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download</span>
          </button>
        )}

        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-900 text-sm font-medium font-sans hover:bg-gray-100 active:scale-95 active:bg-black/10"
          onClick={onDuplicate}
          title="Duplicate clip"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            <path d="M9 9h4v4" />
          </svg>
          <span>Duplicate</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 text-sm font-medium font-sans hover:bg-red-100 hover:text-red-700 active:scale-95"
          onClick={onDelete}
          title="Delete clip"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
