import { ethers } from "ethers";
import { getAbi } from "./metadata";

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: ethers.providers.Provider
): Promise<ethers.BigNumber> {
  const contract = new ethers.Contract(tokenAddress, getAbi("ERC20"), provider);
  return await contract.balanceOf(walletAddress);
}

export async function checkAndApproveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: ethers.BigNumber,
  wallet: ethers.Wallet
): Promise<boolean> {
  const contract = new ethers.Contract(tokenAddress, getAbi("ERC20"), wallet);

  const allowance = await contract.allowance(wallet.address, spenderAddress);
  if (allowance.gte(amount)) return true;

  const tx = await contract.approve(
    spenderAddress,
    ethers.constants.MaxUint256
  );
  await tx.wait();

  return true;
}
