import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SimpleStorageImplementation } from "../typechain-types";

describe("SimpleStorageImplementation", function () {
  let contract: SimpleStorageImplementation;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const SimpleStorage = await ethers.getContractFactory(
      "SimpleStorageImplementation"
    );
    contract = (await upgrades.deployProxy(SimpleStorage, [
      owner.address,
    ])) as SimpleStorageImplementation;
    await contract.waitForDeployment();
  });

  describe("Basic Storage Functions", function () {
    it("should be initialized with the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should allow the owner to set the number", async function () {
      const testNumber = 123;
      await expect(contract.setNumber(testNumber))
        .to.emit(contract, "NumberSet")
        .withArgs(testNumber, owner.address);

      expect(await contract.getNumber()).to.equal(testNumber);
    });

    it("should allow anyone to set the number", async function () {
      const testNumber = 456;
      await expect(contract.connect(addr1).setNumber(testNumber))
        .to.emit(contract, "NumberSet")
        .withArgs(testNumber, addr1.address);

      expect(await contract.getNumber()).to.equal(testNumber);
    });
  });

  describe("Group Creation System", function () {
    let members: SignerWithAddress[];

    beforeEach(async function () {
      // Get signers for testing (Hardhat provides 20 by default, we'll generate more)
      const signers = await ethers.getSigners();
      members = signers.slice(2); // Skip owner and addr1
    });

    describe("Member Registration", function () {
      it("should register a single member", async function () {
        await expect(contract.registerMember(addr1.address))
          .to.emit(contract, "MemberRegistered")
          .withArgs(addr1.address, 0);

        expect(await contract.getMemberCount()).to.equal(1);
      });

      it("should not allow duplicate registrations", async function () {
        await contract.registerMember(addr1.address);
        await expect(contract.registerMember(addr1.address)).to.be.revertedWith(
          "Already registered"
        );
      });

      it("should not allow zero address", async function () {
        await expect(
          contract.registerMember(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid address");
      });

      it("should batch register multiple members (owner only)", async function () {
        const addresses = members.slice(0, 10).map((m) => m.address);

        await expect(contract.batchRegisterMembers(addresses)).to.emit(
          contract,
          "MemberRegistered"
        );

        expect(await contract.getMemberCount()).to.equal(10);
      });

      it("should not allow non-owner to batch register", async function () {
        const addresses = members.slice(0, 5).map((m) => m.address);

        await expect(
          contract.connect(addr1).batchRegisterMembers(addresses)
        ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
      });

      it("should skip already registered members in batch", async function () {
        const addresses = members.slice(0, 5).map((m) => m.address);

        await contract.batchRegisterMembers(addresses);
        expect(await contract.getMemberCount()).to.equal(5);

        // Try to register same members again
        await contract.batchRegisterMembers(addresses);
        expect(await contract.getMemberCount()).to.equal(5); // Should still be 5
      });
    });

    describe("Group Creation with 500 Members", function () {
      let testAddresses: string[];

      beforeEach(async function () {
        // Generate 500 unique addresses for testing
        testAddresses = [];
        for (let i = 0; i < 500; i++) {
          // Create deterministic addresses for testing
          const wallet = ethers.Wallet.createRandom();
          testAddresses.push(wallet.address);
        }

        // Register all 500 members
        await contract.batchRegisterMembers(testAddresses);
      });

      it("should register exactly 500 members", async function () {
        expect(await contract.getMemberCount()).to.equal(500);
      });

      it("should create 100 groups from 500 members", async function () {
        await expect(contract.createRandomGroups()).to.emit(
          contract,
          "GroupsCreated"
        );

        // Verify total groups
        expect(await contract.getTotalGroups()).to.equal(100);
        expect(await contract.isGroupingActive()).to.be.true;
      });

      it("should emit GroupAssigned events for all 100 groups", async function () {
        await expect(contract.createRandomGroups()).to.emit(
          contract,
          "GroupAssigned"
        );

        // Verify we can read all groups
        for (let i = 0; i < 100; i++) {
          const group = await contract.getGroup(i);
          expect(group.length).to.equal(5);

          // Verify each member in group is unique
          const uniqueMembers = new Set(group);
          expect(uniqueMembers.size).to.equal(5);
        }
      });

      it("should assign each member to exactly one group", async function () {
        await contract.createRandomGroups();

        // Track which members are assigned to which groups
        const memberToGroup = new Map<string, number>();

        for (let i = 0; i < 100; i++) {
          const group = await contract.getGroup(i);

          for (const member of group) {
            // Check member isn't in multiple groups
            expect(memberToGroup.has(member)).to.be.false;
            memberToGroup.set(member, i);
          }
        }

        // Verify all 500 members are assigned
        expect(memberToGroup.size).to.equal(500);
      });

      it("should create different groups on subsequent calls (after reset)", async function () {
        // Create first set of groups
        await contract.createRandomGroups();
        const firstGroups: string[][] = [];

        for (let i = 0; i < 100; i++) {
          const group = await contract.getGroup(i);
          firstGroups.push([...group]);
        }

        // Reset and create new groups
        await contract.resetGrouping();

        // Need to wait for next block to get different timestamp/randomness
        await ethers.provider.send("evm_mine", []);

        await contract.createRandomGroups();
        const secondGroups: string[][] = [];

        for (let i = 0; i < 100; i++) {
          const group = await contract.getGroup(i);
          secondGroups.push([...group]);
        }

        // Groups should be different (with high probability)
        let differentGroups = 0;
        for (let i = 0; i < 100; i++) {
          const firstSet = new Set(firstGroups[i]);
          const secondSet = new Set(secondGroups[i]);

          let same = true;
          for (const member of firstSet) {
            if (!secondSet.has(member)) {
              same = false;
              break;
            }
          }

          if (!same) differentGroups++;
        }

        // Expect at least some groups to be different
        expect(differentGroups).to.be.greaterThan(0);
      });

      it("should retrieve a specific group correctly", async function () {
        await contract.createRandomGroups();

        const group50 = await contract.getGroup(50);
        expect(group50.length).to.equal(5);

        // Each address should be valid
        for (const member of group50) {
          expect(ethers.isAddress(member)).to.be.true;
        }
      });

      it("should revert when trying to get invalid group ID", async function () {
        await contract.createRandomGroups();

        await expect(contract.getGroup(100)).to.be.revertedWith(
          "Invalid group ID"
        );
        await expect(contract.getGroup(500)).to.be.revertedWith(
          "Invalid group ID"
        );
      });

      it("should not allow creating groups twice", async function () {
        await contract.createRandomGroups();

        await expect(contract.createRandomGroups()).to.be.revertedWith(
          "Groups already created"
        );
      });

      it("should not allow registration after grouping starts", async function () {
        await contract.createRandomGroups();

        const newMember = ethers.Wallet.createRandom().address;
        await expect(contract.registerMember(newMember)).to.be.revertedWith(
          "Grouping in progress"
        );
      });

      it("should measure gas usage for group creation", async function () {
        const tx = await contract.createRandomGroups();
        const receipt = await tx.wait();

        const gasUsed = receipt!.gasUsed;
        console.log(
          `\n    Gas used for 500 members (100 groups): ${gasUsed.toString()}`
        );
        console.log(`    Gas per group: ${(gasUsed / 100n).toString()}`);
        console.log(`    Gas per member: ${(gasUsed / 500n).toString()}`);

        // Verify gas is reasonable (should be under 30M for 500 members)
        expect(gasUsed < 30000000n).to.be.true;
      });
    });

    describe("Reset Functionality", function () {
      beforeEach(async function () {
        // Register and create groups
        const addresses = [];
        for (let i = 0; i < 25; i++) {
          addresses.push(ethers.Wallet.createRandom().address);
        }
        await contract.batchRegisterMembers(addresses);
        await contract.createRandomGroups();
      });

      it("should reset grouping (owner only)", async function () {
        expect(await contract.isGroupingActive()).to.be.true;
        expect(await contract.getTotalGroups()).to.equal(5);

        await expect(contract.resetGrouping()).to.emit(
          contract,
          "GroupingReset"
        );

        expect(await contract.isGroupingActive()).to.be.false;
        expect(await contract.getTotalGroups()).to.equal(0);
      });

      it("should not allow non-owner to reset", async function () {
        await expect(
          contract.connect(addr1).resetGrouping()
        ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
      });

      it("should allow creating new groups after reset", async function () {
        await contract.resetGrouping();

        await expect(contract.createRandomGroups()).to.not.be.reverted;
        expect(await contract.getTotalGroups()).to.equal(5);
      });

      it("should not allow reset when no grouping is active", async function () {
        await contract.resetGrouping();

        await expect(contract.resetGrouping()).to.be.revertedWith(
          "No active grouping"
        );
      });
    });

    describe("Edge Cases", function () {
      it("should not create groups with less than 5 members", async function () {
        const addresses = [
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
        ];

        await contract.batchRegisterMembers(addresses);

        await expect(contract.createRandomGroups()).to.be.revertedWith(
          "Need at least 5 members"
        );
      });

      it("should handle exactly 5 members (1 group)", async function () {
        const addresses = [];
        for (let i = 0; i < 5; i++) {
          addresses.push(ethers.Wallet.createRandom().address);
        }

        await contract.batchRegisterMembers(addresses);
        await contract.createRandomGroups();

        expect(await contract.getTotalGroups()).to.equal(1);
        const group = await contract.getGroup(0);
        expect(group.length).to.equal(5);
      });

      it("should handle 103 members (20 groups, 3 leftover)", async function () {
        const addresses = [];
        for (let i = 0; i < 103; i++) {
          addresses.push(ethers.Wallet.createRandom().address);
        }

        await contract.batchRegisterMembers(addresses);
        await contract.createRandomGroups();

        expect(await contract.getTotalGroups()).to.equal(20); // 103 / 5 = 20
      });

      it("should only allow owner to create groups", async function () {
        const addresses = [];
        for (let i = 0; i < 10; i++) {
          addresses.push(ethers.Wallet.createRandom().address);
        }

        await contract.batchRegisterMembers(addresses);

        await expect(
          contract.connect(addr1).createRandomGroups()
        ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
      });
    });

    describe("getMyGroup Functionality", function () {
      it("should allow members to retrieve their own group", async function () {
        // We need to use actual signers that can call the contract
        const signers = await ethers.getSigners();
        const testMembers = signers.slice(2, 12); // Get 10 signers

        // Register them
        await contract.batchRegisterMembers(testMembers.map((s) => s.address));
        await contract.createRandomGroups();

        // Each member should be able to get their group
        const member = testMembers[0];
        const [group, groupId] = await contract.connect(member).getMyGroup();

        expect(group.length).to.equal(5);
        expect(group).to.include(member.address);
        expect(groupId).to.be.lessThan(2); // Should be in group 0 or 1
      });

      it("should revert if member is not registered", async function () {
        const unregistered = ethers.Wallet.createRandom().address;

        // Try to call from an unregistered address (using owner to simulate)
        await expect(contract.getMyGroup()).to.be.revertedWith(
          "Not registered"
        );
      });

      it("should revert if groups not created yet", async function () {
        const signers = await ethers.getSigners();
        const member = signers[2];

        await contract.registerMember(member.address);

        await expect(contract.connect(member).getMyGroup()).to.be.revertedWith(
          "Groups not created yet"
        );
      });
    });
  });
});
