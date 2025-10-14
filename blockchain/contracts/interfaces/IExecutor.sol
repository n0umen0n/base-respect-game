// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExecutor {
    struct Transaction {
        address target; // Target contract address
        uint256 value; // ETH value to send
        bytes data; // Call data
    }

    function executeTransactions(
        Transaction[] calldata transactions
    ) external returns (bool);

    function setProposalManager(address _proposalManager) external;
}
