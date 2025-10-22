/**
 * Secure API Client
 *
 * This module provides secure methods to update backend data
 * by signing messages with the user's wallet.
 */

import { BrowserProvider } from "ethers";

/**
 * Update member profile securely
 * Requires wallet signature to prove ownership
 */
export async function secureUpdateProfile(
  walletAddress: string,
  updates: {
    name?: string;
    profileUrl?: string;
    description?: string;
    xAccount?: string;
    xVerified?: boolean;
    privyDid?: string;
  },
  provider?: BrowserProvider // Optional: Privy embedded wallet provider
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the signer (wallet)
    let signer;

    if (provider) {
      // Use provided provider (e.g., Privy embedded wallet)
      signer = await provider.getSigner();
    } else if (typeof window !== "undefined" && (window as any).ethereum) {
      // Fallback to MetaMask or other injected wallet
      const browserProvider = new BrowserProvider((window as any).ethereum);
      signer = await browserProvider.getSigner();
    } else {
      throw new Error("No wallet provider found");
    }

    // Create message to sign
    const timestamp = Date.now();
    const message = `Update profile for ${walletAddress}\nTimestamp: ${timestamp}`;

    console.log("📝 Signing message:", message);

    // Sign the message
    const signature = await signer.signMessage(message);

    console.log("✅ Message signed successfully");

    // Call the secure backend API
    const response = await fetch("/api/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        message,
        timestamp,
        updates,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    console.log("✅ Profile updated successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error updating profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}

/**
 * Helper to get BrowserProvider from Privy
 * Call this if you're using Privy embedded wallets
 */
export async function getPrivyProvider(): Promise<BrowserProvider | null> {
  try {
    // Check if window.ethereum exists (Privy injects this)
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new BrowserProvider((window as any).ethereum);
    }
    return null;
  } catch (error) {
    console.error("Error getting Privy provider:", error);
    return null;
  }
}
