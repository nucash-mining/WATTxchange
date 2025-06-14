import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick as Memory, HardDrive, Wifi, Monitor } from 'lucide-react';

interface HardwareComponent {
  id: string;
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network';
  name: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface HardwareComponentSelectorProps {
  components: HardwareComponent[];
  selectedComponents: string[];
  onToggleComponent: (componentId: string) => void;
}

const HardwareComponentSelector: React.FC<HardwareComponentSelectorProps> = ({
  components,
  selectedComponents,
  onToggleComponent
}) => {
  const getIconColor = (component: HardwareComponent) => {
    const isSelected = selectedComponents.includes(component.id);
    return isSelected ? component.color : 'text-gray-400';
  };

  const getBorderColor = (component: HardwareComponent) => {
    const isSelected = selectedComponents.includes(component.id);
    
    switch (component.type) {
      case 'cpu':
        return isSelected ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30';
      case 'gpu':
        return isSelected ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30';
      case 'memory':
        return isSelected ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30';
      case 'storage':
        return isSelected ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30';
      case 'network':
        return isSelected ? 'border-orange-500/50 bg-orange-500/10' : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30';
      default:
        return isSelected ? 'border-gray-500/50 bg-gray-500/10' : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {components.map((component) => {
        const Icon = component.icon;
        return (
          <motion.button
            key={component.id}
            onClick={() => onToggleComponent(component.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${getBorderColor(component)}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className={`w-8 h-8 mb-2 ${getIconColor(component)}`} />
            <span className="font-medium">{component.name}</span>
            <span className="text-xs text-gray-400 mt-1">{component.value}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default HardwareComponentSelector;