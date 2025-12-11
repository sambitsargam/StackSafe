import { StacksTestnet, StacksMainnet } from "@stacks/network";
import { PostConditionMode } from "@stacks/transactions";

const network = new StacksTestnet();

export const defaultCreateOptions = {
  onClose: () => {
    console.log("Wallet closed");
  },
  onFinish: (data: any) => {
    console.log("Transaction finished:", data);
  },
};

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "ST1PQHQV0W8CRUMB6QVQ0GKWC54BB2XDC13Q6X69H.stacksafe";
export const contractName = "stacksafe";

export { network };
