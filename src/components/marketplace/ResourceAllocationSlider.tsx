import React from 'react';
import { motion } from 'framer-motion';

interface ResourceAllocationSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  color?: string;
}

const ResourceAllocationSlider: React.FC<ResourceAllocationSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  onChange,
  color = 'bg-yellow-400'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer`}
      />
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{min} {unit}</span>
        <span>{Math.round((min + max) / 2)} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

export default ResourceAllocationSlider;