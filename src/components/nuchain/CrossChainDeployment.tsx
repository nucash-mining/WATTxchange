import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Network, 
  Zap, 
  Shield, 
  Coins,
  ArrowRight,
  ExternalLink,
  Copy
} from 'lucide-react';
import { deploymentService } from '../../services/deploymentService';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

const CrossChainDeployment: React.FC = () => {
  const { isConnected, chainId, switchToAltcoinchain } = useWallet();
  const [deploymentPhase, setDeploymentPhase] = useState<'setup' | 'deploying' | 'complete'>('setup');
  const [currentStep, setCurrentStep] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<any>({});
  const [isDeploying, setIsDeploying] = useState(false);

  const deploymentSteps = [
    {
      phase: 'nuChain L2 Setup',
      description: 'Deploy core nuChain L2 infrastructure (Chain ID: 2331)',
      contracts: ['nuToken', 'nuChainCore', 'validatorContract', 'zkRollupBridge'],
      chain: 'nuChain',
      icon: '🌉',
      color: 'text-purple-400'
    },
    {
      phase: 'Polygon Deployment',
      description: 'Deploy mining contracts on Polygon network',
      contracts: ['miningRigConfigurator', 'miningPoolHost', 'crossChainValidator'],
      chain: 'polygon',
      icon: '🔷',
      color: 'text-blue-400'
    },
    {
      phase: 'Altcoinchain Deployment',
      description: 'Deploy mining contracts on Altcoinchain network',
      contracts: ['miningRigConfigurator', 'miningPoolHost', 'crossChainValidator'],
      chain: 'altcoinchain',
      icon: '🔗',
      color: 'text-yellow-400'
    },
    {
      phase: 'Cross-Chain Integration',
      description: 'Initialize cross-chain communication and validation',
      contracts: [],
      chain: 'all',
      icon: '🌐',
      color: 'text-emerald-400'
    }
  ];

  useEffect(() => {
    // Load existing deployment status
    const status = deploymentService.getDeploymentStatus();
    setDeploymentStatus(status);
  }, []);

  const handleFullDeployment = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to deploy contracts');
      return;
    }

    setIsDeploying(true);
    setDeploymentPhase('deploying');
    setCurrentStep(0);

    try {
      // Step 1: Deploy nuChain L2 Core
      setCurrentStep(1);
      await deploymentService.deployToChain('nuChain', 'nuToken');
      await deploymentService.deployToChain('nuChain', 'nuChainCore', [
        deploymentService.getContractAddress('nuChain', 'nuToken'),
        '0x6645143e49B3a15d8F205658903a55E520444698' // WATT on Altcoinchain
      ]);
      await deploymentService.deployToChain('nuChain', 'validatorContract', [
        deploymentService.getContractAddress('nuChain', 'nuToken')
      ]);
      await deploymentService.deployToChain('nuChain', 'zkRollupBridge', [
        deploymentService.getContractAddress('nuChain', 'validatorContract')
      ]);

      // Step 2: Deploy Polygon Contracts
      setCurrentStep(2);
      await deploymentService.deployToChain('polygon', 'crossChainValidator');
      await deploymentService.deployToChain('polygon', 'miningRigConfigurator', [
        '0x970a8b10147e3459d3cbf56329b76ac18d329728', // NFT contract
        '0xE960d5076cd3169C343Ee287A2c3380A222e5839', // WATT on Polygon
        deploymentService.getContractAddress('nuChain', 'nuToken')
      ]);
      await deploymentService.deployToChain('polygon', 'miningPoolHost', [
        '0xE960d5076cd3169C343Ee287A2c3380A222e5839', // WATT on Polygon
        deploymentService.getContractAddress('nuChain', 'nuToken')
      ]);

      // Step 3: Deploy Altcoinchain Contracts
      setCurrentStep(3);
      await deploymentService.deployToChain('altcoinchain', 'crossChainValidator');
      await deploymentService.deployToChain('altcoinchain', 'miningRigConfigurator', [
        '0x970a8b10147e3459d3cbf56329b76ac18d329728', // NFT contract
        '0x6645143e49B3a15d8F205658903a55E520444698', // WATT on Altcoinchain
        deploymentService.getContractAddress('nuChain', 'nuToken')
      ]);
      await deploymentService.deployToChain('altcoinchain', 'miningPoolHost', [
        '0x6645143e49B3a15d8F205658903a55E520444698', // WATT on Altcoinchain
        deploymentService.getContractAddress('nuChain', 'nuToken')
      ]);

      // Step 4: Initialize Cross-Chain Communication
      setCurrentStep(4);
      await deploymentService.initializeCrossChainCommunication();

      setDeploymentPhase('complete');
      toast.success('🎉 Cross-chain mining system deployed successfully!');
      
      // Update deployment status
      const status = deploymentService.getDeploymentStatus();
      setDeploymentStatus(status);
      
    } catch (error) {
      console.error('Deployment failed:', error);
      toast.error('Deployment failed. Please try again.');
      setDeploymentPhase('setup');
    } finally {
      setIsDeploying(false);
    }
  };

  const addNuChainToWallet = async () => {
    const success = await deploymentService.addNuChainToWallet();
    if (success) {
      toast.success('nuChain L2 added to wallet!');
    } else {
      toast.error('Failed to add nuChain L2 to wallet');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Cross-Chain Mining System Deployment
        </h2>
        <p className="text-slate-400 mt-2">Deploy across Polygon, Altcoinchain, and nuChain L2 (Chain ID: 2331)</p>
      </motion.div>

      {/* nuChain L2 Network Info */}
      <motion.div
        className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold">nuChain L2 zkRollup</h3>
              <p className="text-slate-400 text-sm">Chain ID: 2331 • Sonic Labs Technology</p>
            </div>
          </div>
          <motion.button
            onClick={addNuChainToWallet}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Network className="w-4 h-4" />
            <span>Add to Wallet</span>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">⚡ Sonic Labs Layer</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• 1-second block times</li>
              <li>• 400,000+ TPS capacity</li>
              <li>• Ultra-low latency</li>
              <li>• EVM compatibility</li>
            </ul>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">🛡️ zkRollup Security</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Zero-knowledge proofs</li>
              <li>• Altcoinchain validation</li>
              <li>• Private transactions</li>
              <li>• Fraud-proof system</li>
            </ul>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-400 mb-2">🎮 NFT Mining</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Hardware component NFTs</li>
              <li>• Virtual mining pools</li>
              <li>• WATT token consumption</li>
              <li>• NU token rewards</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Deployment Steps */}
      <div className="space-y-4">
        {deploymentSteps.map((step, index) => (
          <motion.div
            key={index}
            className={`bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 ${
              currentStep === index + 1 && deploymentPhase === 'deploying'
                ? 'border-blue-500/50 bg-blue-500/5'
                : currentStep > index && deploymentPhase !== 'setup'
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700/50'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${
                  currentStep > index && deploymentPhase !== 'setup'
                    ? 'bg-emerald-600/20'
                    : currentStep === index + 1 && deploymentPhase === 'deploying'
                    ? 'bg-blue-600/20'
                    : 'bg-slate-700/50'
                }`}>
                  {currentStep > index && deploymentPhase !== 'setup' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : currentStep === index + 1 && deploymentPhase === 'deploying' ? (
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-2xl">{step.icon}</span>
                  )}
                </div>
                <div>
                  <h4 className={`font-semibold ${step.color}`}>{step.phase}</h4>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                  {step.contracts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.contracts.map(contract => (
                        <span
                          key={contract}
                          className="text-xs bg-slate-700/50 px-2 py-1 rounded"
                        >
                          {contract}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-slate-400">
                  {step.chain === 'all' ? 'Multi-Chain' : step.chain}
                </p>
                {currentStep === index + 1 && deploymentPhase === 'deploying' && (
                  <p className="text-xs text-blue-400">Deploying...</p>
                )}
                {currentStep > index && deploymentPhase !== 'setup' && (
                  <p className="text-xs text-emerald-400">Complete</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Deployment Controls */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold">Deployment Control</h4>
            <p className="text-slate-400 text-sm">
              {deploymentPhase === 'setup' ? 'Ready to deploy cross-chain mining system' :
               deploymentPhase === 'deploying' ? `Deploying step ${currentStep} of ${deploymentSteps.length}...` :
               'All contracts deployed successfully!'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {deploymentPhase === 'complete' ? (
              <motion.button
                onClick={addNuChainToWallet}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Network className="w-5 h-5" />
                <span>Add nuChain to Wallet</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={handleFullDeployment}
                disabled={isDeploying || !isConnected}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Rocket className="w-5 h-5" />
                <span>{isDeploying ? 'Deploying...' : 'Deploy All Contracts'}</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Contract Addresses */}
      {deploymentPhase === 'complete' && (
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="text-lg font-semibold mb-4">Deployed Contract Addresses</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* nuChain L2 */}
            <div>
              <h5 className="font-semibold text-purple-400 mb-3">nuChain L2 (2331)</h5>
              <div className="space-y-2">
                {Object.entries(deploymentStatus.nuChain?.contracts || {}).map(([name, contract]: [string, any]) => (
                  contract.deployed && (
                    <div key={name} className="bg-slate-900/50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{name}</span>
                        <button
                          onClick={() => copyAddress(contract.address)}
                          className="p-1 hover:bg-slate-700/50 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-400">{contract.address}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Polygon */}
            <div>
              <h5 className="font-semibold text-blue-400 mb-3">Polygon (137)</h5>
              <div className="space-y-2">
                {Object.entries(deploymentStatus.polygon?.contracts || {}).map(([name, contract]: [string, any]) => (
                  contract.deployed && (
                    <div key={name} className="bg-slate-900/50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{name}</span>
                        <button
                          onClick={() => copyAddress(contract.address)}
                          className="p-1 hover:bg-slate-700/50 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-400">{contract.address}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Altcoinchain */}
            <div>
              <h5 className="font-semibold text-yellow-400 mb-3">Altcoinchain (2330)</h5>
              <div className="space-y-2">
                {Object.entries(deploymentStatus.altcoinchain?.contracts || {}).map(([name, contract]: [string, any]) => (
                  contract.deployed && (
                    <div key={name} className="bg-slate-900/50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{name}</span>
                        <button
                          onClick={() => copyAddress(contract.address)}
                          className="p-1 hover:bg-slate-700/50 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-400">{contract.address}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* System Architecture */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className="text-lg font-semibold mb-4">System Architecture</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-600/20 rounded-lg p-4 mb-3">
              <img src="/MATIC logo.png" alt="Polygon" className="w-12 h-12 mx-auto mb-2" />
              <h5 className="font-semibold text-blue-400">Polygon Network</h5>
              <p className="text-xs text-slate-400">NFT Mining Rigs</p>
            </div>
            <div className="space-y-1 text-xs">
              <p>• Mining Rig Configurator</p>
              <p>• Mining Pool Host</p>
              <p>• Cross-Chain Validator</p>
              <p>• Hardware NFTs (existing)</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-600/20 rounded-lg p-4 mb-3">
              <Zap className="w-12 h-12 mx-auto mb-2 text-purple-400" />
              <h5 className="font-semibold text-purple-400">nuChain L2</h5>
              <p className="text-xs text-slate-400">zkRollup Coordinator</p>
            </div>
            <div className="space-y-1 text-xs">
              <p>• NU Token (native)</p>
              <p>• Validator Contract</p>
              <p>• Mining Pool Factory</p>
              <p>• zkRollup Bridge</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-yellow-600/20 rounded-lg p-4 mb-3">
              <img src="/Altcoinchain logo.png" alt="Altcoinchain" className="w-12 h-12 mx-auto mb-2 rounded-full" />
              <h5 className="font-semibold text-yellow-400">Altcoinchain</h5>
              <p className="text-xs text-slate-400">WATT Token Base</p>
            </div>
            <div className="space-y-1 text-xs">
              <p>• Mining Rig Configurator</p>
              <p>• Mining Pool Host</p>
              <p>• Cross-Chain Validator</p>
              <p>• WATT Token (existing)</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Hash Power Validation</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">NU Reward Distribution</span>
          </div>
        </div>
      </motion.div>

      {/* WATT Consumption Flow */}
      <motion.div
        className="bg-gradient-to-r from-yellow-600/10 to-red-600/10 border border-yellow-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-start space-x-4">
          <Coins className="w-6 h-6 text-yellow-400 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-yellow-400 mb-2">WATT Consumption & NU Rewards</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-yellow-400 mb-2">WATT Flow</h5>
                <ol className="text-sm text-slate-300 space-y-1 list-decimal pl-4">
                  <li>Miners configure NFT rigs (PC Case + Processor + 1-2 GPUs)</li>
                  <li>WATT consumed per block based on power consumption</li>
                  <li>Pool operators (100,000 WATT staked) mine without consumption</li>
                  <li>Consumed WATT sent to: <code className="bg-slate-800 px-1 rounded">0x7069C4CEC0972D2f5FA8E6886e438656D6e6f23b</code></li>
                </ol>
              </div>
              <div>
                <h5 className="font-semibold text-emerald-400 mb-2">NU Rewards</h5>
                <ol className="text-sm text-slate-300 space-y-1 list-decimal pl-4">
                  <li>Hash power validated across Polygon + Altcoinchain</li>
                  <li>50 NU per block distributed proportionally</li>
                  <li>Higher hash power = larger share of rewards</li>
                  <li>Bitcoin-style halving every 210,000 blocks</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CrossChainDeployment;