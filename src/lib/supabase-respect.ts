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
  total_respect_earned: number;
  average_respect: number;
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
  respect_earned: number;
  created_at: string;
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
  average_respect: number;
  total_respect_earned: number;
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
  total_respect_earned: number;
  average_respect: number;
  games_participated: number;
  vouched_by_count: number;
}

/**
 * Helper Functions
 */

export async function getMember(walletAddress: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (error) {
    console.error("Error fetching member:", error);
    return null;
  }

  return data;
}

export async function getCurrentGameStage(): Promise<GameStage | null> {
  const { data, error } = await supabase
    .from("game_stages")
    .select("*")
    .eq("id", 1)
    .single();

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
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
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
    .single();

  if (mgError || !memberGroup) {
    return null;
  }

  // Then get the full group
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("game_number", gameNumber)
    .eq("group_id", memberGroup.group_id)
    .single();

  if (error) {
    console.error("Error fetching group:", error);
    return null;
  }

  return data;
}

export async function getTopSixMembers(): Promise<TopSixMember[]> {
  const { data, error } = await supabase.from("top_six_members").select("*");

  if (error) {
    console.error("Error fetching top six members:", error);
    return [];
  }

  return data || [];
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
  const { data, error } = await supabase
    .from("game_results")
    .select("*")
    .eq("member_address", walletAddress.toLowerCase())
    .order("game_number", { ascending: false });

  if (error) {
    console.error("Error fetching game history:", error);
    return [];
  }

  return data || [];
}

export async function getMemberProfile(
  walletAddress: string
): Promise<MemberProfile | null> {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

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

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .in("wallet_address", addresses);

  if (error) {
    console.error("Error fetching vouched members:", error);
    return [];
  }

  return data || [];
}
