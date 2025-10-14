// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RespectGameStorage {
    // ==================== ENUMS ====================

    enum Stage {
        ContributionSubmission,
        ContributionRanking
    }

    enum ProposalType {
        BanMember,
        ApproveMember,
        TreasuryTransfer,
        ExecuteTransactions // New type for arbitrary transaction execution
    }

    enum ProposalStatus {
        Pending,
        Executed,
        Rejected
    }

    // ==================== STRUCTS ====================

    struct Transaction {
        address target; // Target contract address
        uint256 value; // ETH value to send
        bytes data; // Call data
    }

    struct Member {
        address wallet;
        string name;
        string profileUrl;
        string description;
        string xAccount;
        bool isApproved;
        bool isBanned;
        uint256 joinedAt;
        uint256 totalRespectEarned;
        uint256 averageRespect; // Average over last 12 weeks
        uint256[] respectHistory; // RESPECT earned each game (last 12)
    }

    struct MemberProposal {
        address candidate;
        string name;
        string profileUrl;
        string description;
        string xAccount;
        uint256 createdAt;
        bool executed;
    }

    struct Contribution {
        address contributor;
        string[] contributions;
        string[] links;
        uint256 gameNumber;
        uint256 timestamp;
        bool counted; // Whether this contribution was counted in the game
    }

    struct Group {
        address[] members;
        uint256 gameNumber;
        bool finalized;
    }

    struct Ranking {
        address ranker;
        address[] rankedAddresses; // Ranked members in order
        uint256 gameNumber;
        uint256 groupId;
        uint256 timestamp;
    }

    struct GameResult {
        address member;
        uint256 rank; // 1 to N (where N is group size)
        uint256 respectEarned;
        uint256 gameNumber;
    }

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        address proposer;
        address targetMember;
        uint256 transferAmount;
        address transferRecipient;
        string description;
        uint256 createdAt;
        ProposalStatus status;
        address[] voters;
        uint256 votesFor;
        uint256 votesAgainst;
        Transaction[] transactions; // Array of transactions to execute
    }

    // ==================== STATE VARIABLES ====================

    // Configuration
    uint256 public membersWithoutApproval; // First N members join without approval
    uint256 public periodsForAverage; // Number of periods to calculate average (12)
    uint256[5] public respectDistribution; // RESPECT amounts for ranks 1-5
    uint256 public contributionSubmissionLength; // Duration in seconds
    uint256 public contributionRankingLength; // Duration in seconds

    // Game State
    uint256 public currentGameNumber;
    Stage public currentStage;
    uint256 public nextStageTimestamp;

    // Members
    mapping(address => Member) public members;
    address[] public memberList;
    uint256 public approvedMemberCount;
    address[6] public topSixMembers; // Top 6 by average RESPECT

    // Member Proposals
    MemberProposal[] public memberProposals;

    // Contributions
    mapping(uint256 => mapping(address => Contribution))
        public memberContributions; // gameNumber => member => contribution
    mapping(uint256 => address[]) public gameContributors; // gameNumber => list of contributors

    // Groups
    mapping(uint256 => mapping(uint256 => Group)) public groups; // gameNumber => groupId => Group
    mapping(uint256 => uint256) public gameTotalGroups; // gameNumber => total groups
    mapping(uint256 => mapping(address => uint256)) public memberGroupId; // gameNumber => member => groupId
    mapping(uint256 => mapping(uint256 => uint256)) public groupSizes; // gameNumber => groupId => size

    // Rankings
    mapping(uint256 => mapping(uint256 => mapping(address => Ranking)))
        public rankings; // gameNumber => groupId => ranker => Ranking
    mapping(uint256 => mapping(uint256 => address[])) public groupRankers; // gameNumber => groupId => list of rankers

    // Game Results
    mapping(uint256 => mapping(address => GameResult)) public gameResults; // gameNumber => member => result

    // Grouping Progress (for batch processing)
    uint256 public groupingBatchProgress;
    uint256 public rankingCalculationBatchProgress;
    uint256 public rankingCalculationGroupProgress;
    bool public isProcessingStageSwitch;

    // Random seed for grouping
    uint256 public randomSeed;

    // Proposals
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // proposalId => voter => hasVoted

    // RESPECT Token
    address public respectToken;

    // Treasury (deprecated - use executor instead)
    address public treasury;

    // Executor contract for treasury operations
    address public executor;

    // Governance contract (for split architecture)
    address public governanceContract;

    // ==================== STORAGE GAP ====================

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * Reduced from 50 to 48 after adding executor and governanceContract variables.
     */
    uint256[48] private __gap;
}
