"use client";

import { useState } from "react";
import ConnectButton from "@/components/ConnectButton";
import { openContractCall, callReadOnlyFunction } from "@stacks/connect";
import { network, contractAddress, contractName } from "@/lib/stacks";
import { generateAuthenticationChallenge, startWebAuthnAuthentication, challengeToHex } from "@/lib/webauthn";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [proposeAmount, setProposeAmount] = useState("");
  const [proposeTimelock, setProposeTimelock] = useState("");

  const handlePropose = async () => {
    try {
      setLoading(true);
      setMessage("Generating authentication challenge...");

      const options = await generateAuthenticationChallenge();
      const challenge = options.challenge;

      setMessage("Signing with passkey...");
      const authResp = await startWebAuthnAuthentication(options);

      const amount = BigInt(proposeAmount) * BigInt(1000000);
      const timelock = BigInt(proposeTimelock);

      setMessage("Proposing spend on-chain...");

      openContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "propose-spend",
        functionArgs: [
          "ST2CY5V39NUAR67PVW2YZJK72UJJGD2ZCPGD4C4K5", // recipient
          amount.toString(),
          timelock.toString(),
          "0", // no approvals needed
        ],
        onFinish: () => {
          setMessage("Spend proposed successfully!");
          setProposeAmount("");
          setProposeTimelock("");
        },
        onCancel: () => {
          setMessage("Proposal cancelled");
        },
      });
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (proposalId: string) => {
    try {
      setLoading(true);
      setMessage("Executing spend...");

      openContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "execute-spend",
        functionArgs: [proposalId],
        onFinish: () => {
          setMessage("Spend executed!");
        },
        onCancel: () => {
          setMessage("Execution cancelled");
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">StackSafe Dashboard</h1>
            <ConnectButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Propose Spend */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Propose Spend</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (STX)
                  </label>
                  <input
                    type="number"
                    value={proposeAmount}
                    onChange={(e) => setProposeAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timelock (blocks)
                  </label>
                  <input
                    type="number"
                    value={proposeTimelock}
                    onChange={(e) => setProposeTimelock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>

                <button
                  onClick={handlePropose}
                  disabled={loading || !proposeAmount}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? "Processing..." : "Propose"}
                </button>
              </div>
            </div>

            {/* Proposals List */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Recent Proposals</h2>

              <div className="space-y-3">
                {proposals.length === 0 ? (
                  <p className="text-gray-500">No proposals yet</p>
                ) : (
                  proposals.map((p, idx) => (
                    <div key={idx} className="border rounded p-3 bg-gray-50">
                      <p className="text-sm">
                        <strong>Amount:</strong> {p.amount} STX
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong> {p.executed ? "Executed" : "Pending"}
                      </p>
                      {!p.executed && (
                        <button
                          onClick={() => handleExecute(p.id)}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Execute
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-blue-100 text-blue-800 rounded-lg">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
