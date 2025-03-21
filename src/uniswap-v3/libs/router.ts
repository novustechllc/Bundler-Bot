import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

import { CurrentConfig } from '../config'
import {
  ERC20_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
} from './constants'
import { getPoolInfo } from './pool'
import {
  getProvider,
  getWalletAddress,
  sendTransaction,
} from './providers'
import { fromReadableAmount } from './utils'
import { TransactionState } from './types'

export type TokenTrade = Trade<Token, Token, TradeType>

// Trading Functions

export async function createSingleTrade(): Promise<TokenTrade> {
  const pool = await getPoolInfo()

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const amountOut = await getOutputQuote(swapRoute)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      JSBI.BigInt(amountOut)
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  return uncheckedTrade
}


export async function rawExecuteTrade(
  trade: TokenTrade
): Promise<any> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }


  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  const rawTx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  return rawTx
}

export async function executeTrade(
  trade: TokenTrade
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(CurrentConfig.tokens.in)
  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  const res = await sendTransaction(tx)

  return res
}

// Helper Quoting and Pool Functions

async function getOutputQuote(route: Route<Currency, Currency>) {
  const provider = getProvider()

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  )

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  })

  return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
}

export async function getTokenTransferApproval(
  token: Token
): Promise<TransactionState> {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
    conbsce.log('No Provider Found')
    return TransactionState.Failed
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
        token.decimals
      ).toString()
    )

    return sendTransaction({
      ...transaction,
      from: address,
    })
  } catch (e) {
    return TransactionState.Failed
  }
}



export async function desiredSwapAmounts(): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }
  const pool = await getPoolInfo();

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
  );



  const amountIn = CurrencyAmount.fromRawAmount(CurrentConfig.tokens.in, 1 * 1e18);
  const amountOut = CurrencyAmount.fromRawAmount(CurrentConfig.tokens.out, 6000 * 1e6);
  // const midPrice = swapRoute.midPrice.toSignificant(6);

  const slippageTolerance = new Percent(1, 100); // 50 bips, or 0.50%

  const amountOutSwap = await Trade.exactIn(swapRoute, amountIn);
  conbsce.log(`🚀 ~ Minimum USDT receive after swap ${amountIn.toExact()} ETH ${slippageTolerance.toFixed()}% slippage: `, amountOutSwap.minimumAmountOut(slippageTolerance).toExact())

  const amountInSwap = await Trade.exactOut(swapRoute, amountOut);
  conbsce.log(`🚀 ~ Maximum ETH to swap ${amountOut.toExact()} USDT ${slippageTolerance.toFixed()}% slippage: `, amountInSwap.maximumAmountIn(slippageTolerance).toExact())

}