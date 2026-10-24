import '../../lib/bufferPolyfill';
import React, { useState } from 'react';
import { KEPLR_CHAIN_INFO, NUCHAIN } from '../../config/nuchainBridges';
import { Widget } from '@skip-go/widget';
import { ArrowLeftRight, ExternalLink, Info } from 'lucide-react';

// Skip's default API and RPC proxies (go.skip.build) only allow Skip's own sites,
// so the widget uses the public Skip API plus cosmos.directory's public chain
// proxies (both send CORS headers for any origin).
const SKIP_API = 'https://api.skip.build';
let chainNames: Promise<Record<string, string>> | null = null;
function chainName(chainId: string): Promise<string | undefined> {
  if (!chainNames) chainNames = fetch(`${SKIP_API}/v2/info/chains?include_evm=false&include_svm=false`)
    .then((r) => r.json())
    .then((j: { chains: { chain_id: string; chain_name: string }[] }) => Object.fromEntries(j.chains.map((c) => [c.chain_id, c.chain_name])))
    .catch(() => { chainNames = null; return {}; });
  return chainNames.then((m) => m[chainId]);
}
const endpointOptions = {
  getRpcEndpointForChain: async (id: string) => { const n = await chainName(id); return n ? `https://rpc.cosmos.directory/${n}` : `https://go.skip.build/api/rpc/${id}`; },
  getRestEndpointForChain: async (id: string) => { const n = await chainName(id); return n ? `https://rest.cosmos.directory/${n}` : `https://go.skip.build/api/rest/${id}`; },
};

// Swap between every chain and token on Osmosis (and the rest of the Cosmos
// ecosystem) with Skip Go, which routes swaps through Osmosis and moves tokens
// over IBC. Keplr, Leap, MetaMask and other wallets connect inside the widget.
// nuChain joins the list once its IBC channel to Osmosis is open.
const AddToKeplr: React.FC = () => {
  const [msg, setMsg] = useState('');
  const add = async () => {
    const k = (window as unknown as { keplr?: { experimentalSuggestChain: (c: unknown) => Promise<void>; enable: (id: string) => Promise<void> } }).keplr;
    if (!k) { setMsg('Keplr extension not found.'); return; }
    try { await k.experimentalSuggestChain(KEPLR_CHAIN_INFO); await k.enable(NUCHAIN.cosmosChainId); setMsg('nuChain added to Keplr.'); }
    catch (e) { setMsg(`Keplr: ${(e as Error).message}`); }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={add} className="px-3 py-1.5 rounded-md bg-slate-900/70 border border-slate-700 text-cyan-300 hover:border-cyan-500 text-xs">Add nuChain to Keplr</button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </span>
  );
};

const OsmosisSwap: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <ArrowLeftRight className="text-purple-400 mt-1" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-white">Cosmos Swap</h2>
          <p className="text-slate-300 text-sm mt-1">
            Swap any token on any chain listed on Osmosis: VDL, BZE, ATOM, OSMO, TIA, INJ, USDC, and hundreds more. Routes go
            through Osmosis liquidity and IBC transfers in one flow, so you can start on one chain and end on another.
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
            <a className="text-cyan-400 inline-flex items-center gap-1" href="https://app.osmosis.zone" target="_blank" rel="noopener noreferrer">
              Osmosis <ExternalLink size={12} /></a>
            <a className="text-cyan-400 inline-flex items-center gap-1" href="https://skip.build" target="_blank" rel="noopener noreferrer">
              Routing by Skip Go <ExternalLink size={12} /></a>
            <AddToKeplr />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-xs text-slate-300">
        <Info size={16} className="shrink-0 mt-0.5 text-cyan-400" />
        <span>NU and wWTX appear here once nuChain's IBC channel to Osmosis opens. Until then, swap NU and wWTX on nuChain
          in the Private tab.</span>
      </div>
    </div>

    <div className="flex justify-center">
      <div className="w-full max-w-[500px]">
        <Widget
          theme={{
            brandColor: '#9333ea',
            primary: {
              background: { normal: '#0f172a' },
              text: { normal: '#f1f5f9', lowContrast: '#94a3b8', ultraLowContrast: '#475569' },
              ghostButtonHover: '#1e293b',
            },
            secondary: {
              background: { normal: '#1e293b', transparent: 'rgba(30,41,59,0.7)', hover: '#334155' },
            },
          }}
          defaultRoute={{
            srcChainId: 'osmosis-1', srcAssetDenom: 'uosmo',
            // VDL (Vidulum) on Osmosis, originally from the BeeZee chain
            destChainId: 'osmosis-1', destAssetDenom: 'ibc/40B814E343DAADAF39FF4491727C7FE6286EE0A9A787CF839B318461C6FEDF95',
          }}
          assetSymbolsSortedToTop={['VDL', 'BZE', 'OSMO', 'ATOM', 'USDC']}
          assetAnnotations={{
            VDL: { variant: 'info', selector: { description: 'Vidulum (BeeZee chain)', pinToTop: true } },
            BZE: { variant: 'info', selector: { description: 'BeeZee', pinToTop: true } },
          }}
          settings={{ slippage: 1 }}
          apiUrl={SKIP_API}
          endpointOptions={endpointOptions}
        />
      </div>
    </div>
  </div>
);

export default OsmosisSwap;
