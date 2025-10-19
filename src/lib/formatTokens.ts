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
 * Format respect amount for display
 * @param weiAmount - Token amount in wei
 * @param showFull - If true, show full token amount. If false, divide by 1000
 * @returns Formatted string - by default divided by 1000 (52500 → "52"), or full if showFull=true
 */
export function formatRespectDisplay(
  weiAmount: string | number | null | undefined,
  showFull: boolean = false
): string {
  const tokens = formatRespectAmount(weiAmount);
  
  if (showFull) {
    // Show full token amount for balance (210000 → "210000")
    return tokens.toString();
  }
  
  // Divide by 1000 and show integer only for scores
  // 52,500 → 52
  // 100,500 → 100
  // 1,000,000 → 1000
  const displayValue = Math.floor(tokens / 1000);
  
  return displayValue.toString();
}

/**
 * Format respect earned as score increase (for game history)
 * @param weiAmount - Token amount in wei
 * @returns Formatted string - tokens / 12 / 1000, rounded down (210000 → "17")
 */
export function formatRespectEarned(
  weiAmount: string | number | null | undefined
): string {
  const tokens = formatRespectAmount(weiAmount);
  
  // Divide by 12 (score formula), then by 1000 (display format)
  // 210,000 → 210,000 / 12 = 17,500 → 17,500 / 1000 = 17
  const scoreIncrease = Math.floor(tokens / 12 / 1000);
  
  return scoreIncrease.toString();
}
