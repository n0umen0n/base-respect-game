/**
 * Simplified API Utilities for Testing
 *
 * Works with the simplified schema (just users table)
 */

import { supabase } from "./supabase";

/**
 * Simple User Profile Type
 */
export interface UserProfile {
  id: string;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  current_number: number;
  total_transactions: number;
  highest_number: number;
  created_at: string;
  updated_at: string;
  rank?: number;
}

/**
 * Fetch top 100 profiles (ranked by current number)
 */
export async function getTopProfiles(
  limit: number = 100
): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("top_profiles")
      .select("*")
      .limit(limit);

    if (error) {
      console.error("Error fetching top profiles:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch top profiles:", error);
    throw error;
  }
}

/**
 * Fetch all users (ordered by current number)
 */
export async function getAllUsers(limit: number = 100): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("current_number", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

/**
 * Fetch single user by wallet address
 */
export async function getUserByAddress(
  walletAddress: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // User doesn't exist yet
        return null;
      }
      console.error("Error fetching user:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

/**
 * Update user profile (username, avatar, bio)
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: {
    username?: string;
    avatar_url?: string;
    bio?: string;
  }
) {
  try {
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
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }
}

/**
 * Create or update user (for initial setup)
 */
export async function upsertUser(
  walletAddress: string,
  data?: {
    username?: string;
    privy_did?: string;
  }
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .upsert(
        {
          wallet_address: walletAddress.toLowerCase(),
          ...data,
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

    return user;
  } catch (error) {
    console.error("Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Subscribe to changes in users table (realtime)
 */
export function subscribeToUsers(callback: (payload: any) => void) {
  const channel = supabase
    .channel("users-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users",
      },
      callback
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to a specific user's changes
 */
export function subscribeToUser(
  walletAddress: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`user-${walletAddress}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `wallet_address=eq.${walletAddress.toLowerCase()}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
