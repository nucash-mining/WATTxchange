# WATTxchange Trading Bot

A Python-based trading bot for WATTxchange that supports multiple exchanges and trading strategies.

## Features

- Multi-exchange support via CCXT
- Custom exchange implementations (TradeOgre)
- Multiple trading strategies
- REST API for integration with the WATTxchange UI
- Configurable permission levels for exchange API keys
- Real-time monitoring and performance tracking

## Supported Exchanges

- XeggeX
- Kraken
- Binance
- TradeOgre
- And 100+ more via CCXT

## Included Strategies

- **Grid Trading**: Creates a grid of buy and sell orders at regular price intervals to profit from price oscillations within a range.
- **Cross-Exchange Arbitrage**: Exploits price differences between the same asset on different exchanges.

## Installation

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

The trading bot can be configured via the API or by directly editing the configuration files in the `configs` directory.

### Exchange Configuration

```json
{
  "exchange_id": "xeggex",
  "name": "XeggeX",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "permission_level": "read_only",
  "enabled": true,
  "test_mode": false
}
```

### Strategy Configuration

```json
{
  "strategy_id": "grid_trading",
  "parameters": {
    "exchange_id": "xeggex",
    "symbol": "BTC/USDT",
    "lower_price": 50000,
    "upper_price": 60000,
    "grid_levels": 10,
    "total_investment": 1000
  }
}
```

## Running the Bot

### API Server

```bash
python main.py --api --host 0.0.0.0 --port 8000
```

### Trading Bot

```bash
python main.py
```

## API Endpoints

### Exchanges

- `GET /exchanges` - Get all configured exchanges
- `GET /exchanges/{exchange_id}` - Get a specific exchange configuration
- `POST /exchanges` - Add a new exchange configuration
- `DELETE /exchanges/{exchange_id}` - Remove an exchange configuration
- `POST /exchanges/{exchange_id}/test` - Test connection to an exchange
- `GET /exchanges/{exchange_id}/balance` - Get balance for an exchange
- `GET /exchanges/{exchange_id}/markets` - Get markets for an exchange
- `GET /exchanges/{exchange_id}/ticker/{symbol}` - Get ticker for a symbol on an exchange
- `POST /exchanges/{exchange_id}/orders` - Create an order on an exchange
- `DELETE /exchanges/{exchange_id}/orders/{order_id}` - Cancel an order on an exchange
- `GET /exchanges/{exchange_id}/orders` - Get orders for an exchange

### Strategies

- `GET /strategies` - Get all available strategies
- `GET /strategies/{strategy_id}` - Get information about a specific strategy
- `POST /strategies/active` - Set the active strategy
- `POST /strategies/start` - Start the active strategy
- `POST /strategies/stop` - Stop the active strategy
- `GET /strategies/status` - Get the status of the active strategy

### Configuration

- `GET /config` - Get the current configuration
- `POST /config` - Update the configuration

### Supported Exchanges

- `GET /supported-exchanges` - Get a list of all exchanges supported by ccxt

## Security

- API keys are stored locally and never transmitted to external servers
- Permission levels control what operations can be performed with each API key:
  - `read_only`: Can only read data (balances, orders, etc.)
  - `read_write`: Can read data and create/cancel orders
  - `read_write_withdraw`: Can read data, create/cancel orders, and withdraw funds

## Adding Custom Strategies

1. Create a new Python file in the `strategies` directory
2. Implement a class that inherits from `BaseStrategy`
3. Implement all required methods
4. The strategy will be automatically loaded by the strategy manager

Example:

```python
from base_strategy import BaseStrategy

class MyCustomStrategy(BaseStrategy):
    @classmethod
    def get_strategy_id(cls) -> str:
        return "my_custom_strategy"
    
    @classmethod
    def get_strategy_name(cls) -> str:
        return "My Custom Strategy"
    
    @classmethod
    def get_strategy_description(cls) -> str:
        return "Description of my custom strategy"
    
    @classmethod
    def get_parameters_info(cls) -> Dict:
        return {
            "param1": {
                "type": "string",
                "description": "Parameter 1",
                "required": True
            },
            "param2": {
                "type": "float",
                "description": "Parameter 2",
                "default": 1.0
            }
        }
    
    async def tick(self) -> None:
        # Implement your strategy logic here
        pass
```

## License

MIT