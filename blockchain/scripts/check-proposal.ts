import { ethers } from "hardhat";

const GOVERNANCE_CONTRACT = "0x354d6b039f6d463b706a63f18227eb34d4fc93aa";
const RESPECT_GAME_CORE = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

// Get proposal ID from command line or default to 8
const PROPOSAL_ID = process.env.PROPOSAL_ID || "8";

async function main(): Promise<void> {
  console.log(`🔍 Debugging Proposal #${PROPOSAL_ID}...\n`);

  const governance = await ethers.getContractAt(
    "RespectGameGovernance",
    GOVERNANCE_CONTRACT
  );
  const core = await ethers.getContractAt("RespectGameCore", RESPECT_GAME_CORE);

  // Get proposal details
  const proposal = await governance.getProposal(PROPOSAL_ID);

  console.log("📋 Proposal Details:");
  console.log("  Type:", proposal.proposalType);
  console.log("  Proposer:", proposal.proposer);
  console.log("  Target Member:", proposal.targetMember);
  console.log("  Description:", proposal.description);
  console.log("  Status:", proposal.status);
  console.log("  Votes For:", proposal.votesFor.toString());
  console.log("  Votes Against:", proposal.votesAgainst.toString());

  // Get transaction details
  const txCount = await governance.getProposalTransactionCount(PROPOSAL_ID);
  console.log("\n📝 Transaction Count:", txCount.toString());

  if (txCount > 0) {
    const tx = await governance.getProposalTransaction(PROPOSAL_ID, 0);
    console.log("\n🔧 First Transaction:");
    console.log("  Target:", tx.target);
    console.log("  Value:", tx.value.toString());
    console.log("  Data:", tx.data);

    // Decode the calldata
    if (tx.data.length >= 10) {
      const selector = tx.data.slice(0, 10);
      console.log("  Function Selector:", selector);

      // Check if it's removeMember
      if (selector === "0x0b1ca49a") {
        console.log("  Function: removeMember(address)");

        // Extract the address parameter (addresses are padded to 32 bytes, we need the last 20 bytes)
        // The full parameter is 64 hex chars, but address is only the last 40 hex chars
        const addressParam = "0x" + tx.data.slice(-40);
        const targetAddress = ethers.getAddress(addressParam);
        console.log("  Target Address to Remove:", targetAddress);

        // Check if this member exists
        console.log("\n🔍 Checking if member exists in core contract...");
        try {
          const memberInfo = await core.getMember(targetAddress);
          console.log(
            "  Member exists:",
            memberInfo.wallet !== ethers.ZeroAddress
          );
          if (memberInfo.wallet !== ethers.ZeroAddress) {
            console.log("  Member name:", memberInfo.name);
            console.log("  Member wallet:", memberInfo.wallet);
            console.log("  Is approved:", memberInfo.isApproved);
            console.log("  Is banned:", memberInfo.isBanned);
          } else {
            console.log(
              "\n❌ ERROR: This member does NOT exist in the core contract!"
            );
            console.log("   This is why execution is failing.");
            console.log(
              "   The proposal was created with an invalid member address."
            );
          }
        } catch (error) {
          console.log("  Error checking member:", error);
        }
      }
    }
  }

  // Check governance contract address
  console.log("\n🔍 Verifying governance configuration...");
  const governanceAddr = await core.governanceContract();
  console.log("  Governance contract in core:", governanceAddr);
  console.log("  Expected governance:", GOVERNANCE_CONTRACT);
  console.log(
    "  Match:",
    governanceAddr.toLowerCase() === GOVERNANCE_CONTRACT.toLowerCase()
      ? "✅"
      : "❌"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
