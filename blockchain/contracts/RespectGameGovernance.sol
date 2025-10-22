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
     * @notice Create a proposal with arbitrary transactions
     * @param targets Array of target addresses
     * @param values Array of ETH values to send
     * @param calldatas Array of call data
     * @param description Reason for proposal
     * @return proposalId The ID of the created proposal
     *
     * @dev This is the ONLY function to create proposals. It can handle:
     *      - Ban Member: Call coreContract.banMemberByGovernance(address)
     *      - Approve Member: Call coreContract.approveMemberByGovernance(address)
     *      - Treasury Transfer: Call token.transfer(recipient, amount) or send ETH
     *      - Any other transaction: Execute arbitrary transactions through executor
     */
    function createProposal(
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

        uint256 proposalId = proposals.length;

        Proposal storage newProposal = proposals.push();
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
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

        // Determine proposal type and extract target member (reduces stack depth)
        (ProposalType pType, address targetMember) = _analyzeProposal(
            targets[0],
            calldatas[0]
        );
        newProposal.proposalType = pType;
        newProposal.targetMember = targetMember;

        // Emit detailed event with transaction data
        emit ProposalCreated(
            proposalId,
            uint8(pType),
            msg.sender,
            targetMember,
            targets,
            values,
            calldatas,
            description,
            block.timestamp
        );

        return proposalId;
    }

    /**
     * @notice Analyze proposal to determine type and extract target member
     * @param target First transaction target address
     * @param calldata_ First transaction calldata
     * @return pType The proposal type
     * @return targetMember The target member address (0x0 if not applicable)
     */
    function _analyzeProposal(
        address target,
        bytes calldata calldata_
    ) private view returns (ProposalType, address) {
        ProposalType pType = _determineProposalType(target, calldata_);
        address targetMember = address(0);

        if (
            pType == ProposalType.BanMember ||
            pType == ProposalType.ApproveMember
        ) {
            targetMember = _extractTargetMember(calldata_);
        }

        return (pType, targetMember);
    }

    /**
     * @notice Determine proposal type by analyzing transaction data
     * @param target First transaction target address
     * @param calldata_ First transaction calldata
     */
    function _determineProposalType(
        address target,
        bytes calldata calldata_
    ) private view returns (ProposalType) {
        // If target is coreContract, check the function selector
        if (target == coreContract && calldata_.length >= 4) {
            bytes4 selector = bytes4(calldata_[0:4]);

            // banMemberByGovernance(address) = 0x3c8463a1
            if (selector == 0x3c8463a1) {
                return ProposalType.BanMember;
            }
            // approveMemberByGovernance(address) = 0x9e75ab97
            if (selector == 0x9e75ab97) {
                return ProposalType.ApproveMember;
            }
        }

        // If target is executor, it's for treasury transfers or other operations
        if (target == executor || target != coreContract) {
            return ProposalType.ExecuteTransactions;
        }

        // Default to ExecuteTransactions for any other case
        return ProposalType.ExecuteTransactions;
    }

    /**
     * @notice Extract target member address from calldata
     * @param calldata_ Transaction calldata
     */
    function _extractTargetMember(
        bytes calldata calldata_
    ) private pure returns (address) {
        // Skip the 4-byte function selector and read the address parameter
        if (calldata_.length >= 36) {
            return address(uint160(uint256(bytes32(calldata_[4:36]))));
        }
        return address(0);
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
     */
    function executeProposal(uint256 proposalId) public override {
        require(proposalId < proposals.length, "Invalid");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "Not pending");
        require(proposal.transactions.length > 0, "No transactions");

        bool canExecute = false;

        // Check vote thresholds
        if (proposal.proposalType == ProposalType.BanMember) {
            canExecute = proposal.votesFor >= 3;
        } else if (proposal.proposalType == ProposalType.ApproveMember) {
            canExecute = proposal.votesFor >= 2;
        } else if (proposal.proposalType == ProposalType.ExecuteTransactions) {
            canExecute = proposal.votesFor >= 4;
        }

        require(canExecute, "Need votes");

        // Execute transactions based on type
        if (
            proposal.proposalType == ProposalType.BanMember ||
            proposal.proposalType == ProposalType.ApproveMember
        ) {
            // Direct execution for member operations (they call coreContract directly)
            Transaction storage txn = proposal.transactions[0];
            (bool success, ) = txn.target.call{value: txn.value}(txn.data);
            require(success, "Execution failed");
        } else if (proposal.proposalType == ProposalType.ExecuteTransactions) {
            // Execute through executor for treasury operations
            require(executor != address(0), "No executor");

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

    // ==================== LEGACY FUNCTIONS (For Backwards Compatibility) ====================

    /**
     * @notice Create a proposal to ban a member
     * @dev DEPRECATED: Use createProposal() instead
     * This function is kept for backwards compatibility and convenience
     */
    function createBanProposal(
        address targetMember,
        string calldata description
    ) external override returns (uint256) {
        // Encode the call to banMemberByGovernance(address)
        bytes memory callData = abi.encodeWithSignature(
            "banMemberByGovernance(address)",
            targetMember
        );

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = coreContract;
        values[0] = 0;
        calldatas[0] = callData;

        return this.createProposal(targets, values, calldatas, description);
    }

    /**
     * @notice Create a proposal to approve a member
     * @dev DEPRECATED: Use createProposal() instead
     * This function is kept for backwards compatibility and convenience
     */
    function createApproveMemberProposal(
        address targetMember,
        string calldata description
    ) external override returns (uint256) {
        // Encode the call to approveMemberByGovernance(address)
        bytes memory callData = abi.encodeWithSignature(
            "approveMemberByGovernance(address)",
            targetMember
        );

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = coreContract;
        values[0] = 0;
        calldatas[0] = callData;

        return this.createProposal(targets, values, calldatas, description);
    }

    /**
     * @notice Create a proposal to execute arbitrary transactions
     * @dev DEPRECATED: Use createProposal() instead
     * This function is kept for backwards compatibility and convenience
     */
    function createExecuteTransactionsProposal(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external override returns (uint256) {
        return this.createProposal(targets, values, calldatas, description);
    }
}
