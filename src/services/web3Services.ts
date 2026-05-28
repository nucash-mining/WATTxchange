import { Web3 } from 'web3';

const web3 = new Web3('http://99.248.100.186:8645');
const chainId = 2330;

export async function checkAltcoinchainNode(): Promise<boolean> {
  try {
    const isConnected = await web3.eth.net.isListening();
    console.log(`Altcoinchain node connected: ${isConnected}`);
    return isConnected;
  } catch (error) {
    console.error('Altcoinchain node error:', error);
    return false;
  }
}

export async function verifyChainId(): Promise<void> {
  try {
    const networkId = await web3.eth.getChainId();
    if (networkId !== chainId) {
      throw new Error(`Incorrect chainID: expected ${chainId}, got ${networkId}`);
    }
    console.log(`Chain ID verified: ${networkId}`);
  } catch (error) {
    console.error('Chain ID verification error:', error.message);
    throw error; // Re-throw to handle upstream
  }
}