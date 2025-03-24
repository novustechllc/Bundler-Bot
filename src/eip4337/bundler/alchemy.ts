import { Alchemy, Network } from 'alchemy-sdk';
import axios, { AxiosResponse } from 'axios';
import { IBundler } from './interface';
import { UserOperation } from '../types';
import { Contract, ethers } from 'ethers';
import { EntrypointABI } from '../contracts/abis';

export class AlchemyBundler implements IBundler {
  private _setting: any;
  private _bundlerUrl: string;
  private _entryPoint: string;
  private _entryPointContract: Contract;
  private _alchemy: Alchemy;
  constructor() {
    this._setting = {
      apiKey: '_Jml9yNo4fiPBQsolqUURj8gvPDORYcX',
      network: Network.BASE_SEPOLIA,
    };
    this._bundlerUrl = 'https://arb-sepolia.g.alchemy.com/v2/_Jml9yNo4fiPBQsolqUURj8gvPDORYcX';

    const provider = new ethers.providers.JsonRpcProvider(this._bundlerUrl);
    this._entryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
    this._entryPointContract = new Contract(this._entryPoint, EntrypointABI, provider);
    this._alchemy = new Alchemy(this._setting);
  }

  async sendUserOperation(userOps: UserOperation[]): Promise<string>{
    try {
      const sendResult = await axios.post(
        this._bundlerUrl,
        {
          jsonrpc: "2.0",
          method: "eth_sendUserOperation",
          params: [userOps[0], this._entryPoint],
          id: 1,
        },
      );
      console.log("🚀 ~ AlchemyBundler ~ sendUserOperation ~ sendResult:", sendResult.data)
      
      return sendResult.data.result
    } catch (error: any) {
        console.log("🚀 ~ AlchemyBundler ~ sendUserOperation ~ error:", error.response?.data?.error?.message)
        throw new Error(error.response?.data?.error?.message || "Error sending user operation")
    }
  }
  
  async getMaxPriorityFeePerGas(): Promise<string>{
    try {
      const sendResult = await axios.post(
        this._bundlerUrl,
        {
          jsonrpc: "2.0",
          method: "rundler_maxPriorityFeePerGas",
          params: [],
          id: 1,
        },
      );
      
      return sendResult.data.result;
    } catch (error: any) {
      throw new Error("Error get fee max priority")
    }
  }

  async sendPrivateTransaction(signedTransaction: string): Promise<string> {
    const targetBlock = (await this._alchemy.core.getBlockNumber()) + 10;
    const signedTx = await this._alchemy.transact.sendPrivateTransaction(
      signedTransaction,
      targetBlock
    );
    return signedTx
  }

  public handleResponse = <T>(response: AxiosResponse<T>): T => {
    if (/^2/.test(`${response.status}`)) {
      return response.data;
    }
    throw new Error(
      `${JSON.stringify(response)} with HTTP status code ${response.status}`,
    );
  };

}