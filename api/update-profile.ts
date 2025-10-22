/**
 * Secure Profile Update API
 *
 * This endpoint allows users to update their profile data securely.
 * It validates that the request comes from the actual wallet owner
 * by verifying a signed message.
 *
 * Security measures:
 * 1. Requires wallet signature verification
 * 2. Uses service_role key (kept secret on backend)
 * 3. Users can only update their own profiles
 * 4. Validates all input data
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "ethers";

// Initialize Supabase client with SERVICE ROLE key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateProfileRequest {
  walletAddress: string;
  signature: string; // Signed message proving wallet ownership
  message: string; // The message that was signed
  timestamp: number; // When the message was created (for replay protection)
  updates: {
    name?: string;
    profileUrl?: string;
    description?: string;
    xAccount?: string;
    xVerified?: boolean;
    privyDid?: string;
  };
}

/**
 * Verify CORS
 */
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); // In production, set to your domain
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
    const { walletAddress, signature, message, timestamp, updates } =
      req.body as UpdateProfileRequest;

    // Validate required fields
    if (!walletAddress || !signature || !message || !timestamp) {
      return res.status(400).json({
        error:
          "Missing required fields: walletAddress, signature, message, timestamp",
      });
    }

    // Check timestamp to prevent replay attacks (message must be within 5 minutes)
    const now = Date.now();
    const timeDiff = now - timestamp;
    if (timeDiff > 5 * 60 * 1000 || timeDiff < 0) {
      return res.status(401).json({
        error: "Signature expired or invalid timestamp",
      });
    }

    // Verify the signature
    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(message, signature).toLowerCase();
    } catch (err) {
      console.error("Signature verification failed:", err);
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    // Check that recovered address matches the claimed wallet address
    if (recoveredAddress !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        error: "Signature does not match wallet address",
        details: {
          claimed: walletAddress.toLowerCase(),
          recovered: recoveredAddress,
        },
      });
    }

    // Validate that the message contains the wallet address (prevents signature reuse)
    if (!message.toLowerCase().includes(walletAddress.toLowerCase())) {
      return res.status(401).json({
        error: "Message does not contain wallet address",
      });
    }

    console.log("✅ Signature verified for wallet:", walletAddress);

    // Check if user exists
    const { data: existingMember } = await supabase
      .from("members")
      .select("wallet_address")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle();

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.profileUrl !== undefined)
      updateData.profile_url = updates.profileUrl;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.xAccount !== undefined) updateData.x_account = updates.xAccount;
    if (updates.xVerified !== undefined)
      updateData.x_verified = updates.xVerified;
    if (updates.privyDid !== undefined) updateData.privy_did = updates.privyDid;

    // Validate input lengths
    if (updateData.name && updateData.name.length > 100) {
      return res
        .status(400)
        .json({ error: "Name too long (max 100 characters)" });
    }
    if (updateData.profile_url && updateData.profile_url.length > 500) {
      return res
        .status(400)
        .json({ error: "Profile URL too long (max 500 characters)" });
    }
    if (updateData.description && updateData.description.length > 1000) {
      return res
        .status(400)
        .json({ error: "Description too long (max 1000 characters)" });
    }

    if (existingMember) {
      // Update existing member
      const { error } = await supabase
        .from("members")
        .update(updateData)
        .eq("wallet_address", walletAddress.toLowerCase());

      if (error) {
        console.error("Error updating member:", error);
        return res.status(500).json({ error: "Failed to update profile" });
      }

      console.log("✅ Profile updated for:", walletAddress);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        walletAddress,
      });
    } else {
      // Member doesn't exist yet
      return res.status(404).json({
        error: "Member not found. Please join the game first.",
      });
    }
  } catch (error: any) {
    console.error("❌ Update profile error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
