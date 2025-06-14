import os
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import TradingBotConfig, ExchangeConfig, PermissionLevel
from exchange_manager import exchange_manager
from strategy_manager import strategy_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api")

# Create FastAPI app
app = FastAPI(
    title="WATTxchange Trading Bot API",
    description="API for managing the WATTxchange trading bot",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configuration
config = TradingBotConfig.load()

# Pydantic models for API requests and responses
class ExchangeConfigModel(BaseModel):
    exchange_id: str
    name: str
    api_key: str
    api_secret: str
    password: Optional[str] = None
    permission_level: PermissionLevel = "read_only"
    enabled: bool = True
    test_mode: bool = False
    additional_params: Dict = Field(default_factory=dict)

class StrategyConfigModel(BaseModel):
    strategy_id: str
    parameters: Dict = Field(default_factory=dict)

class OrderModel(BaseModel):
    exchange_id: str
    symbol: str
    order_type: str
    side: str
    amount: float
    price: Optional[float] = None
    params: Dict = Field(default_factory=dict)

# API routes
@app.get("/")
async def root():
    return {"message": "WATTxchange Trading Bot API"}

# Exchange routes
@app.get("/exchanges")
async def get_exchanges():
    """Get all configured exchanges"""
    return [exchange.to_dict() for exchange in config.exchanges]

@app.get("/exchanges/{exchange_id}")
async def get_exchange(exchange_id: str):
    """Get a specific exchange configuration"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    return exchange.to_dict()

@app.post("/exchanges")
async def add_exchange(exchange_config: ExchangeConfigModel):
    """Add a new exchange configuration"""
    # Create exchange config
    exchange = ExchangeConfig(
        exchange_id=exchange_config.exchange_id,
        name=exchange_config.name,
        api_key=exchange_config.api_key,
        api_secret=exchange_config.api_secret,
        password=exchange_config.password,
        permission_level=exchange_config.permission_level,
        enabled=exchange_config.enabled,
        test_mode=exchange_config.test_mode,
        additional_params=exchange_config.additional_params
    )
    
    # Add to config
    config.add_exchange(exchange)
    config.save()
    
    # Add to exchange manager
    success = exchange_manager.add_exchange(exchange)
    
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to add exchange {exchange_config.exchange_id}")
    
    return {"message": f"Exchange {exchange_config.exchange_id} added successfully"}

@app.delete("/exchanges/{exchange_id}")
async def remove_exchange(exchange_id: str):
    """Remove an exchange configuration"""
    # Remove from config
    success = config.remove_exchange(exchange_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    config.save()
    
    # Remove from exchange manager
    exchange_manager.remove_exchange(exchange_id)
    
    return {"message": f"Exchange {exchange_id} removed successfully"}

@app.post("/exchanges/{exchange_id}/test")
async def test_exchange_connection(exchange_id: str):
    """Test connection to an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Test connection
    success = await exchange_manager.test_connection(exchange_id)
    
    if not success:
        raise HTTPException(status_code=400, detail=f"Connection to {exchange_id} failed")
    
    return {"message": f"Connection to {exchange_id} successful"}

@app.get("/exchanges/{exchange_id}/balance")
async def get_exchange_balance(exchange_id: str):
    """Get balance for an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Check permission
    if not exchange_manager.check_permission(exchange_id, "read_only"):
        raise HTTPException(status_code=403, detail=f"Exchange {exchange_id} does not have read_only permission")
    
    # Get balance
    balance = await exchange_manager.fetch_balance(exchange_id)
    
    if not balance:
        raise HTTPException(status_code=400, detail=f"Failed to fetch balance from {exchange_id}")
    
    return balance

@app.get("/exchanges/{exchange_id}/markets")
async def get_exchange_markets(exchange_id: str):
    """Get markets for an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Get markets
    markets = await exchange_manager.fetch_markets(exchange_id)
    
    if not markets:
        raise HTTPException(status_code=400, detail=f"Failed to fetch markets from {exchange_id}")
    
    return markets

@app.get("/exchanges/{exchange_id}/ticker/{symbol}")
async def get_exchange_ticker(exchange_id: str, symbol: str):
    """Get ticker for a symbol on an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Get ticker
    ticker = await exchange_manager.fetch_ticker(exchange_id, symbol)
    
    if not ticker:
        raise HTTPException(status_code=400, detail=f"Failed to fetch ticker for {symbol} from {exchange_id}")
    
    return ticker

@app.post("/exchanges/{exchange_id}/orders")
async def create_order(exchange_id: str, order: OrderModel):
    """Create an order on an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Check permission
    if not exchange_manager.check_permission(exchange_id, "read_write"):
        raise HTTPException(status_code=403, detail=f"Exchange {exchange_id} does not have read_write permission")
    
    # Create order
    result = await exchange_manager.create_order(
        exchange_id=exchange_id,
        symbol=order.symbol,
        order_type=order.order_type,
        side=order.side,
        amount=order.amount,
        price=order.price,
        params=order.params
    )
    
    if not result:
        raise HTTPException(status_code=400, detail=f"Failed to create order on {exchange_id}")
    
    return result

@app.delete("/exchanges/{exchange_id}/orders/{order_id}")
async def cancel_order(exchange_id: str, order_id: str, symbol: Optional[str] = None):
    """Cancel an order on an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Check permission
    if not exchange_manager.check_permission(exchange_id, "read_write"):
        raise HTTPException(status_code=403, detail=f"Exchange {exchange_id} does not have read_write permission")
    
    # Cancel order
    result = await exchange_manager.cancel_order(
        exchange_id=exchange_id,
        order_id=order_id,
        symbol=symbol
    )
    
    if not result:
        raise HTTPException(status_code=400, detail=f"Failed to cancel order {order_id} on {exchange_id}")
    
    return result

@app.get("/exchanges/{exchange_id}/orders")
async def get_exchange_orders(
    exchange_id: str, 
    symbol: Optional[str] = None, 
    status: Optional[str] = "open"
):
    """Get orders for an exchange"""
    exchange = config.get_exchange(exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found")
    
    # Make sure the exchange is added to the manager
    if exchange_manager.get_exchange(exchange_id) is None:
        exchange_manager.add_exchange(exchange)
    
    # Check permission
    if not exchange_manager.check_permission(exchange_id, "read_only"):
        raise HTTPException(status_code=403, detail=f"Exchange {exchange_id} does not have read_only permission")
    
    # Get orders
    if status == "open":
        orders = await exchange_manager.fetch_open_orders(exchange_id, symbol)
    elif status == "closed":
        orders = await exchange_manager.fetch_closed_orders(exchange_id, symbol)
    else:
        orders = await exchange_manager.fetch_orders(exchange_id, symbol)
    
    if orders is None:
        raise HTTPException(status_code=400, detail=f"Failed to fetch orders from {exchange_id}")
    
    return orders

# Strategy routes
@app.get("/strategies")
async def get_strategies():
    """Get all available strategies"""
    return strategy_manager.get_all_strategies_info()

@app.get("/strategies/{strategy_id}")
async def get_strategy(strategy_id: str):
    """Get information about a specific strategy"""
    strategy_info = strategy_manager.get_strategy_info(strategy_id)
    if not strategy_info:
        raise HTTPException(status_code=404, detail=f"Strategy {strategy_id} not found")
    return strategy_info

@app.post("/strategies/active")
async def set_active_strategy(strategy_config: StrategyConfigModel):
    """Set the active strategy"""
    # Make sure all exchanges are added to the manager
    for exchange in config.exchanges:
        if exchange_manager.get_exchange(exchange.exchange_id) is None:
            exchange_manager.add_exchange(exchange)
    
    # Set active strategy
    success = strategy_manager.set_active_strategy(
        strategy_id=strategy_config.strategy_id,
        exchange_manager=exchange_manager,
        parameters=strategy_config.parameters
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to set active strategy to {strategy_config.strategy_id}")
    
    # Update config
    config.active_strategy = strategy_config.strategy_id
    config.strategy_params = strategy_config.parameters
    config.save()
    
    return {"message": f"Active strategy set to {strategy_config.strategy_id}"}

@app.post("/strategies/start")
async def start_strategy():
    """Start the active strategy"""
    if not strategy_manager.get_active_strategy():
        raise HTTPException(status_code=400, detail="No active strategy to start")
    
    success = strategy_manager.start_active_strategy()
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to start active strategy")
    
    return {"message": "Active strategy started"}

@app.post("/strategies/stop")
async def stop_strategy():
    """Stop the active strategy"""
    if not strategy_manager.get_active_strategy():
        raise HTTPException(status_code=400, detail="No active strategy to stop")
    
    success = strategy_manager.stop_active_strategy()
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to stop active strategy")
    
    return {"message": "Active strategy stopped"}

@app.get("/strategies/status")
async def get_strategy_status():
    """Get the status of the active strategy"""
    return strategy_manager.get_active_strategy_status()

# Configuration routes
@app.get("/config")
async def get_config():
    """Get the current configuration"""
    return config.to_dict()

@app.post("/config")
async def update_config(config_data: Dict):
    """Update the configuration"""
    global config
    
    # Update config
    config = TradingBotConfig.from_dict(config_data)
    config.save()
    
    return {"message": "Configuration updated successfully"}

# Supported exchanges
@app.get("/supported-exchanges")
async def get_supported_exchanges():
    """Get a list of all exchanges supported by ccxt"""
    return exchange_manager.get_supported_exchanges()

# Main function to run the API server
def run_api(host="0.0.0.0", port=8000):
    """Run the API server"""
    import uvicorn
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    run_api()