import { Command } from "commander";
import {
  getOrPromptDeployEnv,
  getOrPromptInteger,
  getOrPromptString,
  getOrPromptSolanaAddress,
  validateAndExecute,
} from "@internal/utils/cli";
import {
  argsSchema,
  handleDeployCrossChainErc20,
} from "./deploy-crosschain-erc20.handler";

type CommanderOptions = {
  deployEnv?: string;
  splMint?: string;
  decimals?: string;
  name?: string;
  symbol?: string;
};

async function collectInteractiveOptions(
  options: CommanderOptions
): Promise<CommanderOptions> {
  let opts = { ...options };

  if (!opts.deployEnv) {
    opts.deployEnv = await getOrPromptDeployEnv();
  }

  opts.splMint = await getOrPromptSolanaAddress(
    opts.splMint,
    "Enter SPL mint address (Solana pubkey)"
  );

  opts.decimals = await getOrPromptInteger(
    opts.decimals,
    "Enter token decimals (0-255)",
    0,
    255
  );

  opts.name = await getOrPromptString(opts.name, "Enter token name", "Wrapped SPL");
  opts.symbol = await getOrPromptString(
    opts.symbol,
    "Enter token symbol",
    "wSPL"
  );

  return opts;
}

export const deployCrossChainErc20Command = new Command("deploy-crosschain-erc20")
  .description(
    "Deploy a wrapped ERC20 on Base for a given Solana SPL mint via CrossChainERC20Factory"
  )
  .option(
    "--deploy-env <deployEnv>",
    "Target deploy environment (testnet-alpha | testnet-prod | mainnet)"
  )
  .option("--spl-mint <address>", "SPL token mint address (Solana pubkey)")
  .option("--decimals <decimals>", "Token decimals (0-255)")
  .option("--name <name>", "Token name on Base")
  .option("--symbol <symbol>", "Token symbol on Base")
  .action(async (options) => {
    const opts = await collectInteractiveOptions(options);
    await validateAndExecute(argsSchema, opts, handleDeployCrossChainErc20);
  });


