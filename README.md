# StackSafe — Passkey-Secured Smart Contract Wallet

A next-generation Bitcoin L2 wallet combining the security of passkeys (WebAuthn) with multi-factor spending rules on the Stacks blockchain using Clarity 4.

## 🎯 Overview

StackSafe enables users to:
- **Register passkeys** via WebAuthn for passwordless login
- **Verify authentication** on-chain using secp256r1 cryptography
- **Enforce spending rules**:
  - Daily spending limits per user
  - 2-step approval workflows for larger transactions
  - Timelocks using block height for time-delayed execution
- **Safely call contracts** using `restrict-assets?` patterns

The project combines a **Clarity 4 smart contract** (verified on Stacks testnet/mainnet) with a **Next.js + TypeScript frontend** using `@stacks/connect` and `@stacks/transactions`.

## 📚 Learning Resources

Before diving in, familiarize yourself with:

- **Stacks Docs**: https://docs.stacks.co/
- **Clarity Functions Reference**: https://docs.stacks.co/reference/clarity/functions
- **Key Functions Used**:
  - `secp256r1-verify`: https://docs.stacks.co/reference/clarity/functions#secp256r1-verify
  - `restrict-assets?`: https://docs.stacks.co/reference/clarity/functions#restrict-assets
  - `to-ascii?`: https://docs.stacks.co/reference/clarity/functions#to-ascii
  - `stacks-block-time`: https://docs.stacks.co/reference/clarity/keywords#stacks-block-time

- **Stacks.js**: https://github.com/hirosystems/stacks.js
- **@stacks/connect**: https://github.com/hirosystems/connect
- **Clarinet (local dev)**: https://github.com/hirosystems/clarinet

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and **npm**
- **Clarinet** CLI for Clarity contract development
  ```bash
  cargo install clarinet
  ```
- **macOS/Linux** (Clarinet support)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sambitsargam/StackSafe.git
   cd StackSafe
   ```

2. **Install Clarity contract dependencies** (Clarinet auto-manages):
   ```bash
   clarinet install
   ```

3. **Install and test the smart contract**:
   ```bash
   clarinet test
   ```
   
   This runs all tests in `tests/stacksafe-test.clar` and validates the contract logic.

4. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   
   Navigate to `http://localhost:3000` in your browser.

## 🔧 Configuration

### @stacks/connect Setup (Testnet)

The frontend uses `@stacks/connect` to integrate with Hiro Wallet or Xverse. Update `frontend/lib/stacks.ts` with your testnet config:

```typescript
const network = new StacksTestnet();

export const defaultCreateOptions = {
  onClose: () => {
    console.log("Wallet closed");
  },
  onFinish: (data: FinishedTxData) => {
    console.log("Transaction finished:", data);
  },
};
```

**Network options**:
- `StacksTestnet()` — Stacks testnet (recommended for development)
- `StacksMainnet()` — Bitcoin mainnet (production)

After deploying your contract to testnet, update `frontend/lib/stacks.ts` with:
- Contract address (from `clarinet deployments`)
- Contract name: `stacksafe`
- Principal: Your deployed address

### Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_STACKS_API=https://api.testnet.hiro.so
NEXT_PUBLIC_CONTRACT_ADDRESS=ST1PQHQV0W8CRUMB6QVQ0GKWC54BB2XDC13Q6X69H.stacksafe
```

## 📁 Project Structure

```
StackSafe/
├── README.md                          # This file
├── clarinet.json                      # Clarinet project config
├── contracts/
│   └── stacksafe.clar                 # Clarity 4 smart contract
├── tests/
│   └── stacksafe-test.clar            # Clarinet unit tests
└── frontend/
    ├── package.json                   # Next.js dependencies
    ├── next.config.js                 # Next.js configuration
    ├── tsconfig.json                  # TypeScript config
    ├── pages/
    │   ├── index.tsx                  # Dashboard (balances, approvals)
    │   ├── register.tsx               # Passkey registration flow
    │   └── _app.tsx                   # Next.js app wrapper
    ├── components/
    │   └── ConnectButton.tsx          # Wallet connection UI
    └── lib/
        ├── stacks.ts                  # Contract interaction helpers
        └── webauthn.ts                # WebAuthn challenge/verification
