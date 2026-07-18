// Real on-chain Uniswap-V2 AMM access for Altcoinchain (2330).
// Reads go through the public tunnel RPC; writes go through the connected
// wallet's signer. Trades route to the ORIGINAL SwapinDEX deployment
// (SWAPIN_LIVE — the venue with liquidity); see altcoinchainContracts.ts.
import { ethers } from 'ethers';
import {
  ALTCOINCHAIN,
  SWAPIN_LIVE,
  ALT_TOKENS,
  ALT_TOKEN_DECIMALS,
  SWAPIN_POOLS,
  type AltTokenSymbol,
} from '../config/altcoinchainContracts';

const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairsLength() view returns (uint256)',
  'function allPairs(uint256) view returns (address pair)',
];

const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
];

const WALT_ABI = [
  ...ERC20_ABI,
  'function deposit() payable',
  'function withdraw(uint256 wad)',
];

export interface AmmQuote {
  amountOut: string;       // human units
  amountOutWei: bigint;
  path: string[];          // token addresses
  pathSymbols: string[];   // e.g. ['ALT', 'wALT', 'WATT']
  isWrap: boolean;         // ALT<->wALT 1:1, no pool involved
}

export interface AmmPool {
  pairAddress: string;
  token0: string;          // symbol
  token1: string;          // symbol
  reserve0: string;        // human units
  reserve1: string;
  midPrice: number;        // token1 per token0
}

export interface PairInfo {
  pairAddress: string;
  reserveA: string;        // human units, aligned to the symbolA argument
  reserveB: string;
  reserveAWei: bigint;
  reserveBWei: bigint;
  totalSupplyWei: bigint;
  rate: number;            // symbolB per symbolA
}

export interface AmmPosition {
  pairAddress: string;
  token0: string;
  token1: string;
  lpBalance: string;
  shareOfPool: number;     // 0..1
  token0Amount: string;
  token1Amount: string;
}

class AmmV2Service {
  private provider = new ethers.JsonRpcProvider(ALTCOINCHAIN.rpcUrls[0], ALTCOINCHAIN.chainId, {
    staticNetwork: true,
  });
  private router = new ethers.Contract(SWAPIN_LIVE.UniswapV2Router02, ROUTER_ABI, this.provider);
  private factory = new ethers.Contract(SWAPIN_LIVE.UniswapV2Factory, FACTORY_ABI, this.provider);
  // address(lowercased) -> symbol, for pretty route display
  private addressToSymbol = new Map<string, string>(
    Object.entries(ALT_TOKENS).map(([sym, addr]) => [addr.toLowerCase(), sym])
  );

  isNative(symbol: string): boolean {
    return symbol === 'ALT';
  }

  tokenAddress(symbol: string): string | null {
    if (this.isNative(symbol)) return null;
    return (ALT_TOKENS as Record<string, string>)[symbol] ?? null;
  }

  supportedSymbols(): AltTokenSymbol[] {
    return ['ALT', ...(Object.keys(ALT_TOKENS) as (keyof typeof ALT_TOKENS)[])];
  }

  private symbolFor(address: string): string {
    return this.addressToSymbol.get(address.toLowerCase()) ?? `${address.slice(0, 6)}…`;
  }

  private decimalsOf(symbol: string): number {
    return (ALT_TOKEN_DECIMALS as Record<string, number>)[symbol] ?? 18;
  }

  /** ERC-20 path for a swap; native ALT enters/exits through wALT. */
  private async buildPath(fromSymbol: string, toSymbol: string): Promise<string[]> {
    const from = this.isNative(fromSymbol) ? ALT_TOKENS.wALT : this.tokenAddress(fromSymbol);
    const to = this.isNative(toSymbol) ? ALT_TOKENS.wALT : this.tokenAddress(toSymbol);
    if (!from || !to) throw new Error(`Unknown token: ${!from ? fromSymbol : toSymbol}`);
    if (from.toLowerCase() === to.toLowerCase()) return [from];
    const direct = await this.factory.getPair(from, to);
    if (direct !== ethers.ZeroAddress) return [from, to];
    // hop through wALT
    if (from.toLowerCase() !== ALT_TOKENS.wALT.toLowerCase() && to.toLowerCase() !== ALT_TOKENS.wALT.toLowerCase()) {
      const [legA, legB] = await Promise.all([
        this.factory.getPair(from, ALT_TOKENS.wALT),
        this.factory.getPair(ALT_TOKENS.wALT, to),
      ]);
      if (legA !== ethers.ZeroAddress && legB !== ethers.ZeroAddress) {
        return [from, ALT_TOKENS.wALT, to];
      }
    }
    throw new Error(`No liquidity route ${fromSymbol} -> ${toSymbol}`);
  }

