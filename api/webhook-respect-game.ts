/**
 * Respect Game Webhook Handler
 * Processes all Respect Game contract events and updates Supabase
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { Interface } from "ethers";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Alchemy webhook signing key
const ALCHEMY_SIGNING_KEY = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY!;

// Contract addresses (hardcoded - public on blockchain)
const RESPECT_GAME_CORE_ADDRESS =
  "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29".toLowerCase();
const RESPECT_GAME_GOVERNANCE_ADDRESS =
  "0x354d6b039f6d463b706a63f18227eb34d4fc93aA".toLowerCase();

// Contract ABIs - Event signatures only
const RESPECT_GAME_CORE_EVENTS = [
  "event MemberJoined(address indexed member, string name, string profileUrl, string description, string xAccount, uint256 timestamp, bool autoApproved)",
  "event MemberProposalCreated(uint256 indexed proposalId, address indexed candidate, string name, uint256 timestamp)",
  "event MemberApprovalVoted(address indexed candidate, address indexed approver, uint256 timestamp)",
  "event ContributionSubmitted(address indexed contributor, uint256 indexed gameNumber, string[] contributions, string[] links, uint256 timestamp)",
  "event RankingSubmitted(address indexed ranker, uint256 indexed gameNumber, uint256 indexed groupId, address[] rankedAddresses, uint256 timestamp)",
  "event RespectDistributed(address indexed member, uint256 indexed gameNumber, uint256 rank, uint256 respectAmount, uint256 newAverageRespect)",
  "event StageChanged(uint256 indexed gameNumber, uint8 newStage, uint256 nextStageTimestamp, uint256 timestamp)",
  "event GroupAssigned(uint256 indexed gameNumber, uint256 indexed groupId, address[] members)",
  "event MemberApproved(address indexed member, uint256 timestamp)",
  "event MemberBanned(address indexed member, uint256 timestamp)",
];

const RESPECT_GAME_GOVERNANCE_EVENTS = [
  "event ProposalCreated(uint256 indexed proposalId, uint8 proposalType, address indexed proposer, address indexed targetMember, address[] targets, uint256[] values, bytes[] calldatas, string description, uint256 timestamp)",
  "event ProposalVoted(uint256 indexed proposalId, address indexed voter, bool voteFor, uint256 votesFor, uint256 votesAgainst)",
  "event ProposalExecuted(uint256 indexed proposalId, uint8 proposalType, uint256 timestamp)",
];

// Create interfaces
const coreInterface = new Interface(RESPECT_GAME_CORE_EVENTS);
const governanceInterface = new Interface(RESPECT_GAME_GOVERNANCE_EVENTS);

/**
 * Verify Alchemy webhook signature
 */
function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", ALCHEMY_SIGNING_KEY);
  const digest = hmac.update(body).digest("hex");
  return signature === digest;
}

/**
 * Decode address from topics (for manual decoding)
 */
function decodeAddress(topic: string): string {
  return "0x" + topic.slice(26).toLowerCase();
}

/**
 * Decode uint256 from topics (for manual decoding)
 */
function decodeUint256(topic: string): number {
  return parseInt(topic, 16);
}

/**
 * Event Handlers
 */

