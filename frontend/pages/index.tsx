"use client";

import { useState } from "react";
import ConnectButton from "@/components/ConnectButton";
import { showContractCall } from "@stacks/connect";
import { contractAddress, contractName, defaultCreateOptions } from "@/lib/stacks";
import { generateAuthenticationChallenge, startWebAuthnAuthentication } from "@/lib/webauthn";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const proposals: any[] = []; // TODO: Fetch from contract
  const [message, setMessage] = useState("");
  const [proposeAmount, setProposeAmount] = useState("");
  const [proposeTimelock, setProposeTimelock] = useState("");

  const handlePropose = async () => {
    try {
      setLoading(true);
      setMessage("Generating authentication challenge...");

      const options = await generateAuthenticationChallenge();
      await startWebAuthnAuthentication(options);

      const amount = BigInt(proposeAmount) * BigInt(1000000);
      const timelock = BigInt(proposeTimelock);

      setMessage("Proposing spend on-chain...");

      showContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "propose-spend",
        functionArgs: [
          "ST2CY5V39NUAR67PVW2YZJK72UJJGD2ZCPGD4C4K5", // recipient
          amount.toString(),
          timelock.toString(),
          "0", // no approvals needed
        ],
        ...defaultCreateOptions,
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

      showContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "execute-spend",
        functionArgs: [proposalId],
        ...defaultCreateOptions,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
              SS
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              StackSafe
            </h1>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Propose Spend Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold">+</span>
                </div>
                <h2 className="text-xl font-bold text-white">Propose Spend</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (STX)
                  </label>
                  <input
                    type="number"
                    value={proposeAmount}
                    onChange={(e) => setProposeAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Timelock (blocks)
                  </label>
                  <input
                    type="number"
                    value={proposeTimelock}
                    onChange={(e) => setProposeTimelock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="0"
                  />
                </div>

                <button
                  onClick={handlePropose}
                  disabled={loading || !proposeAmount}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  {loading ? "Processing..." : "Propose Spend"}
                </button>
              </div>
            </div>
          </div>

          {/* Proposals List Card */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <h2 className="text-xl font-bold text-white">Recent Proposals</h2>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {proposals.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No proposals yet</p>
                    <p className="text-slate-500 text-sm mt-1">Create your first spending proposal above</p>
                  </div>
                ) : (
                  proposals.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition"
                    >
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-slate-400 text-xs font-medium">AMOUNT</p>
                          <p className="text-white font-bold">{p.amount} STX</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs font-medium">STATUS</p>
                          <p className={`font-semibold ${
                            p.executed ? "text-green-400" : "text-yellow-400"
                          }`}>
                            {p.executed ? "✓ Executed" : "⏳ Pending"}
                          </p>
                        </div>
                      </div>
                      {!p.executed && (
                        <button
                          onClick={() => handleExecute(p.id)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
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
        </div>

        {/* Status Message */}
        {message && (
          <div className="mt-8 fixed bottom-6 right-6 max-w-md">
            <div className={`px-4 py-3 rounded-lg font-medium shadow-lg backdrop-blur border ${
              message.includes("Error")
                ? "bg-red-900/50 border-red-700 text-red-200"
                : message.includes("successfully")
                ? "bg-green-900/50 border-green-700 text-green-200"
                : "bg-blue-900/50 border-blue-700 text-blue-200"
            }`}>
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
