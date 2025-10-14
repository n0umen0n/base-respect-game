// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./storage/RespectGameStorage.sol";
import "./interfaces/IRespectGameGovernance.sol";
import "./interfaces/IRespectGameCore.sol";
import "./interfaces/IExecutor.sol";

contract RespectGameGovernance is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    RespectGameStorage,
    IRespectGameGovernance
{
    // Reference to the core contract
    address public coreContract;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address _coreContract,
        address _executor
    ) external override initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        require(_coreContract != address(0), "Invalid core contract");
        coreContract = _coreContract;
        executor = _executor;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ==================== HELPER FUNCTIONS ====================

    /**
     * @notice Check if an address is a top member (from core contract)
     * @param member Address to check
     */
    function _isTopMember(address member) private view returns (bool) {
        return IRespectGameCore(coreContract).isTopMember(member);
    }

    /**
     * @notice Find member proposal index by candidate address
     * @param candidate Address of the candidate
     */
    function _findMemberProposalIndex(
        address candidate
    ) private view returns (uint256) {
        for (uint256 i = 0; i < memberProposals.length; i++) {
            if (
                memberProposals[i].candidate == candidate &&
                !memberProposals[i].executed
            ) {
                return i;
            }
        }
        revert("Member proposal not found");
    }

    // ==================== PROPOSAL FUNCTIONS ====================

    /**
     * @notice Create a proposal to ban a member
     * @param targetMember Address of member to ban
     * @param description Reason for banning
     */
    function createBanProposal(
        address targetMember,
        string calldata description
    ) external override returns (uint256) {
        require(_isTopMember(msg.sender), "Not top");

        // Get member info from core contract
        (address wallet, , , , , , bool isBanned, , ) = IRespectGameCore(
            coreContract
        ).getMember(targetMember);
        require(wallet != address(0), "Not member");
        require(!isBanned, "Banned");

        uint256 proposalId = proposals.length;

        Proposal storage newProposal = proposals.push();
        newProposal.id = proposalId;
        newProposal.proposalType = ProposalType.BanMember;
        newProposal.proposer = msg.sender;
        newProposal.targetMember = targetMember;
        newProposal.transferAmount = 0;
        newProposal.transferRecipient = address(0);
        newProposal.description = description;
        newProposal.createdAt = block.timestamp;
        newProposal.status = ProposalStatus.Pending;
        newProposal.votesFor = 0;
        newProposal.votesAgainst = 0;

        emit ProposalCreated(
            proposalId,
            uint8(ProposalType.BanMember),
            msg.sender,
            targetMember,
            description,
            block.timestamp
        );

        return proposalId;
    }

    /**
     * @notice Create a proposal to approve a member
     * @param targetMember Address of member to approve
     * @param description Reason for approval
     */
    function createApproveMemberProposal(
        address targetMember,
        string calldata description
    ) external override returns (uint256) {
        require(_isTopMember(msg.sender), "Not top");

        // Get member info from core contract
        (address wallet, , , , , bool isApproved, , , ) = IRespectGameCore(
            coreContract
        ).getMember(targetMember);
        require(wallet != address(0), "Not member");
        require(!isApproved, "Approved");

        uint256 proposalId = proposals.length;

        Proposal storage newProposal = proposals.push();
        newProposal.id = proposalId;
        newProposal.proposalType = ProposalType.ApproveMember;
        newProposal.proposer = msg.sender;
        newProposal.targetMember = targetMember;
        newProposal.transferAmount = 0;
        newProposal.transferRecipient = address(0);
        newProposal.description = description;
        newProposal.createdAt = block.timestamp;
        newProposal.status = ProposalStatus.Pending;
        newProposal.votesFor = 0;
        newProposal.votesAgainst = 0;

        emit ProposalCreated(
            proposalId,
            uint8(ProposalType.ApproveMember),
            msg.sender,
            targetMember,
            description,
            block.timestamp
        );

        return proposalId;
    }

    /**
     * @notice Create a proposal to execute arbitrary transactions through the executor
     * @param targets Array of target addresses
     * @param values Array of ETH values to send
     * @param calldatas Array of call data
     * @param description Reason for proposal
     */
    function createExecuteTransactionsProposal(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external override returns (uint256) {
        require(_isTopMember(msg.sender), "Not top");
        require(targets.length > 0, "No transactions");
        require(
            targets.length == values.length &&
                values.length == calldatas.length,
            "Length mismatch"
        );
        require(executor != address(0), "No executor");

        uint256 proposalId = proposals.length;

        Proposal storage newProposal = proposals.push();
        newProposal.id = proposalId;
        newProposal.proposalType = ProposalType.ExecuteTransactions;
        newProposal.proposer = msg.sender;
        newProposal.targetMember = address(0);
        newProposal.transferAmount = 0;
        newProposal.transferRecipient = address(0);
        newProposal.description = description;
        newProposal.createdAt = block.timestamp;
        newProposal.status = ProposalStatus.Pending;
        newProposal.votesFor = 0;
        newProposal.votesAgainst = 0;

        // Store transactions
        for (uint i = 0; i < targets.length; i++) {
            newProposal.transactions.push(
                Transaction({
                    target: targets[i],
                    value: values[i],
                    data: calldatas[i]
                })
            );
        }

        emit ProposalCreated(
            proposalId,
            uint8(ProposalType.ExecuteTransactions),
            msg.sender,
            address(0),
            description,
            block.timestamp
        );

        return proposalId;
    }

    /**
     * @notice Vote on a proposal
     * @param proposalId ID of the proposal
     * @param voteFor True to vote for, false to vote against
     */
    function voteOnProposal(
        uint256 proposalId,
        bool voteFor
    ) external override {
        require(proposalId < proposals.length, "Invalid");
        require(_isTopMember(msg.sender), "Not top");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "Not pending");
        require(!hasVoted[proposalId][msg.sender], "Voted");

        hasVoted[proposalId][msg.sender] = true;
        proposal.voters.push(msg.sender);

        if (voteFor) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        emit ProposalVoted(
            proposalId,
            msg.sender,
            voteFor,
            proposal.votesFor,
            proposal.votesAgainst
        );

        // Try to execute if threshold reached
        _tryExecuteProposal(proposalId);
    }

    /**
     * @notice Try to execute a proposal if it has enough votes
     * @param proposalId ID of the proposal
     * @dev Ban requires 3 votes, Approve requires 2 votes, Execute Transactions requires 4 votes
     */
    function _tryExecuteProposal(uint256 proposalId) private {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.status != ProposalStatus.Pending) {
            return;
        }

        bool shouldExecute = false;

        // Different thresholds for different proposal types
        if (proposal.proposalType == ProposalType.BanMember) {
            shouldExecute = proposal.votesFor >= 3;
        } else if (proposal.proposalType == ProposalType.ApproveMember) {
            shouldExecute = proposal.votesFor >= 2;
        } else if (proposal.proposalType == ProposalType.ExecuteTransactions) {
            shouldExecute = proposal.votesFor >= 4;
        }

        if (shouldExecute) {
            executeProposal(proposalId);
        }
    }

    /**
     * @notice Execute a proposal
     * @param proposalId ID of the proposal
     * @dev Ban requires 3 votes, Approve requires 2 votes, Execute Transactions requires 4 votes
     */
    function executeProposal(uint256 proposalId) public override {
        require(proposalId < proposals.length, "Invalid");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "Not pending");

        bool canExecute = false;

        if (proposal.proposalType == ProposalType.BanMember) {
            canExecute = proposal.votesFor >= 3;
            if (canExecute) {
                IRespectGameCore(coreContract).banMemberByGovernance(
                    proposal.targetMember
                );
            }
        } else if (proposal.proposalType == ProposalType.ApproveMember) {
            canExecute = proposal.votesFor >= 2;
            if (canExecute) {
                IRespectGameCore(coreContract).approveMemberByGovernance(
                    proposal.targetMember
                );
            }
        } else if (proposal.proposalType == ProposalType.ExecuteTransactions) {
            canExecute = proposal.votesFor >= 4;
            if (canExecute) {
                require(executor != address(0), "No executor");
                require(proposal.transactions.length > 0, "No transactions");

                // Convert transactions to executor format
                IExecutor.Transaction[]
                    memory execTransactions = new IExecutor.Transaction[](
                        proposal.transactions.length
                    );

                for (uint i = 0; i < proposal.transactions.length; i++) {
                    execTransactions[i] = IExecutor.Transaction({
                        target: proposal.transactions[i].target,
                        value: proposal.transactions[i].value,
                        data: proposal.transactions[i].data
                    });
                }

                // Execute through executor
                bool success = IExecutor(executor).executeTransactions(
                    execTransactions
                );
                require(success, "Execution failed");

                emit TransactionsExecuted(
                    proposalId,
                    proposal.transactions.length,
                    block.timestamp
                );
            }
        }

        require(canExecute, "Need votes");

        proposal.status = ProposalStatus.Executed;

        emit ProposalExecuted(
            proposalId,
            uint8(proposal.proposalType),
            block.timestamp
        );
    }

    /**
     * @notice Set the executor contract address
     * @param _executor Address of the executor contract
     * @dev Only owner can set the executor
     */
    function setExecutor(address _executor) external override onlyOwner {
        require(_executor != address(0), "Invalid executor");
        executor = _executor;
        emit ExecutorSet(_executor, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getProposal(
        uint256 proposalId
    )
        external
        view
        override
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
        )
    {
        require(proposalId < proposals.length, "Invalid");
        Proposal storage proposal = proposals[proposalId];

        return (
            uint8(proposal.proposalType),
            proposal.proposer,
            proposal.targetMember,
            proposal.transferAmount,
            proposal.transferRecipient,
            proposal.description,
            proposal.createdAt,
            uint8(proposal.status),
            proposal.votesFor,
            proposal.votesAgainst
        );
    }

    function getProposalTransactionCount(
        uint256 proposalId
    ) external view override returns (uint256) {
        require(proposalId < proposals.length, "Invalid");
        return proposals[proposalId].transactions.length;
    }

    function getProposalTransaction(
        uint256 proposalId,
        uint256 txIndex
    )
        external
        view
        override
        returns (address target, uint256 value, bytes memory data)
    {
        require(proposalId < proposals.length, "Invalid");
        require(
            txIndex < proposals[proposalId].transactions.length,
            "Invalid tx index"
        );

        Transaction storage txn = proposals[proposalId].transactions[txIndex];
        return (txn.target, txn.value, txn.data);
    }

    function getProposalCount() external view override returns (uint256) {
        return proposals.length;
    }
}
