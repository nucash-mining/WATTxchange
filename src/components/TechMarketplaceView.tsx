import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Share, Star, Eye, EyeOff } from 'lucide-react';
import { useDeviceDetect } from '../hooks/useDeviceDetect';
import HardwareRentalModal from './marketplace/HardwareRentalModal';

interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  downloads: string;
  image: string;
  features: string[];
  requirements: string[];
}

function TechMarketplaceView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showBalances, setShowBalances] = useState(true);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const { isMobile: _isMobile } = useDeviceDetect();

  const categories = [
    { name: 'All', count: 46 },
    { name: 'My Apps', count: 0 },
    { name: 'AI Audio Creation', count: 5 },
    { name: 'AI Image Generation', count: 8 },
    { name: 'AI Video Creation', count: 3 },
    { name: 'AI Text Generation', count: 12 },
    { name: 'AI Code Generation', count: 7 },
    { name: 'AI Data Analysis', count: 4 },
    { name: 'AI Automation', count: 6 },
    { name: 'AI Research', count: 1 },
  ];

  const apps: App[] = [
    {
      id: '1',
      name: 'SRB Miner Multi',
      description: 'Advanced cryptocurrency mining software supporting multiple algorithms',
      category: 'Mining',
      rating: 4.8,
      downloads: '10K+',
      image: '/miner-icon.png',
      features: ['Multi-algorithm support', 'GPU optimization', 'Real-time monitoring'],
      requirements: ['Windows 10+', '4GB RAM', 'DirectX 11'],
    },
    {
      id: '2',
      name: 'XMRig',
      description: 'High-performance Monero mining software',
      category: 'Mining',
      rating: 4.6,
      downloads: '5K+',
      image: '/xmrig-icon.png',
      features: ['CPU mining', 'Low power consumption', 'Cross-platform'],
      requirements: ['Windows/Linux', '2GB RAM', 'SSE2 support'],
    },
  ];

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900/30 backdrop-blur-xl border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Tech Marketplace</h1>
            <p className="text-gray-400 mt-1">Discover and rent cutting-edge technology</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <motion.button
              onClick={() => setShowRentalModal(true)}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Share My Hardware
            </motion.button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
            >
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {/* Categories Sidebar */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-yellow-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Applications Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredApps.map((app, index) => (
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
                      <Download className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{app.name}</h3>
                      <p className="text-gray-400 text-sm">{app.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-300">{app.rating}</span>
                  </div>
                </div>

                <p className="text-gray-300 mb-4">{app.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">{app.downloads} downloads</span>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                      <Share className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <motion.button
                  onClick={() => {
                    setSelectedApp(app);
                    setShowRentalModal(true);
                  }}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  <span>Rent</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware Rental Modal */}
      <HardwareRentalModal
        isOpen={showRentalModal}
        onClose={() => setShowRentalModal(false)}
        app={selectedApp}
        onShowContract={() => {
          setShowRentalModal(false);
        }}
      />
    </div>
  );
}

export default TechMarketplaceView;