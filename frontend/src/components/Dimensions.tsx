import { X } from "lucide-react";

type Dim = {
  label: string;
  width: number;
  height: number;
  note: string;
};

const PRESETS: Dim[] = [
  {
    label: "1080 × 1920 (Vertical)",
    width: 1080,
    height: 1920,
    note: "Ideal for TikTok, Instagram Reels, YouTube Shorts",
  },
  {
    label: "1920 × 1080 (Horizontal)",
    width: 1920,
    height: 1080,
    note: "Standard 16:9 video — YouTube, web, presentations",
  },
  {
    label: "1080 × 1080 (Square)",
    width: 1080,
    height: 1080,
    note: "Square format — Instagram feed, social ads",
  },
  {
    label: "1000 × 1000 (Square)",
    width: 1000,
    height: 1000,
    note: "Square with smaller footprint — quick social posts",
  },
  {
    label: "1280 × 720 (HD 720p)",
    width: 1280,
    height: 720,
    note: "Lightweight HD — fast rendering, good for prototypes",
  },
];

interface Props {
  onSelect: (dim: { width: number; height: number }) => void;
  onClose: () => void;
  initial?: { width: number; height: number };
}

export default function DimensionSelect({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900">
            Project Dimensions
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 max-h-[70vh] overflow-y-auto">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSelect({ width: p.width, height: p.height })}
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg group transition-colors flex flex-col gap-1 border border-transparent hover:border-gray-200"
            >
              <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {p.label}
              </span>
              <span className="text-sm text-gray-500">{p.note}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}