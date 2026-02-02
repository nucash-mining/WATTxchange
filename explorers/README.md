# WATTxchange Unified Block Explorer

A React-based block explorer frontend that works with the eIquidus backend API. Supports multiple blockchains with configurable theming.

## Supported Chains

| Chain | Ticker | Color Theme | Features |
|-------|--------|-------------|----------|
| WATTx | WTX | Yellow/Gold | Smart Contracts, Tokens, Staking |
| Help The Homeless | HTH | Green | Masternodes |
| Flopcoin | FLOP | Pink | Basic UTXO |
| Altcoinchain | ALT | Blue | EVM, ERC-20 Tokens |

## Project Structure

```
unified-explorer/
├── public/                 # Static assets and logos
├── src/
│   ├── components/        # Reusable React components
│   │   └── Layout.jsx     # Header, Footer, StatsBanner
│   ├── config/
│   │   └── chains.js      # Chain configurations
│   ├── hooks/
│   │   └── useApi.js      # API hooks for eIquidus
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Blocks.jsx
│   │   ├── Block.jsx
│   │   ├── Transactions.jsx
│   │   ├── Transaction.jsx
│   │   ├── Address.jsx
│   │   ├── RichList.jsx
│   │   ├── Masternodes.jsx
│   │   ├── Staking.jsx
│   │   └── Tokens.jsx
│   ├── utils/
│   │   └── format.js      # Formatting utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css          # Tailwind + custom styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Development

```bash
# Install dependencies
npm install

# Start development server (default: WTX)
npm run dev

# Start with specific chain
VITE_CHAIN=hth npm run dev
VITE_CHAIN=flop npm run dev
VITE_CHAIN=alt npm run dev
```

## Building for Production

```bash
# Build for a specific chain
npm run build:wtx
npm run build:hth
npm run build:flop
npm run build:alt

# Build all chains
npm run build:all
```

## Deployment

Each chain build outputs to `dist/{chain}/`. Deploy each to its respective subdomain:

- `dist/wtx/` → https://wtx-explorer.wattxchange.app
- `dist/hth/` → https://hth-explorer.wattxchange.app
- `dist/flop/` → https://flop-explorer.wattxchange.app
- `dist/alt/` → https://alt-explorer.wattxchange.app

## Configuration

Edit `src/config/chains.js` to customize:

- API endpoints
- Theme colors
- Feature flags
- Coin metadata

## eIquidus API Endpoints Used

- `/getblockcount` - Current block height
- `/getblockhash` - Block hash by height
- `/getblock` - Block details
- `/gettx` - Transaction details
- `/getbalance` - Address balance
- `/getaddresstxs` - Address transactions
- `/getlasttxs` - Latest transactions
- `/getdistribution` - Rich list
- `/getbasicstats` - Network stats
- `/getsummary` - Full network summary
- `/getmasternodelist` - Masternode list (HTH)
- `/getmasternodecount` - Masternode count (HTH)

## Design

The explorer uses the WATTxchange visual identity:
- Dark theme (#0a0a0a background)
- Dynamic accent colors per chain
- Responsive design with Tailwind CSS
- Modern card-based UI

## License

MIT License - WATTxchange Team