  /** Quote a swap. ALT<->wALT is a 1:1 wrap (no pool). Throws if no route. */
  async quote(fromSymbol: string, toSymbol: string, amountIn: string): Promise<AmmQuote> {
    const amountInWei = ethers.parseUnits(amountIn, this.decimalsOf(fromSymbol));
    if (amountInWei <= 0n) throw new Error('Amount must be positive');

    // wrap / unwrap: 1:1, no pool
    const wrapPair =
      (this.isNative(fromSymbol) && toSymbol === 'wALT') ||
      (fromSymbol === 'wALT' && this.isNative(toSymbol));
    if (wrapPair) {
      return {
        amountOut: amountIn,
        amountOutWei: amountInWei,
        path: [ALT_TOKENS.wALT],
        pathSymbols: [fromSymbol, toSymbol],
        isWrap: true,
      };
    }

    const path = await this.buildPath(fromSymbol, toSymbol);
    const amounts: bigint[] = await this.router.getAmountsOut(amountInWei, path);
    const amountOutWei = amounts[amounts.length - 1];
    const pathSymbols = path.map((a) => this.symbolFor(a));
    if (this.isNative(fromSymbol)) pathSymbols[0] = 'ALT';
    if (this.isNative(toSymbol)) pathSymbols[pathSymbols.length - 1] = 'ALT';
    return {
      amountOut: ethers.formatUnits(amountOutWei, this.decimalsOf(toSymbol)),
      amountOutWei,
      path,
      pathSymbols,
      isWrap: false,
    };
  }

