export const BICAccountFactoryABI = [
    {
      inputs: [
        {
          internalType: "contract IEntryPoint",
          name: "_entryPoint",
          type: "address",
        },
        {
          internalType: "contract BicPermissions",
          name: "_permissions",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "accountImplementation",
      outputs: [
        {
          internalType: "contract BicAccount",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "salt",
          type: "uint256",
        },
      ],
      name: "createAccount",
      outputs: [
        {
          internalType: "contract BicAccount",
          name: "ret",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "salt",
          type: "uint256",
        },
      ],
      name: "getAddress",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "permissions",
      outputs: [
        {
          internalType: "contract BicPermissions",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ] as const;
  