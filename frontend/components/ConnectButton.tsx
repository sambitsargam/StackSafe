"use client";

import { useState } from "react";
import { openContractCall } from "@stacks/connect";
import { contractAddress, contractName } from "@/lib/stacks";

export default function ConnectButton() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      openContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "register-passkey",
        functionArgs: [],
        onFinish: () => {
          setConnected(true);
        },
        onCancel: () => {
          console.log("User cancelled");
        },
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleConnect}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {connected ? `Connected: ${address?.slice(0, 8)}...` : "Connect Wallet"}
      </button>
    </div>
  );
}
