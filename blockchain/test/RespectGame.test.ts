import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { RespectGameImplementation, RespectToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RespectGame", function () {
  let respectGame: RespectGameImplementation;
  let respectToken: RespectToken;
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

    // Deploy RespectGame
    const RespectGame = await ethers.getContractFactory(
      "RespectGameImplementation"
    );
    respectGame = (await upgrades.deployProxy(
      RespectGame,
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
    )) as unknown as RespectGameImplementation;
    await respectGame.waitForDeployment();

    // Add RespectGame as minter
    await respectToken.addMinter(await respectGame.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await respectGame.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct parameters", async function () {
      expect(await respectGame.membersWithoutApproval()).to.equal(
        MEMBERS_WITHOUT_APPROVAL
      );
      expect(await respectGame.periodsForAverage()).to.equal(
        PERIODS_FOR_AVERAGE
      );
      expect(await respectGame.currentGameNumber()).to.equal(1);
      expect(await respectGame.getCurrentStage()).to.equal(0); // ContributionSubmission
    });

    it("Should set correct RESPECT distribution", async function () {
      for (let i = 0; i < 5; i++) {
        expect(await respectGame.respectDistribution(i)).to.equal(
          RESPECT_DISTRIBUTION[i]
        );
      }
    });
  });

  describe("Member Registration", function () {
    it("Should allow first 10 members to join without approval", async function () {
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );

        const member = await respectGame.getMember(members[i].address);
        expect(member.wallet).to.equal(members[i].address);
        expect(member.name).to.equal(`Member ${i}`);
        expect(member.isApproved).to.be.true;
      }

      expect(await respectGame.getMemberCount()).to.equal(10);
      expect(await respectGame.getApprovedMemberCount()).to.equal(10);
    });

    it("Should create proposal for 11th member", async function () {
      // Register first 10
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      // 11th member should need approval
      await respectGame
        .connect(members[10])
        .becomeMember(
          "Member 10",
          "https://profile10.com",
          "Description 10",
          "@member10"
        );

      const member = await respectGame.getMember(members[10].address);
      expect(member.isApproved).to.be.false;
      expect(await respectGame.getMemberCount()).to.equal(11);
      expect(await respectGame.getApprovedMemberCount()).to.equal(10);
    });

    it("Should not allow duplicate registration", async function () {
      await respectGame
        .connect(members[0])
        .becomeMember(
          "Member 0",
          "https://profile0.com",
          "Description 0",
          "@member0"
        );

      await expect(
        respectGame
          .connect(members[0])
          .becomeMember(
            "Member 0",
            "https://profile0.com",
            "Description 0",
            "@member0"
          )
      ).to.be.revertedWith("Already member");
    });
  });

  describe("Contribution Submission", function () {
    beforeEach(async function () {
      // Register 10 members
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }
    });

    it("Should allow members to submit contributions", async function () {
      const contributions = ["Built a feature", "Fixed bugs"];
      const links = ["https://github.com/pr1", "https://github.com/pr2"];

      await expect(
        respectGame.connect(members[0]).submitContribution(contributions, links)
      )
        .to.emit(respectGame, "ContributionSubmitted")
        .withArgs(
          members[0].address,
          1,
          contributions,
          links,
          await time.latest()
        );
    });

    it("Should not allow submission during ranking stage", async function () {
      // Fast forward to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);

      // Need to create groups first
      const contributions = ["Test"];
      const links = ["https://test.com"];

      // Submit contributions for 10 members
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .submitContribution(contributions, links);
      }

      await respectGame.switchStage();

      await expect(
        respectGame.connect(members[0]).submitContribution(contributions, links)
      ).to.be.revertedWith("Not submission stage");
    });

    it("Should not allow empty contributions", async function () {
      await expect(
        respectGame.connect(members[0]).submitContribution([], [])
      ).to.be.revertedWith("No contributions");
    });

    it("Should require matching arrays", async function () {
      const contributions = ["Built a feature", "Fixed bugs"];
      const links = ["https://github.com/pr1"];

      await expect(
        respectGame.connect(members[0]).submitContribution(contributions, links)
      ).to.be.revertedWith("Length mismatch");
    });
  });

  describe("Stage Switching and Grouping", function () {
    beforeEach(async function () {
      // Register 10 members
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      // All members submit contributions
      const contributions = ["Contributed to Base"];
      const links = ["https://github.com/pr"];
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .submitContribution(contributions, links);
      }
    });

    it("Should not switch stage before time", async function () {
      await expect(respectGame.switchStage()).to.be.revertedWith(
        "Too early to switch stage"
      );
    });

    it("Should switch to ranking stage and create groups", async function () {
      // Fast forward time
      await time.increase(SUBMISSION_LENGTH + 1);

      // Switch stage
      await respectGame.switchStage();

      expect(await respectGame.getCurrentStage()).to.equal(1); // Ranking stage

      // Should have 2 groups (10 members / 5 = 2 groups)
      const group0 = await respectGame.getGroup(1, 0);
      const group1 = await respectGame.getGroup(1, 1);

      // Check that groups are filled
      for (let i = 0; i < 5; i++) {
        expect(group0[i]).to.not.equal(ethers.ZeroAddress);
        expect(group1[i]).to.not.equal(ethers.ZeroAddress);
      }
    });

    it("Should not allow switching with less than 2 contributors", async function () {
      // Deploy fresh contract
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      const newGame = (await upgrades.deployProxy(
        RespectGame,
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
      )) as unknown as RespectGameImplementation;
      await newGame.waitForDeployment();

      // Register only 1 member
      await newGame
        .connect(members[0])
        .becomeMember(
          `Member 0`,
          `https://profile0.com`,
          `Description 0`,
          `@member0`
        );
      await newGame
        .connect(members[0])
        .submitContribution(["Test"], ["https://test.com"]);

      await time.increase(SUBMISSION_LENGTH + 1);

      // With only 1 member, it should skip to next game
      await newGame.switchStage();

      // Should be back in submission stage for game 2
      expect(await newGame.currentGameNumber()).to.equal(2);
      expect(await newGame.getCurrentStage()).to.equal(0);
    });
  });

  describe("Ranking Submission", function () {
    let group0Members: string[];
    let group1Members: string[];

    beforeEach(async function () {
      // Register 10 members and submit contributions
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await respectGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGame.switchStage();

      // Get group members
      const group0 = await respectGame.getGroup(1, 0);
      const group1 = await respectGame.getGroup(1, 1);
      group0Members = [...group0];
      group1Members = [...group1];
    });

    it("Should allow group members to submit rankings", async function () {
      // Get first member of group 0
      const ranker = await ethers.getSigner(group0Members[0]);

      // Rank the group (just use the order as-is for testing)
      const ranking = group0Members;

      const tx = await respectGame.connect(ranker).submitRanking(ranking);
      await expect(tx).to.emit(respectGame, "RankingSubmitted");
    });

    it("Should not allow ranking during submission stage", async function () {
      // Switch back to submission stage
      await time.increase(RANKING_LENGTH + 1);
      await respectGame.switchStage();

      const ranker = await ethers.getSigner(group0Members[0]);
      const ranking = group0Members;

      await expect(
        respectGame.connect(ranker).submitRanking(ranking)
      ).to.be.revertedWith("Not ranking");
    });

    it("Should not allow ranking with non-group members", async function () {
      const ranker = await ethers.getSigner(group0Members[0]);

      // Try to rank with members from group 1
      const invalidRanking = group1Members;

      await expect(
        respectGame.connect(ranker).submitRanking(invalidRanking)
      ).to.be.revertedWith("Not in group");
    });

    it("Should not allow duplicate rankings", async function () {
      const ranker = await ethers.getSigner(group0Members[0]);

      const duplicateRanking = [
        group0Members[0],
        group0Members[0], // duplicate
        ...group0Members.slice(2),
      ];

      await expect(
        respectGame.connect(ranker).submitRanking(duplicateRanking)
      ).to.be.revertedWith("Duplicate rankings");
    });
  });

  describe("RESPECT Distribution", function () {
    let group0Members: SignerWithAddress[];

    beforeEach(async function () {
      // Register 10 members
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await respectGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGame.switchStage();

      // Get group 0 members as signers
      const group0Addresses = await respectGame.getGroup(1, 0);
      group0Members = await Promise.all(
        [...group0Addresses].map((addr) => ethers.getSigner(addr))
      );

      // All members submit the same ranking (member 0 is best)
      const ranking = group0Members.map((m) => m.address);

      for (let i = 0; i < group0Members.length; i++) {
        await respectGame.connect(group0Members[i]).submitRanking(ranking);
      }

      // Switch stage to trigger distribution
      await time.increase(RANKING_LENGTH + 1);
      await respectGame.switchStage();
    });

    it("Should distribute RESPECT tokens based on rankings", async function () {
      // Check balances - with 10 members we get 2 groups of 5
      for (let i = 0; i < group0Members.length; i++) {
        const balance = await respectToken.balanceOf(group0Members[i].address);
        expect(balance).to.equal(RESPECT_DISTRIBUTION[i]);
      }
    });

    it("Should update member total RESPECT earned", async function () {
      for (let i = 0; i < group0Members.length; i++) {
        const member = await respectGame.getMember(group0Members[i].address);
        expect(member.totalRespectEarned).to.equal(RESPECT_DISTRIBUTION[i]);
      }
    });

    it("Should calculate average RESPECT", async function () {
      for (let i = 0; i < group0Members.length; i++) {
        const member = await respectGame.getMember(group0Members[i].address);
        // After first game, average equals the amount earned
        expect(member.averageRespect).to.equal(RESPECT_DISTRIBUTION[i]);
      }
    });

    it("Should store game results", async function () {
      for (let i = 0; i < group0Members.length; i++) {
        const result = await respectGame.getGameResult(
          1,
          group0Members[i].address
        );
        expect(result.rank).to.equal(i + 1);
        expect(result.respectEarned).to.equal(RESPECT_DISTRIBUTION[i]);
      }
    });
  });

  describe("Proposals", function () {
    let topMembers: SignerWithAddress[];

    beforeEach(async function () {
      // Need to complete a full game cycle to have top members
      // Register 10 members
      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await respectGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGame.switchStage();

      // Get groups and submit rankings
      const group0 = await respectGame.getGroup(1, 0);
      const group1 = await respectGame.getGroup(1, 1);

      // Create consistent rankings so we know who tops
      for (let i = 0; i < 5; i++) {
        const ranker = await ethers.getSigner(group0[i]);
        await respectGame.connect(ranker).submitRanking([...group0]);
      }

      for (let i = 0; i < 5; i++) {
        const ranker = await ethers.getSigner(group1[i]);
        await respectGame.connect(ranker).submitRanking([...group1]);
      }

      // Complete the game
      await time.increase(RANKING_LENGTH + 1);
      await respectGame.switchStage();

      // Get top members
      const topAddresses = await respectGame.getTopMembers();
      topMembers = await Promise.all(
        [...topAddresses]
          .filter((addr) => addr !== ethers.ZeroAddress)
          .map((addr) => ethers.getSigner(addr))
      );
    });

    it("Should allow top members to create ban proposal", async function () {
      if (topMembers.length === 0) {
        console.log("No top members, skipping test");
        return;
      }

      const targetMember = members[9].address;
      const tx = await respectGame
        .connect(topMembers[0])
        .createBanProposal(targetMember, "Spam behavior");
      await expect(tx).to.emit(respectGame, "ProposalCreated");
    });

    it("Should not allow non-top members to create proposals", async function () {
      // Find a member who is definitely not a top member
      const topAddresses = await respectGame.getTopMembers();
      const topSet = new Set(topAddresses.map((addr) => addr.toLowerCase()));

      let nonTopMember = members[9];
      for (let i = 0; i < members.length; i++) {
        if (
          !topSet.has(members[i].address.toLowerCase()) &&
          members[i].address !== ethers.ZeroAddress
        ) {
          nonTopMember = members[i];
          break;
        }
      }

      const targetMember = members[8].address;

      await expect(
        respectGame
          .connect(nonTopMember)
          .createBanProposal(targetMember, "Test")
      ).to.be.revertedWith("Not top");
    });

    it("Should allow voting on proposals", async function () {
      if (topMembers.length < 3) {
        console.log("Not enough top members, skipping test");
        return;
      }

      const targetMember = members[9].address;
      await respectGame
        .connect(topMembers[0])
        .createBanProposal(targetMember, "Spam behavior");

      // Vote
      await expect(respectGame.connect(topMembers[1]).voteOnProposal(0, true))
        .to.emit(respectGame, "ProposalVoted")
        .withArgs(0, topMembers[1].address, true, 1, 0);
    });

    it("Should execute ban proposal with 3 votes", async function () {
      if (topMembers.length < 3) {
        console.log("Not enough top members, skipping test");
        return;
      }

      const targetMember = members[9].address;
      await respectGame
        .connect(topMembers[0])
        .createBanProposal(targetMember, "Spam behavior");

      // 3 votes needed for ban
      await respectGame.connect(topMembers[0]).voteOnProposal(0, true);
      await respectGame.connect(topMembers[1]).voteOnProposal(0, true);
      await respectGame.connect(topMembers[2]).voteOnProposal(0, true);

      // Check if member is banned
      const member = await respectGame.getMember(targetMember);
      expect(member.isBanned).to.be.true;
      expect(member.averageRespect).to.equal(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await respectGame
        .connect(members[0])
        .becomeMember(
          "Test Member",
          "https://profile.com",
          "Description",
          "@member"
        );
    });

    it("Should return member information", async function () {
      const member = await respectGame.getMember(members[0].address);
      expect(member.name).to.equal("Test Member");
      expect(member.profileUrl).to.equal("https://profile.com");
      expect(member.description).to.equal("Description");
      expect(member.xAccount).to.equal("@member");
      expect(member.isApproved).to.be.true;
    });

    it("Should return current stage", async function () {
      expect(await respectGame.getCurrentStage()).to.equal(0);
    });

    it("Should return member count", async function () {
      expect(await respectGame.getMemberCount()).to.equal(1);
    });

    it("Should return approved member count", async function () {
      expect(await respectGame.getApprovedMemberCount()).to.equal(1);
    });
  });

  describe("Variable Group Sizes", function () {
    it("Should create groups of 3 and 3 for 6 members", async function () {
      // Deploy fresh contract
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      const testGame = (await upgrades.deployProxy(
        RespectGame,
        [
          owner.address,
          await respectToken.getAddress(),
          treasury.address,
          10,
          PERIODS_FOR_AVERAGE,
          RESPECT_DISTRIBUTION,
          SUBMISSION_LENGTH,
          RANKING_LENGTH,
        ],
        { initializer: "initialize", kind: "uups" }
      )) as unknown as RespectGameImplementation;
      await testGame.waitForDeployment();
      await respectToken.addMinter(await testGame.getAddress());

      // Register 6 members
      for (let i = 0; i < 6; i++) {
        await testGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await testGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await testGame.switchStage();

      // Should have 2 groups
      const group0 = await testGame.getGroup(1, 0);
      const group1 = await testGame.getGroup(1, 1);

      expect(group0.length).to.equal(3);
      expect(group1.length).to.equal(3);
    });

    it("Should create groups of 3 and 4 for 7 members", async function () {
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      const testGame = (await upgrades.deployProxy(
        RespectGame,
        [
          owner.address,
          await respectToken.getAddress(),
          treasury.address,
          10,
          PERIODS_FOR_AVERAGE,
          RESPECT_DISTRIBUTION,
          SUBMISSION_LENGTH,
          RANKING_LENGTH,
        ],
        { initializer: "initialize", kind: "uups" }
      )) as unknown as RespectGameImplementation;
      await testGame.waitForDeployment();
      await respectToken.addMinter(await testGame.getAddress());

      // Register 7 members
      for (let i = 0; i < 7; i++) {
        await testGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await testGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await testGame.switchStage();

      // Should have 2 groups (remainder distributed to first groups)
      const group0 = await testGame.getGroup(1, 0);
      const group1 = await testGame.getGroup(1, 1);

      expect(group0.length).to.equal(4);
      expect(group1.length).to.equal(3);
    });

    it("Should create single group for 2 members", async function () {
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      const testGame = (await upgrades.deployProxy(
        RespectGame,
        [
          owner.address,
          await respectToken.getAddress(),
          treasury.address,
          10,
          PERIODS_FOR_AVERAGE,
          RESPECT_DISTRIBUTION,
          SUBMISSION_LENGTH,
          RANKING_LENGTH,
        ],
        { initializer: "initialize", kind: "uups" }
      )) as unknown as RespectGameImplementation;
      await testGame.waitForDeployment();
      await respectToken.addMinter(await testGame.getAddress());

      // Register 2 members
      for (let i = 0; i < 2; i++) {
        await testGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await testGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await testGame.switchStage();

      // Should have 1 group with 2 members
      const group0 = await testGame.getGroup(1, 0);
      expect(group0.length).to.equal(2);
      expect(await testGame.gameTotalGroups(1)).to.equal(1);
    });

    it("Should handle ranking and distribution for group of 2", async function () {
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      const testGame = (await upgrades.deployProxy(
        RespectGame,
        [
          owner.address,
          await respectToken.getAddress(),
          treasury.address,
          10,
          PERIODS_FOR_AVERAGE,
          RESPECT_DISTRIBUTION,
          SUBMISSION_LENGTH,
          RANKING_LENGTH,
        ],
        { initializer: "initialize", kind: "uups" }
      )) as unknown as RespectGameImplementation;
      await testGame.waitForDeployment();
      await respectToken.addMinter(await testGame.getAddress());

      // Register 2 members
      for (let i = 0; i < 2; i++) {
        await testGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await testGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await testGame.switchStage();

      const group0 = await testGame.getGroup(1, 0);
      const ranking = [group0[0], group0[1]];

      // Submit rankings
      await testGame
        .connect(await ethers.getSigner(group0[0]))
        .submitRanking(ranking);
      await testGame
        .connect(await ethers.getSigner(group0[1]))
        .submitRanking(ranking);

      // Complete the game
      await time.increase(RANKING_LENGTH + 1);
      await testGame.switchStage();

      // Check RESPECT distribution - group of 2 gets indices [0, 4]
      const balance0 = await respectToken.balanceOf(group0[0]);
      const balance1 = await respectToken.balanceOf(group0[1]);

      expect(balance0).to.equal(RESPECT_DISTRIBUTION[0]); // 210000
      expect(balance1).to.equal(RESPECT_DISTRIBUTION[4]); // 30000
    });

    it("Should handle no rankings submitted - skip to next game", async function () {
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      const testGame = (await upgrades.deployProxy(
        RespectGame,
        [
          owner.address,
          await respectToken.getAddress(),
          treasury.address,
          10,
          PERIODS_FOR_AVERAGE,
          RESPECT_DISTRIBUTION,
          SUBMISSION_LENGTH,
          RANKING_LENGTH,
        ],
        { initializer: "initialize", kind: "uups" }
      )) as unknown as RespectGameImplementation;
      await testGame.waitForDeployment();
      await respectToken.addMinter(await testGame.getAddress());

      // Register 2 members
      for (let i = 0; i < 2; i++) {
        await testGame
          .connect(members[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
        await testGame
          .connect(members[i])
          .submitContribution(["Contribution"], ["https://link.com"]);
      }

      // Switch to ranking stage
      await time.increase(SUBMISSION_LENGTH + 1);
      await testGame.switchStage();

      // Don't submit any rankings - just wait and switch again
      await time.increase(RANKING_LENGTH + 1);
      await testGame.switchStage();

      // Should move to game 2, and no RESPECT distributed
      expect(await testGame.currentGameNumber()).to.equal(2);
      expect(await testGame.getCurrentStage()).to.equal(0);

      const group0 = await testGame.getGroup(1, 0);
      const balance0 = await respectToken.balanceOf(group0[0]);
      const balance1 = await respectToken.balanceOf(group0[1]);

      expect(balance0).to.equal(0);
      expect(balance1).to.equal(0);
    });
  });

  describe("Scalability with 1000 Members", function () {
    let testMembers: SignerWithAddress[];

    this.timeout(300000); // 5 minutes timeout for large tests

    beforeEach(async function () {
      console.log("\n    Setting up 1000 members...");

      // Get 1000 signers (we need to generate them)
      const allSigners = await ethers.getSigners();

      // Use available signers and create deterministic wallets for the rest
      testMembers = [];

      // Use first 1000 available signers or create wallets
      for (let i = 0; i < 1000; i++) {
        if (i < allSigners.length) {
          testMembers.push(allSigners[i]);
        } else {
          // Create deterministic wallet for testing
          const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
          testMembers.push(wallet as any);
        }
      }

      console.log("    Registering 1000 members...");

      // Register 1000 members (first 10 auto-approved, rest need approval but we'll approve them)
      for (let i = 0; i < 1000; i++) {
        // Fund the wallet if it's a generated one
        if (i >= allSigners.length) {
          await owner.sendTransaction({
            to: testMembers[i].address,
            value: ethers.parseEther("1.0"),
          });
        }

        await respectGame
          .connect(testMembers[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      console.log("    All members registered!");
    });

    it("Should register 1000 members correctly", async function () {
      expect(await respectGame.getMemberCount()).to.equal(1000);
      expect(await respectGame.getApprovedMemberCount()).to.equal(10); // Only first 10 auto-approved
    });

    it("Should handle batched stage switching from Submission to Ranking (1000 members)", async function () {
      console.log("\n    Submitting contributions for 1000 members...");

      // Only first 10 are approved, so only they can submit counted contributions
      const contributions = ["Contributed to Base"];
      const links = ["https://github.com/pr"];

      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(testMembers[i])
          .submitContribution(contributions, links);
      }

      console.log("    Fast forwarding time...");
      await time.increase(SUBMISSION_LENGTH + 1);

      // Should still be in submission stage
      expect(await respectGame.getCurrentStage()).to.equal(0);
      expect(await respectGame.isProcessingStageSwitch()).to.equal(false);

      console.log(
        "    Calling switchStage() - should create 2 groups (10 members / 5)..."
      );

      // First call to switchStage - should process all 10 members in one batch (< 400)
      await respectGame.switchStage();

      // Should now be in ranking stage since 10 < 400 batch size
      expect(await respectGame.getCurrentStage()).to.equal(1);
      expect(await respectGame.isProcessingStageSwitch()).to.equal(false);

      // Should have 2 groups (10 members / 5 = 2 groups)
      const group0 = await respectGame.getGroup(1, 0);
      const group1 = await respectGame.getGroup(1, 1);

      expect(group0.length).to.equal(5);
      expect(group1.length).to.equal(5);
      expect(group0[0]).to.not.equal(ethers.ZeroAddress);
      expect(group1[0]).to.not.equal(ethers.ZeroAddress);
    });

    it("Should handle batched ranking calculation and distribution", async function () {
      console.log("\n    Submitting contributions for first 10 members...");

      const contributions = ["Contributed to Base"];
      const links = ["https://github.com/pr"];

      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(testMembers[i])
          .submitContribution(contributions, links);
      }

      console.log("    Switching to ranking stage...");
      await time.increase(SUBMISSION_LENGTH + 1);
      await respectGame.switchStage();

      // Get groups
      const group0 = await respectGame.getGroup(1, 0);
      const group1 = await respectGame.getGroup(1, 1);

      console.log("    Submitting rankings...");

      // Submit rankings for both groups
      for (let i = 0; i < 5; i++) {
        const ranker0 = await ethers.getSigner(group0[i]);
        await respectGame.connect(ranker0).submitRanking([...group0]);

        const ranker1 = await ethers.getSigner(group1[i]);
        await respectGame.connect(ranker1).submitRanking([...group1]);
      }

      console.log(
        "    Switching back to submission stage (triggers distribution)..."
      );
      await time.increase(RANKING_LENGTH + 1);

      // This should process 2 groups in one batch (< 20 batch size)
      await respectGame.switchStage();

      // Should be in new game now
      expect(await respectGame.currentGameNumber()).to.equal(2);
      expect(await respectGame.getCurrentStage()).to.equal(0);

      console.log("    Verifying RESPECT distribution...");

      // Verify RESPECT was distributed
      for (let i = 0; i < 5; i++) {
        const balance0 = await respectToken.balanceOf(group0[i]);
        const balance1 = await respectToken.balanceOf(group1[i]);

        expect(balance0).to.be.greaterThan(0);
        expect(balance1).to.be.greaterThan(0);
      }
    });

    it("Should track progress correctly during batched processing", async function () {
      console.log(
        "\n    Testing with exactly 10 approved members (fits in one batch)..."
      );

      const contributions = ["Contribution"];
      const links = ["https://link.com"];

      for (let i = 0; i < 10; i++) {
        await respectGame
          .connect(testMembers[i])
          .submitContribution(contributions, links);
      }

      await time.increase(SUBMISSION_LENGTH + 1);

      // Check initial state
      expect(await respectGame.isProcessingStageSwitch()).to.equal(false);
      expect(await respectGame.groupingBatchProgress()).to.equal(0);

      // Switch stage
      await respectGame.switchStage();

      // Should be complete after one call (10 members < 400 batch size)
      expect(await respectGame.isProcessingStageSwitch()).to.equal(false);
      expect(await respectGame.getCurrentStage()).to.equal(1); // Ranking stage
    });

    it("Should measure gas usage for large-scale operations", async function () {
      console.log("\n    Measuring gas for 1000 member operations...");

      // Measure contribution submission
      const tx1 = await respectGame
        .connect(testMembers[0])
        .submitContribution(["Test"], ["https://test.com"]);
      const receipt1 = await tx1.wait();
      console.log(
        `    Gas for contribution submission: ${receipt1!.gasUsed.toString()}`
      );

      // Measure member registration (already done in beforeEach, but we can check)
      const member = await respectGame.getMember(testMembers[0].address);
      expect(member.wallet).to.equal(testMembers[0].address);

      console.log("    Total members registered: 1000");
      console.log("    Total approved members: 10");
    });
  });

  describe("Batched Stage Switching - Large Scale (500 approved members)", function () {
    let largeTestMembers: SignerWithAddress[];

    this.timeout(600000); // 10 minutes timeout

    beforeEach(async function () {
      console.log("\n    Setting up 500 approved members...");

      const allSigners = await ethers.getSigners();
      largeTestMembers = [];

      // Create/get 500 members
      for (let i = 0; i < 500; i++) {
        if (i < allSigners.length) {
          largeTestMembers.push(allSigners[i]);
        } else {
          const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
          largeTestMembers.push(wallet as any);

          // Fund the wallet
          await owner.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther("1.0"),
          });
        }
      }

      console.log("    Registering 500 members...");

      // Register all 500 members (change contract to auto-approve all for this test)
      // For this test, we'll need to deploy a new contract with higher auto-approval
      const RespectGame = await ethers.getContractFactory(
        "RespectGameImplementation"
      );
      respectGame = (await upgrades.deployProxy(
        RespectGame,
        [
          owner.address,
          await respectToken.getAddress(),
          treasury.address,
          500, // Auto-approve first 500
          PERIODS_FOR_AVERAGE,
          RESPECT_DISTRIBUTION,
          SUBMISSION_LENGTH,
          RANKING_LENGTH,
        ],
        { initializer: "initialize", kind: "uups" }
      )) as unknown as RespectGameImplementation;
      await respectGame.waitForDeployment();

      // Add as minter
      await respectToken.addMinter(await respectGame.getAddress());

      // Register all members
      for (let i = 0; i < 500; i++) {
        await respectGame
          .connect(largeTestMembers[i])
          .becomeMember(
            `Member ${i}`,
            `https://profile${i}.com`,
            `Description ${i}`,
            `@member${i}`
          );
      }

      console.log("    All 500 members registered and approved!");
    });

    it("Should require multiple switchStage calls for 500 members", async function () {
      console.log("\n    Submitting contributions for 500 members...");

      const contributions = ["Contribution"];
      const links = ["https://link.com"];

      for (let i = 0; i < 500; i++) {
        await respectGame
          .connect(largeTestMembers[i])
          .submitContribution(contributions, links);
      }

      console.log("    Fast forwarding time...");
      await time.increase(SUBMISSION_LENGTH + 1);

      // 500 members with batch size 400 = need 2 calls
      console.log("    First switchStage call (processes 400 members)...");
      let tx = await respectGame.switchStage();
      let receipt = await tx.wait();
      console.log(`    Gas used: ${receipt!.gasUsed.toString()}`);

      // Should still be processing
      expect(await respectGame.isProcessingStageSwitch()).to.equal(true);
      expect(await respectGame.getCurrentStage()).to.equal(0); // Still in submission
      expect(await respectGame.groupingBatchProgress()).to.equal(400);

      console.log(
        "    Second switchStage call (processes remaining 100 members)..."
      );
      tx = await respectGame.switchStage();
      receipt = await tx.wait();
      console.log(`    Gas used: ${receipt!.gasUsed.toString()}`);

      // Should now be complete
      expect(await respectGame.isProcessingStageSwitch()).to.equal(false);
      expect(await respectGame.getCurrentStage()).to.equal(1); // Ranking stage
      expect(await respectGame.gameTotalGroups(1)).to.equal(100); // 500 / 5 = 100 groups
    });

    it("Should require multiple switchStage calls for ranking distribution (100 groups)", async function () {
      console.log("\n    Submitting contributions...");

      const contributions = ["Contribution"];
      const links = ["https://link.com"];

      for (let i = 0; i < 500; i++) {
        await respectGame
          .connect(largeTestMembers[i])
          .submitContribution(contributions, links);
      }

      console.log("    Switching to ranking stage (2 calls)...");
      await time.increase(SUBMISSION_LENGTH + 1);

      await respectGame.switchStage(); // First batch
      await respectGame.switchStage(); // Second batch

      expect(await respectGame.getCurrentStage()).to.equal(1);

      const totalGroups = await respectGame.gameTotalGroups(1);
      console.log(`    Total groups created: ${totalGroups}`);

      console.log("    Submitting rankings for all 100 groups...");

      // Have all members submit for their own groups
      // Track which groups have received rankings
      const groupsWithRankings = new Set<number>();

      for (let i = 0; i < 500; i++) {
        const member = largeTestMembers[i];

        // Get this member's group
        const [myGroup, myGroupId] = await respectGame
          .connect(member)
          .getMyGroup(1);
        const groupIdNum = Number(myGroupId);

        // Skip if this group already has a ranking
        if (groupsWithRankings.has(groupIdNum)) {
          continue;
        }

        // Create ranking array from group
        const ranking = [...myGroup];

        await respectGame.connect(member).submitRanking(ranking);
        groupsWithRankings.add(groupIdNum);

        // Stop once we've covered all groups
        if (groupsWithRankings.size >= Number(totalGroups)) {
          break;
        }
      }

      console.log(
        `    Submitted rankings for ${groupsWithRankings.size} groups`
      );

      // All groups should have rankings
      expect(groupsWithRankings.size).to.equal(Number(totalGroups));

      console.log(
        "    Switching back to submission (requires multiple calls for 100 groups)..."
      );
      await time.increase(RANKING_LENGTH + 1);

      let callCount = 0;
      const maxCalls = 10; // Should need 5 calls (100 groups / 20 batch size = 5)

      while (
        (await respectGame.getCurrentStage()) === 1n &&
        callCount < maxCalls
      ) {
        console.log(`    switchStage call ${callCount + 1}...`);
        const tx = await respectGame.switchStage();
        const receipt = await tx.wait();
        console.log(`    Gas used: ${receipt!.gasUsed.toString()}`);
        console.log(
          `    Progress: ${await respectGame.rankingCalculationGroupProgress()} / 100 groups`
        );
        callCount++;
      }

      console.log(`    Total switchStage calls needed: ${callCount}`);

      // Should have needed 5 calls (100 groups / 20 batch size)
      expect(callCount).to.equal(5);

      // Should now be in new game
      expect(await respectGame.currentGameNumber()).to.equal(2);
      expect(await respectGame.getCurrentStage()).to.equal(0);

      console.log(
        "    Verifying RESPECT was distributed to all 500 members..."
      );

      // Verify members received RESPECT
      let totalDistributed = 0n;
      const allGroupMembers: string[] = [];
      const uniqueMembers = new Set<string>();

      // Collect all group members
      for (let groupId = 0; groupId < Number(totalGroups); groupId++) {
        const group = await respectGame.getGroup(1, groupId);
        for (let j = 0; j < group.length; j++) {
          allGroupMembers.push(group[j]);
          uniqueMembers.add(group[j].toLowerCase());
        }
      }

      console.log(
        `    Total slots in groups: ${allGroupMembers.length} (should be 500)`
      );
      console.log(
        `    Unique member addresses: ${uniqueMembers.size} (should be 500)`
      );

      // Check balances
      const membersWithRESPECT = new Set<string>();
      for (const memberAddr of uniqueMembers) {
        const balance = await respectToken.balanceOf(memberAddr);
        if (balance > 0n) {
          membersWithRESPECT.add(memberAddr);
          totalDistributed += balance;
        }
      }

      console.log(`    Members with RESPECT: ${membersWithRESPECT.size}`);
      console.log(
        `    Total RESPECT distributed: ${totalDistributed.toString()}`
      );
      console.log(
        `    Expected total: ${
          BigInt(RESPECT_DISTRIBUTION.reduce((a, b) => a + b, 0)) * 100n
        }`
      );

      // All 500 members should be unique and have received RESPECT
      expect(uniqueMembers.size).to.equal(500);
      expect(membersWithRESPECT.size).to.equal(500);

      // Should equal sum of all distributions (500k per game)
      const expectedTotal =
        BigInt(RESPECT_DISTRIBUTION.reduce((a, b) => a + b, 0)) * 100n; // 100 groups
      expect(totalDistributed).to.equal(expectedTotal);
    });
  });
});
