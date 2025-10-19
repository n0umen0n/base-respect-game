// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./storage/RespectGameStorage.sol";
import "./interfaces/IRespectGameCore.sol";
import "./RespectToken.sol";

contract RespectGameCore is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    RespectGameStorage,
    IRespectGameCore
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address _respectToken,
        address _treasury,
        uint256 _membersWithoutApproval,
        uint256 _periodsForAverage,
        uint256[5] calldata _respectDistribution,
        uint256 _contributionSubmissionLength,
        uint256 _contributionRankingLength
    ) external override initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        respectToken = _respectToken;
        treasury = _treasury;
        membersWithoutApproval = _membersWithoutApproval;
        periodsForAverage = _periodsForAverage;
        respectDistribution = _respectDistribution;
        contributionSubmissionLength = _contributionSubmissionLength;
        contributionRankingLength = _contributionRankingLength;

        currentGameNumber = 1;
        currentStage = Stage.ContributionSubmission;
        nextStageTimestamp = block.timestamp + _contributionSubmissionLength;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ==================== GOVERNANCE MANAGEMENT ====================

    /**
     * @notice Set the governance contract address
     * @param _governance Address of the governance contract
     * @dev Only owner can set the governance contract
     */
    function setGovernanceContract(
        address _governance
    ) external override onlyOwner {
        require(_governance != address(0), "Invalid governance");
        governanceContract = _governance;
        emit GovernanceContractSet(_governance, block.timestamp);
    }

    /**
     * @notice Modifier to restrict access to governance contract
     */
    modifier onlyGovernance() {
        require(
            msg.sender == governanceContract,
            "Only governance can call this"
        );
        _;
    }

    // ==================== MEMBER FUNCTIONS ====================

    /**
     * @notice Become a member of the Respect Game
     * @param name Member's name
     * @param profileUrl Member's profile URL
     * @param description Member's description
     * @param xAccount Member's X (Twitter) account
     */
    function becomeMember(
        string calldata name,
        string calldata profileUrl,
        string calldata description,
        string calldata xAccount
    ) external override {
        require(members[msg.sender].wallet == address(0), "Already member");
        require(bytes(name).length > 0, "Name required");

        // First N members join automatically
        if (memberList.length < membersWithoutApproval) {
            members[msg.sender] = Member({
                wallet: msg.sender,
                name: name,
                profileUrl: profileUrl,
                description: description,
                xAccount: xAccount,
                isApproved: true,
                isBanned: false,
                joinedAt: block.timestamp,
                totalRespectEarned: 0,
                averageRespect: 0,
                respectHistory: new uint256[](0)
            });

            memberList.push(msg.sender);
            approvedMemberCount++;

            emit MemberJoined(
                msg.sender,
                name,
                profileUrl,
                description,
                xAccount,
                block.timestamp,
                true
            );
        } else {
            // Create proposal for new member
            memberProposals.push(
                MemberProposal({
                    candidate: msg.sender,
                    name: name,
                    profileUrl: profileUrl,
                    description: description,
                    xAccount: xAccount,
                    createdAt: block.timestamp,
                    executed: false
                })
            );

            // Add as unapproved member
            members[msg.sender] = Member({
                wallet: msg.sender,
                name: name,
                profileUrl: profileUrl,
                description: description,
                xAccount: xAccount,
                isApproved: false,
                isBanned: false,
                joinedAt: block.timestamp,
                totalRespectEarned: 0,
                averageRespect: 0,
                respectHistory: new uint256[](0)
            });

            memberList.push(msg.sender);

            emit MemberProposalCreated(
                memberProposals.length - 1,
                msg.sender,
                name,
                block.timestamp
            );
            emit MemberJoined(
                msg.sender,
                name,
                profileUrl,
                description,
                xAccount,
                block.timestamp,
                false
            );
        }
    }

    /**
     * @notice Approve a member (called by governance contract)
     * @param member Address of member to approve
     */
    function approveMemberByGovernance(
        address member
    ) external override onlyGovernance {
        require(members[member].wallet != address(0), "Not member");
        require(!members[member].isApproved, "Already approved");

        members[member].isApproved = true;
        approvedMemberCount++;

        // Mark corresponding proposal as executed
        for (uint256 i = 0; i < memberProposals.length; i++) {
            if (
                memberProposals[i].candidate == member &&
                !memberProposals[i].executed
            ) {
                memberProposals[i].executed = true;
                break;
            }
        }

        emit MemberApproved(member, block.timestamp);
    }

    /**
     * @notice Ban a member (called by governance contract)
     * @param member Address of member to ban
     */
    // function banMemberByGovernance(
    //     address member
    // ) external override onlyGovernance {
    //     require(members[member].wallet != address(0), "Not member");
    //     require(!members[member].isBanned, "Already banned");

    //     members[member].isBanned = true;
    //     members[member].averageRespect = 0;

    //     // Clear respect history
    //     delete members[member].respectHistory;

    //     emit MemberBanned(member, block.timestamp);
    // }

    /**
     * @notice Remove a member completely from the system (called by owner)
     * @param member Address of member to remove
     * @dev This will delete all member-related data from storage
     */
    function removeMember(address member) external onlyOwner {
        require(members[member].wallet != address(0), "Not a member");

        // Decrement approved member count if they were approved
        if (members[member].isApproved) {
            approvedMemberCount--;
        }

        // Remove from memberList array
        for (uint256 i = 0; i < memberList.length; i++) {
            if (memberList[i] == member) {
                memberList[i] = memberList[memberList.length - 1];
                memberList.pop();
                break;
            }
        }

        // Remove from topSixMembers if present
        for (uint256 i = 0; i < 6; i++) {
            if (topSixMembers[i] == member) {
                topSixMembers[i] = address(0);
                break;
            }
        }

        // Delete member data
        delete members[member];

        // Note: We don't delete historical game data (contributions, rankings, results)
        // as this would require iterating through potentially thousands of games
        // and would be extremely gas-intensive. Historical data can remain.

        emit MemberRemoved(member, block.timestamp);
    }

    // ==================== CONTRIBUTION FUNCTIONS ====================

    /**
     * @notice Submit a contribution for the current game
     * @param contributions Array of contribution descriptions
     * @param links Array of contribution links
     */
    function submitContribution(
        string[] calldata contributions,
        string[] calldata links
    ) external override {
        require(
            currentStage == Stage.ContributionSubmission,
            "Not submission stage"
        );
        require(contributions.length > 0, "No contributions");
        require(contributions.length == links.length, "Length mismatch");

        // Anyone can submit, but only members get counted
        bool isMember = members[msg.sender].wallet != address(0);

        // Check if already submitted for this game
        if (isMember && members[msg.sender].isApproved) {
            require(
                memberContributions[currentGameNumber][msg.sender]
                    .contributor == address(0),
                "Already submitted for this game"
            );
        }

        // Store contribution
        memberContributions[currentGameNumber][msg.sender] = Contribution({
            contributor: msg.sender,
            contributions: contributions,
            links: links,
            gameNumber: currentGameNumber,
            timestamp: block.timestamp,
            counted: isMember &&
                members[msg.sender].isApproved &&
                !members[msg.sender].isBanned
        });

        // Add to contributors list if approved member
        if (
            isMember &&
            members[msg.sender].isApproved &&
            !members[msg.sender].isBanned
        ) {
            gameContributors[currentGameNumber].push(msg.sender);
        }

        emit ContributionSubmitted(
            msg.sender,
            currentGameNumber,
            contributions,
            links,
            block.timestamp
        );
    }

    // ==================== RANKING FUNCTIONS ====================

    /**
     * @notice Submit rankings for your group
     * @param rankedAddresses Array of addresses ranked from 1st to last
     */
    function submitRanking(
        address[] calldata rankedAddresses
    ) external override {
        require(currentStage == Stage.ContributionRanking, "Not ranking");
        require(members[msg.sender].isApproved, "Not approved");
        require(!members[msg.sender].isBanned, "Banned");

        // Get member's group
        uint256 groupId = memberGroupId[currentGameNumber][msg.sender];
        Group storage group = groups[currentGameNumber][groupId];
        uint256 groupSize = group.members.length;

        require(groupSize > 0, "No group");
        require(rankedAddresses.length == groupSize, "Wrong count");

        // Verify msg.sender is in the group
        bool inGroup = false;
        for (uint256 i = 0; i < groupSize; i++) {
            if (group.members[i] == msg.sender) {
                inGroup = true;
                break;
            }
        }
        require(inGroup, "Not in this group");

        // Verify all ranked addresses are in the group
        for (uint256 i = 0; i < rankedAddresses.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < groupSize; j++) {
                if (rankedAddresses[i] == group.members[j]) {
                    found = true;
                    break;
                }
            }
            require(found, "Not in group");
        }

        // Check for duplicates in ranking
        for (uint256 i = 0; i < rankedAddresses.length; i++) {
            for (uint256 j = i + 1; j < rankedAddresses.length; j++) {
                require(
                    rankedAddresses[i] != rankedAddresses[j],
                    "Duplicate rankings"
                );
            }
        }

        // Check if already submitted ranking
        require(
            rankings[currentGameNumber][groupId][msg.sender].ranker ==
                address(0),
            "Already submitted ranking"
        );

        // Store ranking
        address[] memory rankedArray = new address[](rankedAddresses.length);
        for (uint256 i = 0; i < rankedAddresses.length; i++) {
            rankedArray[i] = rankedAddresses[i];
        }

        rankings[currentGameNumber][groupId][msg.sender] = Ranking({
            ranker: msg.sender,
            rankedAddresses: rankedArray,
            gameNumber: currentGameNumber,
            groupId: groupId,
            timestamp: block.timestamp
        });

        groupRankers[currentGameNumber][groupId].push(msg.sender);

        emit RankingSubmitted(
            msg.sender,
            currentGameNumber,
            groupId,
            rankedArray,
            block.timestamp
        );
    }

    // ==================== STAGE MANAGEMENT ====================

    /**
     * @notice Switch between contribution and ranking stages
     * @dev Can be called multiple times to process batches
     */
    function switchStage() external override {
        require(
            block.timestamp >= nextStageTimestamp,
            "Too early to switch stage"
        );

        if (currentStage == Stage.ContributionSubmission) {
            _switchToRankingStage();
        } else {
            _switchToSubmissionStage();
        }
    }

    /**
     * @notice Switch from contribution submission to ranking stage
     */
    function _switchToRankingStage() private {
        // If not processing yet, start processing
        if (!isProcessingStageSwitch) {
            isProcessingStageSwitch = true;
            groupingBatchProgress = 0;

            // Get all contributors for this game
            address[] memory allContributors = gameContributors[
                currentGameNumber
            ];

            // If only 1 contributor, skip to next game
            if (allContributors.length == 1) {
                emit GameCompleted(currentGameNumber, 1, block.timestamp);

                // Move to next game immediately
                currentGameNumber++;
                currentStage = Stage.ContributionSubmission;
                nextStageTimestamp =
                    block.timestamp +
                    contributionSubmissionLength;
                isProcessingStageSwitch = false;

                emit StageChanged(
                    currentGameNumber,
                    uint8(currentStage),
                    nextStageTimestamp,
                    block.timestamp
                );
                return;
            }

            require(allContributors.length >= 2, "Need 2+");
        }

        // Process grouping in batches (process up to 400 members per call)
        uint256 contributorsLength = gameContributors[currentGameNumber].length;
        uint256 remainingMembers = contributorsLength - groupingBatchProgress;

        if (remainingMembers > 0) {
            // If this is the first batch, shuffle the contributors
            if (groupingBatchProgress == 0) {
                _shuffleContributors(currentGameNumber);
            }

            // Load contributors AFTER shuffling
            address[] memory contributors = gameContributors[currentGameNumber];

            // Calculate group sizes
            uint256[] memory groupSizesArray = _calculateGroupSizes(
                contributorsLength
            );

            // Process groups in batches
            uint256 currentIndex = groupingBatchProgress;
            uint256 membersProcessedInBatch = 0;
            uint256 currentGroupId = 0;

            // Find which group to start from based on progress
            uint256 accountedMembers = 0;
            for (uint256 g = 0; g < groupSizesArray.length; g++) {
                if (accountedMembers + groupSizesArray[g] <= currentIndex) {
                    accountedMembers += groupSizesArray[g];
                    currentGroupId++;
                } else {
                    break;
                }
            }

            // Create groups
            for (uint256 g = currentGroupId; g < groupSizesArray.length; g++) {
                uint256 groupSize = groupSizesArray[g];

                // Check if we can process this group in this batch
                if (membersProcessedInBatch + groupSize > 400) {
                    break; // Wait for next batch
                }

                // Create dynamic array for group members
                address[] memory groupMembers = new address[](groupSize);

                for (uint256 j = 0; j < groupSize; j++) {
                    if (currentIndex >= contributors.length) break;
                    groupMembers[j] = contributors[currentIndex];
                    memberGroupId[currentGameNumber][
                        contributors[currentIndex]
                    ] = g;
                    currentIndex++;
                    membersProcessedInBatch++;
                }

                groups[currentGameNumber][g] = Group({
                    members: groupMembers,
                    gameNumber: currentGameNumber,
                    finalized: false
                });

                groupSizes[currentGameNumber][g] = groupSize;

                emit GroupAssigned(currentGameNumber, g, groupMembers);
            }

            groupingBatchProgress = currentIndex;

            // Check if grouping is complete
            if (groupingBatchProgress >= contributors.length) {
                uint256 totalGroups = groupSizesArray.length;
                gameTotalGroups[currentGameNumber] = totalGroups;

                emit GroupsCreated(
                    currentGameNumber,
                    totalGroups,
                    block.timestamp
                );

                // Finish processing
                isProcessingStageSwitch = false;
                currentStage = Stage.ContributionRanking;
                nextStageTimestamp =
                    block.timestamp +
                    contributionRankingLength;

                emit StageChanged(
                    currentGameNumber,
                    uint8(currentStage),
                    nextStageTimestamp,
                    block.timestamp
                );
            }
        }
    }

    /**
     * @notice Switch from ranking stage to contribution submission stage
     */
    function _switchToSubmissionStage() private {
        // If not processing yet, start processing
        if (!isProcessingStageSwitch) {
            isProcessingStageSwitch = true;
            rankingCalculationGroupProgress = 0;
        }

        uint256 totalGroups = gameTotalGroups[currentGameNumber];

        // Special case: If no groups were created, skip to next game immediately
        if (totalGroups == 0) {
            emit GameCompleted(currentGameNumber, 0, block.timestamp);

            // Move to next game
            currentGameNumber++;
            currentStage = Stage.ContributionSubmission;
            nextStageTimestamp = block.timestamp + contributionSubmissionLength;
            isProcessingStageSwitch = false;

            emit StageChanged(
                currentGameNumber,
                uint8(currentStage),
                nextStageTimestamp,
                block.timestamp
            );
            return;
        }

        // Process ranking calculation in batches (process up to 20 groups per call)
        uint256 remainingGroups = totalGroups - rankingCalculationGroupProgress;

        if (remainingGroups > 0) {
            uint256 batchSize = remainingGroups > 20 ? 20 : remainingGroups;
            uint256 endGroupId = rankingCalculationGroupProgress + batchSize;

            for (
                uint256 groupId = rankingCalculationGroupProgress;
                groupId < endGroupId;
                groupId++
            ) {
                _calculateGroupRankings(currentGameNumber, groupId);
            }

            rankingCalculationGroupProgress = endGroupId;

            // Check if all groups processed
            if (rankingCalculationGroupProgress >= totalGroups) {
                // Update top 6 members
                _updateTopMembers();

                emit GameCompleted(
                    currentGameNumber,
                    gameContributors[currentGameNumber].length,
                    block.timestamp
                );

                // Move to next game
                currentGameNumber++;
                currentStage = Stage.ContributionSubmission;
                nextStageTimestamp =
                    block.timestamp +
                    contributionSubmissionLength;
                isProcessingStageSwitch = false;

                emit StageChanged(
                    currentGameNumber,
                    uint8(currentStage),
                    nextStageTimestamp,
                    block.timestamp
                );
            }
        }
    }

    /**
     * @notice Calculate optimal group sizes for N contributors
     * @param totalMembers Total number of members to distribute
     * @return groupSizesArray Array of group sizes
     */
    function _calculateGroupSizes(
        uint256 totalMembers
    ) private pure returns (uint256[] memory) {
        require(totalMembers >= 2, "Need 2+");

        uint256[] memory groupSizesArray;

        // Special cases for small numbers
        if (totalMembers <= 5) {
            // Single group
            groupSizesArray = new uint256[](1);
            groupSizesArray[0] = totalMembers;
            return groupSizesArray;
        }

        // For 6+ members, distribute evenly
        // Calculate number of groups (aim for 3-5 members per group)
        uint256 numGroups;

        if (totalMembers == 6) {
            // 6 members: 2 groups of 3
            numGroups = 2;
        } else if (totalMembers == 7) {
            // 7 members: groups of 3, 4
            numGroups = 2;
        } else if (totalMembers == 8) {
            // 8 members: 2 groups of 4
            numGroups = 2;
        } else if (totalMembers == 9) {
            // 9 members: groups of 4, 5
            numGroups = 2;
        } else {
            // For 10+: try to create groups of ~5 members
            numGroups = (totalMembers + 4) / 5; // Round up division

            // Ensure no group is smaller than 2
            while (numGroups > 1 && totalMembers / numGroups < 2) {
                numGroups--;
            }
        }

        groupSizesArray = new uint256[](numGroups);

        // Distribute members evenly
        uint256 baseSize = totalMembers / numGroups;
        uint256 remainder = totalMembers % numGroups;

        for (uint256 i = 0; i < numGroups; i++) {
            // Distribute remainder to first groups
            groupSizesArray[i] = baseSize + (i < remainder ? 1 : 0);
        }

        return groupSizesArray;
    }

    /**
     * @notice Shuffle contributors using Fisher-Yates algorithm
     * @param gameNumber Game number to shuffle contributors for
     */
    function _shuffleContributors(uint256 gameNumber) private {
        address[] storage contributors = gameContributors[gameNumber];

        // Generate random seed
        randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    block.number,
                    msg.sender,
                    contributors.length
                )
            )
        );

        // Fisher-Yates shuffle
        for (uint256 i = contributors.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(randomSeed, i))) %
                (i + 1);

            address temp = contributors[i];
            contributors[i] = contributors[j];
            contributors[j] = temp;
        }
    }

    /**
     * @notice Calculate rankings for a group using shared submission algorithm
     * Based on: https://james-mart.medium.com/fractal-governance-a-shared-submission-algorithm-311a3039b219
     * @param gameNumber Game number
     * @param groupId Group ID
     */
    function _calculateGroupRankings(
        uint256 gameNumber,
        uint256 groupId
    ) private {
        Group storage group = groups[gameNumber][groupId];
        address[] memory rankers = groupRankers[gameNumber][groupId];
        uint256 groupSize = group.members.length;

        // If no rankings submitted, skip this group (no RESPECT distributed)
        if (rankers.length == 0) {
            group.finalized = true;
            return;
        }

        // Calculate transient scores using shared submission algorithm
        // T = mean(rankings) * consensus_term
        // consensus_term = 1 - (variance / max_variance)

        address[] memory sortedMembers = new address[](groupSize);
        uint256[] memory transientScores = new uint256[](groupSize);

        // Copy members
        for (uint256 i = 0; i < groupSize; i++) {
            sortedMembers[i] = group.members[i];
        }

        // For each member, collect all their rankings and calculate transient score
        for (uint256 m = 0; m < groupSize; m++) {
            address member = sortedMembers[m];
            uint256[] memory memberRankings = new uint256[](rankers.length);

            // Collect all rankings for this member (1-indexed ranks)
            for (uint256 r = 0; r < rankers.length; r++) {
                Ranking storage ranking = rankings[gameNumber][groupId][
                    rankers[r]
                ];

                // Find where this member was ranked
                for (uint256 pos = 0; pos < groupSize; pos++) {
                    if (ranking.rankedAddresses[pos] == member) {
                        memberRankings[r] = pos + 1; // Store as 1-indexed rank
                        break;
                    }
                }
            }

            // Calculate transient score for this member
            transientScores[m] = _calculateTransientScore(
                memberRankings,
                groupSize
            );
        }

        // Sort by transient score (HIGHER is better)
        for (uint256 i = 0; i < groupSize; i++) {
            for (uint256 j = i + 1; j < groupSize; j++) {
                if (transientScores[i] < transientScores[j]) {
                    // Swap scores
                    uint256 tempScore = transientScores[i];
                    transientScores[i] = transientScores[j];
                    transientScores[j] = tempScore;

                    // Swap members
                    address tempMember = sortedMembers[i];
                    sortedMembers[i] = sortedMembers[j];
                    sortedMembers[j] = tempMember;
                }
            }
        }

        // Distribute RESPECT based on final rankings
        for (uint256 rank = 0; rank < groupSize; rank++) {
            address member = sortedMembers[rank];
            uint256 respectAmount = _getRespectForRank(rank, groupSize);

            // Mint RESPECT tokens
            RespectToken(respectToken).mint(member, respectAmount);

            // Update member stats
            members[member].totalRespectEarned += respectAmount;
            members[member].respectHistory.push(respectAmount);

            // Keep only last N periods for average calculation
            if (members[member].respectHistory.length > periodsForAverage) {
                // Remove oldest entry
                for (
                    uint256 i = 0;
                    i < members[member].respectHistory.length - 1;
                    i++
                ) {
                    members[member].respectHistory[i] = members[member]
                        .respectHistory[i + 1];
                }
                members[member].respectHistory.pop();
            }

            // Calculate new average
            uint256 sum = 0;
            for (
                uint256 i = 0;
                i < members[member].respectHistory.length;
                i++
            ) {
                sum += members[member].respectHistory[i];
            }
            uint256 newAverage = sum / periodsForAverage;
            members[member].averageRespect = newAverage;

            // Store game result
            gameResults[gameNumber][member] = GameResult({
                member: member,
                rank: rank + 1,
                respectEarned: respectAmount,
                gameNumber: gameNumber
            });

            emit RespectDistributed(
                member,
                gameNumber,
                rank + 1,
                respectAmount,
                newAverage
            );
        }

        group.finalized = true;
    }

    /**
     * @notice Calculate transient score for a member based on their rankings
     * Formula: T = mean(rankings) * consensus_term
     * Where consensus_term = 1 - (variance / max_variance)
     * Based on: https://james-mart.medium.com/fractal-governance-a-shared-submission-algorithm-311a3039b219
     * @param rankings Array of rankings this member received (1-indexed)
     * @param groupSize Size of the group
     * @return Transient score (scaled by 1000 for precision)
     */
    function _calculateTransientScore(
        uint256[] memory rankings,
        uint256 groupSize
    ) private pure returns (uint256) {
        uint256 len = rankings.length;
        if (len == 0) return 0;

        // Calculate sum and mean (scaled by 1000)
        uint256 sum = 0;
        for (uint256 i = 0; i < len; i++) {
            sum += rankings[i];
        }
        uint256 meanScaled = (sum * 1000) / len;

        // Calculate variance sum (without scaling for efficiency)
        uint256 varSum = 0;
        for (uint256 i = 0; i < len; i++) {
            uint256 rankScaled = rankings[i] * 1000;
            int256 diff = int256(rankScaled) - int256(meanScaled);
            varSum += uint256(diff * diff);
        }
        uint256 variance = varSum / (len * 1000);

        // MaxVar(G) = (G³ - G) / 12, scaled by 1000
        uint256 G = groupSize;
        uint256 maxVar = ((G * G * G - G) * 1000) / 12;

        // Consensus term (scaled by 1000)
        uint256 consensus = variance >= maxVar
            ? 0
            : 1000 - ((variance * 1000) / maxVar);

        // Transient score: invert mean (lower rank = better) and apply consensus
        uint256 invertedMean = ((groupSize + 1) * 1000) - meanScaled;
        return (invertedMean * consensus) / 1000;
    }

    /**
     * @notice Get RESPECT amount for a given rank in a group of given size
     * @param rank 0-indexed rank (0 = 1st place)
     * @param groupSize Size of the group (2-5)
     * @return RESPECT amount
     */
    function _getRespectForRank(
        uint256 rank,
        uint256 groupSize
    ) private view returns (uint256) {
        // Map rank to respectDistribution index based on group size
        // Always use the first N indices for a group of size N
        // Group of 2: ranks [0, 1] -> indices [0, 1] -> 210000, 130000
        // Group of 3: ranks [0, 1, 2] -> indices [0, 1, 2] -> 210000, 130000, 80000
        // Group of 4: ranks [0, 1, 2, 3] -> indices [0, 1, 2, 3] -> 210000, 130000, 80000, 50000
        // Group of 5: ranks [0, 1, 2, 3, 4] -> indices [0, 1, 2, 3, 4] -> 210000, 130000, 80000, 50000, 30000

        // Simply return the distribution at the rank index, scaled by 10^18 for ERC20 decimals
        return respectDistribution[rank] * 10 ** 18;
    }

    /**
     * @notice Update the top 6 members by average RESPECT
     */
    function _updateTopMembers() private {
        // Simple selection of top 6 (can be optimized for large member lists)
        address[6] memory newTopSix;
        uint256[6] memory topAverages;

        for (uint256 i = 0; i < memberList.length; i++) {
            address member = memberList[i];

            if (!members[member].isApproved || members[member].isBanned) {
                continue;
            }

            uint256 avg = members[member].averageRespect;

            // Check if this member belongs in top 6
            for (uint256 j = 0; j < 6; j++) {
                if (avg > topAverages[j]) {
                    // Shift lower members down
                    for (uint256 k = 5; k > j; k--) {
                        newTopSix[k] = newTopSix[k - 1];
                        topAverages[k] = topAverages[k - 1];
                    }

                    newTopSix[j] = member;
                    topAverages[j] = avg;
                    break;
                }
            }
        }

        topSixMembers = newTopSix;
        emit TopMembersUpdated(newTopSix, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getMember(
        address memberAddress
    )
        external
        view
        override
        returns (
            address wallet,
            string memory name,
            string memory profileUrl,
            string memory description,
            string memory xAccount,
            bool isApproved,
            bool isBanned,
            uint256 totalRespectEarned,
            uint256 averageRespect
        )
    {
        Member storage member = members[memberAddress];
        return (
            member.wallet,
            member.name,
            member.profileUrl,
            member.description,
            member.xAccount,
            member.isApproved,
            member.isBanned,
            member.totalRespectEarned,
            member.averageRespect
        );
    }

    function getMyGroup(
        uint256 gameNumber
    ) external view override returns (address[] memory, uint256) {
        require(members[msg.sender].isApproved, "Not approved");
        uint256 groupId = memberGroupId[gameNumber][msg.sender];
        return (groups[gameNumber][groupId].members, groupId);
    }

    function getGroup(
        uint256 gameNumber,
        uint256 groupId
    ) external view override returns (address[] memory) {
        return groups[gameNumber][groupId].members;
    }

    // function getContribution(
    //     uint256 gameNumber,
    //     address contributor
    // )
    //     external
    //     view
    //     override
    //     returns (string[] memory contributions, string[] memory links)
    // {
    //     Contribution storage contribution = memberContributions[gameNumber][
    //         contributor
    //     ];
    //     return (contribution.contributions, contribution.links);
    // }

    function getGameResult(
        uint256 gameNumber,
        address member
    ) external view override returns (uint256 rank, uint256 respectEarned) {
        GameResult storage result = gameResults[gameNumber][member];
        return (result.rank, result.respectEarned);
    }

    function getTopMembers()
        external
        view
        override
        returns (address[6] memory)
    {
        return topSixMembers;
    }

    function getCurrentStage() external view override returns (uint8) {
        return uint8(currentStage);
    }

    function getNextStageTimestamp() external view override returns (uint256) {
        return nextStageTimestamp;
    }

    // function getMemberCount() external view override returns (uint256) {
    //     return memberList.length;
    // }

    // function getApprovedMemberCount() external view override returns (uint256) {
    //     return approvedMemberCount;
    // }

    function isTopMember(address member) public view override returns (bool) {
        for (uint256 i = 0; i < 6; i++) {
            if (topSixMembers[i] == member) {
                return true;
            }
        }
        return false;
    }
}
