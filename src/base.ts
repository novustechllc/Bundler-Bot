import { ethers, TransactionRequest } from 'ethers';
import { FlashbotsBundleProvider, FlashbotsBundleResolution, FlashbotsTransactionResponse } from '@flashbots/ethers-provider-bundle';
import dotenv from 'dotenv';
import { AbiToken20 } from './abis';
dotenv.config();

async function main() {
    // Get the private key from the environment
    const privateKey = process.env.WALLET_PRIVATE_KEY_1 || "";
    const tokenAddress = "0xA48aF2771E56bE99AE78c330dE627Ea63751901F";
    const BLOCKS_IN_THE_FUTURE = 10;
    const LEGACY_GAS_PRICE = ethers.parseUnits("12", "gwei");
    const PRIORITY_FEE = ethers.parseUnits("100", "gwei");

    // Initialize JSON-RPC provider
    // Base sepolia: https://sepolia.base.org
    // ETH sepolia: https://ethereum-sepolia-rpc.publicnode.com
    const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const chainId = (await provider.getNetwork()).chainId;
    console.log("🚀 ~ main ~ chainId:", chainId)

    // Initialize signer with the private key
    const signer = new ethers.Wallet(privateKey, provider);
    console.log("🚀 Using Wallet: ", signer.address)

    // Initialize FlashbotsBundleProvider with the signer and JSON-RPC provider
    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, signer, 'https://relay-sepolia.flashbots.net', {
        chainId: Number(chainId)
    });
    const erc20Contract = new ethers.Contract(tokenAddress, AbiToken20, signer);
    // Your code here...
    /*     const tx_transfer_1 = {
            from: signer.address,
            to: await erc20Contract.getAddress(),
            data: erc20Contract.interface.encodeFunctionData("transfer", ["0x4429B1e0BE0Af0dFFB3CAb40285CBBb631EE5656", ethers.parseUnits("1", 18)]),
            maxFeePerGas: ethers.parseUnits("3", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
            gasLimit: 21000,
            chainId
        } */
    const currentBlock = await provider.getBlockNumber();
    const block = await provider.getBlock(currentBlock)
    const targetBlockNumber = currentBlock + BLOCKS_IN_THE_FUTURE;
    const minTimestamp = block?.timestamp || 0;
    const maxTimestamp = minTimestamp + 120

    const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block?.baseFeePerGas || BigInt(0), BLOCKS_IN_THE_FUTURE)
    console.log("🚀 ~ main ~ maxBaseFeeInFutureBlock:", maxBaseFeeInFutureBlock)

    const tx_transfer_1: TransactionRequest = {
        from: signer.address,
        to: "0x4429B1e0BE0Af0dFFB3CAb40285CBBb631EE5656",
        data: "0x",
        value: ethers.parseUnits("0.001", 18),
        chainId,
        type: 2,
        // EIP 1559
        maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
        maxPriorityFeePerGas: PRIORITY_FEE,
    }

    const tx_transfer_2: TransactionRequest = {
        from: signer.address,
        to: "0xBF6dc05235645299bAa2148300aBbc0E730C74cA",
        data: "0x",
        value: ethers.parseUnits("0.002", 18),
        chainId,
        type: 2,
        // EIP 1559
        maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
        maxPriorityFeePerGas: PRIORITY_FEE,

    }

    const transactionBundle = [
        {
            signer: signer, // ethers signer
            transaction: tx_transfer_1 // ethers populated transaction object
        },
        {
            signer: signer, // ethers signer
            transaction: tx_transfer_2 // ethers populated transaction object
        },
    ]



    const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
    console.log(new Date())
    console.log('Starting to run the simulation...')
    const simulation: any = await flashbotsProvider.simulate(
        signedTransactions,
        currentBlock + 1,
    )
    console.log(new Date())

    // 7. Check the result of the simulation
    if (simulation.firstRevert) {
        console.log(`Simulation Error: ${simulation.firstRevert.error}`)
    } else {
        console.log(
            `Simulation Success: ${currentBlock}}`
        )
    }

    for (let i = 1; i <= 10; i++) {
        const bundleSubmission: any = await flashbotsProvider.sendRawBundle(
            signedTransactions,
            currentBlock + i
        )
        const waitResponse = await bundleSubmission.wait();
        console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`);
        if (
            waitResponse === FlashbotsBundleResolution.BundleIncluded ||
            waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh
        ) {
            console.log('Bundle included!')
            process.exit(0)
        } else {
            console.log({
                bundleStats: await flashbotsProvider.getBundleStatsV2(
                    simulation.bundleHash,
                    currentBlock + 1,
                ),
                userStats: await flashbotsProvider.getUserStatsV2(),
            })
        }
    }
    // const send: any = await flashbotsProvider.sendBundle(transactionBundle, targetBlockNumber, {
    //     maxTimestamp, minTimestamp,
    // });
    // console.log("🚀 ~ main ~ send:", send)
    // const stat = await flashbotsProvider.getBundleStatsV2(send.bundleHash, targetBlockNumber)
    // console.log("🚀 ~ main ~ stat:", stat)

    // const simulate = await send.simulate();
    // console.log("🚀 ~ main ~ simulate:", simulate)

    // const wait = await send.wait();
    // console.log("🚀 ~ main ~ wait:", wait)

    // const receipts = await send.receipts();
    // console.log("🚀 ~ main ~ receipts:", receipts)

}

main();