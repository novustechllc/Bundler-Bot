import { FeeAmount, Pool, Tick } from '@uniswap/v3-sdk'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.bsc/IUniswapV3Pool.json'
import { getProvider } from './providers'
import { Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { Contract, Provider } from 'ethers-multicall'

export interface PoolData {
  address: string
  tokenA: Token
  tokenB: Token
  fee: FeeAmount
  sqrtPriceX96: JSBI
  liquidity: JSBI
  tick: number
  tickSpacing: number
}

export async function getTickIndicesInWordRange(
  poolAddress: string,
  tickSpacing: number,
  startWord: number,
  endWord: number
): Promise<number[]> {
  const multicallProvider = new Provider(getProvider())
  await multicallProvider.init()
  const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi)

  const calls: any[] = []
  const wordPosIndices: number[] = []

  for (let i = startWord; i <= endWord; i++) {
    wordPosIndices.push(i)
    calls.push(poolContract.tickBitmap(i))
  }
  // Chunk of calls
  const results: bigint[] = [];
  for (let i = 0; i < calls.length; i += 100) {
    const chunk = calls.slice(i, i + 100)
    const called = await multicallProvider.all(chunk);
    results.push(...called.map((ethersResponse) => {
      return BigInt(ethersResponse.toString())
    }))
  }


  const tickIndices: number[] = []

  for (let j = 0; j < wordPosIndices.length; j++) {
    const ind = wordPosIndices[j]
    const bitmap = results[j]

    if (bitmap !== BigInt(0)) {
      for (let i = 0; i < 256; i++) {
        const bit = BigInt(1)
        const initialized = (bitmap & (bit << BigInt(i))) !== BigInt(0)
        if (initialized) {
          const tickIndex = (ind * 256 + i) * tickSpacing
          tickIndices.push(tickIndex)
        }
      }
    }
  }

  return tickIndices
}

export async function getAllTicks(
  poolAddress: string,
  tickIndices: number[]
): Promise<Tick[]> {
  const multicallProvider = new Provider(getProvider())
  await multicallProvider.init()
  const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi)

  const calls: any[] = []

  for (const index of tickIndices) {
    calls.push(poolContract.ticks(index))
  }

  const results = await multicallProvider.all(calls)
  const allTicks: Tick[] = []

  for (let i = 0; i < tickIndices.length; i++) {
    const index = tickIndices[i]
    const ethersResponse = results[i]
    const tick = new Tick({
      index,
      liquidityGross: JSBI.BigInt(ethersResponse.liquidityGross.toString()),
      liquidityNet: JSBI.BigInt(ethersResponse.liquidityNet.toString()),
    })
    allTicks.push(tick)
  }
  return allTicks
}
