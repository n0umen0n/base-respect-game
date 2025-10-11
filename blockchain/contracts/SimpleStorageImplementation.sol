// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./storage/SimpleStorageStorage.sol";
import "./interfaces/ISimpleStorage.sol";

contract SimpleStorageImplementation is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    SimpleStorageStorage,
    ISimpleStorage
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public override initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function setNumber(uint256 _number) external override {
        number = _number;
        emit NumberSet(_number, msg.sender);
    }

    function getNumber() external view override returns (uint256) {
        return number;
    }

    function increment() external {
        number = number + 1;
        emit NumberIncremented(number, msg.sender);
    }
}
