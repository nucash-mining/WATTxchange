// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AtomicSwap
 * @dev Implements atomic swaps for EVM-compatible tokens
 * This contract handles the EVM side of cross-chain atomic swaps
 */
contract AtomicSwap is ReentrancyGuard, Ownable {
    // Swap statuses
    enum SwapStatus { INVALID, OPEN, COMPLETED, EXPIRED, CANCELLED }
    
    // Swap struct
    struct Swap {
        bytes32 id;
        address maker;
        address tokenContract; // Zero address for native currency
        uint256 amount;
        bytes32 hashLock;
        uint256 timelock;
        address recipient;
        SwapStatus status;
        bytes32 secretKey; // Revealed only after swap is completed
    }
    
    // Mapping of swap id to Swap struct
    mapping(bytes32 => Swap) public swaps;
    
    // Events
    event SwapCreated(
        bytes32 indexed id,
        address indexed maker,
        address tokenContract,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        address recipient
    );
    
    event SwapCompleted(
        bytes32 indexed id,
        bytes32 secretKey
    );
    
    event SwapExpired(
        bytes32 indexed id
    );
    
    event SwapCancelled(
        bytes32 indexed id
    );
    
    /**
     * @dev Creates a new token swap
     * @param _id Unique swap identifier
     * @param _tokenContract Address of ERC20 token contract (zero address for native currency)
     * @param _amount Amount of tokens to swap
     * @param _hashLock Hash of the secret key
     * @param _timelock Unix timestamp when the swap expires
     * @param _recipient Address that can claim the tokens
     */
    function createTokenSwap(
        bytes32 _id,
        address _tokenContract,
        uint256 _amount,
        bytes32 _hashLock,
        uint256 _timelock,
        address _recipient
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(_timelock > block.timestamp, "Timelock must be in the future");
        require(_recipient != address(0), "Invalid recipient address");
        require(swaps[_id].status == SwapStatus.INVALID, "Swap already exists");
        
        // Transfer tokens to contract
        if (_tokenContract == address(0)) {
            // Native currency (ETH, ALT, etc.)
            require(msg.value == _amount, "Incorrect amount sent");
        } else {
            // ERC20 token
            require(msg.value == 0, "ETH value must be zero for token swaps");
            IERC20 token = IERC20(_tokenContract);
            require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        }
        
        // Create swap
        swaps[_id] = Swap({
            id: _id,
            maker: msg.sender,
            tokenContract: _tokenContract,
            amount: _amount,
            hashLock: _hashLock,
            timelock: _timelock,
            recipient: _recipient,
            status: SwapStatus.OPEN,
            secretKey: bytes32(0)
        });
        
        emit SwapCreated(
            _id,
            msg.sender,
            _tokenContract,
            _amount,
            _hashLock,
            _timelock,
            _recipient
        );
    }
    
    /**
     * @dev Creates a new native currency swap (ETH, ALT, etc.)
     * @param _id Unique swap identifier
     * @param _hashLock Hash of the secret key
     * @param _timelock Unix timestamp when the swap expires
     * @param _recipient Address that can claim the tokens
     */
    function createNativeSwap(
        bytes32 _id,
        bytes32 _hashLock,
        uint256 _timelock,
        address _recipient
    ) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than zero");
        require(_timelock > block.timestamp, "Timelock must be in the future");
        require(_recipient != address(0), "Invalid recipient address");
        require(swaps[_id].status == SwapStatus.INVALID, "Swap already exists");
        
        // Create swap
        swaps[_id] = Swap({
            id: _id,
            maker: msg.sender,
            tokenContract: address(0), // Zero address for native currency
            amount: msg.value,
            hashLock: _hashLock,
            timelock: _timelock,
            recipient: _recipient,
            status: SwapStatus.OPEN,
            secretKey: bytes32(0)
        });
        
        emit SwapCreated(
            _id,
            msg.sender,
            address(0),
            msg.value,
            _hashLock,
            _timelock,
            _recipient
        );
    }
    
    /**
     * @dev Completes a swap by revealing the secret key
     * @param _id Swap identifier
     * @param _secretKey Secret key that hashes to the hashLock
     */
    function completeSwap(bytes32 _id, bytes32 _secretKey) external nonReentrant {
        Swap storage swap = swaps[_id];
        
        require(swap.status == SwapStatus.OPEN, "Swap is not open");
        require(block.timestamp < swap.timelock, "Swap has expired");
        require(sha256(abi.encodePacked(_secretKey)) == swap.hashLock, "Invalid secret key");
        
        // Update swap status
        swap.status = SwapStatus.COMPLETED;
        swap.secretKey = _secretKey;
        
        // Transfer tokens to recipient
        if (swap.tokenContract == address(0)) {
            // Native currency
            (bool success, ) = swap.recipient.call{value: swap.amount}("");
            require(success, "Native currency transfer failed");
        } else {
            // ERC20 token
            IERC20 token = IERC20(swap.tokenContract);
            require(token.transfer(swap.recipient, swap.amount), "Token transfer failed");
        }
        
        emit SwapCompleted(_id, _secretKey);
    }
    
    /**
     * @dev Refunds tokens to the maker if the swap has expired
     * @param _id Swap identifier
     */
    function refundSwap(bytes32 _id) external nonReentrant {
        Swap storage swap = swaps[_id];
        
        require(swap.status == SwapStatus.OPEN, "Swap is not open");
        require(block.timestamp >= swap.timelock, "Swap has not expired yet");
        
        // Update swap status
        swap.status = SwapStatus.EXPIRED;
        
        // Refund tokens to maker
        if (swap.tokenContract == address(0)) {
            // Native currency
            (bool success, ) = swap.maker.call{value: swap.amount}("");
            require(success, "Native currency transfer failed");
        } else {
            // ERC20 token
            IERC20 token = IERC20(swap.tokenContract);
            require(token.transfer(swap.maker, swap.amount), "Token transfer failed");
        }
        
        emit SwapExpired(_id);
    }
    
    /**
     * @dev Cancels a swap (only callable by the maker)
     * @param _id Swap identifier
     */
    function cancelSwap(bytes32 _id) external nonReentrant {
        Swap storage swap = swaps[_id];
        
        require(swap.status == SwapStatus.OPEN, "Swap is not open");
        require(msg.sender == swap.maker, "Only maker can cancel the swap");
        
        // Update swap status
        swap.status = SwapStatus.CANCELLED;
        
        // Refund tokens to maker
        if (swap.tokenContract == address(0)) {
            // Native currency
            (bool success, ) = swap.maker.call{value: swap.amount}("");
            require(success, "Native currency transfer failed");
        } else {
            // ERC20 token
            IERC20 token = IERC20(swap.tokenContract);
            require(token.transfer(swap.maker, swap.amount), "Token transfer failed");
        }
        
        emit SwapCancelled(_id);
    }
    
    /**
     * @dev Gets swap details
     * @param _id Swap identifier
     * @return Swap details
     */
    function getSwap(bytes32 _id) external view returns (
        address maker,
        address tokenContract,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        address recipient,
        SwapStatus status,
        bytes32 secretKey
    ) {
        Swap memory swap = swaps[_id];
        return (
            swap.maker,
            swap.tokenContract,
            swap.amount,
            swap.hashLock,
            swap.timelock,
            swap.recipient,
            swap.status,
            swap.secretKey
        );
    }
    
    /**
     * @dev Checks if a swap is valid
     * @param _id Swap identifier
     * @return bool True if the swap exists and is open
     */
    function isValidSwap(bytes32 _id) external view returns (bool) {
        return swaps[_id].status == SwapStatus.OPEN;
    }
    
    /**
     * @dev Generates a swap id based on parameters
     * @param _maker Maker address
     * @param _tokenContract Token contract address
     * @param _amount Token amount
     * @param _hashLock Hash lock
     * @param _timelock Time lock
     * @param _recipient Recipient address
     * @return bytes32 Swap ID
     */
    function generateSwapId(
        address _maker,
        address _tokenContract,
        uint256 _amount,
        bytes32 _hashLock,
        uint256 _timelock,
        address _recipient
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            _maker,
            _tokenContract,
            _amount,
            _hashLock,
            _timelock,
            _recipient
        ));
    }
}