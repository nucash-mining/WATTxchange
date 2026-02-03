import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Check, AlertTriangle, Download, Wallet, ArrowRight, Clock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';

interface RentalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: any;
}

const RentalContractModal: React.FC<RentalContractModalProps> = ({ isOpen, onClose, app }) => {
  const [isReading, setIsReading] = useState(true);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { isConnected, address } = useWallet();

  const handleSign = async () => {
    if (!isAgreed) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate contract signing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      toast.success('Contract signed successfully');
    }, 2000);
  };

  const handleDownloadContract = () => {
    // In a real implementation, this would generate and download a PDF
    toast.success('Contract downloaded');
  };

  const getContractTerms = () => {
    if (!app) return '';
    
    return `
HARDWARE RENTAL AGREEMENT

This Hardware Rental Agreement (the "Agreement") is entered into between WATTxchange ("Platform") and the hardware provider ("Provider").

1. HARDWARE SHARING TERMS

1.1 The Provider agrees to share computing resources including CPU, GPU, and/or network resources through the WATTxchange platform.

1.2 The Provider will receive compensation at the rate of 0.01 WATT tokens per MHz per hour for CPU resources, 0.01 WATT tokens per CUDA core per hour for GPU resources, or at fixed rates for node hosting as specified in the platform interface.

1.3 The Provider authorizes the Platform to utilize the specified hardware resources only when the following conditions are met:
   a) The Provider's system is idle or under the utilization threshold set by the Provider
   b) The system is powered on and connected to the internet
   c) The WATTxchange client software is running

1.4 The Provider may set resource limits and schedules for hardware sharing through the client software.

2. PAYMENT TERMS

2.1 Payments will be made in WATT tokens to the Provider's wallet address.

2.2 Earnings will be calculated based on actual resource usage and paid automatically every 24 hours.

2.3 The Provider grants permission for the Platform to execute the smart contract that manages WATT token payments.

2.4 The minimum payout threshold is 1.0 WATT tokens.

3. SECURITY AND PRIVACY

3.1 The Platform will implement the following security measures:
   a) All workloads will run in isolated containers or virtual machines
   b) No access to the Provider's personal files or data
   c) Resource usage will be strictly limited to prevent system overload
   d) All network traffic will be encrypted

3.2 The Provider acknowledges that the Platform will collect system performance metrics solely for the purpose of calculating compensation and ensuring system health.

4. TERM AND TERMINATION

4.1 This Agreement commences upon the Provider's acceptance and continues until terminated by either party.

4.2 The Provider may terminate this Agreement at any time by uninstalling the client software or disabling hardware sharing through the client interface.

4.3 The Platform may terminate this Agreement if the Provider's hardware consistently fails to meet minimum availability requirements.

5. LIMITATIONS OF LIABILITY

5.1 The Platform shall not be liable for any damage to the Provider's hardware resulting from normal wear and tear associated with computational usage.

5.2 The Provider acknowledges that hardware sharing may increase power consumption and system wear.

5.3 The Platform's total liability shall not exceed the amount of WATT tokens paid to the Provider in the preceding 30 days.

6. GOVERNING LAW

6.1 This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Platform is registered.

By signing this Agreement, the Provider acknowledges having read, understood, and agreed to all terms and conditions.
`;
  };

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Hardware Rental Agreement</h3>
                <p className="text-gray-400 text-sm">Review and sign the contract to start earning WATT tokens</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isReading ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Contract Terms</h4>
                  <button
                    onClick={handleDownloadContract}
                    className="flex items-center space-x-1 text-sm text-yellow-400 hover:text-yellow-300"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
                
                <div className="bg-gray-900/70 rounded-lg p-6 border border-gray-700/50 h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{getContractTerms()}</pre>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium">Important Information</p>
                      <p className="text-sm text-gray-300 mt-1">
                        By signing this agreement, you authorize the WATTxchange platform to utilize your hardware resources
                        according to the terms specified above. You will be compensated in WATT tokens based on actual resource usage.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="agree" className="text-sm">
                    I have read and agree to the terms and conditions
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <motion.button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => setIsReading(false)}
                    disabled={!isAgreed}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Continue to Sign</span>
                  </motion.button>
                </div>
              </div>
            ) : isComplete ? (
              <div className="space-y-6 text-center py-8">
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-emerald-400">Contract Signed Successfully!</h4>
                  <p className="text-gray-300 mt-2">
                    Your hardware rental agreement has been signed and is now active.
                    You can start earning WATT tokens immediately.
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30 max-w-md mx-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Contract ID:</span>
                      <span className="font-mono">WATT-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Start Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">First Payout:</span>
                      <span>{new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <motion.button
                    onClick={onClose}
                    className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check className="w-5 h-5" />
                    <span>Complete Setup</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Sign Contract</h4>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium">Contract Summary</h5>
                    <button
                      onClick={() => setIsReading(true)}
                      className="text-sm text-yellow-400 hover:text-yellow-300"
                    >
                      View Full Contract
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Wallet className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Payment Terms</p>
                        <p className="text-sm text-gray-400">
                          Earn 0.01 WATT per MHz per hour for CPU resources, paid daily to your wallet
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-sm text-gray-400">
                          Continuous until terminated by either party
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Security Measures</p>
                        <p className="text-sm text-gray-400">
                          Isolated containers, encrypted traffic, resource limits
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Wallet className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium">Wallet Authorization</p>
                      <p className="text-sm text-gray-300 mt-1">
                        By signing this contract, you authorize the WATTxchange platform to make WATT token payments to your wallet.
                        You will need to sign a transaction with your wallet to confirm this authorization.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <motion.button
                    onClick={() => setIsReading(true)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleSign}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        <span>Sign with Wallet</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RentalContractModal;