// MemberJoined(address indexed member, string name, string profileUrl, string description, string xAccount, uint256 timestamp, bool autoApproved)
async function handleMemberJoined(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const memberAddress = decoded.args.member.toLowerCase();
    const name = decoded.args.name;
    const profileUrl = decoded.args.profileUrl;
    const description = decoded.args.description;
    const xAccount = decoded.args.xAccount;
    const timestamp = Number(decoded.args.timestamp);
    const autoApproved = decoded.args.autoApproved;

    const blockTimestamp = new Date(timestamp * 1000).toISOString();

    console.log(
      "👤 Member joined:",
      memberAddress,
      "Name:",
      name,
      "Profile URL:",
      profileUrl || "(none)",
      "X Account:",
      xAccount || "(none)",
      "Auto-approved:",
      autoApproved
    );

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from("members")
      .select("*")
      .eq("wallet_address", memberAddress)
      .single();

    if (existingMember) {
      console.log("Member already exists, updating data");
      // Update member data
      // NOTE: We do NOT update x_account from blockchain events (security)
      // X accounts are only saved after Privy OAuth verification
      const { error: updateError } = await supabase
        .from("members")
        .update({
          name: name,
          profile_url: profileUrl || null,
          description: description || null,
          // x_account: INTENTIONALLY OMITTED - only updated via Privy OAuth
          is_approved: autoApproved,
        })
        .eq("wallet_address", memberAddress);

      if (updateError) throw updateError;
      return { success: true, action: "updated" };
    }

    // Insert new member with all profile data
    // NOTE: x_account is NOT saved from blockchain (anyone can fake it)
    // X accounts are only saved after Privy Twitter OAuth verification
    const { data, error } = await supabase.from("members").insert({
      wallet_address: memberAddress,
      name: name,
      profile_url: profileUrl || null,
      description: description || null,
      // x_account: INTENTIONALLY OMITTED - only saved via Privy OAuth (see updateMemberXAccount)
      x_verified: false, // Default to false until verified via Privy
      is_approved: autoApproved,
      is_banned: false,
      joined_at: blockTimestamp,
      total_respect_earned: 0,
      average_respect: 0,
    });

    if (error) throw error;

    return { success: true, action: "inserted", member: memberAddress };
  } catch (error) {
    console.error("Error handling MemberJoined:", error);
    throw error;
  }
}

// ContributionSubmitted(address indexed contributor, uint256 indexed gameNumber, string[] contributions, string[] links, uint256 timestamp)
async function handleContributionSubmitted(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const contributorAddress = decoded.args.contributor.toLowerCase();
    const gameNumber = Number(decoded.args.gameNumber);
    const contributions = decoded.args.contributions; // Array of strings
    const links = decoded.args.links; // Array of strings
    const timestamp = Number(decoded.args.timestamp);

    console.log(
      "📝 Contribution submitted:",
      contributorAddress,
      "Game:",
      gameNumber,
      "Items:",
      contributions.length
    );

    const blockTimestamp = new Date(timestamp * 1000).toISOString();

    const { data, error } = await supabase.from("contributions").upsert(
      {
        contributor_address: contributorAddress,
        game_number: gameNumber,
        contributions: contributions,
        links: links,
        counted: true,
        tx_hash: txHash,
        block_timestamp: blockTimestamp,
      },
      {
        onConflict: "contributor_address,game_number",
      }
    );

    if (error) throw error;

    return { success: true, action: "contribution_saved" };
  } catch (error) {
    console.error("Error handling ContributionSubmitted:", error);
    throw error;
  }
}

// RankingSubmitted(address indexed ranker, uint256 indexed gameNumber, uint256 indexed groupId, address[] rankedAddresses, uint256 timestamp)
async function handleRankingSubmitted(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const rankerAddress = decoded.args.ranker.toLowerCase();
    const gameNumber = Number(decoded.args.gameNumber);
    const groupId = Number(decoded.args.groupId);
    const rankedAddresses = decoded.args.rankedAddresses.map((addr: string) =>
      addr.toLowerCase()
    );
    const timestamp = Number(decoded.args.timestamp);

    console.log(
      "🏆 Ranking submitted:",
      rankerAddress,
      "Game:",
      gameNumber,
      "Group:",
      groupId,
      "Ranked:",
      rankedAddresses.length
    );

    const blockTimestamp = new Date(timestamp * 1000).toISOString();

    const { data, error } = await supabase.from("rankings").upsert(
      {
        ranker_address: rankerAddress,
        game_number: gameNumber,
        group_id: groupId,
        ranked_addresses: rankedAddresses,
        tx_hash: txHash,
        block_timestamp: blockTimestamp,
      },
      {
        onConflict: "ranker_address,game_number,group_id",
      }
    );

    if (error) throw error;

    return { success: true, action: "ranking_saved" };
  } catch (error) {
    console.error("Error handling RankingSubmitted:", error);
    throw error;
  }
}

