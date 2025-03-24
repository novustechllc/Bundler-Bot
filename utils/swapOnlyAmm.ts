import { ethers } from "ethers";
import {
  UNISWAP_V2_ROUTER,
  WETH_ADDRESS,
  SLIPPAGE_TOLERANCE,
  GAS_LIMIT,
} from "../constants";
import { getAbi } from "./metadata";

const ROUTER_ABI = getAbi("UniswapV2Router02");

export async function getBuyTxWithUniswap(
  wallet: ethers.Wallet,
  tokenAddress: string,
  amountIn: ethers.BigNumber
): Promise<ethers.PopulatedTransaction> {
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, ROUTER_ABI, wallet);

  const path = [WETH_ADDRESS, tokenAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const [, amountsOut] = await router.getAmountsOut(amountIn, path);
  const minAmountOut = amountsOut[1]
    .mul(1000 - SLIPPAGE_TOLERANCE * 10)
    .div(1000);

  return await router.populateTransaction.swapExactETHForTokens(
    minAmountOut,
    path,
    wallet.address,
    deadline,
    {
      value: amountIn,
      gasLimit: GAS_LIMIT,
    }
  );
}

export async function getSellTxWithUniswap(
  wallet: ethers.Wallet,
  tokenAddress: string,
  amountIn: ethers.BigNumber
): Promise<ethers.PopulatedTransaction> {
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, ROUTER_ABI, wallet);

  const path = [tokenAddress, WETH_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const [, amountsOut] = await router.getAmountsOut(amountIn, path);
  const minAmountOut = amountsOut[1]
    .mul(1000 - SLIPPAGE_TOLERANCE * 10)
    .div(1000);

  return await router.populateTransaction.swapExactTokensForETH(
    amountIn,
    minAmountOut,
    path,
    wallet.address,
    deadline,
    {
      gasLimit: GAS_LIMIT,
    }
  );
}
