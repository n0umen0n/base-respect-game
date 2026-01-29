import { Command } from "commander";

import { initializeCommand } from "./initialize.command";
import { solVaultCommand } from "./sol-vault.command";
import {
  bridgeCallCommand,
  bridgeSolCommand,
  bridgeSolWithBcCommand,
  bridgeSplCommand,
  bridgeWrappedTokenCommand,
  deployCrossChainErc20Command,
  wrapTokenCommand,
} from "./solana-to-base";
import { relayMessageCommand, proveMessageCommand } from "./base-to-solana";

export const bridgeCommand = new Command("bridge").description(
  "Bridge management commands"
);

bridgeCommand.addCommand(initializeCommand);
bridgeCommand.addCommand(solVaultCommand);

bridgeCommand.addCommand(bridgeCallCommand);
bridgeCommand.addCommand(bridgeSolCommand);
bridgeCommand.addCommand(bridgeSolWithBcCommand);
bridgeCommand.addCommand(bridgeSplCommand);
bridgeCommand.addCommand(bridgeWrappedTokenCommand);
bridgeCommand.addCommand(deployCrossChainErc20Command);
bridgeCommand.addCommand(wrapTokenCommand);

bridgeCommand.addCommand(proveMessageCommand);
bridgeCommand.addCommand(relayMessageCommand);
