import React, { useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface MobileTouchHandlerProps {
  children: React.ReactNode;
  enableHaptics?: boolean;
}

const MobileTouchHandler: React.FC<MobileTouchHandlerProps> = ({ 
  children, 
  enableHaptics = true 
}) => {
  useEffect(() => {
    // Prevent default touch behaviors that interfere with the app
    const preventDefaultTouch = (e: TouchEvent) => {
      // Prevent pull-to-refresh
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add touch event listeners
    document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Handle haptic feedback for buttons
    if (enableHaptics) {
      const handleButtonTouch = async (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) {
          try {
            await Haptics.impact({ style: ImpactStyle.Light });
          } catch (error) {
            // Haptics not available, ignore
          }
        }
      };

      document.addEventListener('touchstart', handleButtonTouch);

      return () => {
        document.removeEventListener('touchstart', preventDefaultTouch);
        document.removeEventListener('touchmove', preventZoom);
        document.removeEventListener('touchstart', handleButtonTouch);
      };
    }

    return () => {
      document.removeEventListener('touchstart', preventDefaultTouch);
      document.removeEventListener('touchmove', preventZoom);
    };
  }, [enableHaptics]);

  return <>{children}</>;
};

export default MobileTouchHandler;