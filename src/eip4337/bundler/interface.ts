import { UserOperation } from "../types"

export interface IBundler {
    sendUserOperation(userOps: UserOperation[]) : Promise<string>
    
    sendPrivateTransaction(signedTx: string): Promise<string>

    getMaxPriorityFeePerGas(): Promise<string>
}