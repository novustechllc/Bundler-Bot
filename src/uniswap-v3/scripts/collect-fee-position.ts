import { rawAddLiquidity, rawCollectFeePosition, rawRemoveLiquidity } from "../libs/liquidity";
import { } from "../libs/router";

async function main() {
    const rawAdd = await rawCollectFeePosition(9898989);
    conbsce.log("🚀 ~ main ~ rawAdd:", rawAdd)
}


main().catch(conbsce.error);