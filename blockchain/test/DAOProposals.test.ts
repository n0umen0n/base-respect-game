import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { DAOProposalsImplementation } from "../typechain-types";

describe("DAOProposalsImplementation", function () {
  let contract: DAOProposalsImplementation;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const DAOProposals = await ethers.getContractFactory(
      "DAOProposalsImplementation"
    );
    contract = (await upgrades.deployProxy(DAOProposals, [
      owner.address,
    ])) as DAOProposalsImplementation;
    await contract.waitForDeployment();
  });

  it("should be initialized with the correct owner", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });
});
