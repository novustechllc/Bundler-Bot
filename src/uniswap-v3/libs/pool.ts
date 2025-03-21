import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.bsc/IUniswapV3Pool.json'
import { computePoolAddress, Pool, Tick, TickMath, tickToPrice } from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import JSBI from "jsbi";
import { Contract, Provider } from 'ethers-multicall'

import { CurrentConfig } from '../config'
import { POOL_FACTORY_CONTRACT_ADDRESS } from './constants'
import { getProvider } from './providers'
import { fetchTicks, getFullTickData, getGraphPoolInfo } from './graphql'
import { GraphTick, PoolInfo } from './types'
import { Price, Token } from '@uniswap/sdk-core'
import { tickToWord } from './utils'
import { getAllTicks, getTickIndicesInWordRange } from './fetcher';


export async function getPoolInfoFromContract(): Promise<Pool> {
  const provider = getProvider()
  if (!provider) {
    throw new Error('No provider')
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])
    
  const graphTicks = await getFullTickData(currentPoolAddress);
  const sdkTicks = graphTicks.map((graphTick: GraphTick) => {
    return new Tick({
      index: +graphTick.tickIdx,
      liquidityGross: graphTick.liquidityGross,
      liquidityNet: graphTick.liquidityNet,
    })
  });



  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    fee,
    slot0[0],
    liquidity,
    slot0[1],
    sdkTicks
  )

  const tickAt = await pool.tickDataProvider.getTick(195900);
  const activeTickIdx = (
    await pool.tickDataProvider.nextInitializedTickWithinOneWord(
      pool.tickCurrent,
      pool.tickCurrent === TickMath.MIN_TICK ? false : true,
      tickSpacing
    )
  )[0]


  return pool;

}


export async function getPoolInfoFromGraph(): Promise<any> {


  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.poolFee,
  });

  const res = await getGraphPoolInfo(currentPoolAddress)
  return res;
}


export async function fetchAllTicksFromContract(poolAddress: string, tickSpacing: number): Promise<any> {
  const provider = getProvider()
  const multicallProvider = new Provider(provider)
  await multicallProvider.init()

  const minWord = tickToWord(-887272, tickSpacing)
  const maxWord = tickToWord(887272, tickSpacing)

  // Fetch all initialized tickIndices in word range
  const tickIndices = await getTickIndicesInWordRange(
    poolAddress,
    tickSpacing,
    minWord,
    maxWord
  )
  // Fetch all initialized ticks from tickIndices
  const ticks = await getAllTicks(poolAddress, tickIndices)
  return ticks;
}



export async function getPoolInfo(): Promise<Pool> {
  const pool = await getPoolInfoFromContract();
  return pool;
}



export async function getPrice(pool: Pool): Promise<Price<Token, Token>> {
  return tickToPrice(
    pool.token0,
    pool.token1,
    pool.tickCurrent,
  )
}