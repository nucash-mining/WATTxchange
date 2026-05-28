import os
import sys
import logging
import asyncio
import signal
import argparse
from typing import Dict, List, Optional, Any

from config import TradingBotConfig, ExchangeConfig
from exchange_manager import exchange_manager
from strategy_manager import strategy_manager
from api import run_api

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("trading_bot.log")
    ]
)
logger = logging.getLogger("main")

# Global variables
config = TradingBotConfig.load()
running = True

async def initialize():
    """Initialize the trading bot"""
    logger.info("Initializing trading bot...")
    
    # Initialize exchanges
    for exchange_config in config.exchanges:
        if exchange_config.enabled:
            success = exchange_manager.add_exchange(exchange_config)
            if success:
                logger.info(f"Initialized exchange: {exchange_config.exchange_id}")
            else:
                logger.error(f"Failed to initialize exchange: {exchange_config.exchange_id}")
    
    # Initialize active strategy if configured
    if config.active_strategy:
        success = strategy_manager.set_active_strategy(
            strategy_id=config.active_strategy,
            exchange_manager=exchange_manager,
            parameters=config.strategy_params
        )
        
        if success:
            logger.info(f"Initialized strategy: {config.active_strategy}")
        else:
            logger.error(f"Failed to initialize strategy: {config.active_strategy}")
    
    logger.info("Trading bot initialized")

async def start_bot():
    """Start the trading bot"""
    logger.info("Starting trading bot...")
    
    # Start active strategy if configured
    if config.active_strategy and strategy_manager.get_active_strategy():
        success = strategy_manager.start_active_strategy()
        
        if success:
            logger.info(f"Started strategy: {config.active_strategy}")
        else:
            logger.error(f"Failed to start strategy: {config.active_strategy}")
    
    logger.info("Trading bot started")

async def stop_bot():
    """Stop the trading bot"""
    logger.info("Stopping trading bot...")
    
    # Stop active strategy if running
    if strategy_manager.get_active_strategy():
        success = strategy_manager.stop_active_strategy()
        
        if success:
            logger.info("Stopped active strategy")
        else:
            logger.error("Failed to stop active strategy")
    
    logger.info("Trading bot stopped")

async def main_loop():
    """Main loop for the trading bot"""
    global running
    
    try:
        # Initialize the bot
        await initialize()
        
        # Start the bot
        await start_bot()
        
        # Keep running until stopped
        while running:
            await asyncio.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Error in main loop: {str(e)}")
    finally:
        # Stop the bot
        await stop_bot()

def signal_handler(sig, frame):
    """Handle signals to gracefully stop the bot"""
    global running
    logger.info(f"Received signal {sig}")
    running = False

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="WATTxchange Trading Bot")
    parser.add_argument("--api", action="store_true", help="Run the API server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="API server host")
    parser.add_argument("--port", type=int, default=8000, help="API server port")
    return parser.parse_args()

if __name__ == "__main__":
    # Parse command line arguments
    args = parse_args()
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if args.api:
        # Run the API server
        logger.info(f"Starting API server on {args.host}:{args.port}")
        run_api(host=args.host, port=args.port)
    else:
        # Run the main loop
        asyncio.run(main_loop())