// RespectDistributed(address indexed member, uint256 indexed gameNumber, uint256 rank, uint256 respectAmount, uint256 newAverage)
async function handleRespectDistributed(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const memberAddress = decoded.args.member.toLowerCase();
    const gameNumber = Number(decoded.args.gameNumber);
    const rank = Number(decoded.args.rank);
    // Keep as BigInt and convert to string for PostgreSQL bigint columns
    const respectAmount = decoded.args.respectAmount.toString();
    const newAverage = decoded.args.newAverageRespect.toString();

    console.log(
      "💰 Respect distributed:",
      memberAddress,
      "Game:",
      gameNumber,
      "Rank:",
      rank,
      "Amount:",
      respectAmount
    );

    // Get current total to calculate new total
    const { data: memberData } = await supabase
      .from("members")
      .select("total_respect_earned")
      .eq("wallet_address", memberAddress)
      .single();

    // BigInt arithmetic - convert current total to BigInt, add, then back to string
    const currentTotal = BigInt(memberData?.total_respect_earned || 0);
    const amountBigInt = BigInt(respectAmount);
    const newTotal = (currentTotal + amountBigInt).toString();

    // Update member stats
    const { error: memberError } = await supabase
      .from("members")
      .update({
        total_respect_earned: newTotal,
        average_respect: newAverage,
      })
      .eq("wallet_address", memberAddress);

    if (memberError) throw memberError;

    // Insert game result
    const { error: resultError } = await supabase.from("game_results").upsert(
      {
        member_address: memberAddress,
        game_number: gameNumber,
        rank: rank,
        respect_earned: respectAmount,
      },
      {
        onConflict: "member_address,game_number",
      }
    );

    if (resultError) throw resultError;

    // Insert respect history
    const { error: historyError } = await supabase
      .from("respect_history")
      .upsert(
        {
          member_address: memberAddress,
          game_number: gameNumber,
          respect_amount: respectAmount,
        },
        {
          onConflict: "member_address,game_number",
        }
      );

    if (historyError) throw historyError;

    return { success: true, action: "respect_distributed" };
  } catch (error) {
    console.error("Error handling RespectDistributed:", error);
    throw error;
  }
}

// StageChanged(uint256 indexed gameNumber, uint8 newStage, uint256 nextStageTimestamp, uint256 timestamp)
async function handleStageChanged(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const gameNumber = Number(decoded.args.gameNumber);
    const stage = Number(decoded.args.newStage);
    const nextStageTimestamp = Number(decoded.args.nextStageTimestamp);

    const stageName =
      stage === 0 ? "ContributionSubmission" : "ContributionRanking";
    const nextStageDate = new Date(nextStageTimestamp * 1000).toISOString();

    console.log("🔄 Stage changed:", stageName, "Game:", gameNumber);

    const { error } = await supabase
      .from("game_stages")
      .update({
        current_game_number: gameNumber,
        current_stage: stageName,
        next_stage_timestamp: nextStageDate,
      })
      .eq("id", 1);

    if (error) throw error;

    return { success: true, action: "stage_changed" };
  } catch (error) {
    console.error("Error handling StageChanged:", error);
    throw error;
  }
}

// GroupAssigned(uint256 indexed gameNumber, uint256 indexed groupId, address[] members)
async function handleGroupAssigned(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const gameNumber = Number(decoded.args.gameNumber);
    const groupId = Number(decoded.args.groupId);
    const members = decoded.args.members.map((addr: string) =>
      addr.toLowerCase()
    );

    console.log(
      "👥 Group assigned:",
      gameNumber,
      "Group:",
      groupId,
      "Members:",
      members.length
    );

    // Insert group
    const { error: groupError } = await supabase.from("groups").upsert(
      {
        game_number: gameNumber,
        group_id: groupId,
        members: members,
        finalized: false,
      },
      {
        onConflict: "game_number,group_id",
      }
    );

    if (groupError) throw groupError;

    // Insert member_groups entries
    for (const member of members) {
      await supabase.from("member_groups").upsert(
        {
          game_number: gameNumber,
          member_address: member,
          group_id: groupId,
        },
        {
          onConflict: "game_number,member_address",
        }
      );
    }

    return { success: true, action: "group_assigned" };
  } catch (error) {
    console.error("Error handling GroupAssigned:", error);
    throw error;
  }
}

