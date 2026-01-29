import { z } from "zod";
import { getBase58Codec } from "@solana/kit";
import {
  type Address as EvmAddress,
  type Hex,
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { logger } from "@internal/logger";
import { CONFIGS, DEPLOY_ENVS } from "@internal/constants";
import { BRIDGE_ABI } from "@internal/base/abi/bridge.abi";
import { CROSS_CHAIN_ERC20_FACTORY_ABI } from "@internal/base/abi/cross-chain-erc20-factory.abi";

export const argsSchema = z.object({
  deployEnv: z
    .enum(DEPLOY_ENVS, {
      message:
        "Deploy environment must be 'testnet-alpha', 'testnet-prod', or 'mainnet'",
    })
    .default("testnet-prod"),
  splMint: z.string().min(1, "SPL mint is required").brand<"solanaAddress">(),
  decimals: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => Number.isFinite(val) && val >= 0 && val <= 255, {
      message: "Decimals must be an integer between 0 and 255",
    }),
  name: z.string().min(1, "Token name cannot be empty"),
  symbol: z.string().min(1, "Token symbol cannot be empty"),
});

type Args = z.infer<typeof argsSchema>;

export async function handleDeployCrossChainErc20(args: Args): Promise<void> {
  logger.info("--- Deploy wrapped ERC20 on Base for SPL mint ---");

  const config = CONFIGS[args.deployEnv];

  const pkRaw = process.env.EVM_PRIVATE_KEY;
  if (!pkRaw) {
    throw new Error(
      "Missing EVM_PRIVATE_KEY in environment. This is required to send the Base transaction."
    );
  }
  const pk = normalizeEvmPrivateKey(pkRaw);

  // Convert Solana mint pubkey -> bytes32 for Base factory
  const mintBytes32 = `0x${getBase58Codec().encode(args.splMint).toHex()}` as Hex;
  logger.info(`SPL mint: ${args.splMint}`);
  logger.info(`remoteToken (bytes32): ${mintBytes32}`);

  const account = privateKeyToAccount(pk as Hex);
  logger.info(`Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    chain: config.base.chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: config.base.chain,
    transport: http(),
  });

  // Resolve CrossChainERC20Factory via Bridge contract (no hardcoding).
  const factory = (await publicClient.readContract({
    address: config.base.bridgeContract,
    abi: BRIDGE_ABI,
    functionName: "CROSS_CHAIN_ERC20_FACTORY",
  })) as EvmAddress;
  logger.info(`Factory: ${factory}`);

  // Simulate + send
  const { request } = await publicClient.simulateContract({
    address: factory,
    abi: CROSS_CHAIN_ERC20_FACTORY_ABI,
    functionName: "deploy",
    args: [mintBytes32, args.name, args.symbol, args.decimals],
    account,
  });

  logger.info("Sending Base transaction to deploy wrapped ERC20...");
  const hash = await walletClient.writeContract(request);
  logger.success(
    `Tx sent: ${config.base.chain.blockExplorers.default.url}/tx/${hash}`
  );

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Find CrossChainERC20Created event to get deployed address.
  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() !== factory.toLowerCase() ||
      !log.topics?.length
    ) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi: CROSS_CHAIN_ERC20_FACTORY_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "CrossChainERC20Created") {
        const localToken = decoded.args.localToken as EvmAddress;
        const remoteToken = decoded.args.remoteToken as Hex;
        logger.success(`Deployed wrapped ERC20: ${localToken}`);
        logger.info(`remoteToken: ${remoteToken}`);
        return;
      }
    } catch {
      // ignore non-matching logs
    }
  }

  logger.warn(
    "Deployment tx confirmed, but CrossChainERC20Created event was not found in receipt logs. The contract may still have deployed; check the tx on explorer."
  );
}

function normalizeEvmPrivateKey(value: string): Hex {
  // Common failure modes:
  // - value comes from copy/paste with whitespace/newlines
  // - value includes surrounding quotes
  // - value uses 0X prefix
  // - value is 64 hex chars without 0x prefix
  let v = value.trim().replace(/^["']|["']$/g, "").trim();
  v = v.replace(/\s+/g, "");
  if (/^[0-9a-fA-F]{64}$/.test(v)) v = `0x${v}`;
  if (/^0X[0-9a-fA-F]{64}$/.test(v)) v = `0x${v.slice(2)}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error(
      "Invalid EVM_PRIVATE_KEY format. Expected 64 hex chars (optionally prefixed with 0x/0X), with no spaces/newlines."
    );
  }
  return v as Hex;
}


