// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISimpleStorage {
    function initialize(address initialOwner) external;

    function setNumber(uint256 _number) external;

    function getNumber() external view returns (uint256);

    function increment() external;

    // Events
    event NumberSet(uint256 indexed newNumber, address indexed setter);
    event NumberIncremented(
        uint256 indexed newNumber,
        address indexed incrementer
    );
}