// MemberProposalCreated(uint256 indexed proposalId, address indexed candidate, string name, uint256 timestamp)
async function handleMemberProposalCreated(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = coreInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const memberProposalId = Number(decoded.args.proposalId);
    const candidateAddress = decoded.args.candidate.toLowerCase();
    const name = decoded.args.name;
    const timestamp = Number(decoded.args.timestamp);

    console.log(
      "📋 Member proposal created:",
      memberProposalId,
      "Candidate:",
      candidateAddress,
      "Name:",
      name
    );

    const blockTimestamp = new Date(timestamp * 1000).toISOString();

    // Check if member exists in database (race condition with MemberJoined event)
    const { data: existingMember } = await supabase
      .from("members")
      .select("wallet_address")
      .eq("wallet_address", candidateAddress)
      .single();

    // If member doesn't exist yet, wait a bit and check again
    if (!existingMember) {
      console.log("Member not found yet, waiting for MemberJoined event...");
      // Wait 3 seconds for MemberJoined handler to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check again
      const { data: memberAfterWait } = await supabase
        .from("members")
        .select("wallet_address")
        .eq("wallet_address", candidateAddress)
        .single();

      if (!memberAfterWait) {
        console.error(
          "⚠️ Member still not found after waiting. This might be an old/replayed event or events came in separate batches. Skipping proposal creation."
        );
        // Don't throw error - just skip this proposal
        // The member will be added when MemberJoined event is processed (if it hasn't been already)
        return {
          success: true,
          action: "skipped_member_not_found",
          note: "Member not in database yet - possibly old/replayed event",
        };
      }
    }

    // Use offset to avoid ID collision with governance proposals
    // Member proposals: 1000000+, Governance proposals: 0-999999
    const databaseProposalId = 1000000 + memberProposalId;

    // Check if proposal already exists (in case of replayed events)
    const { data: existingProposal } = await supabase
      .from("proposals")
      .select("proposal_id")
      .eq("proposal_id", databaseProposalId)
      .single();

    if (existingProposal) {
      console.log(
        `⚠️ Proposal ${databaseProposalId} already exists. Skipping duplicate.`
      );
      return { success: true, action: "skipped_duplicate" };
    }

    // Insert as a proposal of type "ApproveMember"
    console.log(
      `📝 Inserting proposal ${databaseProposalId} for member ${candidateAddress}...`
    );
    const { error } = await supabase.from("proposals").insert({
      proposal_id: databaseProposalId,
      proposal_type: "ApproveMember",
      proposer_address: candidateAddress, // The candidate is proposing themselves
      target_member_address: candidateAddress,
      description: `Approve ${name} as a new member`,
      status: "Pending",
      votes_for: 0,
      votes_against: 0,
      tx_hash: txHash,
      block_timestamp: blockTimestamp,
    });

    if (error) {
      console.error("❌ Error inserting member proposal:", error);
      throw error;
    }

    console.log(
      `✅ Member proposal inserted successfully with ID: ${databaseProposalId}`
    );

    return { success: true, action: "member_proposal_created" };
  } catch (error) {
    console.error("Error handling MemberProposalCreated:", error);
    throw error;
  }
}

