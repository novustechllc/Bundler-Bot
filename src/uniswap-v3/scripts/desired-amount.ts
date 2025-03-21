import { desiredMintAmountsNotWithinRange, desiredMintAmountsWithinRange, desiredAmountsWhenBurnPosition } from "../libs/liquidity";
import { desiredSwapAmounts } from "../libs/router";

async function main() {
    // desiredSwapAmounts();
    // const tx = await desiredMintAmounts([5, 10]);

    await desiredAmountsWhenBurnPosition();
    // await desiredMintAmountsNotWithinRange();
    // await desiredMintAmountsWithinRange();
}


main().catch(conbsce.error);