import { ethers } from "ethers";
import { RPC_ENDPOINT } from "./constants";

const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);

interface TokenPrice {
  address: string;
  price: number;
  timestamp: number;
}

const tokenPrices = new Map<string, TokenPrice>();

export function getAllTokenPrice(): Map<string, TokenPrice> {
  return tokenPrices;
}

export async function getTokenPrice(tokenAddress: string): Promise<number> {
  const cached = tokenPrices.get(tokenAddress);
  if (cached && Date.now() - cached.timestamp < 30000) {
    // 30 seconds cache
    return cached.price;
  }

  // Implement price fetching logic here (e.g., from DEX or price oracle)
  // This is a placeholder
  return 0;
}
