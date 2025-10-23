/**
 * Secure API Client
 *
 * This module provides secure methods to update backend data
 * by signing messages with the user's wallet.
 *
 * IMPORTANT: This module is designed to work ONLY with Privy embedded wallets
 * to avoid triggering MetaMask or other external wallet popups.
 */

import { BrowserProvider } from "ethers";

/**
 * Update member profile securely
 * Requires wallet signature to prove ownership
 *
 * REQUIRES: A Privy embedded wallet provider must be passed to avoid MetaMask popup
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
  privyEmbeddedWallet?: any // Privy embedded wallet object from useWallets()
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the signer from Privy embedded wallet ONLY
    // DO NOT use window.ethereum as it triggers MetaMask
    if (!privyEmbeddedWallet) {
      throw new Error(
        "Privy embedded wallet is required. Please log in first."
      );
    }

    // Get the EIP-1193 provider from Privy embedded wallet
    const provider = await privyEmbeddedWallet.getEthereumProvider();
    const browserProvider = new BrowserProvider(provider);
    const signer = await browserProvider.getSigner();

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
