import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import MobileTouchHandler from './components/mobile/MobileTouchHandler';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileTouchHandler>
      <App />
    </MobileTouchHandler>
  </StrictMode>
);
