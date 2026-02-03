import React from 'react';

function App() {
  console.log('🚀 Minimal App component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000', 
      color: '#ffffff',
      padding: '20px'
    }}>
      <h1>WATTxchange</h1>
      <p>Minimal test version - if you can see this, React is working!</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
        <h2>Status: ✅ Working</h2>
        <p>This is a minimal test to verify the app loads without errors.</p>
      </div>
    </div>
  );
}

export default App;
