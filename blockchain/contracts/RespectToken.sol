// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract RespectToken is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // Authorized minters (e.g., RespectGame contract)
    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        string memory name,
        string memory symbol
    ) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @notice Add a minter address
     * @param minter Address to grant minting rights
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(!minters[minter], "Already a minter");
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @notice Remove a minter address
     * @param minter Address to revoke minting rights
     */
    function removeMinter(address minter) external onlyOwner {
        require(minters[minter], "Not a minter");
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @notice Mint RESPECT tokens
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Not authorized to mint");
        _mint(to, amount);
    }

    /**
     * @notice Burn RESPECT tokens from an address (only by minters)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(minters[msg.sender], "Not authorized to burn");
        _burn(from, amount);
    }
}
