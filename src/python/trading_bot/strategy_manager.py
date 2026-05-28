import os
import importlib.util
import inspect
import logging
from typing import Dict, List, Optional, Any, Type
from pathlib import Path
from config import STRATEGIES_DIR
from base_strategy import BaseStrategy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("strategy_manager")

class StrategyManager:
    """
    Manages trading strategies
    """
    def __init__(self):
        self.strategies: Dict[str, Type[BaseStrategy]] = {}
        self.active_strategy: Optional[BaseStrategy] = None
        self.load_strategies()
    
    def load_strategies(self) -> None:
        """
        Load all strategy classes from the strategies directory
        """
        self.strategies = {}
        
        # Ensure the strategies directory exists
        if not os.path.exists(STRATEGIES_DIR):
            os.makedirs(STRATEGIES_DIR)
        
        # Load all Python files in the strategies directory
        for file_path in STRATEGIES_DIR.glob("*.py"):
            try:
                # Skip __init__.py and other special files
                if file_path.name.startswith("__"):
                    continue
                
                # Load the module
                module_name = file_path.stem
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                if spec is None or spec.loader is None:
                    logger.warning(f"Could not load spec for {file_path}")
                    continue
                
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Find all strategy classes in the module
                for name, obj in inspect.getmembers(module):
                    if (inspect.isclass(obj) and 
                        issubclass(obj, BaseStrategy) and 
                        obj != BaseStrategy):
                        strategy_id = obj.get_strategy_id()
                        self.strategies[strategy_id] = obj
                        logger.info(f"Loaded strategy: {strategy_id}")
            
            except Exception as e:
                logger.error(f"Error loading strategy from {file_path}: {str(e)}")
    
    def get_strategy_class(self, strategy_id: str) -> Optional[Type[BaseStrategy]]:
        """
        Get a strategy class by ID
        
        Args:
            strategy_id: ID of the strategy
            
        Returns:
            Strategy class or None if not found
        """
        return self.strategies.get(strategy_id)
    
    def get_all_strategies(self) -> Dict[str, Type[BaseStrategy]]:
        """
        Get all available strategies
        
        Returns:
            Dict of strategy ID to strategy class
        """
        return self.strategies
    
    def get_strategy_info(self, strategy_id: str) -> Dict:
        """
        Get information about a strategy
        
        Args:
            strategy_id: ID of the strategy
            
        Returns:
            Dict with strategy information
        """
        strategy_class = self.get_strategy_class(strategy_id)
        if not strategy_class:
            return {}
        
        return {
            "id": strategy_id,
            "name": strategy_class.get_strategy_name(),
            "description": strategy_class.get_strategy_description(),
            "parameters": strategy_class.get_parameters_info(),
            "required_exchanges": strategy_class.get_required_exchanges(),
            "required_markets": strategy_class.get_required_markets()
        }
    
    def get_all_strategies_info(self) -> List[Dict]:
        """
        Get information about all available strategies
        
        Returns:
            List of dicts with strategy information
        """
        return [self.get_strategy_info(strategy_id) for strategy_id in self.strategies]
    
    def initialize_strategy(
        self, 
        strategy_id: str, 
        exchange_manager: Any, 
        parameters: Dict = None
    ) -> Optional[BaseStrategy]:
        """
        Initialize a strategy
        
        Args:
            strategy_id: ID of the strategy
            exchange_manager: Exchange manager instance
            parameters: Strategy parameters
            
        Returns:
            Initialized strategy instance or None if initialization failed
        """
        strategy_class = self.get_strategy_class(strategy_id)
        if not strategy_class:
            logger.error(f"Strategy {strategy_id} not found")
            return None
        
        parameters = parameters or {}
        
        try:
            strategy = strategy_class(exchange_manager, parameters)
            logger.info(f"Initialized strategy: {strategy_id}")
            return strategy
        except Exception as e:
            logger.error(f"Failed to initialize strategy {strategy_id}: {str(e)}")
            return None
    
    def set_active_strategy(
        self, 
        strategy_id: str, 
        exchange_manager: Any, 
        parameters: Dict = None
    ) -> bool:
        """
        Set the active strategy
        
        Args:
            strategy_id: ID of the strategy
            exchange_manager: Exchange manager instance
            parameters: Strategy parameters
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Stop the current active strategy if there is one
        if self.active_strategy:
            self.active_strategy.stop()
            self.active_strategy = None
        
        # Initialize the new strategy
        strategy = self.initialize_strategy(strategy_id, exchange_manager, parameters)
        if not strategy:
            return False
        
        self.active_strategy = strategy
        return True
    
    def start_active_strategy(self) -> bool:
        """
        Start the active strategy
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.active_strategy:
            logger.error("No active strategy to start")
            return False
        
        try:
            self.active_strategy.start()
            logger.info(f"Started strategy: {self.active_strategy.get_strategy_id()}")
            return True
        except Exception as e:
            logger.error(f"Failed to start strategy: {str(e)}")
            return False
    
    def stop_active_strategy(self) -> bool:
        """
        Stop the active strategy
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.active_strategy:
            logger.error("No active strategy to stop")
            return False
        
        try:
            self.active_strategy.stop()
            logger.info(f"Stopped strategy: {self.active_strategy.get_strategy_id()}")
            return True
        except Exception as e:
            logger.error(f"Failed to stop strategy: {str(e)}")
            return False
    
    def get_active_strategy(self) -> Optional[BaseStrategy]:
        """
        Get the active strategy
        
        Returns:
            Active strategy instance or None if no active strategy
        """
        return self.active_strategy
    
    def get_active_strategy_status(self) -> Dict:
        """
        Get the status of the active strategy
        
        Returns:
            Dict with strategy status
        """
        if not self.active_strategy:
            return {"active": False}
        
        return {
            "active": True,
            "id": self.active_strategy.get_strategy_id(),
            "name": self.active_strategy.get_strategy_name(),
            "running": self.active_strategy.is_running(),
            "parameters": self.active_strategy.get_parameters(),
            "performance": self.active_strategy.get_performance(),
            "last_update": self.active_strategy.get_last_update_time()
        }

# Create a global instance of the strategy manager
strategy_manager = StrategyManager()