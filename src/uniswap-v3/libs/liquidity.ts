import { getProvider, getWalletAddress, } from "./providers"
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "./constants"
import { CurrencyAmount, Percent, Price, Fraction } from "@uniswap/sdk-core"
import { AddLiquidityOptions, CollectOptions, nearestUsableTick, NonfungiblePositionManager, Position, priceToClosestTick, RemoveLiquidityOptions, } from "@uniswap/v3-sdk"
import { CurrentConfig } from "../config"
import { constructPosition, getPositionInfo } from "./positions"
import { fromReadableAmount } from "./utils"
import { getPoolInfo, getPrice } from "./pool"

export async function rawAddLiquidity(positionId: number): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const addLiquidityOptions: AddLiquidityOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
    tokenId: positionId,
  }

  const position = await constructPosition(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token0,
      fromReadableAmount(
        CurrentConfig.tokens.token0Amount * CurrentConfig.tokens.fractionToAdd,
        CurrentConfig.tokens.token0.decimals
      ).toString()
    ),
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token1,
      fromReadableAmount(
        CurrentConfig.tokens.token1Amount * CurrentConfig.tokens.fractionToAdd,
        CurrentConfig.tokens.token1.decimals
      ).toString()
    ),
  )



  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    position,
    addLiquidityOptions
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


export async function rawRemoveLiquidity(positionId: number): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const collectOptions: Omit<CollectOptions, 'tokenId'> = {
    expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token0,
      0
    ),
    expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token1,
      0
    ),
    recipient: address,
  }

  const removeLiquidityOptions: RemoveLiquidityOptions = {
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
    tokenId: positionId,
    liquidityPercentage: new Percent(CurrentConfig.tokens.fractionToRemove),
    collectOptions,
  }

  const currentPosition = await constructPosition(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token0,
      fromReadableAmount(
        CurrentConfig.tokens.token0Amount,
        CurrentConfig.tokens.token0.decimals
      ).toString()
    ),
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token1,
      fromReadableAmount(
        CurrentConfig.tokens.token1Amount,
        CurrentConfig.tokens.token1.decimals
      ).toString()
    )
  )


  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    currentPosition,
    removeLiquidityOptions
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



export async function rawCollectFeePosition(positionId: number): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const collectOptions: CollectOptions = {
    tokenId: positionId,
    expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token0,
      0
    ),
    expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token1,
      0
    ),
    recipient: address,
  }

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.collectCallParameters(collectOptions);

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


export async function desiredMintAmountsNotWithinRange(): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }
  const pool = await getPoolInfo();
  const baseCurrency = pool.token0;
  const quoteCurrency = pool.token1;

  const currentPrice = await getPrice(pool);

  // USDT
  const amount0 = CurrencyAmount.fromRawAmount(
    baseCurrency,
    fromReadableAmount(4000, baseCurrency.decimals).toString()
  )

  const amount1 = CurrencyAmount.fromRawAmount(
    quoteCurrency,
    fromReadableAmount(200, quoteCurrency.decimals).toString()
  )

  // Liquidity at higher price
  conbsce.log("------------------------------------------ Start Higher price ------------------------------------------", currentPrice.toFixed())
  const higherBy5Percent = currentPrice.asFraction.multiply(new Fraction(100 + 5, 100));
  const higherBy10Percent = currentPrice.asFraction.multiply(new Fraction(100 + 10, 100));

  // Define the price range
  const lowerPriceAtHigherPrice = new Price(baseCurrency, quoteCurrency, higherBy5Percent.denominator, higherBy5Percent.numerator);
  const upperPriceAtHigherPrice = new Price(baseCurrency, quoteCurrency, higherBy10Percent.denominator, higherBy10Percent.numerator);
  let lowerTick = nearestUsableTick(
    priceToClosestTick(lowerPriceAtHigherPrice),
    pool.tickSpacing
  )

  let upperTick = nearestUsableTick(
    priceToClosestTick(upperPriceAtHigherPrice),
    pool.tickSpacing
  )

  const slippageTolerance = new Percent(1, 100); // 50 bips, or 0.50%


  const position = Position.fromAmount0({
    pool,
    tickLower: lowerTick,
    tickUpper: upperTick,
    amount0: amount0.quotient,
    useFullPrecision: true,
  });

  conbsce.table({
    title: "Higher price",
    mintAmount0: `${position.mintAmountsWithSlippage(slippageTolerance).amount0.toString()} ${baseCurrency.name}`,
    mintAmount1: `${position.mintAmountsWithSlippage(slippageTolerance).amount1.toString()} ${quoteCurrency.name}`,
  });
  conbsce.log("------------------------------------------ End Higher price ------------------------------------------")

  conbsce.log("------------------------------------------ Start Lower price ------------------------------------------")
  const lowerBy15Percent = currentPrice.asFraction.multiply(new Fraction(100 - 15, 100));
  const lowerBy10Percent = currentPrice.asFraction.multiply(new Fraction(100 - 10, 100));

  // Define the price range
  const lowerPriceAtLowerPrice = new Price(baseCurrency, quoteCurrency, lowerBy15Percent.denominator, lowerBy15Percent.numerator);
  const upperPriceAtLowerPrice = new Price(baseCurrency, quoteCurrency, lowerBy10Percent.denominator, lowerBy10Percent.numerator);
  let lowerTickAtLowerPrice = nearestUsableTick(
    priceToClosestTick(lowerPriceAtLowerPrice),
    pool.tickSpacing
  )

  let upperTickAtLowerPrice = nearestUsableTick(
    priceToClosestTick(upperPriceAtLowerPrice),
    pool.tickSpacing
  )

  // USDT

  const positionAtLowerPrice = Position.fromAmount1({
    pool,
    tickLower: lowerTickAtLowerPrice,
    tickUpper: upperTickAtLowerPrice,
    amount1: amount1.quotient,
  });

  conbsce.table({
    title: "Lower price",
    mintAmount0: `${positionAtLowerPrice.mintAmountsWithSlippage(slippageTolerance).amount0.toString()} ${baseCurrency.name}`,
    mintAmount1: `${positionAtLowerPrice.mintAmountsWithSlippage(slippageTolerance).amount1.toString()} ${quoteCurrency.name}`,
  });
  conbsce.log("------------------------------------------ End Lower price ------------------------------------------")
}



