import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Clock, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { atomicSwapService } from '../../services/atomicSwapService';
import AtomicSwapForm from './AtomicSwapForm';
import toast from 'react-hot-toast';

const SwapForm: React.FC = () => {
  return <AtomicSwapForm />;
};

export default SwapForm;