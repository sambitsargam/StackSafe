"use client";

import { useState } from "react";
import { showConnect, disconnect, UserSession, AppConfig } from "@stacks/connect";

export default function ConnectButton() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      showConnect({
        appDetails: {
          name: "StackSafe",
          icon: window.location.origin + "/stacksafe-icon.png",
        },
        onFinish: () => {
          const appConfig = new AppConfig();
          const userSession = new UserSession({ appConfig });
          if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            setConnected(true);
            const addr = userData.profile.stxAddress?.testnet || userData.profile.stxAddress?.mainnet;
            setAddress(addr || null);
          }
          setLoading(false);
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Connection error:", error);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await disconnect();
      setConnected(false);
      setAddress(null);
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={connected ? handleDisconnect : handleConnect}
      disabled={loading}
      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
        connected
          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
          : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={address ? `Connected to ${address}` : "Connect your Stacks wallet"}
    >
      <div className="w-2 h-2 rounded-full bg-white/80"></div>
      {loading ? "Loading..." : connected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}