export async function desiredMintAmountsWithinRange(): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }
  const pool = await getPoolInfo();
  const baseCurrency = pool.token0;
  const quoteCurrency = pool.token1;

  const slippageTolerance = new Percent(1, 100); // 50 bips, or 0.50%


  const currentPrice = await getPrice(pool);

  // USDT
  const amount0 = CurrencyAmount.fromRawAmount(
    baseCurrency,
    fromReadableAmount(4000, baseCurrency.decimals).toString()
  )

  const amount1 = CurrencyAmount.fromRawAmount(
    quoteCurrency,
    fromReadableAmount(200, quoteCurrency.decimals).toString()
  )

  // Liquidity at higher price
  conbsce.log("------------------------------------------ Start Higher price ------------------------------------------", currentPrice.toFixed())
  const lowerMultiply = currentPrice.asFraction.multiply(new Fraction(100 - 5, 100));
  const upperMultiply = currentPrice.asFraction.multiply(new Fraction(100 + 5, 100));

  const lowerPrice = new Price(baseCurrency, quoteCurrency, lowerMultiply.denominator, lowerMultiply.numerator);
  const upperPrice = new Price(baseCurrency, quoteCurrency, upperMultiply.denominator, upperMultiply.numerator);

  const lowerTick = nearestUsableTick(
    priceToClosestTick(lowerPrice),
    pool.tickSpacing
  );

  let upperTick = nearestUsableTick(
    priceToClosestTick(upperPrice),
    pool.tickSpacing
  )

  conbsce.log("🚀 ~ desiredMintAmountsWithinRange ~ upperTick:" ,upperTick - pool.tickSpacing, upperTick)
  const position = Position.fromAmounts({
    pool,
    tickLower: lowerTick,
    tickUpper: upperTick,
    amount0: amount0.quotient,
    amount1: amount1.quotient,
    useFullPrecision: true,
  });
  conbsce.log("🚀 ~ desiredMintAmountsWithinRange ~ position:", position)

  conbsce.table({
    title: "Within range price",
    amount0: `${position.mintAmounts.amount0.toString()} ${baseCurrency.name}`,
    mintAmount0: `${position.mintAmountsWithSlippage(slippageTolerance).amount0.toString()} ${baseCurrency.name}`,
    mintAmount1: `${position.mintAmountsWithSlippage(slippageTolerance).amount1.toString()} ${quoteCurrency.name}`,
  });
}



export async function desiredAmountsWhenBurnPosition(): Promise<any> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }
  const positionInfo = await getPositionInfo(672849)
  const pool = await getPoolInfo()

  const baseCurrency = pool.token0;
  conbsce.log("🚀 ~ desiredAmountsWhenBurnPosition ~ baseCurrency:", baseCurrency)
  const quoteCurrency = pool.token1;


  const amount0 = CurrencyAmount.fromRawAmount(
    baseCurrency,
    fromReadableAmount(4000, baseCurrency.decimals).toString()
  )
  
  const position = new Position({
    pool: pool,
    liquidity: positionInfo.liquidity.toString(),
    tickLower: positionInfo.tickLower,
    tickUpper: positionInfo.tickUpper,

  });
  position.token0PriceLower

  conbsce.log("🚀 ~ desiredAmountsWhenBurnPosition ~ position:", position)
  
  conbsce.table({
    title: "Add already position",
    // amount0: position.mintAmounts.amount0.toString(),
    // amount1: position.mintAmounts.amount1.toString(),
    liquidity: position.liquidity.toString(),
    amount0: position.amount0.toExact(),
    amount1: position.amount1.toExact(),
    token0PriceLower: position.token0PriceLower.toFixed(),
    token0PriceUpper: position.token0PriceUpper.toFixed()
  })
 
}
