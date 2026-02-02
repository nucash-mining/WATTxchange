import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      backgroundColor: '#0a0a0a',
      color: '#f0b90b',
      minHeight: '100vh',
      padding: '40px',
      fontFamily: 'sans-serif'
    }}>
      <h1>WATTx Explorer - React Test</h1>
      <p>If you see this, React is working!</p>
      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          background: '#f0b90b',
          color: '#000',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        Clicked: {count} times
      </button>
    </div>
  );
}
