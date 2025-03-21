import { rawMintPosition } from "../libs/positions";
import {  } from "../libs/router";

async function main() {
   
    const rawMint = await rawMintPosition();
    conbsce.log("🚀 ~ main ~ rawMint:", rawMint)
}


main().catch(conbsce.error);