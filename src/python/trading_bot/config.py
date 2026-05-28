import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Union, Literal

# Base directory for all trading bot data
BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = BASE_DIR / "configs"
LOGS_DIR = BASE_DIR / "logs"
STRATEGIES_DIR = BASE_DIR / "strategies"
DATA_DIR = BASE_DIR / "data"

# Create directories if they don't exist
for directory in [CONFIG_DIR, LOGS_DIR, STRATEGIES_DIR, DATA_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# API permission levels
PermissionLevel = Literal["read_only", "read_write", "read_write_withdraw"]

class ExchangeConfig:
    def __init__(
        self,
        exchange_id: str,
        name: str,
        api_key: str = "",
        api_secret: str = "",
        password: Optional[str] = None,
        permission_level: PermissionLevel = "read_only",
        enabled: bool = True,
        test_mode: bool = False,
        additional_params: Optional[Dict] = None
    ):
        self.exchange_id = exchange_id
        self.name = name
        self.api_key = api_key
        self.api_secret = api_secret
        self.password = password
        self.permission_level = permission_level
        self.enabled = enabled
        self.test_mode = test_mode
        self.additional_params = additional_params or {}
    
    def to_dict(self) -> Dict:
        return {
            "exchange_id": self.exchange_id,
            "name": self.name,
            "api_key": self.api_key,
            "api_secret": self.api_secret,
            "password": self.password,
            "permission_level": self.permission_level,
            "enabled": self.enabled,
            "test_mode": self.test_mode,
            "additional_params": self.additional_params
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ExchangeConfig':
        return cls(
            exchange_id=data["exchange_id"],
            name=data["name"],
            api_key=data.get("api_key", ""),
            api_secret=data.get("api_secret", ""),
            password=data.get("password"),
            permission_level=data.get("permission_level", "read_only"),
            enabled=data.get("enabled", True),
            test_mode=data.get("test_mode", False),
            additional_params=data.get("additional_params", {})
        )

class TradingBotConfig:
    def __init__(
        self,
        exchanges: List[ExchangeConfig] = None,
        active_strategy: Optional[str] = None,
        strategy_params: Optional[Dict] = None,
        global_settings: Optional[Dict] = None
    ):
        self.exchanges = exchanges or []
        self.active_strategy = active_strategy
        self.strategy_params = strategy_params or {}
        self.global_settings = global_settings or {
            "log_level": "INFO",
            "max_order_age_seconds": 60 * 60 * 24,  # 24 hours
            "default_order_refresh_time": 60,  # 1 minute
            "default_order_amount": 0.01,  # BTC
            "default_market": "BTC/USDT",
            "default_leverage": 1,
            "default_position_mode": "one-way",
            "default_slippage_tolerance": 0.01,  # 1%
        }
    
    def to_dict(self) -> Dict:
        return {
            "exchanges": [exchange.to_dict() for exchange in self.exchanges],
            "active_strategy": self.active_strategy,
            "strategy_params": self.strategy_params,
            "global_settings": self.global_settings
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'TradingBotConfig':
        return cls(
            exchanges=[ExchangeConfig.from_dict(exchange) for exchange in data.get("exchanges", [])],
            active_strategy=data.get("active_strategy"),
            strategy_params=data.get("strategy_params", {}),
            global_settings=data.get("global_settings", {})
        )
    
    def save(self, filename: str = "config.json") -> None:
        """Save the configuration to a JSON file"""
        config_path = CONFIG_DIR / filename
        with open(config_path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str = "config.json") -> 'TradingBotConfig':
        """Load the configuration from a JSON file"""
        config_path = CONFIG_DIR / filename
        if not config_path.exists():
            return cls()
        
        with open(config_path, 'r') as f:
            data = json.load(f)
        
        return cls.from_dict(data)
    
    def add_exchange(self, exchange: ExchangeConfig) -> None:
        """Add or update an exchange configuration"""
        for i, existing in enumerate(self.exchanges):
            if existing.exchange_id == exchange.exchange_id:
                self.exchanges[i] = exchange
                return
        self.exchanges.append(exchange)
    
    def remove_exchange(self, exchange_id: str) -> bool:
        """Remove an exchange configuration"""
        for i, exchange in enumerate(self.exchanges):
            if exchange.exchange_id == exchange_id:
                self.exchanges.pop(i)
                return True
        return False
    
    def get_exchange(self, exchange_id: str) -> Optional[ExchangeConfig]:
        """Get an exchange configuration by ID"""
        for exchange in self.exchanges:
            if exchange.exchange_id == exchange_id:
                return exchange
        return None

# Default supported exchanges
DEFAULT_EXCHANGES = [
    {
        "exchange_id": "xeggex",
        "name": "XeggeX",
        "api_key": "",
        "api_secret": "",
        "permission_level": "read_only",
        "enabled": True,
        "test_mode": False
    },
    {
        "exchange_id": "kraken",
        "name": "Kraken",
        "api_key": "",
        "api_secret": "",
        "permission_level": "read_only",
        "enabled": True,
        "test_mode": False
    },
    {
        "exchange_id": "binance",
        "name": "Binance",
        "api_key": "",
        "api_secret": "",
        "permission_level": "read_only",
        "enabled": True,
        "test_mode": False
    },
    {
        "exchange_id": "tradeogre",
        "name": "TradeOgre",
        "api_key": "",
        "api_secret": "",
        "permission_level": "read_only",
        "enabled": True,
        "test_mode": False
    }
]

def initialize_default_config():
    """Create a default configuration file if it doesn't exist"""
    config_path = CONFIG_DIR / "config.json"
    if not config_path.exists():
        config = TradingBotConfig(
            exchanges=[ExchangeConfig.from_dict(exchange) for exchange in DEFAULT_EXCHANGES]
        )
        config.save()
        return config
    return TradingBotConfig.load()

# Initialize default configuration
config = initialize_default_config()