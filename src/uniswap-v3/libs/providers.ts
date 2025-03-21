import { BaseProvider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'

import { CurrentConfig } from '../config'
import { TransactionState } from './types';

const provider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet
);

const createWallet = (): ethers.Wallet =>{
  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider)
}

const wallet = createWallet();

// Provider and Wallet Functions

export function getProvider(): BaseProvider {
  return provider
}

export function getWalletAddress(): string | null {
    return wallet.address
}


export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }
  const txRes = await wallet.sendTransaction(transaction)

  let receipt = null
  const provider = getProvider()
  if (!provider) {
    return TransactionState.Failed
  }

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)

      if (receipt === null) {
        continue
      }
    } catch (e) {
      conbsce.log(`Receipt error:`, e)
      break
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}