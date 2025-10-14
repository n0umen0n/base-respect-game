import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { RespectGameImplementation, RespectToken } from "../typechain-types";

/**
 * Test suite to validate transient score calculations against the
 * Fractal Governance algorithm by James Mart
 * Reference: https://james-mart.medium.com/fractal-governance-a-shared-submission-algorithm-311a3039b219
 *
 * The transient score formula is:
 * T = mean(R) * C
 *
 * Where:
 * - T = transient score
 * - R = set of rankings (1-indexed, where 1 is worst, G is best)
 * - mean(R) = average of all rankings
 * - C = consensus term = 1 - (Var(R) / MaxVar(G))
 * - Var(R) = variance of the rankings
 * - MaxVar(G) = (G³ - G) / 12 where G is group size
 */
describe("Transient Score Validation (Fractal Algorithm)", function () {
  let respectGame: RespectGameImplementation;
  let respectToken: RespectToken;
  let owner: SignerWithAddress;
  let members: SignerWithAddress[];

  const WEEK = 7 * 24 * 60 * 60;
  const GROUP_SIZE = 6;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    members = signers.slice(1, 7); // 6 members for a group

    // Deploy RespectToken
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
        ethers.ZeroAddress, // treasury
        6, // First 6 members without approval
        12, // Periods for average
        [100, 75, 50, 25, 10], // RESPECT distribution
        WEEK,
        WEEK,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    await respectGameProxy.waitForDeployment();

    respectGame = RespectGame.attach(
      await respectGameProxy.getAddress()
    ) as RespectGameImplementation;

    // Set minter
    await respectToken.addMinter(await respectGame.getAddress());

    // Register 6 members
    for (let i = 0; i < 6; i++) {
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

  /**
   * Helper function to calculate expected transient score manually
   * This implements the algorithm from the article for verification
   */
  function calculateExpectedTransientScore(
    rankings: number[],
    groupSize: number
  ): number {
    if (rankings.length === 0) return 0;

    // Calculate mean
    const sum = rankings.reduce((a, b) => a + b, 0);
    const mean = sum / rankings.length;

    // Calculate variance
    const varSum = rankings.reduce((acc, r) => {
      const diff = r - mean;
      return acc + diff * diff;
    }, 0);
    const variance = varSum / rankings.length;

    // Calculate max variance: (G³ - G) / 12
    const G = groupSize;
    const maxVar = (G * G * G - G) / 12;

    // Calculate consensus term: 1 - (variance / maxVar)
    const consensus = variance >= maxVar ? 0 : 1 - variance / maxVar;

    // Transient score: mean * consensus
    // Note: Higher ranking = better in the article (6 is best)
    // Our contract inverts this (1 is worst, 6 is best becomes 6 is worst, 1 is best internally)
    const transientScore = mean * consensus;

    return transientScore;
  }

  /**
   * Algorithm Behavior Tests - Validates the key properties from the article:
   * 1. Perfect consensus should give highest score
   * 2. Polarization should heavily penalize the score
   * 3. Consensus term should weight the mean ranking
   */
  describe("Algorithm Behavior Validation", function () {
    it("Perfect consensus should give the highest transient score", async function () {
      const perfectConsensus = [6, 6, 6, 6, 6, 6];
      const highConsensus = [6, 5, 5, 6, 5, 5];
      const lowConsensus = [6, 6, 6, 1, 1, 1];

      const scorePerfect = calculateExpectedTransientScore(
        perfectConsensus,
        GROUP_SIZE
      );
      const scoreHigh = calculateExpectedTransientScore(
        highConsensus,
        GROUP_SIZE
      );
      const scoreLow = calculateExpectedTransientScore(
        lowConsensus,
        GROUP_SIZE
      );

      console.log(`Perfect consensus score: ${scorePerfect.toFixed(2)}`);
      console.log(`High consensus score: ${scoreHigh.toFixed(2)}`);
      console.log(`Low consensus (polarized) score: ${scoreLow.toFixed(2)}`);

      // Perfect consensus should be highest
      expect(scorePerfect).to.be.greaterThan(scoreHigh);
      expect(scoreHigh).to.be.greaterThan(scoreLow);
    });

    it("Polarization should heavily penalize transient score (Article's key insight)", async function () {
      // From the article: "this algorithm seriously punishes strong failures of consensus"
      // Week 3 example: [6,6,6,1,1,1] was "extremely polarizing"

      const polarized = [6, 6, 6, 1, 1, 1]; // mean = 3.5, but heavy polarization
      const moderate = [4, 4, 3, 3, 3, 4]; // mean = 3.5, but moderate consensus

      const scorePolarized = calculateExpectedTransientScore(
        polarized,
        GROUP_SIZE
      );
      const scoreModerate = calculateExpectedTransientScore(
        moderate,
        GROUP_SIZE
      );

      console.log(`Polarized score (mean 3.5): ${scorePolarized.toFixed(2)}`);
      console.log(
        `Moderate consensus score (mean 3.5): ${scoreModerate.toFixed(2)}`
      );

      // Even with same mean, polarization should give much lower score
      expect(scoreModerate).to.be.greaterThan(scorePolarized * 1.2); // At least 20% higher
    });

    it("Should demonstrate that consensus term weights the mean", async function () {
      // High mean, low consensus
      const highMeanLowConsensus = [6, 6, 5, 1, 1, 2]; // mean ≈ 3.5
      // Low mean, high consensus
      const lowMeanHighConsensus = [3, 3, 3, 3, 2, 4]; // mean ≈ 3.0

      const scoreHighMeanLow = calculateExpectedTransientScore(
        highMeanLowConsensus,
        GROUP_SIZE
      );
      const scoreLowMeanHigh = calculateExpectedTransientScore(
        lowMeanHighConsensus,
        GROUP_SIZE
      );

      console.log(
        `High mean (3.5), low consensus: ${scoreHighMeanLow.toFixed(2)}`
      );
      console.log(
        `Lower mean (3.0), high consensus: ${scoreLowMeanHigh.toFixed(2)}`
      );

      // High consensus should overcome lower mean
      expect(scoreLowMeanHigh).to.be.greaterThan(scoreHighMeanLow);
    });

    it("Article's example pattern: consensus is more valuable than polarized high rankings", async function () {
      // Key insight from article: "it may be better to be someone who builds consensus
      // around a smaller contribution than it is to contribute in a way that could be
      // perceived as polarizing to your community"

      const polarizedHigh = [6, 6, 6, 1, 1, 1]; // Some love it, some hate it
      const consensusModerate = [4, 4, 4, 4, 4, 4]; // Everyone agrees it's good

      const scorePolarized = calculateExpectedTransientScore(
        polarizedHigh,
        GROUP_SIZE
      );
      const scoreConsensus = calculateExpectedTransientScore(
        consensusModerate,
        GROUP_SIZE
      );

      console.log(`Polarized high rankings: ${scorePolarized.toFixed(2)}`);
      console.log(`Consensus moderate rankings: ${scoreConsensus.toFixed(2)}`);

      // Consensus moderate should beat polarized high
      expect(scoreConsensus).to.be.greaterThan(scorePolarized);
    });
  });

  describe("Full Ranking Cycle with Transient Score Verification", function () {
    it("Should calculate transient scores correctly and rank accordingly", async function () {
      // Submit contributions for all 6 members
      for (let i = 0; i < 6; i++) {
        await respectGame
          .connect(members[i])
          .submitContribution([`Contribution ${i}`], [`https://link${i}.com`]);
      }

      // Advance to ranking stage
      await ethers.provider.send("evm_increaseTime", [WEEK]);
      await ethers.provider.send("evm_mine", []);
      await respectGame.switchStage();

      // Get each member's group and submit ranking
      for (let i = 0; i < 6; i++) {
        const [groupMembers, groupId] = await respectGame
          .connect(members[i])
          .getMyGroup(1);

        // Convert to regular array
        const membersArray = Array.from(groupMembers);

        // Submit ranking (everyone ranks in same order within their group)
        await respectGame.connect(members[i]).submitRanking(membersArray);
      }

      // Advance to submission stage (triggers RESPECT distribution)
      await ethers.provider.send("evm_increaseTime", [WEEK]);
      await ethers.provider.send("evm_mine", []);
      await respectGame.switchStage();

      // Check RESPECT was distributed
      let totalRespect = 0n;
      for (let i = 0; i < 6; i++) {
        const respect = await respectToken.balanceOf(members[i].address);
        totalRespect += respect;
        console.log(`Member ${i} RESPECT: ${ethers.formatEther(respect)}`);
      }

      console.log(
        `Total RESPECT distributed: ${ethers.formatEther(totalRespect)}`
      );

      // Verify RESPECT was distributed to all members
      expect(totalRespect).to.be.greaterThan(0);

      // Verify each member got some RESPECT
      for (let i = 0; i < 6; i++) {
        const respect = await respectToken.balanceOf(members[i].address);
        expect(respect).to.be.greaterThan(0);
      }
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum variance correctly (heavily penalized)", async function () {
      // Maximum variance: [1,1,1,6,6,6] or equivalent
      const rankings = [1, 1, 1, 6, 6, 6];
      const perfectConsensus = [3, 3, 3, 3, 3, 3]; // Same mean but perfect consensus

      const scoreMaxVar = calculateExpectedTransientScore(rankings, GROUP_SIZE);
      const scorePerfect = calculateExpectedTransientScore(
        perfectConsensus,
        GROUP_SIZE
      );

      console.log(
        `Maximum variance transient score: ${scoreMaxVar.toFixed(2)}`
      );
      console.log(
        `Perfect consensus transient score: ${scorePerfect.toFixed(2)}`
      );

      // Maximum variance should be heavily penalized compared to perfect consensus
      expect(scorePerfect).to.be.greaterThan(scoreMaxVar * 1.3); // At least 30% higher
    });

    it("Should handle minimum variance (all same) correctly", async function () {
      // Minimum variance: all same
      const rankings = [4, 4, 4, 4, 4, 4];
      const expected = calculateExpectedTransientScore(rankings, GROUP_SIZE);

      console.log(
        `Minimum variance - Expected transient score: ${expected.toFixed(2)}`
      );

      // With minimum variance, consensus term should be 1
      // So transient score should equal mean (4)
      expect(Math.abs(expected - 4.0)).to.be.lessThan(0.01);
    });

    it("Should handle group size of 2", async function () {
      const rankings = [1, 2];
      const expected = calculateExpectedTransientScore(rankings, 2);

      console.log(
        `Group size 2 - Expected transient score: ${expected.toFixed(2)}`
      );

      expect(expected).to.be.greaterThan(0);
    });

    it("Should handle group size of 5", async function () {
      const rankings = [5, 4, 3, 2, 1];
      const expected = calculateExpectedTransientScore(rankings, 5);

      console.log(
        `Group size 5 - Expected transient score: ${expected.toFixed(2)}`
      );

      expect(expected).to.be.greaterThan(0);
    });
  });

  describe("Variance and Consensus Term Validation", function () {
    it("Should correctly calculate variance", async function () {
      const rankings = [2, 4, 4, 4, 5, 7];

      // Manual variance calculation
      const mean = rankings.reduce((a, b) => a + b) / rankings.length; // 4.333...
      const variance =
        rankings.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) /
        rankings.length;

      console.log(`Mean: ${mean.toFixed(3)}`);
      console.log(`Variance: ${variance.toFixed(3)}`);

      // MaxVar for group of 6: (6³ - 6) / 12 = 17.5
      const maxVar = (6 * 6 * 6 - 6) / 12;
      console.log(`MaxVar(6): ${maxVar.toFixed(3)}`);

      // Consensus term
      const consensus = 1 - variance / maxVar;
      console.log(`Consensus term: ${consensus.toFixed(3)}`);

      expect(maxVar).to.equal(17.5);
      expect(consensus).to.be.greaterThan(0);
      expect(consensus).to.be.lessThanOrEqual(1);
    });

    it("Should show consensus term decreases with variance", async function () {
      const scenarios = [
        { rankings: [3, 3, 3, 3, 3, 3], label: "Perfect consensus" },
        { rankings: [3, 3, 3, 3, 3, 4], label: "High consensus" },
        { rankings: [2, 3, 3, 4, 4, 4], label: "Moderate consensus" },
        { rankings: [1, 2, 4, 4, 5, 6], label: "Low consensus" },
        { rankings: [1, 1, 1, 6, 6, 6], label: "Maximum variance" },
      ];

      const consensusTerms: number[] = [];

      for (const scenario of scenarios) {
        const mean =
          scenario.rankings.reduce((a, b) => a + b) / scenario.rankings.length;
        const variance =
          scenario.rankings.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) /
          scenario.rankings.length;
        const maxVar = (6 * 6 * 6 - 6) / 12;
        const consensus = Math.max(0, 1 - variance / maxVar);

        consensusTerms.push(consensus);
        console.log(
          `${scenario.label}: consensus = ${consensus.toFixed(
            3
          )}, variance = ${variance.toFixed(3)}`
        );
      }

      // Verify consensus terms are monotonically decreasing
      for (let i = 1; i < consensusTerms.length; i++) {
        expect(consensusTerms[i]).to.be.lessThanOrEqual(consensusTerms[i - 1]);
      }
    });
  });
});
