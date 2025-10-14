// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRespectGameGovernance {
    // ==================== EVENTS ====================

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

    // ==================== INITIALIZATION ====================

    function initialize(
        address initialOwner,
        address _coreContract,
        address _executor
    ) external;

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

    function getProposalCount() external view returns (uint256);
}
