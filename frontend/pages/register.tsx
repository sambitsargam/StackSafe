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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Register Passkey</h1>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Create Passkey"}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
            {message}
          </div>
        )}

        {pubkeyHex && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            <p className="text-sm font-mono break-all">{pubkeyHex}</p>
          </div>
        )}
      </div>
    </div>
  );
}
