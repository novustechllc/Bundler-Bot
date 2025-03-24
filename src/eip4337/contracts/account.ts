import { Contract, ethers } from "ethers";
import { AccountABI } from "./abis";

export const AccountContract = (account: string): Contract => {
  return new Contract(account, AccountABI);
};

export const accountInterface = new ethers.utils.Interface(AccountABI);
