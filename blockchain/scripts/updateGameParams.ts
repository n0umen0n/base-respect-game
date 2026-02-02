import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from root .env file (for Supabase credentials)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// The address of your deployed RespectGame contract
const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function syncSupabase(
  gameNumber: number,
  stage: number,
  nextStageTimestamp: number
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "\n⚠️ Supabase credentials not found. Skipping database sync."
    );
    console.warn(
      "   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in root .env file."
    );
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const stageName =
    stage === 0 ? "ContributionSubmission" : "ContributionRanking";
  const nextStageDate = new Date(nextStageTimestamp * 1000).toISOString();

  console.log("\n💾 Syncing Supabase database...");

  const { error } = await supabase
    .from("game_stages")
    .update({
      current_game_number: gameNumber,
      current_stage: stageName,
      next_stage_timestamp: nextStageDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("❌ Failed to sync Supabase:", error.message);
    return false;
  }

  console.log("✅ Supabase synced successfully!");
  console.log(`   Game: ${gameNumber}`);
  console.log(`   Stage: ${stageName}`);
  console.log(
    `   Next stage: ${new Date(nextStageTimestamp * 1000).toLocaleString()}`
  );
  return true;
}

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Updating game parameters on contract at: ${contractAddress}`);
  console.log(`Using signer: ${signer.address}`);

  const contract = (await ethers.getContractAt(
    "RespectGameCore",
    contractAddress
  )) as unknown as RespectGameCore;

  // New parameter values
  const membersWithoutApproval = 101;
  const submissionLength = 1 * 60 * 60; // 1 hour in seconds
  const rankingLength = 20 * 60; // 20 minutes in seconds
  const nextStageTimestamp = Math.floor(Date.now() / 1000) + 1 * 60; // Current time + 1 minute

  console.log("\nNew Parameters:");
  console.log(`  Members Without Approval: ${membersWithoutApproval}`);
  console.log(`  Submission Length: ${submissionLength}s (1 hour)`);
  console.log(`  Ranking Length: ${rankingLength}s (20 minutes)`);
  console.log(
    `  Next Stage Timestamp: ${nextStageTimestamp} (${new Date(
      nextStageTimestamp * 1000
    ).toISOString()})`
  );

  console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to proceed...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\nUpdating game parameters...");

  try {
    const tx = await contract
      .connect(signer)
      .updateGameParams(
        membersWithoutApproval,
        submissionLength,
        rankingLength,
        nextStageTimestamp
      );
    console.log(`Transaction sent with hash: ${tx.hash}`);

    console.log("\nWaiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed.");
    console.log(`Gas used: ${receipt?.gasUsed.toString()}`);

    console.log("\n✅ Game parameters updated successfully!");

    // Wait a bit for RPC to sync before reading back
    console.log("\nWaiting for RPC to sync...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Read back the values to confirm
    const newMembersWithoutApproval = await contract.membersWithoutApproval();
    const newSubmissionLength = await contract.contributionSubmissionLength();
    const newRankingLength = await contract.contributionRankingLength();
    const newNextStageTimestamp = await contract.nextStageTimestamp();

    console.log("\nConfirmed New Values:");
    console.log(
      `  Members Without Approval: ${newMembersWithoutApproval.toString()}`
    );
    console.log(
      `  Submission Length: ${newSubmissionLength.toString()}s (${
        Number(newSubmissionLength) / (60 * 60)
      } hours)`
    );
    console.log(
      `  Ranking Length: ${newRankingLength.toString()}s (${
        Number(newRankingLength) / 60
      } minutes)`
    );
    console.log(
      `  Next Stage Timestamp: ${newNextStageTimestamp.toString()} (${new Date(
        Number(newNextStageTimestamp) * 1000
      ).toISOString()})`
    );

    // Sync Supabase database with the new values
    const currentStage = await contract.getCurrentStage();
    const currentGameNumber = await contract.currentGameNumber();
    await syncSupabase(
      Number(currentGameNumber),
      Number(currentStage),
      Number(newNextStageTimestamp)
    );

    console.log("\n🎉 All done! Blockchain and database are now in sync.");
  } catch (error: any) {
    console.error("\n❌ Transaction failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
