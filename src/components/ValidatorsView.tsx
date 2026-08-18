import React from 'react';

// Altcoinchain (2330) hybrid PoW/PoS validator staking dapp.
// The dapp itself is a self-contained page served from /alt-stake/ (public/).
// Embedding it keeps its wallet/RPC logic isolated from the main bundle while
// surfacing it inside the WATTxchange shell.
const ValidatorsView: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-8rem)]">
      <iframe
        src="/alt-stake/index.html"
        title="Altcoinchain Validator Staking"
        className="w-full h-[calc(100vh-8rem)] rounded-xl border border-white/10 bg-transparent"
        style={{ minHeight: '640px' }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default ValidatorsView;
