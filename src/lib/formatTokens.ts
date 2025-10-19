/**
 * Format token amounts from wei (with 18 decimals) to human-readable numbers
 */

/**
 * Convert wei amount to token amount (divide by 10^18)
 * @param weiAmount - Token amount in wei (as string or number)
 * @returns Formatted token amount as a number
 */
export function formatRespectAmount(
  weiAmount: string | number | null | undefined
): number {
  if (!weiAmount || weiAmount === 0 || weiAmount === "0") {
    return 0;
  }

  try {
    // Convert to string, handling both string and number inputs
    let weiString = String(weiAmount);
    
    // Remove any decimal points (PostgreSQL NUMERIC might include them)
    weiString = weiString.split(".")[0];
    
    // Handle empty strings
    if (!weiString) return 0;

    // Convert to BigInt
    const wei = BigInt(weiString);

    // Divide by 10^18 using BigInt
    const divisor = BigInt("1000000000000000000"); // 10^18
    const tokens = wei / divisor;

    return Number(tokens);
  } catch (error) {
    console.error(
      "Error formatting respect amount:",
      error,
      "Input:",
      weiAmount
    );
    return 0;
  }
}

/**
 * Format respect amount with commas for display
 * @param weiAmount - Token amount in wei
 * @returns Formatted string like "210,000"
 */
export function formatRespectDisplay(
  weiAmount: string | number | null | undefined
): string {
  const tokens = formatRespectAmount(weiAmount);
  return tokens.toLocaleString("en-US");
}
