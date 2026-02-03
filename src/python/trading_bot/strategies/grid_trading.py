import time
import logging
import asyncio
import math
from typing import Dict, List, Optional, Any
from base_strategy import BaseStrategy

class GridTradingStrategy(BaseStrategy):
    """
    Grid Trading Strategy
    
    Creates a grid of buy and sell orders at regular price intervals
    to profit from price oscillations within a range.
    """
    
    @classmethod
    def get_strategy_id(cls) -> str:
        return "grid_trading"
    
    @classmethod
    def get_strategy_name(cls) -> str:
        return "Grid Trading"
    
    @classmethod
    def get_strategy_description(cls) -> str:
        return (
            "Creates a grid of buy and sell orders at regular price intervals. "
            "Profits from price oscillations within a range by buying low and selling high. "
            "Works best in sideways markets with regular price movements."
        )
    
    @classmethod
    def get_parameters_info(cls) -> Dict:
        return {
            "exchange_id": {
                "type": "string",
                "description": "Exchange to trade on",
                "required": True
            },
            "symbol": {
                "type": "string",
                "description": "Market symbol to trade (e.g., BTC/USDT)",
                "required": True
            },
            "lower_price": {
                "type": "float",
                "description": "Lower price boundary for the grid",
                "required": True
            },
            "upper_price": {
                "type": "float",
                "description": "Upper price boundary for the grid",
                "required": True
            },
            "grid_levels": {
                "type": "integer",
                "description": "Number of grid levels",
                "default": 10,
                "min": 2,
                "max": 100
            },
            "total_investment": {
                "type": "float",
                "description": "Total investment amount in quote currency",
                "required": True
            },
            "tick_interval": {
                "type": "integer",
                "description": "Interval between strategy updates in seconds",
                "default": 60,
                "min": 10
            }
        }
    
    @classmethod
    def get_required_exchanges(cls) -> List[str]:
        return []  # Any exchange is fine
    
    @classmethod
    def get_required_markets(cls) -> List[str]:
        return []  # Any market is fine
    
    def __init__(self, exchange_manager: Any, parameters: Dict = None):
        super().__init__(exchange_manager, parameters)
        
        # Validate required parameters
        required_params = ["exchange_id", "symbol", "lower_price", "upper_price", "total_investment"]
        for param in required_params:
            if param not in self.parameters:
                raise ValueError(f"Missing required parameter: {param}")
        
        # Set default parameters if not provided
        self.parameters.setdefault("grid_levels", 10)
        self.parameters.setdefault("tick_interval", 60)
        
        # Initialize strategy state
        self.grid_orders = []
        self.order_status = {}
        self.last_price = None
    
    async def on_start(self) -> None:
        """
        Called when the strategy starts
        """
        self.logger.info(f"Starting Grid Trading strategy for {self.parameters['symbol']} on {self.parameters['exchange_id']}")
        
        # Calculate grid levels
        await self.calculate_grid_levels()
        
        # Create initial grid orders
        await self.create_grid_orders()
    
    async def on_stop(self) -> None:
        """
        Called when the strategy stops
        """
        self.logger.info("Stopping Grid Trading strategy")
        
        # Cancel all open orders
        await self.cancel_all_orders()
    
    async def tick(self) -> None:
        """
        Called on each strategy tick
        """
        # Update order status
        await self.update_order_status()
        
        # Check if any orders need to be replaced
        await self.check_and_replace_filled_orders()
        
        # Log current status
        await self.log_status()
    
    async def calculate_grid_levels(self) -> None:
        """
        Calculate price levels for the grid
        """
        lower_price = self.parameters["lower_price"]
        upper_price = self.parameters["upper_price"]
        grid_levels = self.parameters["grid_levels"]
        
        if lower_price >= upper_price:
            raise ValueError("Lower price must be less than upper price")
        
        # Calculate price step
        price_range = upper_price - lower_price
        price_step = price_range / (grid_levels - 1)
        
        # Calculate grid prices
        self.grid_prices = [lower_price + (i * price_step) for i in range(grid_levels)]
        
        # Calculate order size
        total_investment = self.parameters["total_investment"]
        self.order_size = total_investment / grid_levels
        
        self.logger.info(f"Grid calculated with {grid_levels} levels from {lower_price} to {upper_price}")
        self.logger.info(f"Price step: {price_step}, Order size: {self.order_size}")
    
    async def create_grid_orders(self) -> None:
        """
        Create initial grid orders
        """
        exchange_id = self.parameters["exchange_id"]
        symbol = self.parameters["symbol"]
        
        # Get current market price
        ticker = await self.exchange_manager.fetch_ticker(exchange_id, symbol)
        if not ticker:
            self.logger.error(f"Failed to fetch ticker for {symbol}")
            return
        
        current_price = ticker.get("last", 0)
        if current_price <= 0:
            self.logger.error(f"Invalid current price: {current_price}")
            return
        
        self.last_price = current_price
        
        # Create buy orders below current price
        for price in self.grid_prices:
            if price < current_price:
                # Calculate amount in base currency
                amount = self.order_size / price
                
                # Create buy order
                order = await self.exchange_manager.create_order(
                    exchange_id=exchange_id,
                    symbol=symbol,
                    order_type="limit",
                    side="buy",
                    amount=amount,
                    price=price
                )
                
                if order:
                    self.grid_orders.append({
                        "id": order.get("id"),
                        "price": price,
                        "side": "buy",
                        "status": "open"
                    })
                    self.logger.info(f"Created buy order at price {price}")
        
        # Create sell orders above current price
        for price in self.grid_prices:
            if price > current_price:
                # Calculate amount in base currency
                amount = self.order_size / price
                
                # Create sell order
                order = await self.exchange_manager.create_order(
                    exchange_id=exchange_id,
                    symbol=symbol,
                    order_type="limit",
                    side="sell",
                    amount=amount,
                    price=price
                )
                
                if order:
                    self.grid_orders.append({
                        "id": order.get("id"),
                        "price": price,
                        "side": "sell",
                        "status": "open"
                    })
                    self.logger.info(f"Created sell order at price {price}")
    
    async def update_order_status(self) -> None:
        """
        Update the status of all grid orders
        """
        exchange_id = self.parameters["exchange_id"]
        symbol = self.parameters["symbol"]
        
        # Fetch open orders
        open_orders = await self.exchange_manager.fetch_open_orders(exchange_id, symbol)
        
        # Update order status
        open_order_ids = [order.get("id") for order in open_orders]
        
        for order in self.grid_orders:
            if order["id"] in open_order_ids:
                order["status"] = "open"
            else:
                # If not in open orders, check if it was filled
                if order["status"] == "open":
                    order_details = await self.exchange_manager.fetch_order(
                        exchange_id=exchange_id,
                        order_id=order["id"],
                        symbol=symbol
                    )
                    
                    if order_details and order_details.get("status") == "closed":
                        order["status"] = "filled"
                        self.logger.info(f"{order['side'].capitalize()} order filled at price {order['price']}")
                        
                        # Update performance metrics
                        if order["side"] == "sell":
                            # For sell orders, we made a profit if we sold higher than we bought
                            profit = order["price"] - self.last_price
                            self.update_performance(profit, profit > 0)
    
    async def check_and_replace_filled_orders(self) -> None:
        """
        Check for filled orders and replace them with new orders on the opposite side
        """
        exchange_id = self.parameters["exchange_id"]
        symbol = self.parameters["symbol"]
        
        for order in self.grid_orders:
            if order["status"] == "filled":
                # Create a new order on the opposite side
                new_side = "sell" if order["side"] == "buy" else "buy"
                price = order["price"]
                
                # Calculate amount in base currency
                amount = self.order_size / price
                
                # Create new order
                new_order = await self.exchange_manager.create_order(
                    exchange_id=exchange_id,
                    symbol=symbol,
                    order_type="limit",
                    side=new_side,
                    amount=amount,
                    price=price
                )
                
                if new_order:
                    # Update the order in our grid
                    order["id"] = new_order.get("id")
                    order["side"] = new_side
                    order["status"] = "open"
                    
                    self.logger.info(f"Replaced filled {order['side']} order with new {new_side} order at price {price}")
    
    async def cancel_all_orders(self) -> None:
        """
        Cancel all open grid orders
        """
        exchange_id = self.parameters["exchange_id"]
        symbol = self.parameters["symbol"]
        
        for order in self.grid_orders:
            if order["status"] == "open":
                await self.exchange_manager.cancel_order(
                    exchange_id=exchange_id,
                    order_id=order["id"],
                    symbol=symbol
                )
                self.logger.info(f"Cancelled {order['side']} order at price {order['price']}")
    
    async def log_status(self) -> None:
        """
        Log the current status of the strategy
        """
        open_buys = sum(1 for order in self.grid_orders if order["status"] == "open" and order["side"] == "buy")
        open_sells = sum(1 for order in self.grid_orders if order["status"] == "open" and order["side"] == "sell")
        filled_orders = sum(1 for order in self.grid_orders if order["status"] == "filled")
        
        self.logger.info(f"Grid status: {open_buys} open buys, {open_sells} open sells, {filled_orders} filled orders")
        self.logger.info(f"Performance: {self.performance['profit_loss']:.8f} profit, {self.performance['win_rate']:.2f}% win rate")