// MemberApprovalVoted(address indexed candidate, address indexed approver, uint256 timestamp)
async function handleMemberApprovalVoted(log: any, txHash: string) {
  try {
    const candidateAddress = decodeAddress(log.topics[1]);
    const approverAddress = decodeAddress(log.topics[2]);

    console.log(
      "🗳️ Member approval voted:",
      "Candidate:",
      candidateAddress,
      "Approver:",
      approverAddress
    );

    const blockTimestamp = new Date().toISOString();

    // Find the proposal ID for this candidate
    const { data: proposalData } = await supabase
      .from("proposals")
      .select("proposal_id, votes_for")
      .eq("target_member_address", candidateAddress)
      .eq("proposal_type", "ApproveMember")
      .eq("status", "Pending")
      .single();

    if (!proposalData) {
      console.log("No proposal found for candidate:", candidateAddress);
      return { success: true, action: "proposal_not_found" };
    }

    // Insert vote
    const { error: voteError } = await supabase.from("proposal_votes").insert({
      proposal_id: proposalData.proposal_id,
      voter_address: approverAddress,
      vote_for: true,
      tx_hash: txHash,
      block_timestamp: blockTimestamp,
    });

    if (voteError) throw voteError;

    // Update proposal vote count
    const newVotesFor = proposalData.votes_for + 1;
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({
        votes_for: newVotesFor,
      })
      .eq("proposal_id", proposalData.proposal_id);

    if (proposalError) throw proposalError;

    return { success: true, action: "member_approval_voted" };
  } catch (error) {
    console.error("Error handling MemberApprovalVoted:", error);
    throw error;
  }
}

// MemberApproved(address indexed member, uint256 timestamp)
async function handleMemberApproved(log: any, txHash: string) {
  try {
    const memberAddress = decodeAddress(log.topics[1]);

    console.log("✅ Member approved:", memberAddress);

    const { error } = await supabase
      .from("members")
      .update({ is_approved: true })
      .eq("wallet_address", memberAddress);

    if (error) throw error;

    // Mark the corresponding proposal as executed
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({ status: "Executed" })
      .eq("target_member_address", memberAddress)
      .eq("proposal_type", "ApproveMember")
      .eq("status", "Pending");

    if (proposalError) throw proposalError;

    return { success: true, action: "member_approved" };
  } catch (error) {
    console.error("Error handling MemberApproved:", error);
    throw error;
  }
}

// MemberBanned(address indexed member, uint256 timestamp)
async function handleMemberBanned(log: any, txHash: string) {
  try {
    const memberAddress = decodeAddress(log.topics[1]);

    console.log("🚫 Member banned:", memberAddress);

    const { error } = await supabase
      .from("members")
      .update({
        is_banned: true,
        average_respect: 0,
      })
      .eq("wallet_address", memberAddress);

    if (error) throw error;

    return { success: true, action: "member_banned" };
  } catch (error) {
    console.error("Error handling MemberBanned:", error);
    throw error;
  }
}

