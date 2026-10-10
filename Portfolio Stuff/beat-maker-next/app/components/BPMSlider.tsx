// components/Slider.tsx
"use client"
import { useState, useEffect } from "react";

type BPMSliderProps = {
  bpm: number;
  onChange: (value: number) => void;
};

export default function BPMSlider({ bpm, onChange }: BPMSliderProps) {
  const [value, setValue] = useState(120);

  return (
    <div className="flex flex-col items-center gap-2 w-200 text-3xl font-bold">
    <span>Tempo: {bpm}</span>
      <input
        type="range"
        min={60}
        max={200}
        value={bpm}
        onChange={(e) => onChange(Number(e.target.value))} // must call parent
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                   accent-pink-500"
      />
    </div>
  );
}
