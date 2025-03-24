import { ethers } from "ethers";
import WebSocket from "ws";
import {
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  TARGET_WALLET,
  MAXIMUM_BUY_AMOUNT,
} from "./constants";
import { getAllTokenPrice, getTokenPrice } from "./config";
import { getBuyTxWithUniswap, getSellTxWithUniswap } from "./utils/swapOnlyAmm";
import { execute } from "./utils/legacy";
import { getTokenMetadata } from "./utils/metadata";
import { getTokenBalance } from "./utils/token";

// Create provider connections
const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
const ws = new WebSocket(RPC_WEBSOCKET_ENDPOINT);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

console.log("🚀 ~ Target wallet:", TARGET_WALLET);

let tokenList = getAllTokenPrice();

// WebSocket connection handling
ws.on("open", async function open() {
  await subscribeToTransactions(TARGET_WALLET);
  console.log("Subscription request sent\n");
});

ws.on("message", async function incoming(data: any) {
  const messageStr = data.toString("utf8");
  try {
    const messageObj = JSON.parse(messageStr);
    const transaction = messageObj.params.result;

    // Skip if not a DEX swap
    if (!isUniswapSwap(transaction)) {
      console.log("Not a Uniswap swap");
      return;
    }

    const swapInfo = await parseSwapTransaction(transaction);
    if (!swapInfo) return;

    const { inputToken, outputToken } = swapInfo;

    // Get token metadata and prices
    const [inputMetadata, outputMetadata] = await Promise.all([
      getTokenMetadata(inputToken.address),
      getTokenMetadata(outputToken.address),
    ]);

    const msg = formatSwapMessage(
      inputToken,
      outputToken,
      inputMetadata,
      outputMetadata,
      transaction.hash
    );
    console.log("🚀 ~ Swap detected:\n", msg);

    // Handle automated response
    const balance = await provider.getBalance(wallet.address);
    const minBalance = ethers.utils.parseEther("0.01");

    let swapTx;
    if (shouldExecuteSwap(inputToken, outputToken, balance, minBalance)) {
      swapTx = await prepareSwapTransaction(
        wallet,
        inputToken,
        outputToken,
        balance,
        minBalance
      );
    }

    if (swapTx) {
      const txResponse = await execute(swapTx);
      console.log("Transaction executed:", txResponse.hash);
    }
  } catch (e) {
    console.error("Error processing message:", e);
  }
});

async function subscribeToTransactions(address: string) {
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_subscribe",
    params: [
      "newPendingTransactions",
      {
        address: address,
        topics: ["0xa..c"], // Swap event topic
      },
    ],
  };

  ws.send(JSON.stringify(request));
}

function isUniswapSwap(transaction: any): boolean {
  // Add logic to detect Uniswap/DEX transactions
  const UNISWAP_ROUTER = "0xa..c";
  return transaction.to.toLowerCase() === UNISWAP_ROUTER.toLowerCase();
}

async function parseSwapTransaction(transaction: any) {
  // Add logic to parse swap details from transaction
  try {
    // Decode transaction input data
    // Extract token addresses and amounts
    return {
      inputToken: {
        address: "",
        amount: "",
      },
      outputToken: {
        address: "",
        amount: "",
      },
    };
  } catch (e) {
    console.error("Error parsing swap transaction:", e);
    return null;
  }
}

function formatSwapMessage(
  inputToken: any,
  outputToken: any,
  inputMetadata: any,
  outputMetadata: any,
  txHash: string
): string {
  return `Swap: ${inputMetadata.name} -> ${outputMetadata.name}
Amount: ${ethers.utils.formatUnits(
    inputToken.amount,
    inputMetadata.decimals
  )} ${inputMetadata.symbol} -> 
        ${ethers.utils.formatUnits(
          outputToken.amount,
          outputMetadata.decimals
        )} ${outputMetadata.symbol}
Transaction: https://etherscan.io/tx/${txHash}`;
}

function shouldExecuteSwap(
  inputToken: any,
  outputToken: any,
  balance: ethers.BigNumber,
  minBalance: ethers.BigNumber
): boolean {
  // Add logic to determine if swap should be executed
  return balance.gt(minBalance);
}

async function prepareSwapTransaction(
  wallet: ethers.Wallet,
  inputToken: any,
  outputToken: any,
  balance: ethers.BigNumber,
  minBalance: ethers.BigNumber
) {
  // Add logic to prepare swap transaction
  const swapAmount = balance.sub(minBalance);

  if (inputToken.symbol === "ETH") {
    return await getBuyTxWithUniswap(wallet, outputToken.address, swapAmount);
  } else {
    return await getSellTxWithUniswap(
      wallet,
      inputToken.address,
      inputToken.amount
    );
  }
}

export { subscribeToTransactions };