// ProposalCreated(uint256 indexed proposalId, uint8 proposalType, address indexed proposer, address indexed targetMember, address[] targets, uint256[] values, bytes[] calldatas, string description, uint256 timestamp)
async function handleProposalCreated(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = governanceInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const proposalId = Number(decoded.args.proposalId);
    const proposalType = Number(decoded.args.proposalType);
    const proposerAddress = decoded.args.proposer.toLowerCase();
    const targetMemberAddress =
      decoded.args.targetMember !== "0x0000000000000000000000000000000000000000"
        ? decoded.args.targetMember.toLowerCase()
        : null;
    const targets = decoded.args.targets;
    const values = decoded.args.values;
    const calldatas = decoded.args.calldatas;
    const description = decoded.args.description;
    const timestamp = Number(decoded.args.timestamp);

    // Map proposal type number to string
    // Enum values from RespectGameStorage.sol:
    // 0: BanMember, 1: ApproveMember, 2: TreasuryTransfer, 3: ExecuteTransactions
    const proposalTypeMap: Record<number, string> = {
      0: "BanMember",
      1: "ApproveMember",
      2: "TreasuryTransfer",
      3: "ExecuteTransactions",
    };
    const proposalTypeName = proposalTypeMap[proposalType] || "Unknown";

    console.log("📋 Proposal created:", proposalId, "Type:", proposalTypeName);

    // Decode transaction data for transfer proposals
    let transfer_recipient: string | null = null;
    let transfer_amount: string | null = null;

    if (proposalTypeName === "ExecuteTransactions" && targets.length > 0) {
      const firstTarget = targets[0].toLowerCase();
      const firstValue = values[0];
      const firstCalldata = calldatas[0];

      // Check if it's an ERC20 transfer (function selector: 0xa9059cbb)
      if (firstCalldata.startsWith("0xa9059cbb")) {
        try {
          // Decode transfer(address recipient, uint256 amount)
          // Skip 4-byte selector, then 32 bytes for address, then 32 bytes for amount
          const recipientHex = "0x" + firstCalldata.slice(34, 74); // bytes 10-42 (skip 0xa9059cbb)
          const amountHex = "0x" + firstCalldata.slice(74, 138); // bytes 42-74

          transfer_recipient = recipientHex.toLowerCase();
          transfer_amount = BigInt(amountHex).toString();

          console.log("💸 Decoded ERC20 transfer:", {
            recipient: transfer_recipient,
            amount: transfer_amount,
          });
        } catch (err) {
          console.error("Error decoding ERC20 transfer:", err);
        }
      }
      // Check if it's an ETH transfer (empty calldata with value)
      else if (
        (firstCalldata === "0x" || firstCalldata.length === 0) &&
        BigInt(firstValue) > 0n
      ) {
        transfer_recipient = firstTarget;
        transfer_amount = BigInt(firstValue).toString();

        console.log("💸 Decoded ETH transfer:", {
          recipient: transfer_recipient,
          amount: transfer_amount,
        });
      }
    }

    const blockTimestamp = new Date(timestamp * 1000).toISOString();

    const { error } = await supabase.from("proposals").insert({
      proposal_id: proposalId,
      proposal_type: proposalTypeName,
      proposer_address: proposerAddress,
      target_member_address: targetMemberAddress,
      transfer_recipient,
      transfer_amount,
      description: description,
      status: "Pending",
      votes_for: 0,
      votes_against: 0,
      tx_hash: txHash,
      block_timestamp: blockTimestamp,
    });

    if (error) throw error;

    return { success: true, action: "proposal_created" };
  } catch (error) {
    console.error("Error handling ProposalCreated:", error);
    throw error;
  }
}

// ProposalVoted(uint256 indexed proposalId, address indexed voter, bool voteFor, uint256 votesFor, uint256 votesAgainst)
async function handleProposalVoted(log: any, txHash: string) {
  try {
    // Decode using ethers
    const decoded = governanceInterface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    const proposalId = Number(decoded.args.proposalId);
    const voterAddress = decoded.args.voter.toLowerCase();
    const voteFor = decoded.args.voteFor;
    const votesFor = Number(decoded.args.votesFor);
    const votesAgainst = Number(decoded.args.votesAgainst);

    console.log(
      "🗳️ Proposal voted:",
      proposalId,
      "Voter:",
      voterAddress,
      "For:",
      voteFor
    );

    const blockTimestamp = new Date().toISOString();

    // Insert vote
    const { error: voteError } = await supabase.from("proposal_votes").insert({
      proposal_id: proposalId,
      voter_address: voterAddress,
      vote_for: voteFor,
      tx_hash: txHash,
      block_timestamp: blockTimestamp,
    });

    if (voteError) throw voteError;

    // Update proposal vote counts
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({
        votes_for: votesFor,
        votes_against: votesAgainst,
      })
      .eq("proposal_id", proposalId);

    if (proposalError) throw proposalError;

    return { success: true, action: "proposal_voted" };
  } catch (error) {
    console.error("Error handling ProposalVoted:", error);
    throw error;
  }
}

