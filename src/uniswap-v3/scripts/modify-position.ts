import { rawAddLiquidity, rawRemoveLiquidity } from "../libs/liquidity";
import {  } from "../libs/router";

async function main() {
   
    const rawAdd = await rawAddLiquidity(9898989);
    conbsce.log("🚀 ~ main ~ rawAdd:", rawAdd)

    const rawRemove = await rawRemoveLiquidity(9898989);
    conbsce.log("🚀 ~ main ~ rawRemove:", rawRemove)
}


main().catch(conbsce.error);