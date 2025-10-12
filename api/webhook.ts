/**
 * Universal Alchemy Webhook Handler
 * Supports both Address Activity and GraphQL webhooks
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
 * Process event log and update user
 */
async function processEventLog(log: any, txHash: string) {
  try {
    console.log("📝 Processing event log with topics:", log.topics);

    if (!log.topics || log.topics.length < 3) {
      console.log("⏭️ Not enough topics, skipping");
      return null;
    }

    // Decode event data
    // NumberSet(uint256 indexed newNumber, address indexed setter)
    const newNumber = parseInt(log.topics[1], 16);
    const setterAddress = "0x" + log.topics[2].slice(26);

    console.log("✅ Decoded event:", {
      newNumber,
      setterAddress: setterAddress.toLowerCase(),
      txHash,
    });

    // Get current user data
    const { data: existingUser } = await supabase
      .from("users")
      .select("current_number, total_transactions, highest_number")
      .eq("wallet_address", setterAddress.toLowerCase())
      .single();

    // Calculate new stats
    const totalTxs = (existingUser?.total_transactions || 0) + 1;
    const highestNum = Math.max(existingUser?.highest_number || 0, newNumber);

    // Upsert user
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
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ User updated successfully:", data);
    return { success: true, user: data };
  } catch (error) {
    console.error("❌ Error processing event log:", error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🎣 Webhook received!");

    // Verify signature
    const signature = req.headers["x-alchemy-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!signature || !verifySignature(body, signature)) {
      console.error("❌ Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("✅ Signature verified");

    const payload = req.body;
    console.log("📦 Payload type:", payload.type);

    const results = [];

    // Handle GraphQL webhook (has data.block.logs structure)
    if (payload.event?.data?.block?.logs) {
      console.log("📊 GraphQL webhook detected");
      const logs = payload.event.data.block.logs;
      console.log(`📋 Processing ${logs.length} logs`);

      for (const log of logs) {
        const contractAddr = log.account?.address;
        console.log("🔍 Log from:", contractAddr);

        if (contractAddr?.toLowerCase() === CONTRACT_ADDRESS) {
          const txHash = log.transaction?.hash || log.transactionHash;
          const result = await processEventLog(log, txHash);
          if (result) results.push(result);
        }
      }
    }
    // Handle Address Activity webhook (has event.activity structure)
    else if (payload.event?.activity) {
      console.log("📊 Address Activity webhook detected");
      const activities = payload.event.activity;
      console.log(`📋 Processing ${activities.length} activities`);

      for (const activity of activities) {
        console.log("🔍 Activity:", JSON.stringify(activity, null, 2));

        // Only process if it has a log with topics (event log)
        if (activity.log && activity.log.topics) {
          const contractAddr = activity.log.address;
          console.log("🔍 Event log from:", contractAddr);

          if (contractAddr?.toLowerCase() === CONTRACT_ADDRESS) {
            const txHash = activity.hash || activity.log.transactionHash;
            const result = await processEventLog(activity.log, txHash);
            if (result) results.push(result);
          }
        } else {
          console.log(
            "⏭️ Skipping - no event log (category:",
            activity.category,
            ")"
          );
        }
      }
    } else {
      console.error("❌ Unknown webhook format");
      return res.status(400).json({ error: "Unknown webhook format" });
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
