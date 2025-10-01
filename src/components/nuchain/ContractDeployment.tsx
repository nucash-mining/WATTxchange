import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Reply as Deploy, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { contractService } from '../../services/contractService';
import CrossChainDeployment from './CrossChainDeployment';
import toast from 'react-hot-toast';

const ContractDeployment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'crosschain'>('crosschain');
  const [deploymentStatus, setDeploymentStatus] = useState<Record<string, 'pending' | 'deploying' | 'deployed' | 'failed'>>({
    nuToken: 'pending',
    validator: 'pending',
    miningPoolFactory: 'pending',
    nftMiningRigs: 'pending',
    zkRollupBridge: 'pending'
  });

  const [deployedAddresses, setDeployedAddresses] = useState<Record<string, string>>({
    nuToken: '',
    validator: '',
    miningPoolFactory: '',
    nftMiningRigs: '',
    zkRollupBridge: ''
  });

  const contracts = [
    {
      id: 'nuToken',
      name: 'NU Token',
      description: 'Native token for nuChain L2 network',
      dependencies: [],
      gasEstimate: '2,500,000',
      icon: '🪙'
    },
    {
      id: 'miningRigConfigurator',
      name: 'Mining Rig Configurator',
      description: 'NFT mining rig configuration and WATT consumption',
      dependencies: ['nuToken'],
      gasEstimate: '5,200,000',
      icon: '⚙️'
    },
    {
      id: 'miningPoolHost',
      name: 'Mining Pool Host',
      description: '100,000 WATT staking for pool hosting',
      dependencies: ['nuToken'],
      gasEstimate: '4,800,000',
      icon: '⛏️'
    },
    {
      id: 'crossChainValidator',
      name: 'Cross-Chain Validator',
      description: 'Validates hash power across Polygon and Altcoinchain',
      dependencies: [],
      gasEstimate: '3,800,000',
      icon: '🔗'
    },
    {
      id: 'nuChainCore',
      name: 'nuChain L2 Core',
      description: 'zkRollup L2 core with Sonic Labs integration (Chain ID: 2331)',
      dependencies: ['nuToken'],
      gasEstimate: '6,100,000',
      icon: '🌉'
    },
    {
      id: 'validatorContract',
      name: 'Validator Contract',
      description: 'PoS validator staking and delegation',
      dependencies: ['nuToken'],
      gasEstimate: '4,200,000',
      icon: '🛡️'
    },
    {
      id: 'zkRollupBridge',
      name: 'zkRollup Bridge',
      description: 'Cross-chain zkProof validation bridge',
      dependencies: ['nuChainCore'],
      gasEstimate: '5,500,000',
      icon: '🌐'
    }
  ];

  const deployContract = async (contractId: string) => {
    setDeploymentStatus(prev => ({ ...prev, [contractId]: 'deploying' }));
    
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      setDeployedAddresses(prev => ({ ...prev, [contractId]: mockAddress }));
      setDeploymentStatus(prev => ({ ...prev, [contractId]: 'deployed' }));
      
      // Update contract service
      contractService.updateContractAddress(contractId, mockAddress);
      
      toast.success(`${contracts.find(c => c.id === contractId)?.name} deployed successfully!`);
    } catch (error) {
      setDeploymentStatus(prev => ({ ...prev, [contractId]: 'failed' }));
      toast.error(`Failed to deploy ${contracts.find(c => c.id === contractId)?.name}`);
    }
  };

  const deployAllContracts = async () => {
    for (const contract of contracts) {
      // Check dependencies
      const dependenciesMet = contract.dependencies.every(dep => 
        deploymentStatus[dep] === 'deployed'
      );
      
      if (dependenciesMet && deploymentStatus[contract.id] === 'pending') {
        await deployContract(contract.id);
        // Wait a bit between deployments
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'deploying':
        return <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'border-emerald-500/50 bg-emerald-500/10';
      case 'deploying':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'failed':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-slate-700/50 bg-slate-800/30';
    }
  };

  const allDeployed = Object.values(deploymentStatus).every(status => status === 'deployed');
  const anyDeploying = Object.values(deploymentStatus).some(status => status === 'deploying');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('crosschain')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'crosschain'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Cross-Chain Deployment
        </button>
        <button
          onClick={() => setActiveTab('single')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'single'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Individual Contracts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'crosschain' ? (
        <CrossChainDeployment />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h3 className="text-2xl font-bold">Contract Deployment</h3>
              <p className="text-slate-400 mt-1">Deploy nuChain L2 smart contracts</p>
            </div>
            
            <motion.button
              onClick={deployAllContracts}
              disabled={anyDeploying || allDeployed}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                allDeployed
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : anyDeploying
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              whileHover={!anyDeploying && !allDeployed ? { scale: 1.05 } : {}}
              whileTap={!anyDeploying && !allDeployed ? { scale: 0.95 } : {}}
            >
              <Deploy className="w-5 h-5" />
              <span>
                {allDeployed ? 'All Deployed' : anyDeploying ? 'Deploying...' : 'Deploy All'}
              </span>
            </motion.button>
          </motion.div>

          {/* Deployment Progress */}
          <motion.div
            className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Deployment Progress</h4>
              <div className="text-sm text-slate-400">
                {Object.values(deploymentStatus).filter(s => s === 'deployed').length} / {contracts.length} deployed
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(Object.values(deploymentStatus).filter(s => s === 'deployed').length / contracts.length) * 100}%` 
                }}
              />
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {contracts.map((contract, index) => (
                <div key={contract.id} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    deploymentStatus[contract.id] === 'deployed' ? 'bg-emerald-400' :
                    deploymentStatus[contract.id] === 'deploying' ? 'bg-blue-400 animate-pulse' :
                    deploymentStatus[contract.id] === 'failed' ? 'bg-red-400' : 'bg-slate-600'
                  }`} />
                  <p className="text-xs text-slate-400">{contract.name.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contract Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract, index) => {
              const status = deploymentStatus[contract.id];
              const address = deployedAddresses[contract.id];
              const canDeploy = contract.dependencies.every(dep => deploymentStatus[dep] === 'deployed');
              
              return (
                <motion.div
                  key={contract.id}
                  className={`backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 ${getStatusColor(status)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{contract.icon}</span>
                      <div>
                        <h4 className="font-semibold">{contract.name}</h4>
                        <p className="text-xs text-slate-400">Gas: {contract.gasEstimate}</p>
                      </div>
                    </div>
                    {getStatusIcon(status)}
                  </div>

                  <p className="text-sm text-slate-300 mb-4">{contract.description}</p>

                  {contract.dependencies.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">Dependencies:</p>
                      <div className="flex flex-wrap gap-1">
                        {contract.dependencies.map(dep => (
                          <span
                            key={dep}
                            className={`text-xs px-2 py-1 rounded ${
                              deploymentStatus[dep] === 'deployed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {contracts.find(c => c.id === dep)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {address && (
                    <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Contract Address:</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-mono text-slate-300 flex-1 truncate">{address}</p>
                        <button
                          onClick={() => copyAddress(address)}
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button className="p-1 hover:bg-slate-700/50 rounded transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={() => deployContract(contract.id)}
                    disabled={!canDeploy || status === 'deploying' || status === 'deployed'}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      status === 'deployed'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : status === 'deploying'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : canDeploy
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                    whileHover={canDeploy && status === 'pending' ? { scale: 1.02 } : {}}
                    whileTap={canDeploy && status === 'pending' ? { scale: 0.98 } : {}}
                  >
                    {status === 'deployed' ? 'Deployed' :
                     status === 'deploying' ? 'Deploying...' :
                     status === 'failed' ? 'Failed - Retry' :
                     canDeploy ? 'Deploy' : 'Waiting for Dependencies'}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          {/* Network Configuration */}
          {allDeployed && (
            <motion.div
              className="bg-gradient-to-r from-emerald-600/10 to-blue-600/10 border border-emerald-500/30 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-emerald-400 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-2">Deployment Complete!</h3>
                  <p className="text-slate-300 mb-4">
                    All nuChain L2 contracts have been successfully deployed. The network is now ready for:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Available Features</h4>
                      <ul className="space-y-1 text-slate-300">
                        <li>• Validator staking and delegation</li>
                        <li>• NFT mining pool creation</li>
                        <li>• Hardware component NFT mining</li>
                        <li>• zkRollup transaction batching</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Next Steps</h4>
                      <ul className="space-y-1 text-slate-300">
                        <li>• Add nuChain network to wallet</li>
                        <li>• Bridge tokens from Altcoinchain</li>
                        <li>• Start validator or join mining pool</li>
                        <li>• Configure NFT mining rigs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractDeployment;