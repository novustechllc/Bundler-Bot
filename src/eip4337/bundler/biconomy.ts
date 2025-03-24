import { UserOperation } from '../types';
import { IBundler  } from './interface';

export class BiconomyBundler implements IBundler {
  constructor(){
    
  }

  sendUserOperation(userOps: UserOperation[]): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async sendPrivateTransaction(signedTransaction: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}