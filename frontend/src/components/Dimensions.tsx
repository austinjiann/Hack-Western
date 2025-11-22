// DimensionSelect.tsx
import { useState } from "react";

type Dim = {
  label: string;
  width: number;
  height: number;
  note: string;
};

const PRESETS: Dim[] = [
  { label: "1080 × 1920 (Vertical)", width: 1080, height: 1920, note: "Ideal for TikTok, Instagram Reels, YouTube Shorts" },
  { label: "1920 × 1080 (Horizontal)", width: 1920, height: 1080, note: "Standard 16:9 video — YouTube, web, presentations" },
  { label: "1080 × 1080 (Square)", width: 1080, height: 1080, note: "Square format — Instagram feed, social ads" },
  { label: "1000 × 1000 (Square)", width: 1000, height: 1000, note: "Square with smaller footprint — quick social posts" },
  { label: "1280 × 720 (HD 720p)", width: 1280, height: 720, note: "Lightweight HD — fast rendering, good for prototypes" },
];

interface Props {
  onSelect: (dim: { width: number; height: number }) => void;
  initial?: { width: number; height: number };
}

export default function DimensionSelect({ onSelect, initial }: Props) {
  const [selected, setSelected] = useState(
    initial ? `${initial.width}x${initial.height}` : `${PRESETS[0].width}x${PRESETS[0].height}`
  );

  const handleChange = (val: string) => {
    setSelected(val);
    const [w, h] = val.split("x").map(Number);
    onSelect({ width: w, height: h });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold">Project Dimensions</label>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {PRESETS.map((p) => (
          <option key={p.label} value={`${p.width}x${p.height}`}>
            {p.label}
          </option>
        ))}
      </select>
      <small className="text-gray-500 text-sm">
        {PRESETS.find((p) => `${p.width}x${p.height}` === selected)?.note}
      </small>
    </div>
  );
}