```

## 🏗️ Architecture

### Smart Contract Flow

```
┌─────────────────────────────────────────────────────┐
│  Frontend: WebAuthn Passkey Challenge (Browser)     │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────┐
│  User Signs Challenge with Passkey (P-256)          │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────┐
│  Frontend: Send to Contract via openContractCall     │
│  - signature bytes                                   │
│  - challenge bytes                                   │
│  - public key                                        │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────┐
│  Contract: secp256r1-verify(pubkey, sig, challenge) │
│  ✓ Signature valid? → Authenticate user             │
│  ✗ Invalid sig? → Reject                            │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────┐
│  Contract: propose-spend / approve-spend / execute  │
│  - Check daily limit                                │
│  - Check approval requirements                      │
│  - Verify timelock passed (block height)            │
└─────────────────────────────────────────────────────┘
```

### Spending Rules

| Scenario | Behavior |
|----------|----------|
| Amount < daily limit | Immediate execution (if no approval rules) |
| Amount ≥ daily limit | Requires `approve-spend` before `execute` |
| Timelock set | Must wait until block height ≥ timelock block |
| Multiple approvals | Each approval in list must call `approve-spend` |

## 💻 Development Commands

| Command | Purpose |
|---------|---------|
| `clarinet test` | Run all Clarity unit tests |
| `clarinet check` | Validate contract syntax |
| `clarinet deployments generate` | Generate testnet deployment descriptor |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build Next.js for production |
| `npm run lint` | Run ESLint on frontend code |

## 🔐 Security Considerations

1. **Passkey Binding**: Passkeys are stored client-side in device secure enclave; only the public key is sent to the contract.
2. **secp256r1 Verification**: All on-chain signature verification uses Clarity's built-in `secp256r1-verify` function.
3. **Timelock Enforcement**: Spend proposals are locked by block height, preventing instantaneous execution.
4. **Daily Limits**: Enforced at contract level; limits reset per user.
5. **restrict-assets?**: Optional safeguard for contract calls to prevent unauthorized asset transfers.

## 🧪 Testing

### Run Smart Contract Tests

```bash
clarinet test
```

Expected output:
- ✓ `test-register-passkey`: Passkey registration succeeds
- ✓ `test-authenticate-challenge`: secp256r1-verify validates signature
- ✓ `test-propose-spend-under-limit`: Spend under daily limit proposed
- ✓ `test-propose-spend-over-limit`: Spend over limit rejects
- ✓ `test-two-step-approval`: Approval flow works end-to-end
- ✓ `test-timelock-enforcement`: Execution blocked before block height

### Run Frontend Tests (if added)

```bash
npm run test
```

## 📝 Example Workflows

### 1. Register a Passkey

```typescript
// frontend/pages/register.tsx
const handleRegister = async () => {
  // Generate WebAuthn challenge
  const challenge = generateChallenge();
  
  // User enrolls with passkey
  const credential = await navigator.credentials.create({...});
  
  // Send public key to contract via openContractCall
  await registerPasskeyOnChain(credential.getPublicKey());
};
```

### 2. Propose and Execute Spend

```typescript
// frontend/pages/index.tsx
const handlePropose = async (to: string, amount: bigint) => {
  // 1. Generate challenge
  const challenge = generateChallenge();
  
  // 2. User signs with passkey
  const signature = await navigator.credentials.get({...});
  
  // 3. Call contract
  await openContractCall({
    contractAddress: "ST1PQHQV0...",
    contractName: "stacksafe",
    functionName: "propose-spend",
    functionArgs: [to, amount, ...],
  });
  
  // 4. Wait for approval (poll read-only function)
  await waitForApproval(proposalId);
  
  // 5. Execute
  await executeSpend(proposalId);
};
```

## 🚀 Deployment to Testnet

1. **Deploy the contract**:
   ```bash
   clarinet deployments generate
   clarinet deployment apply testnet
   ```

2. **Update frontend config** with deployed contract address.

3. **Deploy Next.js frontend**:
   ```bash
   cd frontend
   npm run build
   npm run start
   ```

   Or deploy to **Vercel**:
   ```bash
   vercel --prod
   ```

## 📖 Next Steps

- [ ] Set up Hiro Wallet or Xverse on testnet
- [ ] Run `clarinet test` to verify contract logic
- [ ] Start frontend dev server and test passkey registration
- [ ] Configure Stacks testnet faucet for STX tokens
- [ ] Propose and execute test transactions
- [ ] Monitor on-chain state with Stacks Explorer

## 🤝 Contributing

Pull requests are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a PR with a clear description

## 📄 License

MIT License — See LICENSE file for details.

## ❓ FAQ

**Q: Why secp256r1 instead of ed25519?**  
A: secp256r1 (P-256) is the WebAuthn standard for passkeys on most devices. Clarity's `secp256r1-verify` provides native support.

**Q: Can I use this on Bitcoin mainnet?**  
A: Yes! Stacks settles on Bitcoin L1. Change network to `StacksMainnet()` in production. Always test on testnet first.

**Q: How do I reset daily spending limits?**  
A: Call `set-daily-limit` from an authorized admin wallet. Current implementation uses contract owner.

**Q: What if the user loses their passkey?**  
A: Implement an account recovery flow (multi-sig backup keys, social recovery, etc.). This is left as an extension.

---

**Built with ❤️ using Clarity 4 + Next.js**  
Last updated: December 2025