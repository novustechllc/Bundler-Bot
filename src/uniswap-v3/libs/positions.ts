import { ethers } from "ethers"
import { getProvider, getWalletAddress, sendTransaction } from "./providers"
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, NONFUNGIBLE_POSITION_MANAGER_ABI, NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "./constants"
import { PositionInfo, TransactionState } from "./types"
import { CurrencyAmount, Percent, Token } from "@uniswap/sdk-core"
import { MintOptions, nearestUsableTick, NonfungiblePositionManager, Pool, Position } from "@uniswap/v3-sdk"
import { getPoolInfo } from "./pool"
import { CurrentConfig } from "../config"

export async function getPositionIds(): Promise<number[]> {
    const provider = getProvider()
    // const address = getWalletAddress()
    const address = "0xae8999da4d81cb81b42288b12176fe20d7ead578"

    if (!provider || !address) {
        throw new Error('No provider available')
    }

    const positionContract = new ethers.Contract(
        NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
        NONFUNGIBLE_POSITION_MANAGER_ABI,
        provider
    )

    // Get number of positions
    const balance: number = await positionContract.balanceOf(address)

    // Get all positions
    const tokenIds = []
    for (let i = 0; i < balance; i++) {
        const tokenOfOwnerByIndex: number =
            await positionContract.tokenOfOwnerByIndex(address, i)
        tokenIds.push(tokenOfOwnerByIndex)
    }

    return tokenIds
}

export async function getPositionInfo(tokenId: number): Promise<PositionInfo> {
    const provider = getProvider()

    if (!provider) {
        throw new Error('No provider available')
    }

    const positionContract = new ethers.Contract(
        NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
        NONFUNGIBLE_POSITION_MANAGER_ABI,
        provider
    )

    const position = await positionContract.positions(tokenId)

    return {
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        liquidity: position.liquidity,
        feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
        feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
        tokensOwed0: position.tokensOwed0,
        tokensOwed1: position.tokensOwed1,
    }
}

export async function rawMintPosition(): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const mintOptions: MintOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  const position = await constructPosition(
    CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token0, CurrentConfig.tokens.token0Amount),
    CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token1, CurrentConfig.tokens.token1Amount),
  )
  
  
  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    position,
    mintOptions
  );

  const tx = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }
  return tx;
}

export async function mintPosition(): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  const mintOptions: MintOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  const position = await constructPosition(
    CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token0, CurrentConfig.tokens.token0Amount),
    CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token1, CurrentConfig.tokens.token1Amount),
  )
  
  
  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    position,
    mintOptions
  );

  const tx = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  const res = await sendTransaction(tx)

  return res
}

export async function constructPosition(
    token0Amount: CurrencyAmount<Token>,
    token1Amount: CurrencyAmount<Token>
  ): Promise<Position> {
    // get pool info
    const pool = await getPoolInfo()
  
    // construct pool instance

    // create position using the maximum liquidity from input amounts
    return Position.fromAmounts({
      pool: pool,
      tickLower:
        nearestUsableTick(pool.tickCurrent, pool.tickSpacing) -
        pool.tickSpacing * 2,
      tickUpper:
        nearestUsableTick(pool.tickCurrent, pool.tickSpacing) +
        pool.tickSpacing * 2,
      amount0: token0Amount.quotient,
      amount1: token1Amount.quotient,
      useFullPrecision: true,
    })
  }
  