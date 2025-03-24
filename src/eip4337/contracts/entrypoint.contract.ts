import { Contract, providers, Signer } from "ethers";
import { EntrypointABI } from "./abis";

export const EntryPointContract = (entryPoint: string, provider: providers.Provider | Signer): Contract => {
  return new Contract(entryPoint, EntrypointABI, provider);
};
