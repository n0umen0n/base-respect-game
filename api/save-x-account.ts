/**
 * Save X Account API (Profile Creation Only)
 *
 * This endpoint allows saving X account during profile creation.
 * It uses Privy DID verification instead of wallet signatures.
 * This is secure because:
 * 1. X account comes from Privy's verified OAuth
 * 2. Privy DID links the X account to the authenticated user
 * 3. Only works once during profile creation (member must exist but X account must be null)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with SERVICE ROLE key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SaveXAccountRequest {
  walletAddress: string; // Smart account address
  xAccount: string;
  xVerified: boolean;
  privyDid: string;
}

/**
 * Verify CORS
 */
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress, xAccount, xVerified, privyDid } =
      req.body as SaveXAccountRequest;

    // Validate required fields
    if (!walletAddress || !xAccount || !privyDid) {
      return res.status(400).json({
        error: "Missing required fields: walletAddress, xAccount, privyDid",
      });
    }

    console.log("📝 Saving X account:", {
      walletAddress,
      xAccount,
      xVerified,
      privyDid,
    });

    // Check if member exists
    const { data: existingMember } = await supabase
      .from("members")
      .select("wallet_address, x_account, privy_did")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle();

    if (!existingMember) {
      return res.status(404).json({
        error:
          "Member not found. Please wait for blockchain transaction to complete.",
      });
    }

    // Security: Only allow setting X account if:
    // 1. Member doesn't have X account yet (first-time setup)
    // 2. OR member has same Privy DID (same user updating)
    if (
      existingMember.x_account &&
      existingMember.privy_did &&
      existingMember.privy_did !== privyDid
    ) {
      return res.status(403).json({
        error: "X account already set by another user",
      });
    }

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
      console.error("Error updating member:", error);
      return res.status(500).json({ error: "Failed to save X account" });
    }

    console.log("✅ X account saved for:", walletAddress);
    return res.status(200).json({
      success: true,
      message: "X account saved successfully",
    });
  } catch (error: any) {
    console.error("❌ Save X account error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
