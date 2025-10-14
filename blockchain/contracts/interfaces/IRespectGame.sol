// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRespectGame {
    // ==================== EVENTS ====================

    // Member Events
    event MemberJoined(
        address indexed member,
        string name,
        uint256 timestamp,
        bool autoApproved
    );
    event MemberProposalCreated(
        uint256 indexed proposalId,
        address indexed candidate,
        string name,
        uint256 timestamp
    );
    event MemberApproved(address indexed member, uint256 timestamp);
    event MemberBanned(address indexed member, uint256 timestamp);

    // Contribution Events
    event ContributionSubmitted(
        address indexed contributor,
        uint256 indexed gameNumber,
        string[] contributions,
        string[] links,
        uint256 timestamp
    );

    // Ranking Events
    event RankingSubmitted(
        address indexed ranker,
        uint256 indexed gameNumber,
        uint256 indexed groupId,
        address[] rankedAddresses,
        uint256 timestamp
    );

    // Group Events
    event GroupsCreated(
        uint256 indexed gameNumber,
        uint256 totalGroups,
        uint256 timestamp
    );
    event GroupAssigned(
        uint256 indexed gameNumber,
        uint256 indexed groupId,
        address[] members
    );

    // Game Events
    event StageChanged(
        uint256 indexed gameNumber,
        uint8 newStage,
        uint256 nextStageTimestamp,
        uint256 timestamp
    );
    event GameCompleted(
        uint256 indexed gameNumber,
        uint256 totalParticipants,
        uint256 timestamp
    );
    event RespectDistributed(
        address indexed member,
        uint256 indexed gameNumber,
        uint256 rank,
        uint256 respectAmount,
        uint256 newAverageRespect
    );

    // Proposal Events
    event ProposalCreated(
        uint256 indexed proposalId,
        uint8 proposalType,
        address indexed proposer,
        address indexed targetMember,
        string description,
        uint256 timestamp
    );
    event ProposalVoted(
        uint256 indexed proposalId,
        address indexed voter,
        bool voteFor,
        uint256 totalVotesFor,
        uint256 totalVotesAgainst
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        uint8 proposalType,
        uint256 timestamp
    );
    event ExecutorSet(address indexed executor, uint256 timestamp);
    event TransactionsExecuted(
        uint256 indexed proposalId,
        uint256 transactionCount,
        uint256 timestamp
    );

    // Top Members Update
    event TopMembersUpdated(address[6] topMembers, uint256 timestamp);

    // ==================== INITIALIZATION ====================

    function initialize(
        address initialOwner,
        address _respectToken,
        address _treasury,
        uint256 _membersWithoutApproval,
        uint256 _periodsForAverage,
        uint256[5] calldata _respectDistribution,
        uint256 _contributionSubmissionLength,
        uint256 _contributionRankingLength
    ) external;

    // ==================== MEMBER FUNCTIONS ====================

    function becomeMember(
        string calldata name,
        string calldata profileUrl,
        string calldata description,
        string calldata xAccount
    ) external;

    // ==================== CONTRIBUTION FUNCTIONS ====================

    function submitContribution(
        string[] calldata contributions,
        string[] calldata links
    ) external;

    // ==================== RANKING FUNCTIONS ====================

    function submitRanking(address[] calldata rankedAddresses) external;

    // ==================== STAGE MANAGEMENT ====================

    function switchStage() external;

    // ==================== PROPOSAL FUNCTIONS ====================

    function createBanProposal(
        address targetMember,
        string calldata description
    ) external returns (uint256);

    function createApproveMemberProposal(
        address targetMember,
        string calldata description
    ) external returns (uint256);

    function createExecuteTransactionsProposal(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external returns (uint256);

    function voteOnProposal(uint256 proposalId, bool voteFor) external;

    function executeProposal(uint256 proposalId) external;

    function setExecutor(address _executor) external;

    // ==================== VIEW FUNCTIONS ====================

    function getMember(
        address memberAddress
    )
        external
        view
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
        );

    function getMyGroup(
        uint256 gameNumber
    ) external view returns (address[] memory, uint256);

    function getGroup(
        uint256 gameNumber,
        uint256 groupId
    ) external view returns (address[] memory);

    function getContribution(
        uint256 gameNumber,
        address contributor
    )
        external
        view
        returns (string[] memory contributions, string[] memory links);

    function getGameResult(
        uint256 gameNumber,
        address member
    ) external view returns (uint256 rank, uint256 respectEarned);

    function getTopMembers() external view returns (address[6] memory);

    function getCurrentStage() external view returns (uint8);

    function getNextStageTimestamp() external view returns (uint256);

    function getMemberCount() external view returns (uint256);

    function getApprovedMemberCount() external view returns (uint256);

    function isTopMember(address member) external view returns (bool);

    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            uint8 proposalType,
            address proposer,
            address targetMember,
            uint256 transferAmount,
            address transferRecipient,
            string memory description,
            uint256 createdAt,
            uint8 status,
            uint256 votesFor,
            uint256 votesAgainst
        );

    function getProposalTransactionCount(
        uint256 proposalId
    ) external view returns (uint256);

    function getProposalTransaction(
        uint256 proposalId,
        uint256 txIndex
    ) external view returns (address target, uint256 value, bytes memory data);
}
