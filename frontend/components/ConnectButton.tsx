"use client";

import { useState } from "react";
import { showConnect, disconnect } from "@stacks/connect";

export default function ConnectButton() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      showConnect({
        appDetails: {
          name: "StackSafe",
          icon: "https://example.com/icon.png",
        },
      });
      setConnected(true);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setConnected(false);
      setAddress(null);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={connected ? handleDisconnect : handleConnect}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {connected ? `Connected: ${address?.slice(0, 8)}...` : "Connect Wallet"}
      </button>
    </div>
  );
}
