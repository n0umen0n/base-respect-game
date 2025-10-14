import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  RespectGameImplementation,
  RespectToken,
  Executor,
} from "../typechain-types";

describe("RespectGame Governance System", function () {
  let respectGame: RespectGameImplementation;
  let respectToken: RespectToken;
  let executor: Executor;
  let owner: SignerWithAddress;
  let topMembers: SignerWithAddress[];
  let regularMember: SignerWithAddress;

  const WEEK = 7 * 24 * 60 * 60;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    // Top 6 members
    topMembers = signers.slice(1, 7);
    regularMember = signers[7];

    // Deploy RespectToken as proxy
    const RespectToken = await ethers.getContractFactory("RespectToken");
    const respectTokenProxy = await upgrades.deployProxy(
      RespectToken,
      [owner.address, "Respect Token", "RESPECT"],
      { initializer: "initialize", kind: "uups" }
    );
    await respectTokenProxy.waitForDeployment();
    respectToken = RespectToken.attach(
      await respectTokenProxy.getAddress()
    ) as RespectToken;

    // Deploy RespectGame
    const RespectGame = await ethers.getContractFactory(
      "RespectGameImplementation"
    );
    const respectGameProxy = await upgrades.deployProxy(
      RespectGame,
      [
        owner.address,
        await respectToken.getAddress(),
        ethers.ZeroAddress, // treasury (deprecated)
        6, // First 6 members without approval
        12, // Periods for average
        [100, 75, 50, 25, 10], // RESPECT distribution
        WEEK, // Contribution submission length
        WEEK, // Contribution ranking length
      ],
      { initializer: "initialize", kind: "uups" }
    );
    await respectGameProxy.waitForDeployment();

    respectGame = RespectGame.attach(
      await respectGameProxy.getAddress()
    ) as RespectGameImplementation;

    // Deploy Executor
    const Executor = await ethers.getContractFactory("Executor");
    executor = (await Executor.deploy(
      await respectGame.getAddress()
    )) as Executor;
    await executor.waitForDeployment();

    // Set minter for RespectToken
    await respectToken.addMinter(await respectGame.getAddress());

    // Set executor in RespectGame
    await respectGame.setExecutor(await executor.getAddress());

    // Register top 6 members (they get auto-approved)
    for (let i = 0; i < 6; i++) {
      await respectGame
        .connect(topMembers[i])
        .becomeMember(
          `Member ${i + 1}`,
          `https://profile${i + 1}.com`,
          `Description ${i + 1}`,
          `@member${i + 1}`
        );
    }

    // Fund the executor (treasury)
    await owner.sendTransaction({
      to: await executor.getAddress(),
      value: ethers.parseEther("10"),
    });

    // Run through one game cycle to populate top 6 members
    // Submit contributions for all members
    for (let i = 0; i < 6; i++) {
      await respectGame
        .connect(topMembers[i])
        .submitContribution(
          [`Contribution ${i + 1}`],
          [`https://link${i + 1}.com`]
        );
    }

    // Fast forward time to ranking stage
    await ethers.provider.send("evm_increaseTime", [WEEK]);
    await ethers.provider.send("evm_mine", []);

    // Switch to ranking stage
    await respectGame.switchStage();

    // Get group assignments and submit rankings
    for (let i = 0; i < 6; i++) {
      const [groupMembers, groupId] = await respectGame
        .connect(topMembers[i])
        .getMyGroup(1);

      // Convert to regular array and rank members in their group (just rank them in order)
      const membersArray = Array.from(groupMembers);
      await respectGame.connect(topMembers[i]).submitRanking(membersArray);
    }

    // Fast forward time to next submission stage
    await ethers.provider.send("evm_increaseTime", [WEEK]);
    await ethers.provider.send("evm_mine", []);

    // Switch to submission stage (calculates rankings and updates top 6)
    await respectGame.switchStage();
  });

  describe("Executor Setup", function () {
    it("Should have correct executor set", async function () {
      expect(await respectGame.executor()).to.equal(
        await executor.getAddress()
      );
    });

    it("Should have correct proposal manager in executor", async function () {
      expect(await executor.proposalManager()).to.equal(
        await respectGame.getAddress()
      );
    });

    it("Should have ETH in executor", async function () {
      const balance = await ethers.provider.getBalance(
        await executor.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Transaction Proposal Creation", function () {
    it("Should allow top member to create transaction proposal", async function () {
      const targetAddress = regularMember.address;
      const transferAmount = ethers.parseEther("1");

      // Create transaction to send ETH
      const targets = [targetAddress];
      const values = [transferAmount];
      const calldatas = ["0x"];

      const tx = await respectGame
        .connect(topMembers[0])
        .createExecuteTransactionsProposal(
          targets,
          values,
          calldatas,
          "Send 1 ETH to regular member"
        );

      const receipt = await tx.wait();

      // Check that the ProposalCreated event was emitted
      const event = receipt!.logs.find((log: any) => {
        try {
          const parsed = respectGame.interface.parseLog(log);
          return parsed && parsed.name === "ProposalCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should not allow non-top member to create transaction proposal", async function () {
      const targets = [regularMember.address];
      const values = [ethers.parseEther("1")];
      const calldatas = ["0x"];

      await expect(
        respectGame
          .connect(regularMember)
          .createExecuteTransactionsProposal(
            targets,
            values,
            calldatas,
            "Send 1 ETH to regular member"
          )
      ).to.be.revertedWith("Not top");
    });

    it("Should not allow empty transaction array", async function () {
      await expect(
        respectGame
          .connect(topMembers[0])
          .createExecuteTransactionsProposal([], [], [], "Empty proposal")
      ).to.be.revertedWith("No transactions");
    });
  });

  describe("Voting and Execution", function () {
    let proposalId: number;

    beforeEach(async function () {
      const targetAddress = regularMember.address;
      const transferAmount = ethers.parseEther("1");

      const targets = [targetAddress];
      const values = [transferAmount];
      const calldatas = ["0x"];

      const tx = await respectGame
        .connect(topMembers[0])
        .createExecuteTransactionsProposal(
          targets,
          values,
          calldatas,
          "Send 1 ETH to regular member"
        );
      await tx.wait();

      proposalId = 0;
    });

    it("Should require 4 votes to execute transactions", async function () {
      const initialBalance = await ethers.provider.getBalance(
        regularMember.address
      );

      // Vote with 3 members (not enough for execute transactions)
      for (let i = 0; i < 3; i++) {
        await respectGame
          .connect(topMembers[i])
          .voteOnProposal(proposalId, true);
      }

      // Check proposal is still pending
      const proposal = await respectGame.getProposal(proposalId);
      expect(proposal.status).to.equal(0); // Pending

      // Vote with 4th member (should execute - execute transactions needs 4)
      const voteTx = await respectGame
        .connect(topMembers[3])
        .voteOnProposal(proposalId, true);

      // Check that TransactionsExecuted event was emitted
      await expect(voteTx).to.emit(respectGame, "TransactionsExecuted");

      // Check proposal is executed
      const proposalAfter = await respectGame.getProposal(proposalId);
      expect(proposalAfter.status).to.equal(1); // Executed

      // Check ETH was transferred
      const finalBalance = await ethers.provider.getBalance(
        regularMember.address
      );
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
    });

    it("Should not allow non-top member to vote", async function () {
      await expect(
        respectGame.connect(regularMember).voteOnProposal(proposalId, true)
      ).to.be.revertedWith("Not top");
    });

    it("Should not allow double voting", async function () {
      await respectGame.connect(topMembers[0]).voteOnProposal(proposalId, true);

      await expect(
        respectGame.connect(topMembers[0]).voteOnProposal(proposalId, true)
      ).to.be.revertedWith("Voted");
    });

    it("Should execute multiple transactions in a proposal", async function () {
      // Create proposal with multiple transactions
      const targets = [
        topMembers[0].address,
        topMembers[1].address,
        topMembers[2].address,
      ];
      const values = [
        ethers.parseEther("0.5"),
        ethers.parseEther("0.3"),
        ethers.parseEther("0.2"),
      ];
      const calldatas = ["0x", "0x", "0x"];

      await respectGame
        .connect(topMembers[0])
        .createExecuteTransactionsProposal(
          targets,
          values,
          calldatas,
          "Multi-recipient payment"
        );

      const newProposalId = 1;

      const balancesBefore = await Promise.all([
        ethers.provider.getBalance(topMembers[0].address),
        ethers.provider.getBalance(topMembers[1].address),
        ethers.provider.getBalance(topMembers[2].address),
      ]);

      // Vote with 4 members to execute
      for (let i = 0; i < 4; i++) {
        await respectGame
          .connect(topMembers[i])
          .voteOnProposal(newProposalId, true);
      }

      const balancesAfter = await Promise.all([
        ethers.provider.getBalance(topMembers[0].address),
        ethers.provider.getBalance(topMembers[1].address),
        ethers.provider.getBalance(topMembers[2].address),
      ]);

      // Note: topMembers[0-3] balance includes gas costs from voting,
      // so we just check that they received at least the expected amount
      expect(balancesAfter[1] - balancesBefore[1]).to.be.greaterThan(
        ethers.parseEther("0.29") // Account for gas
      );
      expect(balancesAfter[2] - balancesBefore[2]).to.be.greaterThan(
        ethers.parseEther("0.19") // Account for gas
      );
    });
  });

  describe("Updated Ban/Approve Thresholds", function () {
    beforeEach(async function () {
      // Register a regular member
      await respectGame
        .connect(regularMember)
        .becomeMember(
          "Regular Member",
          "https://profile.com",
          "Regular description",
          "@regular"
        );
    });

    it("Should require 3 votes to ban a member", async function () {
      await respectGame
        .connect(topMembers[0])
        .createBanProposal(regularMember.address, "Violates rules");

      const proposalId = 0;

      // Vote with 2 members (not enough)
      for (let i = 0; i < 2; i++) {
        await respectGame
          .connect(topMembers[i])
          .voteOnProposal(proposalId, true);
      }

      let member = await respectGame.getMember(regularMember.address);
      expect(member.isBanned).to.be.false;

      // Vote with 3rd member (should execute)
      await respectGame.connect(topMembers[2]).voteOnProposal(proposalId, true);

      member = await respectGame.getMember(regularMember.address);
      expect(member.isBanned).to.be.true;
    });

    it("Should require 2 votes to approve a member", async function () {
      await respectGame
        .connect(topMembers[0])
        .createApproveMemberProposal(regularMember.address, "Good contributor");

      const proposalId = 0;

      // Vote with 1 member (not enough)
      await respectGame.connect(topMembers[0]).voteOnProposal(proposalId, true);

      let member = await respectGame.getMember(regularMember.address);
      expect(member.isApproved).to.be.false;

      // Vote with 2nd member (should execute)
      await respectGame.connect(topMembers[1]).voteOnProposal(proposalId, true);

      member = await respectGame.getMember(regularMember.address);
      expect(member.isApproved).to.be.true;
    });
  });

  describe("Proposal Retrieval", function () {
    it("Should return transaction count and details", async function () {
      const targets = [regularMember.address];
      const values = [ethers.parseEther("1")];
      const calldatas = ["0x"];

      await respectGame
        .connect(topMembers[0])
        .createExecuteTransactionsProposal(
          targets,
          values,
          calldatas,
          "Test proposal"
        );

      const proposal = await respectGame.getProposal(0);
      expect(proposal.proposalType).to.equal(3); // ExecuteTransactions

      const txCount = await respectGame.getProposalTransactionCount(0);
      expect(txCount).to.equal(1);

      const tx = await respectGame.getProposalTransaction(0, 0);
      expect(tx.target).to.equal(regularMember.address);
      expect(tx.value).to.equal(ethers.parseEther("1"));
      expect(tx.data).to.equal("0x");
    });

    it("Should return multiple transaction details", async function () {
      const targets = [topMembers[0].address, topMembers[1].address];
      const values = [ethers.parseEther("0.5"), ethers.parseEther("0.3")];
      const calldatas = ["0x", "0x"];

      await respectGame
        .connect(topMembers[0])
        .createExecuteTransactionsProposal(
          targets,
          values,
          calldatas,
          "Multi-tx proposal"
        );

      const txCount = await respectGame.getProposalTransactionCount(0);
      expect(txCount).to.equal(2);

      const tx0 = await respectGame.getProposalTransaction(0, 0);
      expect(tx0.target).to.equal(topMembers[0].address);
      expect(tx0.value).to.equal(ethers.parseEther("0.5"));

      const tx1 = await respectGame.getProposalTransaction(0, 1);
      expect(tx1.target).to.equal(topMembers[1].address);
      expect(tx1.value).to.equal(ethers.parseEther("0.3"));
    });
  });

  describe("Contract Interactions", function () {
    it("Should execute function calls on other contracts", async function () {
      // Deploy a simple mock contract to interact with
      const MockContract = await ethers.getContractFactory("RespectToken");
      const MockTokenProxy = await upgrades.deployProxy(
        MockContract,
        [owner.address, "Mock", "MCK"],
        { initializer: "initialize", kind: "uups" }
      );
      await MockTokenProxy.waitForDeployment();
      const mockToken = MockContract.attach(await MockTokenProxy.getAddress());

      await mockToken.addMinter(await executor.getAddress());

      // Create proposal to mint tokens to regularMember
      const mintAmount = ethers.parseEther("100");
      const mintCalldata = mockToken.interface.encodeFunctionData("mint", [
        regularMember.address,
        mintAmount,
      ]);

      const targets = [await mockToken.getAddress()];
      const values = [0];
      const calldatas = [mintCalldata];

      await respectGame
        .connect(topMembers[0])
        .createExecuteTransactionsProposal(
          targets,
          values,
          calldatas,
          "Mint mock tokens"
        );

      // Vote with 4 members
      for (let i = 0; i < 4; i++) {
        await respectGame.connect(topMembers[i]).voteOnProposal(0, true);
      }

      // Check tokens were minted
      const balance = await mockToken.balanceOf(regularMember.address);
      expect(balance).to.equal(mintAmount);
    });
  });
});
