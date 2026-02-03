// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AxelarBridge
 * @dev Bridge contract for Axelar cross-chain transfers
 */
interface IAxelarGateway {
    function sendToken(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata symbol,
        uint256 amount
    ) external;
    
    function callContract(
        string calldata destinationChain,
        string calldata contractAddress,
        bytes calldata payload
    ) external;
}

interface IAxelarGasService {
    function payNativeGasForContractCall(
        address sender,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        address refundAddress
    ) external payable;
    
    function payNativeGasForContractCallWithToken(
        address sender,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount,
        address refundAddress
    ) external payable;
}

contract AxelarBridge is ReentrancyGuard, Ownable {
    IAxelarGateway public gateway;
    IAxelarGasService public gasService;
    
    // Supported chains and their contract addresses
    mapping(string => string) public supportedChains;
    
    // Supported tokens
    mapping(string => address) public supportedTokens;
    
    // Events
    event TokenSent(
        address indexed sender,
        string destinationChain,
        string destinationAddress,
        string symbol,
        uint256 amount
    );
    
    event MessageSent(
        address indexed sender,
        string destinationChain,
        string destinationAddress,
        bytes payload
    );
    
    constructor(address _gateway, address _gasService) {
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
    }
    
    /**
     * @dev Sets the gateway contract address
     * @param _gateway New gateway address
     */
    function setGateway(address _gateway) external onlyOwner {
        gateway = IAxelarGateway(_gateway);
    }
    
    /**
     * @dev Sets the gas service contract address
     * @param _gasService New gas service address
     */
    function setGasService(address _gasService) external onlyOwner {
        gasService = IAxelarGasService(_gasService);
    }
    
    /**
     * @dev Adds or updates a supported chain
     * @param _chain Chain name
     * @param _contractAddress Contract address on the destination chain
     */
    function setSupportedChain(string memory _chain, string memory _contractAddress) external onlyOwner {
        supportedChains[_chain] = _contractAddress;
    }
    
    /**
     * @dev Adds or updates a supported token
     * @param _symbol Token symbol
     * @param _tokenAddress Token contract address
     */
    function setSupportedToken(string memory _symbol, address _tokenAddress) external onlyOwner {
        supportedTokens[_symbol] = _tokenAddress;
    }
    
    /**
     * @dev Sends tokens to another chain
     * @param _destinationChain Destination chain name
     * @param _destinationAddress Destination address
     * @param _symbol Token symbol
     * @param _amount Token amount
     */
    function sendToken(
        string memory _destinationChain,
        string memory _destinationAddress,
        string memory _symbol,
        uint256 _amount
    ) external payable nonReentrant {
        require(bytes(supportedChains[_destinationChain]).length > 0, "Unsupported destination chain");
        require(supportedTokens[_symbol] != address(0), "Unsupported token");
        
        // Transfer tokens from sender to this contract
        IERC20 token = IERC20(supportedTokens[_symbol]);
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        // Approve gateway to spend tokens
        token.approve(address(gateway), _amount);
        
        // Pay for gas
        bytes memory payload = "";
        gasService.payNativeGasForContractCallWithToken{value: msg.value}(
            address(this),
            _destinationChain,
            supportedChains[_destinationChain],
            payload,
            _symbol,
            _amount,
            msg.sender
        );
        
        // Send tokens via Axelar
        gateway.sendToken(
            _destinationChain,
            _destinationAddress,
            _symbol,
            _amount
        );
        
        emit TokenSent(
            msg.sender,
            _destinationChain,
            _destinationAddress,
            _symbol,
            _amount
        );
    }
    
    /**
     * @dev Sends a message to another chain
     * @param _destinationChain Destination chain name
     * @param _destinationAddress Destination contract address
     * @param _payload Message payload
     */
    function sendMessage(
        string memory _destinationChain,
        string memory _destinationAddress,
        bytes memory _payload
    ) external payable nonReentrant {
        require(bytes(supportedChains[_destinationChain]).length > 0, "Unsupported destination chain");
        
        // Pay for gas
        gasService.payNativeGasForContractCall{value: msg.value}(
            address(this),
            _destinationChain,
            _destinationAddress,
            _payload,
            msg.sender
        );
        
        // Send message via Axelar
        gateway.callContract(
            _destinationChain,
            _destinationAddress,
            _payload
        );
        
        emit MessageSent(
            msg.sender,
            _destinationChain,
            _destinationAddress,
            _payload
        );
    }
    
    /**
     * @dev Executes a function call from another chain
     * @param _sourceChain Source chain name
     * @param _sourceAddress Source address
     * @param _payload Function call payload
     */
    function execute(
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) external {
        // This function would be called by the Axelar gateway
        // Implement your cross-chain logic here
    }
    
    /**
     * @dev Withdraws tokens in case they get stuck
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function withdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_token);
        require(token.transfer(owner(), _amount), "Token transfer failed");
    }
    
    /**
     * @dev Withdraws native currency in case it gets stuck
     * @param _amount Amount to withdraw
     */
    function withdrawNative(uint256 _amount) external onlyOwner {
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "Native currency transfer failed");
    }
    
    // Function to receive Ether
    receive() external payable {}
}