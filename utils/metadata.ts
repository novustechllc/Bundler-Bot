import { ethers } from "ethers";
import { RPC_ENDPOINT } from "../constants";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);

export function getAbi(contractName: string): any[] {
  // Add more ABIs as needed
  switch (contractName) {
    case "ERC20":
      return ERC20_ABI;
    case "UniswapV2Router02":
      return require("../abis/UniswapV2Router02.json");
    default:
      throw new Error(`ABI not found for ${contractName}`);
  }
}

export async function getTokenMetadata(tokenAddress: string) {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  try {
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
    };
  } catch (e) {
    console.error(`Error fetching metadata for ${tokenAddress}:`, e);
    return null;
  }
}
