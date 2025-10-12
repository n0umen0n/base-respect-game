/**
 * Supabase Client Configuration
 *
 * This file sets up the Supabase client for the frontend.
 * It uses the public anon key which is safe to expose.
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
 * Database Types
 * These match your Supabase schema
 */

export interface User {
  id: string;
  wallet_address: string;
  privy_did?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  tx_hash: string;
  user_op_hash?: string;
  user_address: string;
  smart_wallet_address?: string;
  function_name: string;
  previous_value?: number;
  new_value: number;
  block_number: number;
  block_timestamp: string;
  gas_sponsored: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  user_address: string;
  current_number: number;
  total_transactions: number;
  highest_number: number;
  lowest_number?: number;
  first_transaction_at?: string;
  last_transaction_at?: string;
  total_gas_saved: number;
  rank?: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_address: string;
  achievement_type: string;
  achievement_name: string;
  description?: string;
  earned_at: string;
}

export interface GlobalStats {
  id: number;
  total_users: number;
  total_transactions: number;
  total_gas_saved: number;
  highest_number_ever: number;
  highest_number_user?: string;
  updated_at: string;
}

export interface TopLeaderboardEntry {
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  current_number: number;
  total_transactions: number;
  highest_number: number;
  last_transaction_at?: string;
  rank: number;
}

export interface RecentTransaction {
  id: string;
  tx_hash: string;
  user_address: string;
  username?: string;
  avatar_url?: string;
  function_name: string;
  previous_value?: number;
  new_value: number;
  block_timestamp: string;
  gas_sponsored: boolean;
}

export interface UserStats {
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  current_number?: number;
  total_transactions?: number;
  highest_number?: number;
  lowest_number?: number;
  first_transaction_at?: string;
  last_transaction_at?: string;
  total_achievements: number;
  rank?: number;
}
