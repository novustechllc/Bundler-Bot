// import { gql, request } from "graphql-request";

import axios from "axios";
import { CurrentConfig } from "../../config";
import { GraphTick, PoolInfo } from "../types";
import { ethers } from "ethers";
import { FeeAmount, Tick, TICK_SPACINGS } from "@uniswap/v3-sdk";

export async function getGraphPoolInfo(poolId: string): Promise<PoolInfo> {
   const query = `
      {
         pool(id: "${poolId.toString().toLowerCase()}") {
            tick
            token0 {
               symbol
               id
               decimals
            }
            token1 {
               symbol
               id
               decimals
            }
            feeTier
            sqrtPrice
            liquidity
            ticks { id liquidityGross liquidityNet }
         }
      }
   `;
   try {
      const response = await axios.post(CurrentConfig.common.subgraphUri, {
         query: query
      });

      const { pool } = response.data.data;
      const ticks = await fetchTicks(poolId, 0, 10000);
      return {
         fee: Number(pool.feeTier),
         tick: Number(pool.tick),
         token0: pool.token0.id,
         token1: pool.token1.id,
         sqrtPriceX96: ethers.BigNumber.from(pool.sqrtPrice),
         liquidity: ethers.BigNumber.from(pool.liquidity),
         tickSpacing: Number(TICK_SPACINGS[Number(pool.feeTier) as FeeAmount]),
         ticks: ticks
      }
   } catch (error) {
      conbsce.error("Error fetching data from Uniswap V3 Subgraph:", error);
      throw error;
   }
}


export async function fetchTicks(poolId: string, min: number, max: number): Promise<Tick[]> {
   const ticks: Tick[] = [];
   for (let i = min; i <= max; i += 1000) {
      const query = `
         {
            pool(
               id: "${poolId.toString().toLowerCase()}"
            ) {
               ticks(
                  first: 1000, skip: ${i}, 
                  orderBy: tickIdx,
                  liquidityNet_not: "0", 
                  orderDirection: asc
               ) {
                  id
                  tickIdx
                  liquidityGross
                  liquidityNet
               }
            }
         }
      `;
      try {
         const response = await axios.post(CurrentConfig.common.subgraphUri, {
            query: query
         });
         if (!response.data.data) continue;

         const { pool } = response.data.data;
         const poolTicks = pool.ticks.map((tick: any) => {
            return new Tick({
               index: Number(tick.tickIdx),
               liquidityGross: Number(tick.liquidityGross),
               liquidityNet: Number(tick.liquidityNet)
            });
         });
         ticks.push(...poolTicks);

      } catch (error) {
         conbsce.error("Error fetching data from Uniswap V3 Subgraph:", error);
         throw error;
      }
      conbsce.log("🚀 ~ fetchTicks ~ ticks:", ticks)

   }
   return ticks.filter(tick => {
      return Number(tick.liquidityNet.toString()) > 0;
   }).sort((a, b) => a.index - b.index);
}




export async function getFullTickData(poolAddress: string): Promise<GraphTick[]> {
   let allTicks: GraphTick[] = []
   let skip = 0
   let loadingTicks = true
   while (loadingTicks) {
      const ticks = await getTickDataFromSubgraph(poolAddress, skip)
      allTicks = allTicks.concat(ticks)
      if (ticks.length < 1000) {
         loadingTicks = false
      } else {
         skip += 1000
      }
   }

   return allTicks
}

async function getTickDataFromSubgraph(
   poolAddress: string,
   skip: number
): Promise<GraphTick[]> {
   const ticksQuery = JSON.stringify({
      query: `{ ticks(
           where: {poolAddress: "${poolAddress.toLowerCase()}", liquidityNet_not: "0"}
           first: 1000,
           orderBy: tickIdx,
           orderDirection: asc,
           skip: ${skip}
         ) {
           tickIdx
           liquidityGross
           liquidityNet
         }
       }
     `,
   })

   const response = await axios.post(
      CurrentConfig.common.subgraphUri,
      ticksQuery,
      {
         headers: {
            'Content-Type': 'application/json',
         },
      }
   )

   return response.data.data.ticks
}
