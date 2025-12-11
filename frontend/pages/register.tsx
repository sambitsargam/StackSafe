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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-xl z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-lg shadow-xl">
              SS
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              StackSafe
            </h1>
            <p className="text-xs text-slate-400 font-medium">Secure Smart Wallet</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-2xl">
          <div className="group">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-2xl opacity-0 group-hover:opacity-30 transition duration-500"></div>
            
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 md:p-12">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl">
                    <span className="text-4xl">🔐</span>
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Create Your Passkey</h2>
                    <p className="text-slate-400 text-sm md:text-base mt-2">Secure, passwordless authentication with WebAuthn</p>
                  </div>
                </div>
              </div>

              {/* Main Action Button */}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full px-6 py-4 mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⚡</span>
                    <span>Processing Passkey...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Create Passkey</span>
                  </>
                )}
              </button>

              {/* Status Message */}
              {message && (
                <div className={`mb-6 p-4 rounded-xl border backdrop-blur transition-all duration-300 flex items-center gap-3 ${
                  message.includes("Error")
                    ? "bg-red-900/30 border-red-700/50 text-red-200"
                    : message.includes("successfully")
                    ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-200"
                    : "bg-blue-900/30 border-blue-700/50 text-blue-200"
                }`}>
                  <span className="text-lg">
                    {message.includes("Error") ? "❌" : message.includes("successfully") ? "✓" : "ℹ"}
                  </span>
                  <span className="font-medium">{message}</span>
                </div>
              )}

              {/* Public Key Display */}
              {pubkeyHex && (
                <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-900/10 border border-emerald-700/30 rounded-xl p-6 mb-6">
                  <p className="text-emerald-200 text-xs font-bold mb-3 uppercase tracking-wide">✓ Public Key Extracted</p>
                  <p className="text-emerald-100 text-sm font-mono break-all bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mb-3 max-h-24 overflow-y-auto">
                    {pubkeyHex}
                  </p>
                  <p className="text-emerald-300 text-sm flex items-center gap-2">
                    <span>✓</span>
                    <span>Ready for on-chain registration</span>
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 space-y-3">
                <p className="text-slate-300 text-sm font-semibold flex items-start gap-2">
                  <span className="text-base">ℹ️</span>
                  <span><strong className="text-blue-400">How it works:</strong></span>
                </p>
                <ul className="text-slate-400 text-sm space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span>Your device generates a secure passkey using WebAuthn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span>We extract your public key and register it on Stacks blockchain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span>All future transactions use secp256r1 signature verification</span>
                  </li>
                </ul>
              </div>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                <p className="text-amber-200 text-xs font-medium flex items-center gap-2">
                  <span>🔒</span>
                  <span>Your passkey is secured by your device's secure enclave</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
