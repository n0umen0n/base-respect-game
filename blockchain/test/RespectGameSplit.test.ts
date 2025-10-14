import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  RespectGameCore,
  RespectGameGovernance,
  RespectToken,
  Executor,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RespectGame - Split Architecture", function () {
  let respectGameCore: RespectGameCore;
  let respectGameGovernance: RespectGameGovernance;
  let respectToken: RespectToken;
  let executor: Executor;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let members: SignerWithAddress[];

  const MEMBERS_WITHOUT_APPROVAL = 10;
  const PERIODS_FOR_AVERAGE = 12;
  const RESPECT_DISTRIBUTION = [210000, 130000, 80000, 50000, 30000];
  const SUBMISSION_LENGTH = 10 * 60; // 10 minutes
  const RANKING_LENGTH = 10 * 60; // 10 minutes

  beforeEach(async function () {
    // Get signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    treasury = signers[1];
    members = signers.slice(2, 22); // Get 20 members for testing

    // Deploy RespectToken
    const RespectToken = await ethers.getContractFactory("RespectToken");
    respectToken = (await upgrades.deployProxy(
      RespectToken,
      [owner.address, "RESPECT", "RESPECT"],
      { initializer: "initialize", kind: "uups" }
    )) as unknown as RespectToken;
    await respectToken.waitForDeployment();

    // Deploy Executor (with temporary proposal manager - will be set to governance later)
    const Executor = await ethers.getContractFactory("Executor");
    executor = (await Executor.deploy(owner.address)) as unknown as Executor;
    await executor.waitForDeployment();

    // Deploy RespectGameCore
    const RespectGameCore = await ethers.getContractFactory("RespectGameCore");
    respectGameCore = (await upgrades.deployProxy(
      RespectGameCore,
      [
        owner.address,
        await respectToken.getAddress(),
        treasury.address,
        MEMBERS_WITHOUT_APPROVAL,
        PERIODS_FOR_AVERAGE,
        RESPECT_DISTRIBUTION,
        SUBMISSION_LENGTH,
        RANKING_LENGTH,
      ],
      { initializer: "initialize", kind: "uups" }
    )) as unknown as RespectGameCore;
    await respectGameCore.waitForDeployment();

    // Deploy RespectGameGovernance
    const RespectGameGovernance = await ethers.getContractFactory(
      "RespectGameGovernance"
    );
    respectGameGovernance = (await upgrades.deployProxy(
      RespectGameGovernance,
      [
        owner.address,
        await respectGameCore.getAddress(),
        await executor.getAddress(),
      ],
      { initializer: "initialize", kind: "uups" }
    )) as unknown as RespectGameGovernance;
    await respectGameGovernance.waitForDeployment();

    // Configure permissions
    await respectToken.addMinter(await respectGameCore.getAddress());
    await respectGameCore.setGovernanceContract(
      await respectGameGovernance.getAddress()
    );

    // Set governance as proposal manager (executor ownership stays with deployer for admin purposes)
    await executor.setProposalManager(await respectGameGovernance.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner for core", async function () {
      expect(await respectGameCore.owner()).to.equal(owner.address);
    });

    it("Should set the right owner for governance", async function () {
      expect(await respectGameGovernance.owner()).to.equal(owner.address);
    });

    it("Should initialize core with correct parameters", async function () {
      expect(await respectGameCore.membersWithoutApproval()).to.equal(
        MEMBERS_WITHOUT_APPROVAL
      );
      expect(await respectGameCore.periodsForAverage()).to.equal(
        PERIODS_FOR_AVERAGE
      );
      expect(await respectGameCore.currentGameNumber()).to.equal(1);
      expect(await respectGameCore.getCurrentStage()).to.equal(0); // ContributionSubmission
    });

    it("Should set correct RESPECT distribution", async function () {
      for (let i = 0; i < 5; i++) {
        expect(await respectGameCore.respectDistribution(i)).to.equal(
          RESPECT_DISTRIBUTION[i]
        );
      }
    });

    it("Should link governance to core", async function () {
      expect(await respectGameCore.governanceContract()).to.equal(
        await respectGameGovernance.getAddress()
      );
    });

    it("Should link core to governance", async function () {
      expect(await respectGameGovernance.coreContract()).to.equal(
        await respectGameCore.getAddress()
      );
    });
  });

  describe("Member Registration", function () {
    it("Should allow first 10 members to join without approval", async function () {
      for (let i = 0; i < 10; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );

        const member = await respectGameCore.getMember(members[i].address);
        expect(member.wallet).to.equal(members[i].address);
        expect(member.name).to.equal(`Member ${i}`);
        expect(member.isApproved).to.be.true;
      }

      expect(await respectGameCore.getApprovedMemberCount()).to.equal(10);
    });

    it("Should create proposal for 11th member", async function () {
      // First 10 members join automatically
      for (let i = 0; i < 10; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      // 11th member should create a proposal
      await respectGameCore
        .connect(members[10])
        .becomeMember(
          "Member 10",
          "https://profile10.com",
          "Description 10",
          "@member10"
        );

      const member = await respectGameCore.getMember(members[10].address);
      expect(member.wallet).to.equal(members[10].address);
      expect(member.isApproved).to.be.false;
    });

    it("Should not allow duplicate member registration", async function () {
      await respectGameCore
        .connect(members[0])
        .becomeMember(
          "Member 0",
          "https://profile0.com",
          "Description 0",
          "@member0"
        );

      await expect(
        respectGameCore
          .connect(members[0])
          .becomeMember(
            "Member 0 Again",
            "https://profile0.com",
            "Description 0",
            "@member0"
          )
      ).to.be.revertedWith("Already member");
    });
  });

  describe("Contribution Submission", function () {
    beforeEach(async function () {
      // Add 5 members
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }
    });

    it("Should allow approved members to submit contributions", async function () {
      await respectGameCore
        .connect(members[0])
        .submitContribution(
          ["Contribution 1", "Contribution 2"],
          ["https://link1.com", "https://link2.com"]
        );

      const contribution = await respectGameCore.getContribution(
        1,
        members[0].address
      );
      expect(contribution.contributions.length).to.equal(2);
      expect(contribution.contributions[0]).to.equal("Contribution 1");
      expect(contribution.links[0]).to.equal("https://link1.com");
    });

    it("Should not allow contribution during ranking stage", async function () {
      // Submit contribution first
      await respectGameCore
        .connect(members[0])
        .submitContribution(["Contribution 1"], ["https://link1.com"]);
      await respectGameCore
        .connect(members[1])
        .submitContribution(["Contribution 1"], ["https://link1.com"]);

      // Fast forward time and switch stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGameCore.switchStage();

      // Try to submit contribution during ranking
      await expect(
        respectGameCore
          .connect(members[2])
          .submitContribution(["Contribution 1"], ["https://link1.com"])
      ).to.be.revertedWith("Not submission stage");
    });

    it("Should not allow duplicate contribution submission", async function () {
      await respectGameCore
        .connect(members[0])
        .submitContribution(["Contribution 1"], ["https://link1.com"]);

      await expect(
        respectGameCore
          .connect(members[0])
          .submitContribution(["Contribution 2"], ["https://link2.com"])
      ).to.be.revertedWith("Already submitted for this game");
    });
  });

  describe("Stage Management", function () {
    beforeEach(async function () {
      // Add 5 members
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }
    });

    it("Should not switch stage before time", async function () {
      await expect(respectGameCore.switchStage()).to.be.revertedWith(
        "Too early to switch stage"
      );
    });

    it("Should switch from submission to ranking", async function () {
      // Submit contributions
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .submitContribution([`Contribution ${i}`], [`https://link${i}.com`]);
      }

      expect(await respectGameCore.getCurrentStage()).to.equal(0);

      // Fast forward and switch
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGameCore.switchStage();

      expect(await respectGameCore.getCurrentStage()).to.equal(1); // Ranking
    });
  });

  describe("Governance - Member Approval", function () {
    beforeEach(async function () {
      // Add 10 members (auto-approved)
      for (let i = 0; i < 10; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      // Submit contributions and complete a game to establish top members
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .submitContribution([`Contribution ${i}`], [`https://link${i}.com`]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGameCore.switchStage();

      // Submit rankings - get group from first member's perspective
      const group = await respectGameCore.connect(members[0]).getMyGroup(1);
      const groupMembers = [...group[0]]; // Create mutable copy

      for (let i = 0; i < groupMembers.length; i++) {
        const ranker = groupMembers[i];
        const rankerSigner = members.find((m) => m.address === ranker);
        if (rankerSigner) {
          await respectGameCore
            .connect(rankerSigner)
            .submitRanking(groupMembers);
        }
      }

      // Switch back to submission (completes game)
      await time.increase(RANKING_LENGTH + 1);
      await respectGameCore.switchStage();
    });

    it("Should allow top member to create approval proposal", async function () {
      // Add unapproved member
      await respectGameCore
        .connect(members[10])
        .becomeMember(
          "Member 10",
          "https://profile10.com",
          "Description 10",
          "@member10"
        );

      // Get a top member
      const topMembers = await respectGameCore.getTopMembers();
      const topMemberAddress = topMembers[0];
      const topMemberSigner = members.find(
        (m) => m.address === topMemberAddress
      );

      if (topMemberSigner) {
        const tx = await respectGameGovernance
          .connect(topMemberSigner)
          .createApproveMemberProposal(members[10].address, "Good candidate");

        expect(tx).to.emit(respectGameGovernance, "ProposalCreated");
      }
    });

    it("Should not allow non-top member to create proposal", async function () {
      // Add unapproved member
      await respectGameCore
        .connect(members[10])
        .becomeMember(
          "Member 10",
          "https://profile10.com",
          "Description 10",
          "@member10"
        );

      await expect(
        respectGameGovernance
          .connect(members[10])
          .createApproveMemberProposal(members[10].address, "Self approval")
      ).to.be.revertedWith("Not top");
    });
  });

  describe("Governance - Ban Member", function () {
    beforeEach(async function () {
      // Add 10 members
      for (let i = 0; i < 10; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      // Complete a game to establish top members
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .submitContribution([`Contribution ${i}`], [`https://link${i}.com`]);
      }

      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGameCore.switchStage();

      const group = await respectGameCore.connect(members[0]).getMyGroup(1);
      const groupMembers = [...group[0]]; // Create mutable copy

      for (let i = 0; i < groupMembers.length; i++) {
        const ranker = groupMembers[i];
        const rankerSigner = members.find((m) => m.address === ranker);
        if (rankerSigner) {
          await respectGameCore
            .connect(rankerSigner)
            .submitRanking(groupMembers);
        }
      }

      await time.increase(RANKING_LENGTH + 1);
      await respectGameCore.switchStage();
    });

    it("Should allow top member to create ban proposal", async function () {
      const topMembers = await respectGameCore.getTopMembers();
      const topMemberAddress = topMembers[0];
      const topMemberSigner = members.find(
        (m) => m.address === topMemberAddress
      );

      const memberToBan = members[9];

      if (topMemberSigner) {
        const tx = await respectGameGovernance
          .connect(topMemberSigner)
          .createBanProposal(memberToBan.address, "Violation of rules");

        expect(tx).to.emit(respectGameGovernance, "ProposalCreated");
      }
    });
  });

  describe("Full Game Cycle", function () {
    it("Should complete a full game cycle", async function () {
      // Add members
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      // Submit contributions
      for (let i = 0; i < 5; i++) {
        await respectGameCore
          .connect(members[i])
          .submitContribution([`Contribution ${i}`], [`https://link${i}.com`]);
      }

      // Switch to ranking
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGameCore.switchStage();

      // Submit rankings - get group from first member's perspective
      const group = await respectGameCore.connect(members[0]).getMyGroup(1);
      const groupMembers = [...group[0]]; // Create mutable copy

      for (let i = 0; i < groupMembers.length; i++) {
        const ranker = groupMembers[i];
        const rankerSigner = members.find((m) => m.address === ranker);
        if (rankerSigner) {
          await respectGameCore
            .connect(rankerSigner)
            .submitRanking(groupMembers);
        }
      }

      // Switch back to submission (completes game)
      await time.increase(RANKING_LENGTH + 1);
      await respectGameCore.switchStage();

      // Verify game moved to next
      expect(await respectGameCore.currentGameNumber()).to.equal(2);
      expect(await respectGameCore.getCurrentStage()).to.equal(0);

      // Verify RESPECT was distributed
      for (let i = 0; i < groupMembers.length; i++) {
        const member = groupMembers[i];
        const memberInfo = await respectGameCore.getMember(member);
        expect(memberInfo.totalRespectEarned).to.be.greaterThan(0);
      }
    });
  });
});
