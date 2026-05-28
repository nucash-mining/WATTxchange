// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AtomicSwapOrderBook
 * @dev Implements an order book for atomic swaps
 */
contract AtomicSwapOrderBook is ReentrancyGuard, Ownable {
    // Order types
    enum OrderType { BUY, SELL }
    
    // Order statuses
    enum OrderStatus { OPEN, FILLED, CANCELLED, EXPIRED }
    
    // Order struct
    struct Order {
        bytes32 id;
        address maker;
        string fromChain;
        string fromAsset;
        uint256 fromAmount;
        string toChain;
        string toAsset;
        uint256 toAmount;
        OrderType orderType;
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        address taker;
        bytes32 swapId;
    }
    
    // Mapping of order id to Order struct
    mapping(bytes32 => Order) public orders;
    
    // Array of all order ids
    bytes32[] public orderIds;
    
    // Mapping of maker address to their order ids
    mapping(address => bytes32[]) public makerOrders;
    
    // Events
    event OrderCreated(
        bytes32 indexed id,
        address indexed maker,
        string fromChain,
        string fromAsset,
        uint256 fromAmount,
        string toChain,
        string toAsset,
        uint256 toAmount,
        OrderType orderType,
        uint256 expiresAt
    );
    
    event OrderFilled(
        bytes32 indexed id,
        address indexed taker,
        bytes32 swapId
    );
    
    event OrderCancelled(
        bytes32 indexed id
    );
    
    event OrderExpired(
        bytes32 indexed id
    );
    
    /**
     * @dev Creates a new order
     * @param _fromChain Source blockchain
     * @param _fromAsset Source asset symbol
     * @param _fromAmount Source amount
     * @param _toChain Destination blockchain
     * @param _toAsset Destination asset symbol
     * @param _toAmount Destination amount
     * @param _orderType Order type (BUY or SELL)
     * @param _expiresAt Unix timestamp when the order expires
     * @return bytes32 Order ID
     */
    function createOrder(
        string memory _fromChain,
        string memory _fromAsset,
        uint256 _fromAmount,
        string memory _toChain,
        string memory _toAsset,
        uint256 _toAmount,
        OrderType _orderType,
        uint256 _expiresAt
    ) external nonReentrant returns (bytes32) {
        require(_fromAmount > 0, "From amount must be greater than zero");
        require(_toAmount > 0, "To amount must be greater than zero");
        require(_expiresAt > block.timestamp, "Expiration must be in the future");
        require(bytes(_fromChain).length > 0, "From chain cannot be empty");
        require(bytes(_fromAsset).length > 0, "From asset cannot be empty");
        require(bytes(_toChain).length > 0, "To chain cannot be empty");
        require(bytes(_toAsset).length > 0, "To asset cannot be empty");
        
        // Generate order id
        bytes32 orderId = keccak256(abi.encodePacked(
            msg.sender,
            _fromChain,
            _fromAsset,
            _fromAmount,
            _toChain,
            _toAsset,
            _toAmount,
            _orderType,
            block.timestamp
        ));
        
        // Create order
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            fromChain: _fromChain,
            fromAsset: _fromAsset,
            fromAmount: _fromAmount,
            toChain: _toChain,
            toAsset: _toAsset,
            toAmount: _toAmount,
            orderType: _orderType,
            status: OrderStatus.OPEN,
            createdAt: block.timestamp,
            expiresAt: _expiresAt,
            taker: address(0),
            swapId: bytes32(0)
        });
        
        // Add order to arrays
        orderIds.push(orderId);
        makerOrders[msg.sender].push(orderId);
        
        emit OrderCreated(
            orderId,
            msg.sender,
            _fromChain,
            _fromAsset,
            _fromAmount,
            _toChain,
            _toAsset,
            _toAmount,
            _orderType,
            _expiresAt
        );
        
        return orderId;
    }
    
    /**
     * @dev Fills an order
     * @param _orderId Order identifier
     * @param _swapId Swap identifier from the AtomicSwap contract
     */
    function fillOrder(bytes32 _orderId, bytes32 _swapId) external nonReentrant {
        Order storage order = orders[_orderId];
        
        require(order.status == OrderStatus.OPEN, "Order is not open");
        require(block.timestamp < order.expiresAt, "Order has expired");
        require(order.maker != msg.sender, "Maker cannot fill their own order");
        
        // Update order
        order.status = OrderStatus.FILLED;
        order.taker = msg.sender;
        order.swapId = _swapId;
        
        emit OrderFilled(_orderId, msg.sender, _swapId);
    }
    
    /**
     * @dev Cancels an order (only callable by the maker)
     * @param _orderId Order identifier
     */
    function cancelOrder(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        
        require(order.status == OrderStatus.OPEN, "Order is not open");
        require(order.maker == msg.sender, "Only maker can cancel the order");
        
        order.status = OrderStatus.CANCELLED;
        
        emit OrderCancelled(_orderId);
    }
    
    /**
     * @dev Marks an order as expired
     * @param _orderId Order identifier
     */
    function expireOrder(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        
        require(order.status == OrderStatus.OPEN, "Order is not open");
        require(block.timestamp >= order.expiresAt, "Order has not expired yet");
        
        order.status = OrderStatus.EXPIRED;
        
        emit OrderExpired(_orderId);
    }
    
    /**
     * @dev Gets order details
     * @param _orderId Order identifier
     * @return Order details
     */
    function getOrder(bytes32 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
    
    /**
     * @dev Gets all orders
     * @return bytes32[] Array of order ids
     */
    function getAllOrders() external view returns (bytes32[] memory) {
        return orderIds;
    }
    
    /**
     * @dev Gets all orders for a maker
     * @param _maker Maker address
     * @return bytes32[] Array of order ids
     */
    function getMakerOrders(address _maker) external view returns (bytes32[] memory) {
        return makerOrders[_maker];
    }
    
    /**
     * @dev Gets all open orders
     * @return bytes32[] Array of open order ids
     */
    function getOpenOrders() external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Count open orders
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == OrderStatus.OPEN) {
                count++;
            }
        }
        
        // Create array of open order ids
        bytes32[] memory openOrderIds = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == OrderStatus.OPEN) {
                openOrderIds[index] = orderIds[i];
                index++;
            }
        }
        
        return openOrderIds;
    }
    
    /**
     * @dev Gets open orders for a specific trading pair
     * @param _fromChain Source blockchain
     * @param _fromAsset Source asset symbol
     * @param _toChain Destination blockchain
     * @param _toAsset Destination asset symbol
     * @return bytes32[] Array of matching order ids
     */
    function getOpenOrdersForPair(
        string memory _fromChain,
        string memory _fromAsset,
        string memory _toChain,
        string memory _toAsset
    ) external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Count matching orders
        for (uint256 i = 0; i < orderIds.length; i++) {
            Order memory order = orders[orderIds[i]];
            
            if (order.status == OrderStatus.OPEN &&
                keccak256(bytes(order.fromChain)) == keccak256(bytes(_fromChain)) &&
                keccak256(bytes(order.fromAsset)) == keccak256(bytes(_fromAsset)) &&
                keccak256(bytes(order.toChain)) == keccak256(bytes(_toChain)) &&
                keccak256(bytes(order.toAsset)) == keccak256(bytes(_toAsset))) {
                count++;
            }
        }
        
        // Create array of matching order ids
        bytes32[] memory matchingOrderIds = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            Order memory order = orders[orderIds[i]];
            
            if (order.status == OrderStatus.OPEN &&
                keccak256(bytes(order.fromChain)) == keccak256(bytes(_fromChain)) &&
                keccak256(bytes(order.fromAsset)) == keccak256(bytes(_fromAsset)) &&
                keccak256(bytes(order.toChain)) == keccak256(bytes(_toChain)) &&
                keccak256(bytes(order.toAsset)) == keccak256(bytes(_toAsset))) {
                matchingOrderIds[index] = orderIds[i];
                index++;
            }
        }
        
        return matchingOrderIds;
    }
}