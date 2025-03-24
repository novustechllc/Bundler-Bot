import { ethers, Signer } from 'ethers';
import dotenv from 'dotenv';
import { AbiToken20 } from './abis';
import { AlchemyBundler } from './eip4337/bundler/alchemy';
import { accountInterface } from './eip4337/contracts/Account';
import { UserOperationBuilder } from './eip4337/utils';
import { EntryPointContract } from './eip4337/contracts/entrypoint.contract';
import { BicAccountFactoryContract } from './eip4337/contracts/account-factory.contract';
import { IBundler } from './eip4337/bundler/interface';
dotenv.config();

async function main() {
    // Get the private key from the environment
    const privateKey1 = process.env.WALLET_PRIVATE_KEY_1 || "";
    const privateKey2 = process.env.WALLET_PRIVATE_KEY_2 || "";
    const privateKeyBundler = process.env.WALLET_PRIVATE_KEY_BUNDLE || "";
    const tokenAddress = "0xA48aF2771E56bE99AE78c330dE627Ea63751901F";

    // Initialize JSON-RPC provider
    const rpcUrl = "https://arb-sepolia.g.alchemy.com/v2/_Jml9yNo4fiPBQsolqUURj8gvPDORYcX";
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const chainId = (await provider.getNetwork()).chainId;

    const bundlerSigner = new ethers.Wallet(privateKeyBundler, provider);

    const entrypoint = EntryPointContract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", bundlerSigner);
    const factory = BicAccountFactoryContract("0x4e8A55cC1985714BF9fdB6E1F246E6B92E511AA2", provider);
    const salt = 100;

    // Initialize signer with the private key
    const aliceSigner = new ethers.Wallet(privateKey1, provider);
    const bobSigner = new ethers.Wallet(privateKey2, provider);


    const bundler = new AlchemyBundler();

    const userOp1 = await buildUserOp(aliceSigner, bundler, salt);
    const userOp2 = await buildUserOp(bobSigner, bundler, salt);
    const tx2 = await entrypoint.handleOps([userOp1, userOp2], bundlerSigner.address)
    console.log("🚀 ~ main ~ tx2:", tx2)



    

}

const buildUserOp = async (signerOrProvider: ethers.Wallet, bundler: IBundler, salt: number = 100) => {
    const entrypoint = EntryPointContract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", signerOrProvider);
    const factory = BicAccountFactoryContract("0x4e8A55cC1985714BF9fdB6E1F246E6B92E511AA2", signerOrProvider);

    const sender = await factory.getAddress(signerOrProvider.address, salt);
    const nonce = await entrypoint.getNonce(sender, salt);

    const fee = await signerOrProvider.getFeeData();


    const callDataForEntrypoint = accountInterface.encodeFunctionData("executeBatch", [
        ["0x4429B1e0BE0Af0dFFB3CAb40285CBBb631EE5656"],
        [ethers.utils.parseUnits("0.00001", 18)],
        ["0x"]
    ]);
    const maxPriorityFeePerGas = await bundler.getMaxPriorityFeePerGas();
    const userOp1 = new UserOperationBuilder();
    userOp1.setSender(sender);
    userOp1.setNonce(nonce);
    userOp1.setInitCode("0x"); // Manual deploy
    userOp1.setCallData(callDataForEntrypoint);
    userOp1.setMaxFeePerGas(fee.maxFeePerGas?.toHexString() || "0x");
    userOp1.setMaxPriorityFeePerGas(maxPriorityFeePerGas);

    const opHash = await entrypoint.getUserOpHash(userOp1.build());
    const signedMessage = await signerOrProvider.signMessage(ethers.utils.arrayify(opHash));
    const signature = ethers.utils.solidityPack(["bytes"], [signedMessage]);
    userOp1.setSignature(signature);
    return userOp1.build();
}

main();