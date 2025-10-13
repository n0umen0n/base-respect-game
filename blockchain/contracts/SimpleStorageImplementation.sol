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

    // ==================== GROUP CREATION FUNCTIONS ====================

    /**
     * @notice Register a single member for group assignment
     * @param _member Address of the member to register
     */
    function registerMember(address _member) external override {
        require(!groupingActive, "Grouping in progress");
        require(_member != address(0), "Invalid address");
        require(!members[_member].registered, "Already registered");

        members[_member] = Member({
            wallet: _member,
            registered: true,
            groupId: 0
        });

        memberList.push(_member);
        emit MemberRegistered(_member, memberList.length - 1);
    }

    /**
     * @notice Register multiple members in a batch (owner only)
     * @param _members Array of member addresses to register
     */
    function batchRegisterMembers(
        address[] calldata _members
    ) external override onlyOwner {
        require(!groupingActive, "Grouping in progress");

        for (uint256 i = 0; i < _members.length; i++) {
            address member = _members[i];
            require(member != address(0), "Invalid address");

            if (!members[member].registered) {
                members[member] = Member({
                    wallet: member,
                    registered: true,
                    groupId: 0
                });
                memberList.push(member);
                emit MemberRegistered(member, memberList.length - 1);
            }
        }
    }

    /**
     * @notice Create random groups of 5 from registered members
     * @return Number of groups created
     * @dev Uses Fisher-Yates shuffle algorithm for randomization
     */
    function createRandomGroups()
        external
        override
        onlyOwner
        returns (uint256)
    {
        require(memberList.length >= 5, "Need at least 5 members");
        require(!groupingActive, "Groups already created");

        groupingActive = true;

        // Generate pseudo-random seed from multiple sources
        randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao, // Post-merge randomness source
                    block.number,
                    msg.sender,
                    memberList.length
                )
            )
        );

        uint256 numCompleteGroups = memberList.length / 5;

        // Fisher-Yates shuffle with in-place swapping
        for (uint256 i = memberList.length - 1; i > 0; i--) {
            uint256 j = _random(i + 1, i);

            // Swap memberList[i] with memberList[j]
            address temp = memberList[i];
            memberList[i] = memberList[j];
            memberList[j] = temp;
        }

        // Create groups from shuffled array
        for (uint256 i = 0; i < numCompleteGroups; i++) {
            address[5] memory group;

            for (uint256 j = 0; j < 5; j++) {
                uint256 memberIndex = i * 5 + j;
                address memberAddr = memberList[memberIndex];
                group[j] = memberAddr;
                members[memberAddr].groupId = i;
            }

            groups[i] = group;
            emit GroupAssigned(i, group);
        }

        totalGroups = numCompleteGroups;
        emit GroupsCreated(totalGroups, block.timestamp, randomSeed);

        return totalGroups;
    }

    /**
     * @notice Generate a pseudo-random number
     * @param max Maximum value (exclusive)
     * @param nonce Unique value for randomness
     * @return Random number between 0 and max-1
     */
    function _random(
        uint256 max,
        uint256 nonce
    ) private view returns (uint256) {
        return
            uint256(
                keccak256(abi.encodePacked(randomSeed, nonce, block.timestamp))
            ) % max;
    }

    /**
     * @notice Get members of a specific group
     * @param groupId ID of the group to retrieve
     * @return Array of 5 member addresses
     */
    function getGroup(
        uint256 groupId
    ) external view override returns (address[5] memory) {
        require(groupId < totalGroups, "Invalid group ID");
        return groups[groupId];
    }

    /**
     * @notice Get the group that the caller belongs to
     * @return group Array of 5 member addresses in the caller's group
     * @return groupId ID of the caller's group
     */
    function getMyGroup()
        external
        view
        override
        returns (address[5] memory group, uint256 groupId)
    {
        require(members[msg.sender].registered, "Not registered");
        require(groupingActive, "Groups not created yet");
        groupId = members[msg.sender].groupId;
        group = groups[groupId];
        return (group, groupId);
    }

    /**
     * @notice Get total number of registered members
     * @return Number of registered members
     */
    function getMemberCount() external view override returns (uint256) {
        return memberList.length;
    }

    /**
     * @notice Get total number of groups created
     * @return Number of groups
     */
    function getTotalGroups() external view override returns (uint256) {
        return totalGroups;
    }

    /**
     * @notice Check if grouping is currently active
     * @return True if groups have been created
     */
    function isGroupingActive() external view override returns (bool) {
        return groupingActive;
    }

    /**
     * @notice Reset the grouping system (owner only)
     * @dev Clears all group assignments but keeps member registrations
     */
    function resetGrouping() external override onlyOwner {
        require(groupingActive, "No active grouping");

        // Clear group assignments
        for (uint256 i = 0; i < memberList.length; i++) {
            members[memberList[i]].groupId = 0;
        }

        // Clear groups mapping
        for (uint256 i = 0; i < totalGroups; i++) {
            delete groups[i];
        }

        totalGroups = 0;
        groupingActive = false;
        randomSeed = 0;

        emit GroupingReset(block.timestamp);
    }
}
