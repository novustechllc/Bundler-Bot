import { ethers } from "ethers";
import { GAS_MULTIPLIER } from "../constants";

export async function execute(
  transaction: ethers.PopulatedTransaction
): Promise<ethers.providers.TransactionResponse> {
  try {
    // Get current gas price
    const provider = transaction.provider as ethers.providers.Provider;
    const feeData = await provider.getFeeData();

    // Calculate gas price with multiplier
    const gasPrice = feeData.gasPrice
      ?.mul(Math.floor(GAS_MULTIPLIER * 100))
      .div(100);

    // Add gas price to transaction
    transaction.gasPrice = gasPrice;

    // Send transaction
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY as string,
      provider
    );
    const txResponse = await wallet.sendTransaction(transaction);

    return txResponse;
  } catch (e) {
    console.error("Transaction execution failed:", e);
    throw e;
  }
}