// ProposalExecuted(uint256 indexed proposalId, uint8 proposalType, uint256 timestamp)
async function handleProposalExecuted(log: any, txHash: string) {
  try {
    const proposalId = decodeUint256(log.topics[1]);

    console.log("✅ Proposal executed:", proposalId);

    const { error } = await supabase
      .from("proposals")
      .update({ status: "Executed" })
      .eq("proposal_id", proposalId);

    if (error) throw error;

    return { success: true, action: "proposal_executed" };
  } catch (error) {
    console.error("Error handling ProposalExecuted:", error);
    throw error;
  }
}

/**
 * Process event log from either contract
 */
async function processEventLog(
  log: any,
  txHash: string,
  contractAddress: string
) {
  try {
    console.log("📝 Processing event log from:", contractAddress);
    console.log("🔍 Expected addresses:", {
      core: RESPECT_GAME_CORE_ADDRESS,
      governance: RESPECT_GAME_GOVERNANCE_ADDRESS,
    });

    if (!log.topics || log.topics.length < 1) {
      console.log("⏭️ Not enough topics, skipping");
      return null;
    }

    // Determine which interface to use based on contract address
    const iface =
      contractAddress === RESPECT_GAME_CORE_ADDRESS
        ? coreInterface
        : governanceInterface;

    // Debug: Log the raw log data
    console.log("🔍 Raw log data:", {
      topics: log.topics,
      data: log.data,
      topicsLength: log.topics?.length,
    });

    // Try to parse the log
    let decoded;
    try {
      decoded = iface.parseLog({
        topics: log.topics,
        data: log.data,
      });
    } catch (parseError) {
      console.log(
        "⏭️ Could not parse event, skipping. Error:",
        parseError.message
      );
      console.log("📋 Log details:", JSON.stringify(log, null, 2));
      return null;
    }

    if (!decoded) {
      console.log("⏭️ Decoded is null, skipping");
      console.log("📋 Log details:", JSON.stringify(log, null, 2));
      return null;
    }

    const eventName = decoded.name;
    console.log("✅ Decoded event:", eventName);

    // Route to appropriate handler
    switch (eventName) {
      case "MemberJoined":
        return await handleMemberJoined(log, txHash);
      case "MemberProposalCreated":
        return await handleMemberProposalCreated(log, txHash);
      case "MemberApprovalVoted":
        return await handleMemberApprovalVoted(log, txHash);
      case "ContributionSubmitted":
        return await handleContributionSubmitted(log, txHash);
      case "RankingSubmitted":
        return await handleRankingSubmitted(log, txHash);
      case "RespectDistributed":
        return await handleRespectDistributed(log, txHash);
      case "StageChanged":
        return await handleStageChanged(log, txHash);
      case "GroupAssigned":
        return await handleGroupAssigned(log, txHash);
      case "MemberApproved":
        return await handleMemberApproved(log, txHash);
      case "MemberBanned":
        return await handleMemberBanned(log, txHash);
      case "ProposalCreated":
        return await handleProposalCreated(log, txHash);
      case "ProposalVoted":
        return await handleProposalVoted(log, txHash);
      case "ProposalExecuted":
        return await handleProposalExecuted(log, txHash);
      default:
        console.log("⏭️ Unknown event:", eventName);
        return null;
    }
  } catch (error) {
    console.error("❌ Error processing event log:", error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log request details for debugging
  console.log("🎣 Webhook received!");
  console.log("Method:", req.method);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));

  const bodyString = req.body ? JSON.stringify(req.body) : "(no body)";
  console.log("Body preview:", bodyString.substring(0, 500));

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify signature
    const signature = req.headers["x-alchemy-signature"] as string;

    if (!signature) {
      console.error("❌ No signature header found");
      console.error("Available headers:", Object.keys(req.headers));
      return res.status(401).json({ error: "Missing signature" });
    }

    const body = JSON.stringify(req.body);

    if (!ALCHEMY_SIGNING_KEY) {
      console.error("❌ ALCHEMY_WEBHOOK_SIGNING_KEY not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!verifySignature(body, signature)) {
      console.error("❌ Invalid signature");
      console.error(
        "Expected signature calculation for body:",
        body.substring(0, 200)
      );
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("✅ Signature verified");

    const payload = req.body;

    if (!payload) {
      console.error("❌ Empty payload");
      return res.status(400).json({ error: "Empty payload" });
    }

    const results: any[] = [];

    // Handle GraphQL webhook
    if (payload.event?.data?.block?.logs) {
      const logs = payload.event.data.block.logs;
      console.log(`📋 Processing GraphQL webhook with ${logs.length} logs`);

      for (const log of logs) {
        const contractAddr = log.account?.address?.toLowerCase();
        console.log("🔍 Checking log from:", contractAddr);

        if (
          contractAddr === RESPECT_GAME_CORE_ADDRESS ||
          contractAddr === RESPECT_GAME_GOVERNANCE_ADDRESS
        ) {
          console.log("✅ Address matches! Processing...");
          const txHash = log.transaction?.hash || log.transactionHash;
          try {
            const result = await processEventLog(log, txHash, contractAddr);
            if (result) results.push(result);
          } catch (error: any) {
            console.error(
              "❌ Failed to process individual event, continuing with others:",
              error
            );
            results.push({ success: false, error: error.message });
          }
        } else {
          console.log("⏭️ Address doesn't match, skipping");
        }
      }
    }
    // Handle Address Activity webhook
    else if (payload.event?.activity) {
      const activities = payload.event.activity;
      console.log(
        `📋 Processing Address Activity webhook with ${activities.length} activities`
      );

      for (const activity of activities) {
        if (activity.log && activity.log.topics) {
          const contractAddr = activity.log.address?.toLowerCase();
          console.log("🔍 Checking activity from:", contractAddr);

          if (
            contractAddr === RESPECT_GAME_CORE_ADDRESS ||
            contractAddr === RESPECT_GAME_GOVERNANCE_ADDRESS
          ) {
            console.log("✅ Address matches! Processing...");
            const txHash = activity.hash || activity.log.transactionHash;
            try {
              const result = await processEventLog(
                activity.log,
                txHash,
                contractAddr
              );
              if (result) results.push(result);
            } catch (error: any) {
              console.error(
                "❌ Failed to process individual event, continuing with others:",
                error
              );
              results.push({ success: false, error: error.message });
            }
          } else {
            console.log("⏭️ Address doesn't match, skipping");
          }
        }
      }
    }
    // Handle new webhook format (direct logs array)
    else if (payload.logs && Array.isArray(payload.logs)) {
      console.log(
        `📋 Processing direct logs array with ${payload.logs.length} logs`
      );

      for (const log of payload.logs) {
        const contractAddr = log.address?.toLowerCase();
        console.log("🔍 Checking log from:", contractAddr);

        if (
          contractAddr === RESPECT_GAME_CORE_ADDRESS ||
          contractAddr === RESPECT_GAME_GOVERNANCE_ADDRESS
        ) {
          console.log("✅ Address matches! Processing...");
          const txHash = log.transactionHash || log.transaction?.hash;
          try {
            const result = await processEventLog(log, txHash, contractAddr);
            if (result) results.push(result);
          } catch (error: any) {
            console.error(
              "❌ Failed to process individual event, continuing with others:",
              error
            );
            results.push({ success: false, error: error.message });
          }
        } else {
          console.log("⏭️ Address doesn't match, skipping");
        }
      }
    } else {
      console.error("❌ Unknown webhook format!");
      console.error("Payload structure:", JSON.stringify(payload, null, 2));
      return res.status(400).json({
        error: "Unknown webhook format",
        receivedKeys: Object.keys(payload),
        hasEvent: !!payload.event,
        hasLogs: !!payload.logs,
        eventKeys: payload.event ? Object.keys(payload.event) : null,
      });
    }

    console.log(`✅ Processed ${results.length} events successfully`);
    return res.status(200).json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
