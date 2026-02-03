import React from 'react';
import { motion } from 'framer-motion';
import { Server, Wifi, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Chain {
  name: string;
  nodeType: 'full' | 'light';
  syncStatus: 'syncing' | 'synced' | 'connected' | 'disconnected';
  icon: () => JSX.Element;
}

interface NodeStatusProps {
  chains: Chain[];
}

const NodeStatus: React.FC<NodeStatusProps> = ({ chains }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'syncing':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
      case 'connected':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'syncing':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'disconnected':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Server className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-semibold">Node Status</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {chains.slice(0, 5).map((chain, index) => {
          const IconComponent = chain.icon;
          return (
            <motion.div
              key={chain.name}
              className={`p-4 rounded-lg border ${getStatusColor(chain.syncStatus)}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <IconComponent />
                  <span className="font-medium text-sm">{chain.name}</span>
                </div>
                {getStatusIcon(chain.syncStatus)}
              </div>
              <div className="flex items-center space-x-2">
                {chain.nodeType === 'full' ? (
                  <Server className="w-3 h-3 text-yellow-400" />
                ) : (
                  <Wifi className="w-3 h-3 text-purple-400" />
                )}
                <span className="text-xs text-slate-400 capitalize">
                  {chain.nodeType} Node
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs capitalize">{chain.syncStatus}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default NodeStatus;