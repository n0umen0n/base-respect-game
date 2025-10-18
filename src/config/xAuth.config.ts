/**
 * X (Twitter) OAuth 2.0 Configuration
 *
 * Setup Instructions:
 * 1. Go to https://developer.twitter.com/en/portal/dashboard
 * 2. Create a new Project and App
 * 3. Enable OAuth 2.0
 * 4. Add callback URL: http://localhost:5173/auth/x/callback (dev) and your production URL
 * 5. Add environment variables to .env.local
 */

export const X_OAUTH_CONFIG = {
  // X OAuth 2.0 endpoints
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
  userEndpoint: "https://api.twitter.com/2/users/me",

  // OAuth 2.0 parameters
  clientId: import.meta.env.VITE_X_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_X_REDIRECT_URI ||
    `${window.location.origin}/auth/x/callback`,

  // Scopes needed
  scopes: ["tweet.read", "users.read"],

  // PKCE parameters
  codeChallengeMethod: "S256" as const,
};

/**
 * Generate random string for OAuth state
 */
export function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return generateRandomString(128);
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Build X OAuth authorization URL
 */
export async function buildAuthorizationUrl(): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> {
  const state = generateRandomString(16);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: X_OAUTH_CONFIG.clientId,
    redirect_uri: X_OAUTH_CONFIG.redirectUri,
    scope: X_OAUTH_CONFIG.scopes.join(" "),
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: X_OAUTH_CONFIG.codeChallengeMethod,
  });

  const url = `${X_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;

  return { url, state, codeVerifier };
}

/**
 * Exchange authorization code for access token and get user info
 * Uses backend API to avoid CORS issues
 */
export async function exchangeCodeAndGetUser(
  code: string,
  codeVerifier: string
): Promise<{
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}> {
  // Call our backend API endpoint (Vercel serverless function)
  const response = await fetch("/api/x-token-exchange", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      codeVerifier,
      redirectUri: X_OAUTH_CONFIG.redirectUri,
      clientId: X_OAUTH_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      errorData.error || `Failed to exchange code: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.success || !data.user) {
    throw new Error("Invalid response from token exchange API");
  }

  return data.user;
}
