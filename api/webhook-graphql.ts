/**
 * Alchemy GraphQL Webhook Handler
 *
 * Handles GraphQL webhook payloads from Alchemy
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Alchemy webhook signing key
const ALCHEMY_SIGNING_KEY = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY!;

// Your contract address (lowercase for comparison)
const CONTRACT_ADDRESS = "0x44ac2dae725b989df123243a21c9b52b224b4273";

/**
 * Verify Alchemy webhook signature
 */
function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", ALCHEMY_SIGNING_KEY);
  const digest = hmac.update(body).digest("hex");
  return signature === digest;
}

/**
 * Process event log - Update user stats
 */
async function processEventLog(log: any, transaction: any, block: any) {
  try {
    console.log("📝 Processing event log");
    console.log("Log topics:", log.topics);

    // Decode event data
    // NumberSet(uint256 indexed newNumber, address indexed setter)
    const newNumber = parseInt(log.topics[1], 16);
    const setterAddress = "0x" + log.topics[2].slice(26);

    console.log("Decoded:", {
      newNumber,
      setterAddress: setterAddress.toLowerCase(),
    });

    // Get current user data (if exists)
    const { data: existingUser } = await supabase
      .from("users")
      .select("current_number, total_transactions, highest_number")
      .eq("wallet_address", setterAddress.toLowerCase())
      .single();

    console.log("Existing user:", existingUser);

    // Calculate new stats
    const totalTxs = (existingUser?.total_transactions || 0) + 1;
    const highestNum = Math.max(existingUser?.highest_number || 0, newNumber);

    // Upsert user with updated stats
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          wallet_address: setterAddress.toLowerCase(),
          current_number: newNumber,
          total_transactions: totalTxs,
          highest_number: highestNum,
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
      console.error("❌ Error upserting user:", error);
      throw error;
    }

    console.log("✅ User updated:", data);
    return {
      success: true,
      user: data,
      newNumber,
      setterAddress,
    };
  } catch (error) {
    console.error("❌ Error processing event:", error);
    throw error;
  }
}

/**
 * Main webhook handler for GraphQL webhooks
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🎣 GraphQL Webhook received!");

    // Verify webhook signature
    const signature = req.headers["x-alchemy-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!signature || !verifySignature(body, signature)) {
      console.error("❌ Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("✅ Signature verified");

    // Parse GraphQL webhook payload
    const payload = req.body;
    console.log("📦 Full payload:", JSON.stringify(payload, null, 2));

    // GraphQL webhook structure: { event: { block: { logs: [...] } } }
    const block = payload.event?.block;

    if (!block) {
      console.error("❌ No block data in payload");
      return res.status(400).json({ error: "Invalid payload - no block" });
    }

    const logs = block.logs;

    if (!logs || logs.length === 0) {
      console.log("ℹ️ No logs in this block for our contract");
      return res.status(200).json({
        success: true,
        processed: 0,
        message: "No logs to process",
      });
    }

    console.log(`📋 Processing ${logs.length} logs`);

    const results = [];

    // Process each log
    for (const logEntry of logs) {
      console.log("🔍 Processing log from:", logEntry.account?.address);

      // Verify it's from our contract
      if (logEntry.account?.address?.toLowerCase() !== CONTRACT_ADDRESS) {
        console.log("⏭️ Skipping log from other contract");
        continue;
      }

      // Process the event
      const result = await processEventLog(
        logEntry,
        logEntry.transaction,
        block
      );
      results.push(result);
    }

    console.log("✅ All logs processed successfully");
    return res.status(200).json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("❌ Webhook handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