  /**
   * Execute a swap with the connected wallet. Handles ALT wrap/unwrap,
   * ERC-20 approval, and all three router swap variants.
   * Returns the confirmed tx hash.
   */
  async swap(
    signer: ethers.Signer,
    fromSymbol: string,
    toSymbol: string,
    amountIn: string,
    slippagePct: number,
    deadlineMinutes = 30
  ): Promise<string> {
    const amountInWei = ethers.parseUnits(amountIn, this.decimalsOf(fromSymbol));
    const to = await signer.getAddress();
    const q = await this.quote(fromSymbol, toSymbol, amountIn);

    // ALT <-> wALT wrap: talk to WALT directly.
    if (q.isWrap) {
      const walt = new ethers.Contract(ALT_TOKENS.wALT, WALT_ABI, signer);
      const tx = this.isNative(fromSymbol)
        ? await walt.deposit({ value: amountInWei })
        : await walt.withdraw(amountInWei);
      await tx.wait();
      return tx.hash;
    }

    const minOut = (q.amountOutWei * BigInt(Math.floor((100 - slippagePct) * 1000))) / 100000n;
    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    const router = new ethers.Contract(SWAPIN_LIVE.UniswapV2Router02, ROUTER_ABI, signer);

    if (this.isNative(fromSymbol)) {
      const tx = await router.swapExactETHForTokens(minOut, q.path, to, deadline, {
        value: amountInWei,
      });
      await tx.wait();
      return tx.hash;
    }

    // ERC-20 input: ensure allowance first.
    const token = new ethers.Contract(q.path[0], ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(to, SWAPIN_LIVE.UniswapV2Router02);
    if (allowance < amountInWei) {
      const approveTx = await token.approve(SWAPIN_LIVE.UniswapV2Router02, amountInWei);
      await approveTx.wait();
    }

    const tx = this.isNative(toSymbol)
      ? await router.swapExactTokensForETH(amountInWei, minOut, q.path, to, deadline)
      : await router.swapExactTokensForTokens(amountInWei, minOut, q.path, to, deadline);
    await tx.wait();
    return tx.hash;
  }

  /** Live reserves for the known pools (skips pairs that fail to respond). */
  async getPools(): Promise<AmmPool[]> {
    const entries = Object.entries(SWAPIN_POOLS);
    const pools = await Promise.all(
      entries.map(async ([name, pairAddress]) => {
        try {
          const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
          const [t0, t1, reserves] = await Promise.all([
            pair.token0(),
            pair.token1(),
            pair.getReserves(),
          ]);
          const sym0 = this.symbolFor(t0);
          const sym1 = this.symbolFor(t1);
          const r0 = ethers.formatUnits(reserves[0], this.decimalsOf(sym0));
          const r1 = ethers.formatUnits(reserves[1], this.decimalsOf(sym1));
          return {
            pairAddress,
            token0: sym0,
            token1: sym1,
            reserve0: r0,
            reserve1: r1,
            midPrice: parseFloat(r0) > 0 ? parseFloat(r1) / parseFloat(r0) : 0,
          } as AmmPool;
        } catch (error) {
          console.warn(`ammV2Service: failed to read pool ${name}`, error);
          return null;
        }
      })
    );
    return pools.filter((p): p is AmmPool => p !== null);
  }

  /** The connected account's LP positions across the known pools. */
  async getPositions(owner: string): Promise<AmmPosition[]> {
    const pools = await this.getPools();
    const positions = await Promise.all(
      pools.map(async (pool) => {
        try {
          const pair = new ethers.Contract(pool.pairAddress, PAIR_ABI, this.provider);
          const [lpBalance, totalSupply]: [bigint, bigint] = await Promise.all([
            pair.balanceOf(owner),
            pair.totalSupply(),
          ]);
          if (lpBalance === 0n || totalSupply === 0n) return null;
          const share = Number((lpBalance * 1000000n) / totalSupply) / 1000000;
          return {
            pairAddress: pool.pairAddress,
            token0: pool.token0,
            token1: pool.token1,
            lpBalance: ethers.formatEther(lpBalance),
            shareOfPool: share,
            token0Amount: (parseFloat(pool.reserve0) * share).toFixed(4),
            token1Amount: (parseFloat(pool.reserve1) * share).toFixed(4),
          } as AmmPosition;
        } catch {
          return null;
        }
      })
    );
    return positions.filter((p): p is AmmPosition => p !== null);
  }

  /** ERC-20 address a symbol enters pools as (native ALT pools via wALT). */
  private poolTokenAddress(symbol: string): string {
    const addr = this.isNative(symbol) ? ALT_TOKENS.wALT : this.tokenAddress(symbol);
    if (!addr) throw new Error(`Unknown token: ${symbol}`);
    return addr;
  }

  /** Wallet balance in human units (native or ERC-20). */
  async balanceOf(owner: string, symbol: string): Promise<string> {
    if (this.isNative(symbol)) {
      return ethers.formatEther(await this.provider.getBalance(owner));
    }
    const token = new ethers.Contract(this.poolTokenAddress(symbol), ERC20_ABI, this.provider);
    return ethers.formatUnits(await token.balanceOf(owner), this.decimalsOf(symbol));
  }

  /**
   * Reserves for the (symbolA, symbolB) pair, aligned to the argument order.
   * Returns null when the pair does not exist yet (adding liquidity creates it).
   */
  async getPairInfo(symbolA: string, symbolB: string): Promise<PairInfo | null> {
    const a = this.poolTokenAddress(symbolA);
    const b = this.poolTokenAddress(symbolB);
    if (a.toLowerCase() === b.toLowerCase()) throw new Error('ALT and wALT are the same pool token');
    const pairAddress: string = await this.factory.getPair(a, b);
    if (pairAddress === ethers.ZeroAddress) return null;
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
    const [token0, reserves, totalSupplyWei]: [string, [bigint, bigint, number], bigint] =
      await Promise.all([pair.token0(), pair.getReserves(), pair.totalSupply()]);
    const aIs0 = token0.toLowerCase() === a.toLowerCase();
    const reserveAWei = aIs0 ? reserves[0] : reserves[1];
    const reserveBWei = aIs0 ? reserves[1] : reserves[0];
    const reserveA = ethers.formatUnits(reserveAWei, this.decimalsOf(symbolA));
    const reserveB = ethers.formatUnits(reserveBWei, this.decimalsOf(symbolB));
    return {
      pairAddress,
      reserveA,
      reserveB,
      reserveAWei,
      reserveBWei,
      totalSupplyWei,
      rate: parseFloat(reserveA) > 0 ? parseFloat(reserveB) / parseFloat(reserveA) : 0,
    };
  }

  private async ensureAllowance(
    signer: ethers.Signer,
    tokenAddress: string,
    owner: string,
    amountWei: bigint
  ): Promise<void> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(owner, SWAPIN_LIVE.UniswapV2Router02);
    if (allowance < amountWei) {
      const tx = await token.approve(SWAPIN_LIVE.UniswapV2Router02, amountWei);
      await tx.wait();
    }
  }

