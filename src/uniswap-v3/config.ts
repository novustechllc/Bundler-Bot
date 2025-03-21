import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import dotenv from 'dotenv';
dotenv.config();

import { USDC_TOKEN, LINK_TOKEN, WETH_TOKEN } from './libs/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
  WALLET_EXTENSION,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  common: {
    subgraphUri: string;
    subgraphUriEnabled: boolean;
  }
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  }
  tokens: {
    in: Token
    amountIn: number
    out: Token
    poolFee: number
    
    token0: Token,
    token1: Token,
    token0Amount: number,
    token1Amount: number,
    fractionToRemove: number
    fractionToAdd: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  common: {
    subgraphUri: process.env.UNISWAP_GRAPH_URL || '',
    subgraphUriEnabled: process.env.UNISWAP_GRAPH_ENABLED === 'true',
  },
  env: Environment.MAINNET,
  rpc: {
    local: 'http://127.0.0.1:8545',
    mainnet: 'https://eth.llamarpc.com',
  },
  wallet: {
    address: '',
    privateKey:
      '',
  },
  tokens: {
    // Trading
    in: WETH_TOKEN,
    amountIn: 1.8,
    out: USDC_TOKEN,
    poolFee: FeeAmount.MEDIUM,

    // Liquidity
    token0: WETH_TOKEN,
    token0Amount: 1,
    token1: USDC_TOKEN,
    token1Amount: 4000,

    fractionToRemove: 10, // 10% of liquidity to remove
    fractionToAdd: 5, // 5% of liquidity to add
  },
}
