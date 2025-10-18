import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function to exchange X OAuth code for token
 * This runs server-side to avoid CORS issues
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, codeVerifier, redirectUri, clientId } = req.body;

    // Validate required fields
    if (!code || !codeVerifier || !redirectUri || !clientId) {
      return res.status(400).json({
        error:
          "Missing required fields: code, codeVerifier, redirectUri, clientId",
      });
    }

    console.log("Exchanging code for token...", {
      hasCode: !!code,
      hasVerifier: !!codeVerifier,
      redirectUri,
      clientId: clientId.substring(0, 10) + "...",
    });

    // Exchange code for token with X API
    const tokenResponse = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return res.status(tokenResponse.status).json({
        error: "Token exchange failed",
        details: errorText,
      });
    }

    const tokenData = await tokenResponse.json();
    console.log("Token exchange successful");

    // Get user info using the access token
    const userResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("User info fetch failed:", errorText);
      return res.status(userResponse.status).json({
        error: "Failed to fetch user info",
        details: errorText,
      });
    }

    const userData = await userResponse.json();
    console.log("User info fetched successfully");

    // Return only the necessary user data (don't expose tokens)
    return res.status(200).json({
      success: true,
      user: {
        id: userData.data.id,
        username: userData.data.username,
        name: userData.data.name,
        verified: userData.data.verified || false,
        profile_image_url: userData.data.profile_image_url,
      },
    });
  } catch (error: any) {
    console.error("Error in token exchange:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
