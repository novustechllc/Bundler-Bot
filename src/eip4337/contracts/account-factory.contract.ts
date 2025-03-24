import { Contract, providers, Signer } from "ethers";
import { BICAccountFactoryABI } from "./abis";

export const BicAccountFactoryContract = (address: string, provider: providers.Provider | Signer): Contract => {
  return new Contract(address, BICAccountFactoryABI, provider);
};