  /**
   * Add liquidity to the (symbolA, symbolB) pool with the connected wallet.
   * Native ALT goes through addLiquidityETH; a missing pair is created by the
   * router at the implied price. Returns the confirmed tx hash.
   */
  async addLiquidity(
    signer: ethers.Signer,
    symbolA: string,
    symbolB: string,
    amountA: string,
    amountB: string,
    slippagePct: number,
    deadlineMinutes = 30
  ): Promise<string> {
    const to = await signer.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    const amountAWei = ethers.parseUnits(amountA, this.decimalsOf(symbolA));
    const amountBWei = ethers.parseUnits(amountB, this.decimalsOf(symbolB));
    if (amountAWei <= 0n || amountBWei <= 0n) throw new Error('Amounts must be positive');
    const minFactor = BigInt(Math.floor((100 - slippagePct) * 1000));
    const minA = (amountAWei * minFactor) / 100000n;
    const minB = (amountBWei * minFactor) / 100000n;
    const router = new ethers.Contract(SWAPIN_LIVE.UniswapV2Router02, ROUTER_ABI, signer);

    const aNative = this.isNative(symbolA);
    const bNative = this.isNative(symbolB);
    if (aNative && bNative) throw new Error('Pick two different tokens');
    if (aNative || bNative) {
      const [tokenSym, tokenWei, tokenMin, ethWei, ethMin] = aNative
        ? [symbolB, amountBWei, minB, amountAWei, minA]
        : [symbolA, amountAWei, minA, amountBWei, minB];
      const tokenAddr = this.poolTokenAddress(tokenSym);
      if (tokenAddr.toLowerCase() === ALT_TOKENS.wALT.toLowerCase()) {
        throw new Error('ALT/wALT is a 1:1 wrap, not a pool — use the swap tab to wrap');
      }
      await this.ensureAllowance(signer, tokenAddr, to, tokenWei);
      const tx = await router.addLiquidityETH(tokenAddr, tokenWei, tokenMin, ethMin, to, deadline, {
        value: ethWei,
      });
      await tx.wait();
      return tx.hash;
    }

    const a = this.poolTokenAddress(symbolA);
    const b = this.poolTokenAddress(symbolB);
    if (a.toLowerCase() === b.toLowerCase()) throw new Error('Pick two different tokens');
    await this.ensureAllowance(signer, a, to, amountAWei);
    await this.ensureAllowance(signer, b, to, amountBWei);
    const tx = await router.addLiquidity(a, b, amountAWei, amountBWei, minA, minB, to, deadline);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Burn a percentage of the wallet's LP tokens in a pair and withdraw both
   * sides. Reads the exact LP balance on-chain (UI numbers are rounded).
   * Returns the confirmed tx hash.
   */
  async removeLiquidityByPct(
    signer: ethers.Signer,
    pairAddress: string,
    pct: number,
    slippagePct: number,
    deadlineMinutes = 30
  ): Promise<string> {
    if (!(pct > 0 && pct <= 100)) throw new Error('Percentage must be 1-100');
    const owner = await signer.getAddress();
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
    const [token0, token1, reserves, totalSupply, lpBalance]: [string, string, [bigint, bigint, number], bigint, bigint] =
      await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves(),
        pair.totalSupply(),
        pair.balanceOf(owner),
      ]);
    if (lpBalance === 0n) throw new Error('No LP tokens in this pool');
    const liquidity = (lpBalance * BigInt(Math.floor(pct * 100))) / 10000n;
    if (liquidity === 0n) throw new Error('Amount too small');

    // expected withdrawals at current reserves, minus slippage tolerance
    const minFactor = BigInt(Math.floor((100 - slippagePct) * 1000));
    const min0 = (((reserves[0] * liquidity) / totalSupply) * minFactor) / 100000n;
    const min1 = (((reserves[1] * liquidity) / totalSupply) * minFactor) / 100000n;

    // LP token is itself an ERC-20; router pulls it via allowance
    await this.ensureAllowance(signer, pairAddress, owner, liquidity);
    const router = new ethers.Contract(SWAPIN_LIVE.UniswapV2Router02, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    const tx = await router.removeLiquidity(token0, token1, liquidity, min0, min1, owner, deadline);
    await tx.wait();
    return tx.hash;
  }
}

export const ammV2Service = new AmmV2Service();
