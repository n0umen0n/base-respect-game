/**
 * API Utilities for fetching data from Supabase
 *
 * These functions provide a clean interface for your components
 * to fetch data from the database.
 */

import {
  supabase,
  type TopLeaderboardEntry,
  type RecentTransaction,
  type UserStats,
  type GlobalStats,
  type Achievement,
} from "./supabase";

/**
 * Fetch top leaderboard (top 100 users by current number)
 */
export async function getLeaderboard(
  limit: number = 100
): Promise<TopLeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("top_leaderboard")
    .select("*")
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch recent transactions
 */
export async function getRecentTransactions(
  limit: number = 50
): Promise<RecentTransaction[]> {
  const { data, error } = await supabase
    .from("recent_transactions")
    .select("*")
    .limit(limit);

  if (error) {
    console.error("Error fetching recent transactions:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch user stats by wallet address
 */
export async function getUserStats(
  walletAddress: string
): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - user doesn't exist yet
      return null;
    }
    console.error("Error fetching user stats:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch user achievements
 */
export async function getUserAchievements(
  walletAddress: string
): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_address", walletAddress.toLowerCase())
    .order("earned_at", { ascending: false });

  if (error) {
    console.error("Error fetching achievements:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch global statistics
 */
export async function getGlobalStats(): Promise<GlobalStats | null> {
  const { data, error } = await supabase
    .from("global_stats")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching global stats:", error);
    throw error;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: {
    username?: string;
    avatar_url?: string;
    bio?: string;
  }
) {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("wallet_address", walletAddress.toLowerCase())
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }

  return data;
}

/**
 * Create or update user
 */
export async function upsertUser(walletAddress: string, privyDid?: string) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        wallet_address: walletAddress.toLowerCase(),
        privy_did: privyDid,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "wallet_address",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user:", error);
    throw error;
  }

  return data;
}

/**
 * Subscribe to leaderboard changes (realtime)
 */
export function subscribeToLeaderboard(callback: (payload: any) => void) {
  const channel = supabase
    .channel("leaderboard-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "leaderboard",
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new transactions (realtime)
 */
export function subscribeToTransactions(callback: (payload: any) => void) {
  const channel = supabase
    .channel("transaction-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "transactions",
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to user achievements (realtime)
 */
export function subscribeToUserAchievements(
  walletAddress: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`achievements-${walletAddress}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "achievements",
        filter: `user_address=eq.${walletAddress.toLowerCase()}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
