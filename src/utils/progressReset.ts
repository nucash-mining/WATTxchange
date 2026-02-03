export const resetAllProgress = () => {
  console.log('Dispatching global progress reset event');
  window.dispatchEvent(new CustomEvent('resetProgress'));
  
  // Reset any localStorage progress values
  localStorage.removeItem('installProgress');
  localStorage.removeItem('downloadProgress');
  localStorage.removeItem('miningProgress');
  localStorage.removeItem('hardwareScanProgress');
  
  // Reset any sessionStorage progress values
  sessionStorage.removeItem('installProgress');
  sessionStorage.removeItem('downloadProgress');
  sessionStorage.removeItem('miningProgress');
  sessionStorage.removeItem('hardwareScanProgress');
  
  console.log('All progress indicators reset');
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).resetProgress = resetAllProgress;
}
