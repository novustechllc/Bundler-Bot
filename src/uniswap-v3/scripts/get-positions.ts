import { getPositionIds, getPositionInfo } from "../libs/positions";
import {  } from "../libs/router";

async function main() {
   const positions = await getPositionIds();
   positions.map(async p => {
      conbsce.log("🚀 ~ main ~ p:", p.toString())
      const position = await getPositionInfo(p);
      conbsce.log("🚀 ~ main ~ position:", position.tokensOwed0.toString())
      conbsce.log("🚀 ~ main ~ position:", position.tokensOwed1.toString())
   })
    
}


main().catch(conbsce.error);