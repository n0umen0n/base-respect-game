export const CROSS_CHAIN_ERC20_FACTORY_ABI = [
  {
    type: "function",
    name: "deploy",
    inputs: [
      { name: "remoteToken", type: "bytes32", internalType: "bytes32" },
      { name: "name", type: "string", internalType: "string" },
      { name: "symbol", type: "string", internalType: "string" },
      { name: "decimals", type: "uint8", internalType: "uint8" },
    ],
    outputs: [{ name: "localToken", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CrossChainERC20Created",
    inputs: [
      {
        name: "localToken",
        type: "address",
        internalType: "address",
        indexed: true,
      },
      {
        name: "remoteToken",
        type: "bytes32",
        internalType: "bytes32",
        indexed: true,
      },
      {
        name: "deployer",
        type: "address",
        internalType: "address",
        indexed: false,
      },
    ],
    anonymous: false,
  },
] as const;


