"use client";

import { useState } from "react";
import { generateRegistrationChallenge, startWebAuthnRegistration, derivePublicKeyFromCredential, challengeToHex } from "@/lib/webauthn";
import { showContractCall } from "@stacks/connect";
import { contractAddress, contractName, defaultCreateOptions } from "@/lib/stacks";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pubkeyHex, setPubkeyHex] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setMessage("Generating WebAuthn challenge...");

      const options = await generateRegistrationChallenge();
      setMessage("Waiting for passkey enrollment...");

      const attResp = await startWebAuthnRegistration(options);
      setMessage("Extracting public key...");

      const publicKey = await derivePublicKeyFromCredential(attResp);
      const pubkeyHexStr = challengeToHex(publicKey);
      setPubkeyHex(pubkeyHexStr);

      setMessage("Registering passkey on-chain...");

      showContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "register-passkey",
        functionArgs: [pubkeyHexStr],
        ...defaultCreateOptions,
        onFinish: () => {
          setMessage("Passkey registered successfully!");
        },
        onCancel: () => {
          setMessage("Registration cancelled");
        },
      });
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
            SS
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            StackSafe
          </h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Create Your Passkey</h2>
                <p className="text-slate-400 text-sm mt-1">Secure, passwordless authentication</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full px-6 py-3 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              "Create Passkey"
            )}
          </button>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border backdrop-blur ${
              message.includes("Error")
                ? "bg-red-900/30 border-red-700 text-red-200"
                : message.includes("successfully")
                ? "bg-green-900/30 border-green-700 text-green-200"
                : "bg-blue-900/30 border-blue-700 text-blue-200"
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}

          {/* Public Key Display */}
          {pubkeyHex && (
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <p className="text-slate-300 text-xs font-semibold mb-2">PUBLIC KEY (P-256)</p>
              <p className="text-green-400 text-sm font-mono break-all bg-slate-900/50 p-3 rounded border border-slate-600">
                {pubkeyHex}
              </p>
              <p className="text-slate-400 text-xs mt-2">✓ Ready for on-chain registration</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
            <p className="text-slate-300 text-sm">
              <span className="font-semibold text-blue-400">ℹ️ How it works:</span>
              <br />
              Your passkey will be registered on the Stacks blockchain using secp256r1 cryptography.
              This enables secure, passwordless access to your StackSafe wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
