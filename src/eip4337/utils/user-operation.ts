import { BigNumberish, BytesLike, constants, utils, BigNumber } from "ethers";
import { UserOperation } from './../types';

export const DEFAULT_VERIFICATION_GAS_LIMIT = BigNumber.from(1_000_000);
export const DEFAULT_CALL_GAS_LIMIT = BigNumber.from(1_000_000);
export const DEFAULT_PRE_VERIFICATION_GAS = BigNumber.from(1_000_000);
export const DEFAULT_MAX_PRIORITY_GAS = BigNumber.from(1_000_000);

export const DEFAULT_USER_OP: UserOperation = {
  sender: constants.AddressZero,
  nonce: constants.Zero,
  initCode: utils.hexlify("0x"),
  callData: utils.hexlify("0x"),
  // disable because no default value since 25-04-2024
  callGasLimit: DEFAULT_CALL_GAS_LIMIT,
  verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
  preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS,
  maxFeePerGas: DEFAULT_MAX_PRIORITY_GAS,
  maxPriorityFeePerGas: DEFAULT_MAX_PRIORITY_GAS,
  paymasterAndData: utils.hexlify("0x"),
  signature: utils.hexlify("0x"),
};

export class UserOperationBuilder {
  private defaultOp: UserOperation;
  private currentOp: UserOperation | any;

  constructor() {
    this.defaultOp = {
      ...DEFAULT_USER_OP,
    };
    this.currentOp = {
      ...this.defaultOp,
    };
  }

  private resolveFields(op: Partial<UserOperation>): Partial<UserOperation> {
    const obj = {
      sender: op.sender !== undefined ? utils.getAddress(op.sender) : undefined,
      nonce: op.nonce !== undefined ? BigNumber.from(op.nonce) : undefined,
      initCode: op.initCode !== undefined ? utils.hexlify(op.initCode) : undefined,
      callData: op.callData !== undefined ? utils.hexlify(op.callData) : undefined,
      callGasLimit: op.callGasLimit !== undefined ? BigNumber.from(op.callGasLimit) : undefined,
      verificationGasLimit: op.verificationGasLimit !== undefined ? BigNumber.from(op.verificationGasLimit) : undefined,
      preVerificationGas: op.preVerificationGas !== undefined ? BigNumber.from(op.preVerificationGas) : undefined,
      maxFeePerGas: op.maxFeePerGas !== undefined ? BigNumber.from(op.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: op.maxPriorityFeePerGas !== undefined ? BigNumber.from(op.maxPriorityFeePerGas) : undefined,
      paymasterAndData: op.paymasterAndData !== undefined ? utils.hexlify(op.paymasterAndData) : undefined,
      signature: op.signature !== undefined ? utils.hexlify(op.signature) : undefined,
    };
    return Object.keys(obj).reduce(
      (prev, curr) =>
        (obj as any)[curr] !== undefined
          ? {
              ...prev,
              [curr]: (obj as any)[curr],
            }
          : prev,
      {},
    ) as unknown as Partial<UserOperation>;
  }

  public getSender() {
    return this.currentOp.sender;
  }
  public getNonce() {
    return this.currentOp.nonce;
  }
  public getInitCode() {
    return this.currentOp.initCode;
  }
  public getCallData() {
    return this.currentOp.callData;
  }
  public getCallGasLimit() {
    return this.currentOp.callGasLimit;
  }
  public getVerificationGasLimit() {
    return this.currentOp.verificationGasLimit;
  }
  public getPreVerificationGas() {
    return this.currentOp.preVerificationGas;
  }
  public getMaxFeePerGas() {
    return this.currentOp.maxFeePerGas;
  }
  public getMaxPriorityFeePerGas() {
    return this.currentOp.maxPriorityFeePerGas;
  }
  public getPaymasterAndData() {
    return this.currentOp.paymasterAndData;
  }
  public getSignature() {
    return this.currentOp.signature;
  }
  public getOp() {
    return this.currentOp;
  }

  public setSender(val: string) {
    this.currentOp.sender = utils.getAddress(val);
    return this;
  }
  public setNonce(val: BigNumberish) {
    this.currentOp.nonce = BigNumber.from(val);
    return this;
  }
  public setInitCode(val: BytesLike) {
    this.currentOp.initCode = utils.hexlify(val);
    return this;
  }
  public setCallData(val: BytesLike) {
    this.currentOp.callData = utils.hexlify(val);
    return this;
  }
  public setCallGasLimit(val: BigNumberish) {
    this.currentOp.callGasLimit = BigNumber.from(val);
    return this;
  }
  public setVerificationGasLimit(val: BigNumberish) {
    this.currentOp.verificationGasLimit = BigNumber.from(val);
    return this;
  }
  public setPreVerificationGas(val: BigNumberish) {
    this.currentOp.preVerificationGas = BigNumber.from(val);
    return this;
  }
  public setMaxFeePerGas(val: BigNumberish, buffer = 0.2) {
    if (val) {
      if (typeof val === "string") {
        const intVal = parseInt(val, 16);
        const maxFeePerGas = BigNumber.from(intVal);
        const maxFeePerGasBuff = BigNumber.from(Math.round(intVal * buffer));
        this.currentOp.maxFeePerGas = maxFeePerGas.add(maxFeePerGasBuff);
      } else {
        this.currentOp.maxFeePerGas = BigNumber.from(val);
      }
    }
    return this;
  }
  public setMaxPriorityFeePerGas(val: BigNumberish, buffer = 0.2) {
    if (val) {
      if (typeof val === "string") {
        const intVal = parseInt(val, 16);
        const maxPriorityFeePerGas = BigNumber.from(intVal);
        const maxPriorityFeePerGasBuff = BigNumber.from(Math.round(intVal * buffer));
        this.currentOp.maxPriorityFeePerGas = maxPriorityFeePerGas.add(maxPriorityFeePerGasBuff);
      } else {
        this.currentOp.maxPriorityFeePerGas = BigNumber.from(val);
      }
    }
    return this;
  }
  public setPaymasterAndData(val: BytesLike) {
    this.currentOp.paymasterAndData = utils.hexlify(val);
    return this;
  }
  public setSignature(val: BytesLike) {
    this.currentOp.signature = utils.hexlify(val);
    return this;
  }
  public setPartial(partialOp: Partial<UserOperation>) {
    this.currentOp = {
      ...this.currentOp,
      ...this.resolveFields(partialOp),
    };
    return this;
  }

  public useDefaults(partialOp: Partial<UserOperation>) {
    const resolvedOp = this.resolveFields(partialOp);
    this.defaultOp = {
      ...this.defaultOp,
      ...resolvedOp,
    };
    this.currentOp = {
      ...this.currentOp,
      ...resolvedOp,
    };

    return this;
  }
  public resetDefaults() {
    this.defaultOp = {
      ...DEFAULT_USER_OP,
    };
    return this;
  }

  public build() {
    this.setPartial(this.currentOp);
    return this.toJson();
  }

  public resetOp() {
    this.currentOp = {
      ...this.defaultOp,
    };
    return this;
  }

  public toJson(): UserOperation {
    return Object.keys(this.currentOp)
      .map((key) => {
        let val = this.currentOp[key];
        if (typeof val !== "string" || !val.startsWith("0x")) {
          val = utils.hexValue(val);
        }
        return [key, val];
      })
      .reduce(
        (set, [k, v]) => ({
          ...set,
          [k]: v,
        }),
        {},
      ) as UserOperation;
  }
}
