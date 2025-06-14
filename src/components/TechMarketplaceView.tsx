import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, Filter, Star, Cpu, HardDrive, Monitor, Zap } from 'lucide-react';

const TechMarketplaceView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { name: 'All', count: 46 },
    { name: 'My Apps', count: 0 },
    { name: 'AI Audio Creation', count: 5 },
    { name: 'AI Image Creation', count: 9 },
    { name: 'Artificial Intelligence', count: 5 },
    { name: 'Cybersecurity', count: 1 },
    { name: 'Desktop and Gaming', count: 2 },
    { name: 'Machine Learning', count: 2 },
    { name: 'Mining', count: 17 },
    { name: 'Operation System', count: 4 },
    { name: 'Speech Recognition', count: 1 }
  ];

  const miningApps = [
    {
      id: 1,
      name: 'SRB Miner',
      description: 'Multi-algorithm cryptocurrency miner',
      category: 'Mining',
      rating: 4.8,
      price: '0.05 WATT/hour',
      icon: Cpu,
      coins: ['XMR', 'ALT', 'ETI', 'EGAZ', 'HTH'],
      specs: 'RTX 4090, 24GB VRAM'
    },
    {
      id: 2,
      name: 'T-Rex Miner',
      description: 'NVIDIA GPU cryptocurrency miner',
      category: 'Mining',
      rating: 4.7,
      price: '0.04 WATT/hour',
      icon: Monitor,
      coins: ['BTCZ', 'OCTA', 'ETHO', 'EGEM', 'HTH'],
      specs: 'RTX 3080, 12GB VRAM'
    },
    {
      id: 3,
      name: 'XMRig',
      description: 'High performance Monero CPU miner',
      category: 'Mining',
      rating: 4.9,
      price: '0.02 WATT/hour',
      icon: Cpu,
      coins: ['XMR'],
      specs: 'AMD Ryzen 9 5950X'
    },
    {
      id: 4,
      name: 'Dogecoin Miner',
      description: 'Scrypt algorithm miner for DOGE',
      category: 'Mining',
      rating: 4.6,
      price: '0.03 WATT/hour',
      icon: HardDrive,
      coins: ['DOGE'],
      specs: 'ASIC L7, 9.5GH/s'
    },
    {
      id: 5,
      name: 'Multi-Algo Rig',
      description: 'Versatile mining rig for multiple algorithms',
      category: 'Mining',
      rating: 4.8,
      price: '0.08 WATT/hour',
      icon: Zap,
      coins: ['ALT', 'ETI', 'EGAZ', 'BTCZ', 'OCTA', 'ETHO', 'EGEM', 'HTH'],
      specs: 'Mixed GPU Farm'
    },
    {
      id: 6,
      name: 'HTH x25x Miner',
      description: 'Specialized miner for Help The Homeless coin',
      category: 'Mining',
      rating: 4.9,
      price: '0.04 WATT/hour',
      icon: Cpu,
      coins: ['HTH'],
      specs: 'NVIDIA RTX 3090, 24GB VRAM'
    }
  ];

  const filteredApps = miningApps.filter(app => {
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.coins.some(coin => coin.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Tech Marketplace</h2>
          <p className="text-gray-400 mt-1">Rent mining hardware and applications</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
            />
          </div>
          <motion.button
            className="p-2 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <motion.button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                      : 'hover:bg-gray-800/50 text-gray-300'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="text-sm">{category.name}</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {category.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Applications Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredApps.map((app, index) => {
              const Icon = app.icon;
              return (
                <motion.div
                  key={app.id}
                  className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-600/20 rounded-lg">
                        <Icon className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{app.name}</h4>
                        <p className="text-sm text-gray-400">{app.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{app.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4">{app.description}</p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Supported Coins</p>
                      <div className="flex flex-wrap gap-1">
                        {app.coins.map(coin => (
                          <span
                            key={coin}
                            className={`px-2 py-1 bg-gray-800 rounded text-xs font-medium ${
                              coin === 'HTH' ? 'bg-blue-500/20 text-blue-400' : ''
                            }`}
                          >
                            {coin}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Hardware Specs</p>
                      <p className="text-sm text-gray-300">{app.specs}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <div>
                        <p className="text-lg font-bold text-yellow-400">{app.price}</p>
                        <p className="text-xs text-gray-400">per hour</p>
                      </div>
                      <motion.button
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Rent</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechMarketplaceView;