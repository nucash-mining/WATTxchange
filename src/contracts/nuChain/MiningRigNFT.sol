// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// Counters removed in OpenZeppelin v5, using uint256 instead
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MiningRigNFT
 * @dev NFT contract for mining rig configurations that can be staked on nuChain
 * Each NFT represents a unique mining rig with different traits affecting hashpower
 */
contract MiningRigNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    // Counters removed in OpenZeppelin v5
    using Strings for uint256;

    // ============ STRUCTS ============
    
    struct MiningRigTraits {
        uint256 gpuCount;           // Number of GPUs (1-8)
        uint256 gpuModel;           // GPU model (1-10, higher = better)
        uint256 memorySize;         // Memory size in GB (4-32)
        uint256 powerEfficiency;    // Power efficiency rating (1-10)
        uint256 coolingSystem;      // Cooling system type (1-5)
        uint256 overclockLevel;     // Overclock level (1-10)
        uint256 miningAlgorithm;    // Mining algorithm (1-8)
        uint256 stabilityRating;    // Stability rating (1-10)
        uint256 baseHashpower;      // Base hashpower calculated from traits
        uint256 rarity;             // Overall rarity score
    }
    
    struct MiningRigMetadata {
        string name;
        string description;
        string image;
        MiningRigTraits traits;
        uint256 mintTime;
        address minter;
    }
    
    // ============ STATE VARIABLES ============
    
    uint256 private _tokenIdCounter;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Mining rig configurations
    mapping(uint256 => MiningRigMetadata) public miningRigs;
    
    // Trait configurations
    mapping(string => uint256[]) public traitOptions;
    mapping(string => uint256[]) public traitWeights;
    
    // Rarity thresholds
    uint256 public constant COMMON_THRESHOLD = 60;
    uint256 public constant UNCOMMON_THRESHOLD = 80;
    uint256 public constant RARE_THRESHOLD = 95;
    uint256 public constant EPIC_THRESHOLD = 99;
    
    // Hashpower multipliers
    mapping(uint256 => uint256) public gpuModelMultipliers;
    mapping(uint256 => uint256) public algorithmMultipliers;
    
    // Events
    event MiningRigMinted(uint256 indexed tokenId, address indexed to, uint256 hashpower);
    event TraitsGenerated(uint256 indexed tokenId, MiningRigTraits traits);
    event HashpowerCalculated(uint256 indexed tokenId, uint256 hashpower);
    
    // ============ CONSTRUCTOR ============
    
    constructor() ERC721("Mining Rig NFT", "MRIG") {
        _initializeTraitOptions();
        _initializeMultipliers();
    }
    
    // ============ MINTING ============
    
    /**
     * @dev Mint a new mining rig NFT with random traits
     * @param to Address to mint the NFT to
     * @return tokenId The minted token ID
     */
    function mintMiningRig(address to) external onlyOwner nonReentrant returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Generate random traits
        MiningRigTraits memory traits = _generateRandomTraits();
        
        // Calculate base hashpower
        traits.baseHashpower = _calculateHashpower(traits);
        
        // Calculate rarity
        traits.rarity = _calculateRarity(traits);
        
        // Create metadata
        MiningRigMetadata memory metadata = MiningRigMetadata({
            name: _generateName(traits),
            description: _generateDescription(traits),
            image: _generateImageURI(tokenId, traits),
            traits: traits,
            mintTime: block.timestamp,
            minter: to
        });
        
        miningRigs[tokenId] = metadata;
        
        // Mint the NFT
        _safeMint(to, tokenId);
        
        emit MiningRigMinted(tokenId, to, traits.baseHashpower);
        emit TraitsGenerated(tokenId, traits);
        emit HashpowerCalculated(tokenId, traits.baseHashpower);
        
        return tokenId;
    }
    
    /**
     * @dev Mint multiple mining rig NFTs
     * @param to Address to mint the NFTs to
     * @param count Number of NFTs to mint
     */
    function mintMultipleMiningRigs(address to, uint256 count) external onlyOwner nonReentrant {
        for (uint256 i = 0; i < count; i++) {
            mintMiningRig(to);
        }
    }
    
    // ============ TRAIT GENERATION ============
    
    /**
     * @dev Generate random traits for a mining rig
     */
    function _generateRandomTraits() internal view returns (MiningRigTraits memory) {
        return MiningRigTraits({
            gpuCount: _getRandomTrait("gpuCount"),
            gpuModel: _getRandomTrait("gpuModel"),
            memorySize: _getRandomTrait("memorySize"),
            powerEfficiency: _getRandomTrait("powerEfficiency"),
            coolingSystem: _getRandomTrait("coolingSystem"),
            overclockLevel: _getRandomTrait("overclockLevel"),
            miningAlgorithm: _getRandomTrait("miningAlgorithm"),
            stabilityRating: _getRandomTrait("stabilityRating"),
            baseHashpower: 0, // Will be calculated
            rarity: 0 // Will be calculated
        });
    }
    
    /**
     * @dev Get random trait value based on weights
     * @param traitName Name of the trait
     */
    function _getRandomTrait(string memory traitName) internal view returns (uint256) {
        uint256[] memory options = traitOptions[traitName];
        uint256[] memory weights = traitWeights[traitName];
        
        require(options.length > 0, "Trait not configured");
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }
        
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            traitName
        ))) % totalWeight;
        
        uint256 cumulativeWeight = 0;
        for (uint256 i = 0; i < options.length; i++) {
            cumulativeWeight += weights[i];
            if (random < cumulativeWeight) {
                return options[i];
            }
        }
        
        return options[options.length - 1];
    }
    
    // ============ HASHPOWER CALCULATION ============
    
    /**
     * @dev Calculate hashpower based on traits
     * @param traits Mining rig traits
     */
    function _calculateHashpower(MiningRigTraits memory traits) internal view returns (uint256) {
        uint256 baseHashpower = 1000; // Base 1000 hashpower
        
        // GPU count multiplier (linear)
        uint256 gpuMultiplier = traits.gpuCount * 1000;
        
        // GPU model multiplier
        uint256 gpuModelMultiplier = gpuModelMultipliers[traits.gpuModel];
        
        // Memory size bonus
        uint256 memoryBonus = (traits.memorySize - 4) * 50; // 50 hashpower per GB above 4GB
        
        // Power efficiency bonus
        uint256 efficiencyBonus = traits.powerEfficiency * 100;
        
        // Cooling system bonus
        uint256 coolingBonus = traits.coolingSystem * 200;
        
        // Overclock level bonus
        uint256 overclockBonus = traits.overclockLevel * 150;
        
        // Algorithm multiplier
        uint256 algorithmMultiplier = algorithmMultipliers[traits.miningAlgorithm];
        
        // Stability rating bonus
        uint256 stabilityBonus = traits.stabilityRating * 100;
        
        // Calculate total hashpower
        uint256 totalHashpower = (
            (baseHashpower + gpuMultiplier) * gpuModelMultiplier / 1000 +
            memoryBonus +
            efficiencyBonus +
            coolingBonus +
            overclockBonus +
            stabilityBonus
        ) * algorithmMultiplier / 1000;
        
        return totalHashpower;
    }
    
    /**
     * @dev Calculate rarity score based on traits
     * @param traits Mining rig traits
     */
    function _calculateRarity(MiningRigTraits memory traits) internal pure returns (uint256) {
        uint256 rarityScore = 0;
        
        // GPU count rarity (higher count = rarer)
        if (traits.gpuCount >= 8) rarityScore += 20;
        else if (traits.gpuCount >= 6) rarityScore += 15;
        else if (traits.gpuCount >= 4) rarityScore += 10;
        else if (traits.gpuCount >= 2) rarityScore += 5;
        
        // GPU model rarity (higher model = rarer)
        if (traits.gpuModel >= 9) rarityScore += 25;
        else if (traits.gpuModel >= 7) rarityScore += 20;
        else if (traits.gpuModel >= 5) rarityScore += 15;
        else if (traits.gpuModel >= 3) rarityScore += 10;
        else rarityScore += 5;
        
        // Memory size rarity (higher memory = rarer)
        if (traits.memorySize >= 24) rarityScore += 15;
        else if (traits.memorySize >= 16) rarityScore += 12;
        else if (traits.memorySize >= 12) rarityScore += 8;
        else if (traits.memorySize >= 8) rarityScore += 5;
        else rarityScore += 2;
        
        // Power efficiency rarity (higher efficiency = rarer)
        if (traits.powerEfficiency >= 9) rarityScore += 10;
        else if (traits.powerEfficiency >= 7) rarityScore += 8;
        else if (traits.powerEfficiency >= 5) rarityScore += 5;
        else if (traits.powerEfficiency >= 3) rarityScore += 3;
        else rarityScore += 1;
        
        // Cooling system rarity (better cooling = rarer)
        if (traits.coolingSystem >= 4) rarityScore += 8;
        else if (traits.coolingSystem >= 3) rarityScore += 6;
        else if (traits.coolingSystem >= 2) rarityScore += 4;
        else rarityScore += 2;
        
        // Overclock level rarity (higher overclock = rarer)
        if (traits.overclockLevel >= 9) rarityScore += 12;
        else if (traits.overclockLevel >= 7) rarityScore += 10;
        else if (traits.overclockLevel >= 5) rarityScore += 7;
        else if (traits.overclockLevel >= 3) rarityScore += 4;
        else rarityScore += 2;
        
        // Stability rating rarity (higher stability = rarer)
        if (traits.stabilityRating >= 9) rarityScore += 10;
        else if (traits.stabilityRating >= 7) rarityScore += 8;
        else if (traits.stabilityRating >= 5) rarityScore += 5;
        else if (traits.stabilityRating >= 3) rarityScore += 3;
        else rarityScore += 1;
        
        return rarityScore;
    }
    
    // ============ METADATA GENERATION ============
    
    /**
     * @dev Generate name based on traits
     * @param traits Mining rig traits
     */
    function _generateName(MiningRigTraits memory traits) internal pure returns (string memory) {
        string memory rarity = _getRarityName(traits.rarity);
        string memory gpuModel = _getGPUModelName(traits.gpuModel);
        
        return string(abi.encodePacked(
            rarity,
            " ",
            gpuModel,
            " Mining Rig #",
            traits.gpuCount.toString(),
            "x"
        ));
    }
    
    /**
     * @dev Generate description based on traits
     * @param traits Mining rig traits
     */
    function _generateDescription(MiningRigTraits memory traits) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "A ",
            _getRarityName(traits.rarity).toLowerCase(),
            " mining rig with ",
            traits.gpuCount.toString(),
            "x ",
            _getGPUModelName(traits.gpuModel),
            " GPUs, ",
            traits.memorySize.toString(),
            "GB memory, and ",
            _getCoolingSystemName(traits.coolingSystem),
            " cooling. ",
            "Hashpower: ",
            traits.baseHashpower.toString(),
            " H/s"
        ));
    }
    
    /**
     * @dev Generate image URI
     * @param tokenId Token ID
     * @param traits Mining rig traits
     */
    function _generateImageURI(uint256 tokenId, MiningRigTraits memory traits) internal view returns (string memory) {
        return string(abi.encodePacked(
            _baseTokenURI,
            "image/",
            tokenId.toString(),
            "?traits=",
            _encodeTraits(traits)
        ));
    }
    
    /**
     * @dev Encode traits for URI
     * @param traits Mining rig traits
     */
    function _encodeTraits(MiningRigTraits memory traits) internal pure returns (string memory) {
        return string(abi.encodePacked(
            traits.gpuCount.toString(),
            ",",
            traits.gpuModel.toString(),
            ",",
            traits.memorySize.toString(),
            ",",
            traits.powerEfficiency.toString(),
            ",",
            traits.coolingSystem.toString(),
            ",",
            traits.overclockLevel.toString(),
            ",",
            traits.miningAlgorithm.toString(),
            ",",
            traits.stabilityRating.toString()
        ));
    }
    
    // ============ HELPER FUNCTIONS ============
    
    /**
     * @dev Get rarity name
     * @param rarity Rarity score
     */
    function _getRarityName(uint256 rarity) internal pure returns (string memory) {
        if (rarity >= EPIC_THRESHOLD) return "Epic";
        if (rarity >= RARE_THRESHOLD) return "Rare";
        if (rarity >= UNCOMMON_THRESHOLD) return "Uncommon";
        return "Common";
    }
    
    /**
     * @dev Get GPU model name
     * @param model GPU model number
     */
    function _getGPUModelName(uint256 model) internal pure returns (string memory) {
        if (model >= 9) return "RTX 4090";
        if (model >= 8) return "RTX 4080";
        if (model >= 7) return "RTX 4070";
        if (model >= 6) return "RTX 3080";
        if (model >= 5) return "RTX 3070";
        if (model >= 4) return "RTX 3060";
        if (model >= 3) return "RTX 2080";
        if (model >= 2) return "RTX 2070";
        return "GTX 1660";
    }
    
    /**
     * @dev Get cooling system name
     * @param cooling Cooling system type
     */
    function _getCoolingSystemName(uint256 cooling) internal pure returns (string memory) {
        if (cooling >= 5) return "Liquid Nitrogen";
        if (cooling >= 4) return "Custom Liquid";
        if (cooling >= 3) return "AIO Liquid";
        if (cooling >= 2) return "High-Performance Air";
        return "Standard Air";
    }
    
    // ============ INITIALIZATION ============
    
    /**
     * @dev Initialize trait options and weights
     */
    function _initializeTraitOptions() internal {
        // GPU Count (1-8)
        traitOptions["gpuCount"] = [1, 2, 3, 4, 5, 6, 7, 8];
        traitWeights["gpuCount"] = [30, 25, 20, 15, 5, 3, 1, 1]; // 1-2 GPUs most common
        
        // GPU Model (1-10)
        traitOptions["gpuModel"] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        traitWeights["gpuModel"] = [20, 18, 15, 12, 10, 8, 6, 4, 2, 1]; // Lower models more common
        
        // Memory Size (4-32 GB)
        traitOptions["memorySize"] = [4, 8, 12, 16, 20, 24, 28, 32];
        traitWeights["memorySize"] = [25, 30, 20, 15, 5, 3, 1, 1]; // 8GB most common
        
        // Power Efficiency (1-10)
        traitOptions["powerEfficiency"] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        traitWeights["powerEfficiency"] = [5, 8, 12, 15, 18, 15, 12, 8, 5, 2]; // Mid-range most common
        
        // Cooling System (1-5)
        traitOptions["coolingSystem"] = [1, 2, 3, 4, 5];
        traitWeights["coolingSystem"] = [40, 30, 20, 8, 2]; // Standard air most common
        
        // Overclock Level (1-10)
        traitOptions["overclockLevel"] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        traitWeights["overclockLevel"] = [15, 20, 20, 15, 10, 8, 5, 3, 2, 1]; // Low overclock most common
        
        // Mining Algorithm (1-8)
        traitOptions["miningAlgorithm"] = [1, 2, 3, 4, 5, 6, 7, 8];
        traitWeights["miningAlgorithm"] = [15, 15, 15, 15, 15, 10, 10, 5]; // First 4 algorithms most common
        
        // Stability Rating (1-10)
        traitOptions["stabilityRating"] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        traitWeights["stabilityRating"] = [5, 8, 12, 15, 18, 15, 12, 8, 5, 2]; // Mid-range most common
    }
    
    /**
     * @dev Initialize multipliers
     */
    function _initializeMultipliers() internal {
        // GPU Model Multipliers (percentage)
        gpuModelMultipliers[1] = 100;   // GTX 1660
        gpuModelMultipliers[2] = 120;   // RTX 2070
        gpuModelMultipliers[3] = 140;   // RTX 2080
        gpuModelMultipliers[4] = 160;   // RTX 3060
        gpuModelMultipliers[5] = 180;   // RTX 3070
        gpuModelMultipliers[6] = 200;   // RTX 3080
        gpuModelMultipliers[7] = 220;   // RTX 4070
        gpuModelMultipliers[8] = 240;   // RTX 4080
        gpuModelMultipliers[9] = 260;   // RTX 4090
        gpuModelMultipliers[10] = 300;  // Future GPU
        
        // Algorithm Multipliers (percentage)
        algorithmMultipliers[1] = 100;  // Ethash
        algorithmMultipliers[2] = 110;  // KawPow
        algorithmMultipliers[3] = 120;  // RandomX
        algorithmMultipliers[4] = 130;  // CuckooCycle
        algorithmMultipliers[5] = 140;  // Equihash
        algorithmMultipliers[6] = 150;  // Lyra2REv2
        algorithmMultipliers[7] = 160;  // X16R
        algorithmMultipliers[8] = 200;  // Custom Algorithm
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get mining rig traits
     * @param tokenId Token ID
     */
    function getMiningRigTraits(uint256 tokenId) external view returns (MiningRigTraits memory) {
        require(_exists(tokenId), "Token does not exist");
        return miningRigs[tokenId].traits;
    }
    
    /**
     * @dev Get mining rig hashpower
     * @param tokenId Token ID
     */
    function getMiningRigHashpower(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return miningRigs[tokenId].traits.baseHashpower;
    }
    
    /**
     * @dev Get mining rig rarity
     * @param tokenId Token ID
     */
    function getMiningRigRarity(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _getRarityName(miningRigs[tokenId].traits.rarity);
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Set base URI
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Update trait options
     * @param traitName Name of the trait
     * @param options New trait options
     * @param weights New trait weights
     */
    function updateTraitOptions(
        string memory traitName,
        uint256[] memory options,
        uint256[] memory weights
    ) external onlyOwner {
        require(options.length == weights.length, "Options and weights length mismatch");
        traitOptions[traitName] = options;
        traitWeights[traitName] = weights;
    }
    
    /**
     * @dev Update GPU model multiplier
     * @param model GPU model number
     * @param multiplier New multiplier
     */
    function updateGPUModelMultiplier(uint256 model, uint256 multiplier) external onlyOwner {
        gpuModelMultipliers[model] = multiplier;
    }
    
    /**
     * @dev Update algorithm multiplier
     * @param algorithm Algorithm number
     * @param multiplier New multiplier
     */
    function updateAlgorithmMultiplier(uint256 algorithm, uint256 multiplier) external onlyOwner {
        algorithmMultipliers[algorithm] = multiplier;
    }
    
    // ============ OVERRIDES ============
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        MiningRigMetadata memory metadata = miningRigs[tokenId];
        
        return string(abi.encodePacked(
            'data:application/json;base64,',
            _encodeBase64(abi.encodePacked(
                '{"name":"', metadata.name, '",',
                '"description":"', metadata.description, '",',
                '"image":"', metadata.image, '",',
                '"attributes":[',
                '{"trait_type":"GPU Count","value":', metadata.traits.gpuCount.toString(), '},',
                '{"trait_type":"GPU Model","value":', metadata.traits.gpuModel.toString(), '},',
                '{"trait_type":"Memory Size","value":', metadata.traits.memorySize.toString(), '},',
                '{"trait_type":"Power Efficiency","value":', metadata.traits.powerEfficiency.toString(), '},',
                '{"trait_type":"Cooling System","value":', metadata.traits.coolingSystem.toString(), '},',
                '{"trait_type":"Overclock Level","value":', metadata.traits.overclockLevel.toString(), '},',
                '{"trait_type":"Mining Algorithm","value":', metadata.traits.miningAlgorithm.toString(), '},',
                '{"trait_type":"Stability Rating","value":', metadata.traits.stabilityRating.toString(), '},',
                '{"trait_type":"Hashpower","value":', metadata.traits.baseHashpower.toString(), '},',
                '{"trait_type":"Rarity","value":"', _getRarityName(metadata.traits.rarity), '"}',
                ']}'
            ))
        ));
    }
    
    function _encodeBase64(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        string memory result = new string(4 * ((data.length + 2) / 3));
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let i := 0
            } lt(i, mload(data)) {
                i := add(i, 3)
            } {
                let input := and(mload(add(data, add(32, i))), 0xffffff)
                
                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)
                
                mstore(resultPtr, out)
                
                resultPtr := add(resultPtr, 4)
            }
            
            switch mod(mload(data), 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }
        }
        
        return result;
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
