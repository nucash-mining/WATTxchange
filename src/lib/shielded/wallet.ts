import { ethers } from 'ethers';
import { NUCHAIN_ADD_NETWORK } from '../../config/nuchainShielded';

type Eth = ethers.Eip1193Provider & { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

/** Connect the browser wallet, switching it to nuChain (adding the network if needed). */
export async function connectNuChain(): Promise<ethers.JsonRpcSigner> {
  const eth = (window as unknown as { ethereum?: Eth }).ethereum;
  if (!eth) throw new Error('No browser wallet found (install MetaMask or similar)');
  await eth.request({ method: 'eth_requestAccounts' });
  try { await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NUCHAIN_ADD_NETWORK.chainId }] }); }
  catch { await eth.request({ method: 'wallet_addEthereumChain', params: [NUCHAIN_ADD_NETWORK] }); }
  return new ethers.BrowserProvider(eth).getSigner();
}
