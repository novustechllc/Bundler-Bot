// Network Configuration
export const RPC_ENDPOINT =
  process.env.RPC_ENDPOINT ||
  "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY";
export const RPC_WEBSOCKET_ENDPOINT =
  process.env.WS_ENDPOINT || "wss://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY";

// Contract Addresses
export const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Transaction Configuration
export const GAS_LIMIT = 300000;
export const GAS_MULTIPLIER = 1.1;
export const MAXIMUM_BUY_AMOUNT = "1000000000000000000"; // 1 ETH
export const SLIPPAGE_TOLERANCE = 0.5; // 0.5%

// Target wallet for monitoring
export const TARGET_WALLET = process.env.TARGET_WALLET || "";

// Bundle Configuration
export const MAX_BUNDLE_SIZE = 4;
export const MIN_BUNDLE_PROFIT = "0.01"; // ETH
export const BUNDLE_PRIORITY_FEE = "0.05"; // ETH
