# WATTxchange Trading Bot
# Version: 1.0.0

from .config import TradingBotConfig, ExchangeConfig
from .exchange_manager import exchange_manager
from .strategy_manager import strategy_manager
from .base_strategy import BaseStrategy

__version__ = "1.0.0"