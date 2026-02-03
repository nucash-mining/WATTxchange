import time
import logging
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from base_strategy import BaseStrategy

class ArbitrageStrategy(BaseStrategy):
    """
    Arbitrage Trading Strategy
    
    Exploits price differences between the same asset on different exchanges
    by buying on the exchange with the lower price and selling on the exchange
    with the higher price.
    """
    
    @classmethod
    def get_strategy_id(cls) -> str:
        return "arbitrage"
    
    @classmethod
    def get_strategy_name(cls) -> str:
        return "Cross-Exchange Arbitrage"
    
    @classmethod
    def get_strategy_description(cls) -> str:
        return (
            "Exploits price differences between the same asset on different exchanges. "
            "Buys on the exchange with the lower price and sells on the exchange with the higher price. "
            "Requires at least two exchanges with the same trading pair."
        )
    
    @classmethod
    def get_parameters_info(cls) -> Dict:
        return {
            "symbol": {
                "type": "string",
                "description": "Trading pair to arbitrage (e.g., BTC/USDT)",
                "required": True
            },
            "exchanges": {
                "type": "array",
                "description": "List of exchange IDs to use for arbitrage",
                "required": True,
                "min_length": 2
            },
            "min_profit_percent": {
                "type": "float",
                "description": "Minimum profit percentage to execute arbitrage",
                "default": 1.0,
                "min": 0.1
            },
            "max_order_size": {
                "type": "float",
                "description": "Maximum order size in base currency",
                "required": True
            },
            "tick_interval": {
                "type": "integer",
                "description": "Interval between strategy updates in seconds",
                "default": 10,
                "min": 1
            }
        }
    
    @classmethod
    def get_required_exchanges(cls) -> List[str]:
        return []  # Any exchanges are fine, but need at least 2
    
    @classmethod
    def get_required_markets(cls) -> List[str]:
        return []  # Any market is fine
    
    def __init__(self, exchange_manager: Any, parameters: Dict = None):
        super().__init__(exchange_manager, parameters)
        
        # Validate required parameters
        required_params = ["symbol", "exchanges", "max_order_size"]
        for param in required_params:
            if param not in self.parameters:
                raise ValueError(f"Missing required parameter: {param}")
        
        # Validate exchanges
        if len(self.parameters["exchanges"]) < 2:
            raise ValueError("At least two exchanges are required for arbitrage")
        
        # Set default parameters if not provided
        self.parameters.setdefault("min_profit_percent", 1.0)
        self.parameters.setdefault("tick_interval", 10)
        
        # Initialize strategy state
        self.last_prices = {}
        self.active_arbitrages = []
    
    async def on_start(self) -> None:
        """
        Called when the strategy starts
        """
        self.logger.info(f"Starting Arbitrage strategy for {self.parameters['symbol']} on {', '.join(self.parameters['exchanges'])}")
        
        # Check if all exchanges support the symbol
        for exchange_id in self.parameters["exchanges"]:
            markets = await self.exchange_manager.fetch_markets(exchange_id)
            symbols = [market["symbol"] for market in markets]
            
            if self.parameters["symbol"] not in symbols:
                self.logger.warning(f"Exchange {exchange_id} does not support {self.parameters['symbol']}")
    
    async def on_stop(self) -> None:
        """
        Called when the strategy stops
        """
        self.logger.info("Stopping Arbitrage strategy")
        
        # Cancel any active arbitrage orders
        for arbitrage in self.active_arbitrages:
            if arbitrage["status"] == "active":
                await self.cancel_arbitrage(arbitrage)
    
    async def tick(self) -> None:
        """
        Called on each strategy tick
        """
        # Update prices for all exchanges
        await self.update_prices()
        
        # Find arbitrage opportunities
        opportunities = self.find_arbitrage_opportunities()
        
        # Execute arbitrage if profitable
        for opportunity in opportunities:
            await self.execute_arbitrage(opportunity)
        
        # Update active arbitrages
        await self.update_active_arbitrages()
        
        # Log current status
        await self.log_status()
    
    async def update_prices(self) -> None:
        """
        Update prices for all exchanges
        """
        symbol = self.parameters["symbol"]
        
        for exchange_id in self.parameters["exchanges"]:
            try:
                ticker = await self.exchange_manager.fetch_ticker(exchange_id, symbol)
                
                if ticker:
                    self.last_prices[exchange_id] = {
                        "bid": ticker.get("bid", 0),
                        "ask": ticker.get("ask", 0),
                        "last": ticker.get("last", 0),
                        "timestamp": time.time()
                    }
                    self.logger.debug(f"{exchange_id} {symbol}: Bid={ticker.get('bid')}, Ask={ticker.get('ask')}")
            
            except Exception as e:
                self.logger.error(f"Error fetching price for {symbol} on {exchange_id}: {str(e)}")
    
    def find_arbitrage_opportunities(self) -> List[Dict]:
        """
        Find arbitrage opportunities between exchanges
        
        Returns:
            List[Dict]: List of arbitrage opportunities
        """
        opportunities = []
        symbol = self.parameters["symbol"]
        min_profit_percent = self.parameters["min_profit_percent"]
        
        # Check all exchange pairs
        exchanges = self.parameters["exchanges"]
        for i in range(len(exchanges)):
            for j in range(i + 1, len(exchanges)):
                exchange1 = exchanges[i]
                exchange2 = exchanges[j]
                
                # Skip if we don't have prices for both exchanges
                if exchange1 not in self.last_prices or exchange2 not in self.last_prices:
                    continue
                
                # Get bid and ask prices
                bid1 = self.last_prices[exchange1]["bid"]
                ask1 = self.last_prices[exchange1]["ask"]
                bid2 = self.last_prices[exchange2]["bid"]
                ask2 = self.last_prices[exchange2]["ask"]
                
                # Check if we can buy on exchange1 and sell on exchange2
                if bid2 > ask1:
                    profit_percent = ((bid2 / ask1) - 1) * 100
                    
                    if profit_percent >= min_profit_percent:
                        opportunities.append({
                            "buy_exchange": exchange1,
                            "sell_exchange": exchange2,
                            "buy_price": ask1,
                            "sell_price": bid2,
                            "profit_percent": profit_percent,
                            "symbol": symbol
                        })
                        self.logger.info(f"Found arbitrage opportunity: Buy on {exchange1} at {ask1}, Sell on {exchange2} at {bid2}, Profit: {profit_percent:.2f}%")
                
                # Check if we can buy on exchange2 and sell on exchange1
                if bid1 > ask2:
                    profit_percent = ((bid1 / ask2) - 1) * 100
                    
                    if profit_percent >= min_profit_percent:
                        opportunities.append({
                            "buy_exchange": exchange2,
                            "sell_exchange": exchange1,
                            "buy_price": ask2,
                            "sell_price": bid1,
                            "profit_percent": profit_percent,
                            "symbol": symbol
                        })
                        self.logger.info(f"Found arbitrage opportunity: Buy on {exchange2} at {ask2}, Sell on {exchange1} at {bid1}, Profit: {profit_percent:.2f}%")
        
        return opportunities
    
    async def execute_arbitrage(self, opportunity: Dict) -> None:
        """
        Execute an arbitrage opportunity
        
        Args:
            opportunity: Arbitrage opportunity details
        """
        # Check if we have permission to trade on both exchanges
        buy_exchange = opportunity["buy_exchange"]
        sell_exchange = opportunity["sell_exchange"]
        
        if not self.exchange_manager.check_permission(buy_exchange, "read_write"):
            self.logger.warning(f"No permission to trade on {buy_exchange}")
            return
        
        if not self.exchange_manager.check_permission(sell_exchange, "read_write"):
            self.logger.warning(f"No permission to trade on {sell_exchange}")
            return
        
        # Calculate order size
        max_order_size = self.parameters["max_order_size"]
        
        # Check balances on both exchanges
        buy_balance = await self.exchange_manager.fetch_balance(buy_exchange)
        sell_balance = await self.exchange_manager.fetch_balance(sell_exchange)
        
        symbol = opportunity["symbol"]
        base_currency, quote_currency = symbol.split('/')
        
        # Check if we have enough quote currency on buy exchange
        quote_balance = buy_balance.get(quote_currency, {}).get("free", 0)
        max_buy_amount = quote_balance / opportunity["buy_price"]
        
        # Check if we have enough base currency on sell exchange
        base_balance = sell_balance.get(base_currency, {}).get("free", 0)
        
        # Use the minimum of all constraints
        order_size = min(max_order_size, max_buy_amount, base_balance)
        
        if order_size <= 0:
            self.logger.warning(f"Insufficient balance for arbitrage")
            return
        
        # Create buy order
        buy_order = await self.exchange_manager.create_order(
            exchange_id=buy_exchange,
            symbol=symbol,
            order_type="limit",
            side="buy",
            amount=order_size,
            price=opportunity["buy_price"]
        )
        
        if not buy_order:
            self.logger.error(f"Failed to create buy order on {buy_exchange}")
            return
        
        # Create sell order
        sell_order = await self.exchange_manager.create_order(
            exchange_id=sell_exchange,
            symbol=symbol,
            order_type="limit",
            side="sell",
            amount=order_size,
            price=opportunity["sell_price"]
        )
        
        if not sell_order:
            self.logger.error(f"Failed to create sell order on {sell_exchange}")
            
            # Cancel buy order if sell order fails
            await self.exchange_manager.cancel_order(
                exchange_id=buy_exchange,
                order_id=buy_order.get("id"),
                symbol=symbol
            )
            
            return
        
        # Record the arbitrage
        arbitrage = {
            "id": f"arb_{time.time()}",
            "buy_exchange": buy_exchange,
            "sell_exchange": sell_exchange,
            "buy_order_id": buy_order.get("id"),
            "sell_order_id": sell_order.get("id"),
            "symbol": symbol,
            "amount": order_size,
            "buy_price": opportunity["buy_price"],
            "sell_price": opportunity["sell_price"],
            "profit_percent": opportunity["profit_percent"],
            "status": "active",
            "timestamp": time.time()
        }
        
        self.active_arbitrages.append(arbitrage)
        self.logger.info(f"Executed arbitrage: {arbitrage['id']}")
    
    async def update_active_arbitrages(self) -> None:
        """
        Update the status of active arbitrages
        """
        for arbitrage in self.active_arbitrages:
            if arbitrage["status"] != "active":
                continue
            
            # Check buy order status
            buy_order = await self.exchange_manager.fetch_order(
                exchange_id=arbitrage["buy_exchange"],
                order_id=arbitrage["buy_order_id"],
                symbol=arbitrage["symbol"]
            )
            
            # Check sell order status
            sell_order = await self.exchange_manager.fetch_order(
                exchange_id=arbitrage["sell_exchange"],
                order_id=arbitrage["sell_order_id"],
                symbol=arbitrage["symbol"]
            )
            
            # If both orders are filled, the arbitrage is complete
            if (buy_order.get("status") == "closed" and 
                sell_order.get("status") == "closed"):
                
                arbitrage["status"] = "completed"
                
                # Calculate actual profit
                buy_cost = buy_order.get("cost", arbitrage["amount"] * arbitrage["buy_price"])
                sell_cost = sell_order.get("cost", arbitrage["amount"] * arbitrage["sell_price"])
                profit = sell_cost - buy_cost
                
                arbitrage["actual_profit"] = profit
                arbitrage["actual_profit_percent"] = (profit / buy_cost) * 100
                
                self.logger.info(f"Arbitrage {arbitrage['id']} completed with profit: {profit} ({arbitrage['actual_profit_percent']:.2f}%)")
                
                # Update performance metrics
                self.update_performance(profit, profit > 0)
            
            # If either order is cancelled, the arbitrage failed
            elif (buy_order.get("status") == "canceled" or 
                  sell_order.get("status") == "canceled"):
                
                arbitrage["status"] = "failed"
                self.logger.warning(f"Arbitrage {arbitrage['id']} failed: order was cancelled")
                
                # Cancel the other order if it's still open
                if buy_order.get("status") != "canceled":
                    await self.exchange_manager.cancel_order(
                        exchange_id=arbitrage["buy_exchange"],
                        order_id=arbitrage["buy_order_id"],
                        symbol=arbitrage["symbol"]
                    )
                
                if sell_order.get("status") != "canceled":
                    await self.exchange_manager.cancel_order(
                        exchange_id=arbitrage["sell_exchange"],
                        order_id=arbitrage["sell_order_id"],
                        symbol=arbitrage["symbol"]
                    )
    
    async def cancel_arbitrage(self, arbitrage: Dict) -> None:
        """
        Cancel an active arbitrage
        
        Args:
            arbitrage: Arbitrage details
        """
        # Cancel buy order
        await self.exchange_manager.cancel_order(
            exchange_id=arbitrage["buy_exchange"],
            order_id=arbitrage["buy_order_id"],
            symbol=arbitrage["symbol"]
        )
        
        # Cancel sell order
        await self.exchange_manager.cancel_order(
            exchange_id=arbitrage["sell_exchange"],
            order_id=arbitrage["sell_order_id"],
            symbol=arbitrage["symbol"]
        )
        
        arbitrage["status"] = "cancelled"
        self.logger.info(f"Cancelled arbitrage: {arbitrage['id']}")
    
    async def log_status(self) -> None:
        """
        Log the current status of the strategy
        """
        active_count = sum(1 for arb in self.active_arbitrages if arb["status"] == "active")
        completed_count = sum(1 for arb in self.active_arbitrages if arb["status"] == "completed")
        failed_count = sum(1 for arb in self.active_arbitrages if arb["status"] in ["failed", "cancelled"])
        
        self.logger.info(f"Arbitrage status: {active_count} active, {completed_count} completed, {failed_count} failed")
        
        if completed_count > 0:
            total_profit = sum(arb.get("actual_profit", 0) for arb in self.active_arbitrages if arb["status"] == "completed")
            avg_profit_percent = sum(arb.get("actual_profit_percent", 0) for arb in self.active_arbitrages if arb["status"] == "completed") / completed_count
            
            self.logger.info(f"Total profit: {total_profit:.8f}, Average profit: {avg_profit_percent:.2f}%")