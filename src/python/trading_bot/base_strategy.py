import time
import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, ClassVar, Type

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class BaseStrategy(ABC):
    """
    Base class for all trading strategies
    """
    
    @classmethod
    @abstractmethod
    def get_strategy_id(cls) -> str:
        """
        Get the unique identifier for this strategy
        
        Returns:
            str: Strategy ID
        """
        pass
    
    @classmethod
    @abstractmethod
    def get_strategy_name(cls) -> str:
        """
        Get the human-readable name for this strategy
        
        Returns:
            str: Strategy name
        """
        pass
    
    @classmethod
    @abstractmethod
    def get_strategy_description(cls) -> str:
        """
        Get a description of this strategy
        
        Returns:
            str: Strategy description
        """
        pass
    
    @classmethod
    @abstractmethod
    def get_parameters_info(cls) -> Dict:
        """
        Get information about the parameters this strategy accepts
        
        Returns:
            Dict: Parameter information
        """
        pass
    
    @classmethod
    def get_required_exchanges(cls) -> List[str]:
        """
        Get the exchanges required by this strategy
        
        Returns:
            List[str]: Required exchange IDs
        """
        return []
    
    @classmethod
    def get_required_markets(cls) -> List[str]:
        """
        Get the markets required by this strategy
        
        Returns:
            List[str]: Required market symbols
        """
        return []
    
    def __init__(self, exchange_manager: Any, parameters: Dict = None):
        """
        Initialize the strategy
        
        Args:
            exchange_manager: Exchange manager instance
            parameters: Strategy parameters
        """
        self.exchange_manager = exchange_manager
        self.parameters = parameters or {}
        self.logger = logging.getLogger(f"strategy.{self.get_strategy_id()}")
        self.running = False
        self.task = None
        self.start_time = None
        self.last_update_time = None
        self.performance = {
            "trades": 0,
            "profit_loss": 0.0,
            "win_rate": 0.0,
            "max_drawdown": 0.0
        }
    
    def get_parameters(self) -> Dict:
        """
        Get the current parameters
        
        Returns:
            Dict: Current parameters
        """
        return self.parameters
    
    def set_parameters(self, parameters: Dict) -> None:
        """
        Set new parameters
        
        Args:
            parameters: New parameters
        """
        self.parameters = parameters
    
    def is_running(self) -> bool:
        """
        Check if the strategy is running
        
        Returns:
            bool: True if running
        """
        return self.running
    
    def get_performance(self) -> Dict:
        """
        Get the strategy performance metrics
        
        Returns:
            Dict: Performance metrics
        """
        return self.performance
    
    def get_last_update_time(self) -> Optional[float]:
        """
        Get the timestamp of the last update
        
        Returns:
            float: Timestamp or None if not updated yet
        """
        return self.last_update_time
    
    def start(self) -> None:
        """
        Start the strategy
        """
        if self.running:
            self.logger.warning("Strategy is already running")
            return
        
        self.running = True
        self.start_time = time.time()
        self.last_update_time = time.time()
        
        # Create a task to run the strategy
        loop = asyncio.get_event_loop()
        self.task = loop.create_task(self._run())
        
        self.logger.info(f"Started strategy: {self.get_strategy_name()}")
    
    def stop(self) -> None:
        """
        Stop the strategy
        """
        if not self.running:
            self.logger.warning("Strategy is not running")
            return
        
        self.running = False
        
        if self.task:
            self.task.cancel()
            self.task = None
        
        self.logger.info(f"Stopped strategy: {self.get_strategy_name()}")
    
    async def _run(self) -> None:
        """
        Main loop for the strategy
        """
        try:
            await self.on_start()
            
            while self.running:
                try:
                    await self.tick()
                    self.last_update_time = time.time()
                    
                    # Sleep for the tick interval
                    tick_interval = self.parameters.get("tick_interval", 60)  # Default: 1 minute
                    await asyncio.sleep(tick_interval)
                
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self.logger.error(f"Error in strategy tick: {str(e)}")
                    await asyncio.sleep(5)  # Sleep briefly before retrying
            
            await self.on_stop()
        
        except asyncio.CancelledError:
            await self.on_stop()
        except Exception as e:
            self.logger.error(f"Fatal error in strategy: {str(e)}")
            self.running = False
    
    async def on_start(self) -> None:
        """
        Called when the strategy starts
        """
        pass
    
    async def on_stop(self) -> None:
        """
        Called when the strategy stops
        """
        pass
    
    @abstractmethod
    async def tick(self) -> None:
        """
        Called on each strategy tick
        """
        pass
    
    def update_performance(self, trade_profit: float, is_win: bool) -> None:
        """
        Update performance metrics with a new trade
        
        Args:
            trade_profit: Profit/loss from the trade
            is_win: Whether the trade was a win
        """
        self.performance["trades"] += 1
        self.performance["profit_loss"] += trade_profit
        
        # Update win rate
        if is_win:
            win_count = self.performance.get("win_count", 0) + 1
            self.performance["win_count"] = win_count
        else:
            win_count = self.performance.get("win_count", 0)
        
        if self.performance["trades"] > 0:
            self.performance["win_rate"] = (win_count / self.performance["trades"]) * 100
        
        # Update max drawdown
        current_drawdown = min(0, self.performance["profit_loss"])
        self.performance["max_drawdown"] = min(
            self.performance.get("max_drawdown", 0),
            current_drawdown
        )