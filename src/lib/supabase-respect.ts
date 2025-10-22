/**
 * Supabase Client for Respect Game
 * Types and client configuration for the Respect Game schema
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file"
  );
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database Types for Respect Game
 */

export interface Member {
  id: string;
  wallet_address: string;
  privy_did?: string;
  name: string;
  profile_url?: string;
  description?: string;
  x_account?: string;
  x_verified: boolean;
  is_approved: boolean;
  is_banned: boolean;
  joined_at: string;
  total_respect_earned: string; // NUMERIC as string to preserve precision
  average_respect: string; // NUMERIC as string to preserve precision
  created_at: string;
  updated_at: string;
}

export interface GameStage {
  id: number;
  current_game_number: number;
  current_stage: "ContributionSubmission" | "ContributionRanking";
  next_stage_timestamp: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  contributor_address: string;
  game_number: number;
  contributions: string[];
  links: string[];
  counted: boolean;
  tx_hash?: string;
  block_timestamp: string;
  created_at: string;
}

export interface Group {
  id: string;
  game_number: number;
  group_id: number;
  members: string[]; // Array of wallet addresses
  finalized: boolean;
  created_at: string;
}

export interface MemberGroup {
  id: string;
  game_number: number;
  member_address: string;
  group_id: number;
}

export interface Ranking {
  id: string;
  ranker_address: string;
  game_number: number;
  group_id: number;
  ranked_addresses: string[];
  tx_hash?: string;
  block_timestamp: string;
  created_at: string;
}

export interface GameResult {
  id: string;
  member_address: string;
  game_number: number;
  rank: number;
  respect_earned: string; // NUMERIC as string to preserve precision
  created_at: string;
  contributions?: string[];
  links?: string[];
  ranked_addresses?: string[];
}

export interface Proposal {
  id: string;
  proposal_id: number;
  proposal_type: "BanMember" | "ApproveMember" | "ExecuteTransactions";
  proposer_address: string;
  target_member_address?: string;
  transfer_amount?: number;
  transfer_recipient?: string;
  description: string;
  status: "Pending" | "Executed";
  votes_for: number;
  votes_against: number;
  tx_hash?: string;
  block_timestamp: string;
  created_at: string;
}

export interface ProposalVote {
  id: string;
  proposal_id: number;
  voter_address: string;
  vote_for: boolean;
  tx_hash?: string;
  block_timestamp: string;
  created_at: string;
}

export interface MemberApproval {
  id: string;
  approved_member_address: string;
  approver_address: string;
  approved_at: string;
}

export interface RespectHistory {
  id: string;
  member_address: string;
  game_number: number;
  respect_amount: number;
  created_at: string;
}

// View Types
export interface TopSixMember {
  wallet_address: string;
  name: string;
  profile_url?: string;
  x_account?: string;
  x_verified: boolean;
  average_respect: string; // NUMERIC as string to preserve precision
  total_respect_earned: string; // NUMERIC as string to preserve precision
  rank: number;
}

export interface CurrentGameContribution {
  contributor_address: string;
  name: string;
  profile_url?: string;
  x_account?: string;
  game_number: number;
  contributions: string[];
  links: string[];
  created_at: string;
}

export interface LiveProposal {
  proposal_id: number;
  proposal_type: string;
  proposer_address: string;
  proposer_name: string;
  target_member_address?: string;
  target_member_name?: string;
  transfer_amount?: number;
  transfer_recipient?: string;
  description: string;
  status: string;
  votes_for: number;
  votes_against: number;
  block_timestamp: string;
  created_at: string;
}

export interface MemberProfile {
  wallet_address: string;
  privy_did?: string;
  name: string;
  profile_url?: string;
  description?: string;
  x_account?: string;
  x_verified: boolean;
  is_approved: boolean;
  is_banned: boolean;
  joined_at: string;
  total_respect_earned: string; // NUMERIC as string to preserve precision
  average_respect: string; // NUMERIC as string to preserve precision
  games_participated: number;
  vouched_by_count: number;
}

/**
 * Helper Functions
 */

export async function getMember(walletAddress: string): Promise<Member | null> {
  // Cast NUMERIC columns to TEXT to preserve precision
  const { data, error } = await supabase
    .from("members")
    .select(
      `
      id, wallet_address, privy_did, name, profile_url, description,
      x_account, x_verified, is_approved, is_banned, joined_at,
      total_respect_earned::text, average_respect::text,
      created_at, updated_at
    `
    )
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows gracefully

  if (error) {
    console.error("Error fetching member:", error);
    return null;
  }

  return data;
}

