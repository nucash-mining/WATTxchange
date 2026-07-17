// Deploy WrappedTokenFactory (nonce 0) + HTLCVault (nonce 1) with the fresh
// bridge deployer so addresses are identical on every chain deployed later.
import { readFileSync } from 'node:fs';
import { JsonRpcProvider, Wallet, ContractFactory, getCreateAddress, formatEther } from 'ethers';

const RPC = process.env.BRIDGE_RPC || 'https://rpc.wattxchange.app';
const CHAIN_ID = Number(process.env.BRIDGE_CHAIN_ID || 2330);

const key = JSON.parse(readFileSync(`${process.env.HOME}/.wattxchange-deployer/bridge-deployer.json`, 'utf8'));
const provider = new JsonRpcProvider(RPC, CHAIN_ID);
const wallet = new Wallet(key.private_key, provider);

const art = (n) => JSON.parse(readFileSync(`contracts/out/${n}.sol/${n}.json`, 'utf8'));

const nonce = await provider.getTransactionCount(wallet.address);
console.log('deployer:', wallet.address, 'nonce:', nonce, 'balance:', formatEther(await provider.getBalance(wallet.address)));
if (nonce !== 0) throw new Error(`nonce must be 0 for deterministic addresses, got ${nonce}`);

console.log('expected factory:', getCreateAddress({ from: wallet.address, nonce: 0 }));
console.log('expected vault:  ', getCreateAddress({ from: wallet.address, nonce: 1 }));

for (const name of ['WrappedTokenFactory', 'HTLCVault']) {
  const a = art(name);
  const cf = new ContractFactory(a.abi, a.bytecode.object, wallet);
  const c = await cf.deploy({ type: 0, gasLimit: 4_000_000 });
  await c.deploymentTransaction().wait();
  const code = await provider.getCode(await c.getAddress());
  console.log(name, 'deployed at', await c.getAddress(), 'code bytes:', (code.length - 2) / 2);
}
console.log('remaining balance:', formatEther(await provider.getBalance(wallet.address)), 'ALT');
