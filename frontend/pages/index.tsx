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

      const amount_str = amount.toString();
      const timelock_str = timelock.toString();

      setMessage("Proposing spend on-chain...");

      showContractCall({
        contractAddress: contractAddress.split(".")[0],
        contractName: contractName,
        functionName: "propose-spend",
        functionArgs: [
          "ST2CY5V39NUAR67PVW2YZJK72UJJGD2ZCPGD4C4K5", // recipient
          amount_str,
          timelock_str,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Logo with glow effect */}
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
          <ConnectButton />
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Propose Spend Card */}
          <div className="lg:col-span-1 group">
            <div className="relative h-full">
              {/* Card glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
              
              <div className="relative h-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl hover:shadow-2xl transition-all duration-300 hover:border-emerald-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    +
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Propose Spend</h2>
                    <p className="text-xs text-slate-400">Create a new spending proposal</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2.5">
                      Amount (STX)
                    </label>
                    <div className="relative group/input">
                      <input
                        type="number"
                        value={proposeAmount}
                        onChange={(e) => setProposeAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 group-hover/input:border-emerald-500/30"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">STX</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2.5">
                      Timelock (blocks)
                    </label>
                    <input
                      type="number"
                      value={proposeTimelock}
                      onChange={(e) => setProposeTimelock(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      placeholder="0"
                    />
                  </div>

                  <button
                    onClick={handlePropose}
                    disabled={loading || !proposeAmount}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⚡</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Propose Spend
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Proposals List Card */}
          <div className="lg:col-span-2 group">
            <div className="relative h-full">
              {/* Card glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
              
              <div className="relative h-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl hover:shadow-2xl transition-all duration-300 hover:border-purple-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    📋
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Recent Proposals</h2>
                    <p className="text-xs text-slate-400">Manage your spending proposals</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {proposals.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <p className="text-lg">📭</p>
                      <p className="text-slate-400 font-medium mt-2">No proposals yet</p>
                      <p className="text-slate-500 text-sm mt-1">Create your first spending proposal to get started</p>
                    </div>
                  ) : (
                    proposals.map((p, idx) => (
                      <div
                        key={idx}
                        className="group/proposal bg-gradient-to-r from-slate-700/20 to-slate-700/10 border border-slate-600/30 rounded-xl p-4 hover:border-slate-500/50 transition-all duration-300 hover:bg-slate-700/30"
                      >
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</p>
                            <p className="text-white font-bold text-lg">{p.amount}</p>
                            <p className="text-xs text-slate-500">STX</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Timelock</p>
                            <p className="text-white font-bold text-lg">{p.timelock || "—"}</p>
                            <p className="text-xs text-slate-500">blocks</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</p>
                            <p className={`text-sm font-bold ${
                              p.executed ? "text-emerald-400" : "text-amber-400"
                            }`}>
                              {p.executed ? "✓ Done" : "⏳ Pending"}
                            </p>
                          </div>
                        </div>
                        {!p.executed && (
                          <button
                            onClick={() => handleExecute(p.id)}
                            className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
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
        </div>

        {/* Status Message Toast */}
        {message && (
          <div className="fixed bottom-6 right-6 max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className={`px-6 py-4 rounded-xl font-medium shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
              message.includes("Error")
                ? "bg-red-900/40 border-red-700/50 text-red-200"
                : message.includes("successfully")
                ? "bg-emerald-900/40 border-emerald-700/50 text-emerald-200"
                : "bg-blue-900/40 border-blue-700/50 text-blue-200"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {message.includes("Error") ? "❌" : message.includes("successfully") ? "✓" : "ℹ"}
                </span>
                {message}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
}