export async function getMembers(walletAddresses: string[]): Promise<Member[]> {
  if (!walletAddresses || walletAddresses.length === 0) {
    return [];
  }

  const normalizedAddresses = walletAddresses.map((addr) => addr.toLowerCase());

  // Cast NUMERIC columns to TEXT
  const { data, error } = await supabase
    .from("members")
    .select(
      `
      id, wallet_address, privy_did, name, profile_url, description,
      x_account, x_verified, is_approved, is_banned, joined_at,
      total_respect_earned::text, average_respect::text,
      created_at, updated_at
    `
    )
    .in("wallet_address", normalizedAddresses);

  if (error) {
    console.error("Error fetching members:", error);
    return [];
  }

  return data || [];
}

export async function getCurrentGameStage(): Promise<GameStage | null> {
  const { data, error } = await supabase
    .from("game_stages")
    .select("*")
    .eq("id", 1)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows gracefully

  if (error) {
    console.error("Error fetching game stage:", error);
    return null;
  }

  return data;
}

export async function getMemberContribution(
  walletAddress: string,
  gameNumber: number
): Promise<Contribution | null> {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("contributor_address", walletAddress.toLowerCase())
    .eq("game_number", gameNumber)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows gracefully

  if (error) {
    console.error("Error fetching contribution:", error);
    return null;
  }

  return data;
}

export async function getMemberGroup(
  walletAddress: string,
  gameNumber: number
): Promise<Group | null> {
  // First get the group_id for the member
  const { data: memberGroup, error: mgError } = await supabase
    .from("member_groups")
    .select("group_id")
    .eq("member_address", walletAddress.toLowerCase())
    .eq("game_number", gameNumber)
    .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

  if (mgError || !memberGroup) {
    return null;
  }

  // Then get the full group
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("game_number", gameNumber)
    .eq("group_id", memberGroup.group_id)
    .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

  if (error) {
    console.error("Error fetching group:", error);
    return null;
  }

  return data;
}

export async function getMemberRanking(
  walletAddress: string,
  gameNumber: number
): Promise<Ranking | null> {
  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .eq("ranker_address", walletAddress.toLowerCase())
    .eq("game_number", gameNumber)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows gracefully

  if (error) {
    console.error("Error fetching ranking:", error);
    return null;
  }

  return data;
}

export async function getTopSixMembers(): Promise<TopSixMember[]> {
  // Cast NUMERIC columns to TEXT to preserve precision
  const { data, error } = await supabase
    .from("top_six_members")
    .select(
      "wallet_address, name, profile_url, x_account, x_verified, average_respect::text, total_respect_earned::text, rank"
    );

  if (error) {
    console.error("Error fetching top six members:", error);
    return [];
  }

  return data || [];
}

export async function getAllMembers(): Promise<TopSixMember[]> {
  // Fetch all approved, non-banned members ordered by respect
  const { data, error } = await supabase
    .from("members")
    .select(
      "wallet_address, name, profile_url, x_account, x_verified, average_respect::text, total_respect_earned::text"
    )
    .eq("is_approved", true)
    .eq("is_banned", false)
    .order("average_respect", { ascending: false })
    .order("total_respect_earned", { ascending: false });

  if (error) {
    console.error("Error fetching all members:", error);
    return [];
  }

  // Add rank to each member
  return (data || []).map((member, index) => ({
    ...member,
    rank: index + 1,
  }));
}

export async function getLiveProposals(): Promise<LiveProposal[]> {
  const { data, error } = await supabase
    .from("live_proposals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching live proposals:", error);
    return [];
  }

  return data || [];
}

export async function getHistoricalProposals(): Promise<LiveProposal[]> {
  const { data, error } = await supabase
    .from("historical_proposals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching historical proposals:", error);
    return [];
  }

  return data || [];
}

