import { Token, TradeType } from '@uniswap/sdk-core'
import { TICK_SPACINGS, Trade } from '@uniswap/v3-sdk'
import { BigNumber, ethers } from 'ethers'
import JSBI from 'jsbi'


const MAX_DECIMALS = 4

export function fromReadableAmount(
  amount: number,
  decimals: number
): BigNumber {
  return ethers.utils.parseUnits(amount.toString(), decimals)
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, MAX_DECIMALS)
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`
}


export function tickToWord(tick: number, tickSpacing: number = TICK_SPACINGS[3000]): number {
  let compressed = Math.floor(tick / tickSpacing)
  if (tick < 0 && tick % tickSpacing !== 0) {
    compressed -= 1
  }
  return tick >> 8
}

export const minWord = tickToWord(-887272)
export const maxWord = tickToWord(887272)
