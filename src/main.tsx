import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App-test.tsx';
import './index.css';

console.log('🚀 Starting React app...');

const rootElement = document.getElementById('root');
console.log('📍 Root element:', rootElement);

if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('✅ React app rendered!');
}
