import os
import time
import json
import logging
import ccxt
import asyncio
from typing import Dict, List, Optional, Any, Union
from config import ExchangeConfig, PermissionLevel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("exchange_manager")

class ExchangeManager:
    """
    Manages connections to multiple cryptocurrency exchanges
    """
    def __init__(self):
        self.exchanges: Dict[str, ccxt.Exchange] = {}
        self.exchange_configs: Dict[str, ExchangeConfig] = {}
        self.last_rate_limit_reset: Dict[str, float] = {}
    
    def add_exchange(self, config: ExchangeConfig) -> bool:
        """
        Add a new exchange connection
        
        Args:
            config: Exchange configuration
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if the exchange is supported by ccxt
            if not hasattr(ccxt, config.exchange_id):
                logger.error(f"Exchange {config.exchange_id} is not supported by ccxt")
                return False
            
            # Special handling for TradeOgre which isn't in ccxt
            if config.exchange_id == "tradeogre":
                from custom_exchanges.tradeogre import TradeOgre
                exchange_class = TradeOgre
            else:
                exchange_class = getattr(ccxt, config.exchange_id)
            
            # Create exchange instance
            exchange_params = {
                'apiKey': config.api_key,
                'secret': config.api_secret,
                'enableRateLimit': True,
            }
            
            # Add password if provided (some exchanges require it)
            if config.password:
                exchange_params['password'] = config.password
            
            # Add any additional parameters
            exchange_params.update(config.additional_params)
            
            # Create the exchange instance
            exchange = exchange_class(exchange_params)
            
            # Set sandbox mode if test_mode is enabled
            if config.test_mode and hasattr(exchange, 'set_sandbox_mode'):
                exchange.set_sandbox_mode(True)
            
            # Store the exchange and its configuration
            self.exchanges[config.exchange_id] = exchange
            self.exchange_configs[config.exchange_id] = config
            self.last_rate_limit_reset[config.exchange_id] = time.time()
            
            logger.info(f"Added exchange: {config.exchange_id} ({config.name})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add exchange {config.exchange_id}: {str(e)}")
            return False
    
    def remove_exchange(self, exchange_id: str) -> bool:
        """
        Remove an exchange connection
        
        Args:
            exchange_id: ID of the exchange to remove
            
        Returns:
            bool: True if successful, False otherwise
        """
        if exchange_id in self.exchanges:
            del self.exchanges[exchange_id]
            del self.exchange_configs[exchange_id]
            if exchange_id in self.last_rate_limit_reset:
                del self.last_rate_limit_reset[exchange_id]
            logger.info(f"Removed exchange: {exchange_id}")
            return True
        return False
    
    def get_exchange(self, exchange_id: str) -> Optional[ccxt.Exchange]:
        """
        Get an exchange instance by ID
        
        Args:
            exchange_id: ID of the exchange
            
        Returns:
            Exchange instance or None if not found
        """
        return self.exchanges.get(exchange_id)
    
    def get_all_exchanges(self) -> Dict[str, ccxt.Exchange]:
        """
        Get all exchange instances
        
        Returns:
            Dict of exchange ID to exchange instance
        """
        return self.exchanges
    
    def get_exchange_config(self, exchange_id: str) -> Optional[ExchangeConfig]:
        """
        Get an exchange configuration by ID
        
        Args:
            exchange_id: ID of the exchange
            
        Returns:
            Exchange configuration or None if not found
        """
        return self.exchange_configs.get(exchange_id)
    
    def check_permission(self, exchange_id: str, required_level: PermissionLevel) -> bool:
        """
        Check if the exchange has the required permission level
        
        Args:
            exchange_id: ID of the exchange
            required_level: Required permission level
            
        Returns:
            bool: True if the exchange has the required permission level
        """
        config = self.exchange_configs.get(exchange_id)
        if not config:
            return False
        
        # Permission hierarchy: read_only < read_write < read_write_withdraw
        permission_levels = {
            "read_only": 0,
            "read_write": 1,
            "read_write_withdraw": 2
        }
        
        return permission_levels.get(config.permission_level, 0) >= permission_levels.get(required_level, 0)
    
    async def fetch_balance(self, exchange_id: str) -> Dict:
        """
        Fetch account balance from an exchange
        
        Args:
            exchange_id: ID of the exchange
            
        Returns:
            Dict: Account balance
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return {}
        
        if not self.check_permission(exchange_id, "read_only"):
            logger.error(f"Exchange {exchange_id} does not have read_only permission")
            return {}
        
        try:
            return await exchange.fetch_balance()
        except Exception as e:
            logger.error(f"Failed to fetch balance from {exchange_id}: {str(e)}")
            return {}
    
    async def fetch_markets(self, exchange_id: str) -> List[Dict]:
        """
        Fetch markets from an exchange
        
        Args:
            exchange_id: ID of the exchange
            
        Returns:
            List[Dict]: Markets
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return []
        
        try:
            return await exchange.fetch_markets()
        except Exception as e:
            logger.error(f"Failed to fetch markets from {exchange_id}: {str(e)}")
            return []
    
    async def fetch_ticker(self, exchange_id: str, symbol: str) -> Dict:
        """
        Fetch ticker for a symbol from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Symbol to fetch ticker for
            
        Returns:
            Dict: Ticker
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return {}
        
        try:
            return await exchange.fetch_ticker(symbol)
        except Exception as e:
            logger.error(f"Failed to fetch ticker for {symbol} from {exchange_id}: {str(e)}")
            return {}
    
    async def create_order(
        self, 
        exchange_id: str, 
        symbol: str, 
        order_type: str, 
        side: str, 
        amount: float, 
        price: Optional[float] = None,
        params: Dict = None
    ) -> Dict:
        """
        Create an order on an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Symbol to create order for
            order_type: Order type (limit, market)
            side: Order side (buy, sell)
            amount: Order amount
            price: Order price (required for limit orders)
            params: Additional parameters
            
        Returns:
            Dict: Order details
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return {}
        
        if not self.check_permission(exchange_id, "read_write"):
            logger.error(f"Exchange {exchange_id} does not have read_write permission")
            return {}
        
        params = params or {}
        
        try:
            return await exchange.create_order(symbol, order_type, side, amount, price, params)
        except Exception as e:
            logger.error(f"Failed to create {order_type} {side} order for {symbol} on {exchange_id}: {str(e)}")
            return {}
    
    async def cancel_order(self, exchange_id: str, order_id: str, symbol: Optional[str] = None) -> Dict:
        """
        Cancel an order on an exchange
        
        Args:
            exchange_id: ID of the exchange
            order_id: ID of the order to cancel
            symbol: Symbol of the order (required by some exchanges)
            
        Returns:
            Dict: Cancellation details
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return {}
        
        if not self.check_permission(exchange_id, "read_write"):
            logger.error(f"Exchange {exchange_id} does not have read_write permission")
            return {}
        
        try:
            return await exchange.cancel_order(order_id, symbol)
        except Exception as e:
            logger.error(f"Failed to cancel order {order_id} on {exchange_id}: {str(e)}")
            return {}
    
    async def withdraw(
        self, 
        exchange_id: str, 
        currency: str, 
        amount: float, 
        address: str, 
        tag: Optional[str] = None, 
        params: Dict = None
    ) -> Dict:
        """
        Withdraw funds from an exchange
        
        Args:
            exchange_id: ID of the exchange
            currency: Currency to withdraw
            amount: Amount to withdraw
            address: Withdrawal address
            tag: Address tag (for currencies like XRP)
            params: Additional parameters
            
        Returns:
            Dict: Withdrawal details
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return {}
        
        if not self.check_permission(exchange_id, "read_write_withdraw"):
            logger.error(f"Exchange {exchange_id} does not have read_write_withdraw permission")
            return {}
        
        params = params or {}
        
        try:
            return await exchange.withdraw(currency, amount, address, tag, params)
        except Exception as e:
            logger.error(f"Failed to withdraw {amount} {currency} to {address} from {exchange_id}: {str(e)}")
            return {}
    
    async def fetch_order(self, exchange_id: str, order_id: str, symbol: Optional[str] = None) -> Dict:
        """
        Fetch an order from an exchange
        
        Args:
            exchange_id: ID of the exchange
            order_id: ID of the order to fetch
            symbol: Symbol of the order (required by some exchanges)
            
        Returns:
            Dict: Order details
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return {}
        
        if not self.check_permission(exchange_id, "read_only"):
            logger.error(f"Exchange {exchange_id} does not have read_only permission")
            return {}
        
        try:
            return await exchange.fetch_order(order_id, symbol)
        except Exception as e:
            logger.error(f"Failed to fetch order {order_id} from {exchange_id}: {str(e)}")
            return {}
    
    async def fetch_orders(self, exchange_id: str, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch orders from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Symbol to fetch orders for
            since: Timestamp to fetch orders since
            limit: Maximum number of orders to fetch
            
        Returns:
            List[Dict]: Orders
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return []
        
        if not self.check_permission(exchange_id, "read_only"):
            logger.error(f"Exchange {exchange_id} does not have read_only permission")
            return []
        
        try:
            return await exchange.fetch_orders(symbol, since, limit)
        except Exception as e:
            logger.error(f"Failed to fetch orders from {exchange_id}: {str(e)}")
            return []
    
    async def fetch_open_orders(self, exchange_id: str, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch open orders from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Symbol to fetch orders for
            since: Timestamp to fetch orders since
            limit: Maximum number of orders to fetch
            
        Returns:
            List[Dict]: Open orders
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return []
        
        if not self.check_permission(exchange_id, "read_only"):
            logger.error(f"Exchange {exchange_id} does not have read_only permission")
            return []
        
        try:
            return await exchange.fetch_open_orders(symbol, since, limit)
        except Exception as e:
            logger.error(f"Failed to fetch open orders from {exchange_id}: {str(e)}")
            return []
    
    async def fetch_closed_orders(self, exchange_id: str, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch closed orders from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Symbol to fetch orders for
            since: Timestamp to fetch orders since
            limit: Maximum number of orders to fetch
            
        Returns:
            List[Dict]: Closed orders
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return []
        
        if not self.check_permission(exchange_id, "read_only"):
            logger.error(f"Exchange {exchange_id} does not have read_only permission")
            return []
        
        try:
            return await exchange.fetch_closed_orders(symbol, since, limit)
        except Exception as e:
            logger.error(f"Failed to fetch closed orders from {exchange_id}: {str(e)}")
            return []
    
    async def fetch_my_trades(self, exchange_id: str, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch trades from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Symbol to fetch trades for
            since: Timestamp to fetch trades since
            limit: Maximum number of trades to fetch
            
        Returns:
            List[Dict]: Trades
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return []
        
        if not self.check_permission(exchange_id, "read_only"):
            logger.error(f"Exchange {exchange_id} does not have read_only permission")
            return []
        
        try:
            return await exchange.fetch_my_trades(symbol, since, limit)
        except Exception as e:
            logger.error(f"Failed to fetch trades from {exchange_id}: {str(e)}")
            return []
    
    async def test_connection(self, exchange_id: str) -> bool:
        """
        Test connection to an exchange
        
        Args:
            exchange_id: ID of the exchange
            
        Returns:
            bool: True if connection is successful
        """
        exchange = self.get_exchange(exchange_id)
        if not exchange:
            logger.error(f"Exchange {exchange_id} not found")
            return False
        
        try:
            # Try to fetch markets as a simple test
            await exchange.load_markets()
            logger.info(f"Connection to {exchange_id} successful")
            return True
        except Exception as e:
            logger.error(f"Connection to {exchange_id} failed: {str(e)}")
            return False
    
    def get_supported_exchanges(self) -> List[str]:
        """
        Get a list of all exchanges supported by ccxt
        
        Returns:
            List[str]: List of exchange IDs
        """
        return ccxt.exchanges

# Create a global instance of the exchange manager
exchange_manager = ExchangeManager()