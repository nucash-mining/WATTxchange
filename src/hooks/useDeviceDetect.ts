import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileWallet: boolean;
  isMetaMask: boolean;
  isTrustWallet: boolean;
  isRainbow: boolean;
  isWalletConnect: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
}

export const useDeviceDetect = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileWallet: false,
    isMetaMask: false,
    isTrustWallet: false,
    isRainbow: false,
    isWalletConnect: false,
    orientation: 'landscape',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 375,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 812
  });

  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return;

      const userAgent = navigator.userAgent;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detect mobile devices
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent) || width <= 768;
      
      // Detect tablets (typically have larger screens than phones)
      const isTablet = isMobileDevice && Math.min(width, height) > 600 && Math.max(width, height) > 900;
      
      // Detect mobile wallets
      const ethereum = window.ethereum;
      const isMetaMask = !!ethereum?.isMetaMask;
      const isTrustWallet = !!ethereum?.isTrust;
      const isRainbow = !!ethereum?.isRainbow;
      const isWalletConnect = !!ethereum?.isWalletConnect;
      
      // Detect if we're in a mobile wallet browser
      const isMobileWallet = (isMetaMask || isTrustWallet || isRainbow || isWalletConnect) && 
                            (isMobileDevice || width <= 768);
      
      // Determine orientation
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setDeviceInfo({
        isMobile: isMobileDevice && !isTablet || width <= 768,
        isTablet,
        isDesktop: !isMobileDevice && !isTablet && width > 768,
        isMobileWallet,
        isMetaMask,
        isTrustWallet,
        isRainbow,
        isWalletConnect,
        orientation,
        screenWidth: width,
        screenHeight: height
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return deviceInfo;
};