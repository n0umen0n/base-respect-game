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
    await contract.deployed();
  });

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

  it("should not allow a non-owner to set the number", async function () {
    const testNumber = 456;
    await expect(contract.connect(addr1).setNumber(testNumber))
      .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(addr1.address);
  });
});
