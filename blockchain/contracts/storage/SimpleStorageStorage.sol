// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SimpleStorageStorage is Initializable {
    // Variable to store the number
    uint256 internal number;

    // Group creation storage
    struct Member {
        address wallet;
        bool registered;
        uint256 groupId;
    }

    address[] internal memberList;
    mapping(address => Member) internal members;
    mapping(uint256 => address[5]) internal groups;

    uint256 internal totalGroups;
    bool internal groupingActive;
    uint256 internal randomSeed;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[43] private __gap;
}
