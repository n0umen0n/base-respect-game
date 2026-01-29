// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {stdJson} from "forge-std/StdJson.sol";
import {ERC20} from "solady/tokens/ERC20.sol";

import {Bridge} from "../../src/Bridge.sol";
import {Ix, Pubkey} from "../../src/libraries/SVMLib.sol";
import {Transfer} from "../../src/libraries/TokenLib.sol";
import {DevOps} from "../DevOps.s.sol";

contract BridgeTokensToSolanaScript is DevOps {
    using stdJson for string;

    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address public immutable LOCAL_TOKEN = vm.envAddress("LOCAL_TOKEN");
    bytes32 public immutable REMOTE_TOKEN = vm.envBytes32("REMOTE_TOKEN");
    bytes32 public immutable TO = vm.envBytes32("TO");
    uint64 public immutable AMOUNT = uint64(vm.envUint("AMOUNT"));
    // Optional override: treat AMOUNT as local token amount, but allow explicitly setting remoteAmount.
    // This is useful when local/remote decimals don't match the legacy assumption (18 -> 9).
    uint64 public immutable REMOTE_AMOUNT = uint64(vm.envOr("REMOTE_AMOUNT", uint256(0)));
    bytes public extraData = bytes("Dummy extra data");

    Bridge public bridge;

    function setUp() public {
        bridge = Bridge(_getAddress("Bridge"));
    }

    function run() public payable {
        vm.startBroadcast();
        if (vm.envOr("NEEDS_APPROVAL", false)) {
            ERC20(LOCAL_TOKEN).approve(address(bridge), AMOUNT);
        }
        uint256 value = LOCAL_TOKEN == ETH_ADDRESS ? AMOUNT : 0;
        uint64 remoteAmount = REMOTE_AMOUNT != 0 ? REMOTE_AMOUNT : uint64(AMOUNT / 1e9);
        Transfer memory t = Transfer({
            localToken: LOCAL_TOKEN, remoteToken: Pubkey.wrap(REMOTE_TOKEN), to: TO, remoteAmount: remoteAmount
        });
        bridge.bridgeToken{value: value}(t, new Ix[](0));
        vm.stopBroadcast();
    }
}
