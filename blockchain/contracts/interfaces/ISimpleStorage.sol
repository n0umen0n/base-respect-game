// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISimpleStorage {
    function initialize(address initialOwner) external;

    function setNumber(uint256 _number) external;

    function getNumber() external view returns (uint256);

    function increment() external;

    // Group creation functions
    function registerMember(address _member) external;

    function batchRegisterMembers(address[] calldata _members) external;

    function createRandomGroups() external returns (uint256);

    function getGroup(
        uint256 groupId
    ) external view returns (address[5] memory);

    function getMyGroup() external view returns (address[5] memory, uint256);

    function getMemberCount() external view returns (uint256);

    function getTotalGroups() external view returns (uint256);

    function isGroupingActive() external view returns (bool);

    function resetGrouping() external;

    // Events
    event NumberSet(uint256 indexed newNumber, address indexed setter);
    event NumberIncremented(
        uint256 indexed newNumber,
        address indexed incrementer
    );

    // Group events
    event MemberRegistered(address indexed member, uint256 index);
    event GroupsCreated(
        uint256 totalGroups,
        uint256 timestamp,
        uint256 randomSeed
    );
    event GroupAssigned(uint256 indexed groupId, address[5] members);
    event GroupingReset(uint256 timestamp);
}
