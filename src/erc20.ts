import { BigNumberish, ethers, Typed } from 'ethers';
import { AbiToken20 } from './abis';

async function getERC20Balance(tokenAddress: string, accountAddress: string, rpcUrl: string): Promise<string> {
    // Create an ethers.js provider
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create an instance of the ERC20 contract
    const erc20Contract = new ethers.Contract(tokenAddress, AbiToken20, provider);

    // Call the balanceOf function to get the balance
    const balance = await erc20Contract.balanceOf(accountAddress)
    console.log("🚀 ~ getERC20Balance ~ balance:", balance)

    // Convert the balance to a human-readable format
    const balanceString = ethers.formatUnits(balance, 18); // Assuming 18 decimal places for the token

    return balanceString;
}

function isAddress(address: string): boolean {
    return ethers.isAddress(address);
}

function formatUnits(amount: BigNumberish, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
}

function parseUnits(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
}
/**
 * BSC Token Testnet: 0x48dE49d84145a58Ded308D485F9a4245cCeF3BfE
 * BSC Token Mainnet: 0x...
 */
async function main() {
    // Use BSC mainnet JSON-RPC URL
    // BSC Testnet: https://data-seed-prebsc-2-s3.bnbchain.org:8545
    // BSC Mainnet: https://binance.llamarpc.com
    // ARB Testnet: https://sepolia-rollup.arbitrum.io/rpc
    const rpcUrl = 'https://data-seed-prebsc-2-s3.bnbchain.org:8545';
    const tokenAddress = '0x48dE49d84145a58Ded308D485F9a4245cCeF3BfE'; 
    const accountAddress = '0x165adfb7efb01c2d6772c99cc392991ce8da6d48';

    // Call getERC20Balance function
    const balance = await getERC20Balance(tokenAddress, accountAddress, rpcUrl);
    console.log('ERC20 Balance:', balance);

    // Call isAddress function
    const isValidAddress = isAddress(accountAddress);
    console.log('Is Valid Address:', isValidAddress);

    // Call formatUnits function
    const formattedAmount = formatUnits('1000000000000000000', 18);
    console.log('Formatted Amount:', formattedAmount);

    // Call parseUnits function
    const parsedAmount = parseUnits('1');
    console.log('Parsed Amount:', parsedAmount);
}

main().catch((error) => {
    console.error('Error:', error);
});