export async function getMemberGameHistory(
  walletAddress: string
): Promise<GameResult[]> {
  const normalizedAddress = walletAddress.toLowerCase();

  // Fetch game results - cast NUMERIC to TEXT
  const { data: gameResults, error: resultsError } = await supabase
    .from("game_results")
    .select(
      "id, member_address, game_number, rank, respect_earned::text, created_at"
    )
    .eq("member_address", normalizedAddress)
    .order("game_number", { ascending: false });

  if (resultsError) {
    console.error("Error fetching game history:", resultsError);
    return [];
  }

  if (!gameResults || gameResults.length === 0) {
    return [];
  }

  // For each game result, fetch contributions and rankings
  const enrichedResults = await Promise.all(
    gameResults.map(async (result) => {
      // Fetch contributions for this game
      const { data: contribution } = await supabase
        .from("contributions")
        .select("contributions, links")
        .eq("contributor_address", normalizedAddress)
        .eq("game_number", result.game_number)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

      // Fetch rankings submitted by this user for this game
      const { data: rankings } = await supabase
        .from("rankings")
        .select("ranked_addresses")
        .eq("ranker_address", normalizedAddress)
        .eq("game_number", result.game_number)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

      return {
        ...result,
        contributions: contribution?.contributions || [],
        links: contribution?.links || [],
        ranked_addresses: rankings?.ranked_addresses || [],
      };
    })
  );

  return enrichedResults;
}

export async function getMemberProfile(
  walletAddress: string
): Promise<MemberProfile | null> {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

  if (error) {
    console.error("Error fetching member profile:", error);
    return null;
  }

  return data;
}

export async function getVouchedForMembers(
  walletAddress: string
): Promise<Member[]> {
  const { data: approvals, error: appError } = await supabase
    .from("member_approvals")
    .select("approved_member_address")
    .eq("approver_address", walletAddress.toLowerCase());

  if (appError || !approvals) {
    return [];
  }

  const addresses = approvals.map((a) => a.approved_member_address);

  if (addresses.length === 0) {
    return [];
  }

  // Cast NUMERIC columns to TEXT
  const { data, error } = await supabase
    .from("members")
    .select(
      `
      id, wallet_address, privy_did, name, profile_url, description,
      x_account, x_verified, is_approved, is_banned, joined_at,
      total_respect_earned::text, average_respect::text,
      created_at, updated_at
    `
    )
    .in("wallet_address", addresses);

  if (error) {
    console.error("Error fetching vouched members:", error);
    return [];
  }

  return data || [];
}

/**
 * Upload a profile picture to Supabase Storage
 * @param file - The image file to upload
 * @param walletAddress - The wallet address of the user (used for unique file naming)
 * @returns The public URL of the uploaded image
 */
export async function uploadProfilePicture(
  file: File,
  walletAddress: string
): Promise<string> {
  try {
    console.log("🖼️ Starting profile picture upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      walletAddress: walletAddress.substring(0, 10) + "...",
    });

    // Create a unique file name using wallet address and timestamp
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${walletAddress.toLowerCase()}-${timestamp}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    console.log("📁 Upload path:", filePath);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("respect-game-profiles")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase storage error:", error);
      throw new Error("Failed to upload profile picture: " + error.message);
    }

    console.log("✅ Upload successful, getting public URL...");

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("respect-game-profiles")
      .getPublicUrl(filePath);

    console.log("🔗 Public URL:", urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("❌ Error in uploadProfilePicture:", error);
    throw error;
  }
}

/**
 * Update member's verified X account in database
 * This should ONLY be called after Privy Twitter authentication
 * @param walletAddress - The member's wallet address
 * @param xAccount - The verified X account (e.g., "@username")
 * @param xVerified - Whether the X account is verified
 * @param privyDid - The Privy DID to link the X account to this specific user
 */
export async function updateMemberXAccount(
  walletAddress: string,
  xAccount: string,
  xVerified: boolean,
  privyDid: string
): Promise<void> {
  try {
    console.log("Updating X account in database:", {
      walletAddress: walletAddress.toLowerCase(),
      xAccount,
      xVerified,
      privyDid: privyDid.substring(0, 20) + "...",
    });

    // First check if member exists
    const { data: member, error: checkError } = await supabase
      .from("members")
      .select("wallet_address, x_account")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

    if (checkError || !member) {
      console.error("Member not found in database yet:", checkError);
      throw new Error("Member not found - webhook may not have processed yet");
    }

    console.log("Member found, current X account:", member.x_account);

    // Update member with X account
    const { error } = await supabase
      .from("members")
      .update({
        x_account: xAccount,
        x_verified: xVerified,
        privy_did: privyDid,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress.toLowerCase());

    if (error) {
      console.error("Error updating X account:", error);
      throw new Error("Failed to update X account: " + error.message);
    }

    console.log("✅ X account updated successfully in database");
  } catch (error: any) {
    console.error("❌ Error in updateMemberXAccount:", error);
    throw error;
  }
}
