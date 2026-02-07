# PHANTOM Architecture

## System Overview

PHANTOM is a confidential DeFi intelligence engine that uses iExec's Trusted Execution Environment (TEE) to analyze portfolio risk without exposing wallet data. It combines on-chain smart contracts, off-chain TEE computation, and a privacy-first frontend.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHANTOM Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐    │
│  │ Frontend │────▶│ iExec        │────▶│ TEE Enclave      │    │
│  │ Next.js  │     │ DataProtector │     │ (Intel SGX)      │    │
│  │          │◀────│ SDK          │◀────│ Risk Engine      │    │
│  └────┬─────┘     └──────────────┘     └──────────────────┘    │
│       │                                                         │
│       │           ┌──────────────┐     ┌──────────────────┐    │
│       └──────────▶│ PhantomVault │────▶│ Strategy         │    │
│                   │ (Arbitrum    │     │ Execution        │    │
│                   │  Sepolia)    │     │ (ERC-4337)       │    │
│                   └──────────────┘     └──────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Next.js 14)

**Location:** `frontend/`

The frontend provides the user interface for portfolio management, risk analysis, and strategy execution. Built with:

- **Next.js 14** with App Router
- **wagmi v2 + viem** for wallet connection and contract interaction
- **@iexec/dataprotector** SDK for privacy operations (dynamic imports for SSR compatibility)
- **Framer Motion** for animations
- **Radix UI** for accessible components

#### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useDataProtector` | `hooks/use-data-protector.ts` | Initializes iExec DataProtector SDK with dynamic imports |
| `usePhantom` | `hooks/use-phantom.ts` | Core privacy operations: protect data, run analysis, grant access |
| `useSmartAccount` | `hooks/use-smart-account.ts` | PhantomVault contract reads/writes via wagmi |

#### Dynamic Import Pattern

The iExec SDK uses Node.js modules (ipfs-utils, kubo-rpc-client) that crash during Next.js SSR. We solve this with dynamic imports:

```typescript
// ✅ Works with Next.js SSR
const { IExecDataProtector } = await import('@iexec/dataprotector');

// ❌ Crashes during SSR
import { IExecDataProtector } from '@iexec/dataprotector';
```

### 2. Smart Contracts (Solidity 0.8.28)

**Location:** `contracts/`

#### PhantomVault (`contracts/src/PhantomVault.sol`)
- **Deployed:** `0xe50Ac1B9996533e158b5fE4C6955222Ff6327D07` on Arbitrum Sepolia
- Portfolio management (create, update)
- Strategy submission and execution
- TEE signature verification
- Auto-rebalance triggers
- Access control (Ownable, Pausable, ReentrancyGuard)
- Fee management

#### PhantomAccount (`contracts/src/PhantomAccount.sol`)
- ERC-4337 compatible smart account
- Session key management for automated operations
- Signature validation (EIP-1271)

#### PhantomPaymaster (`contracts/src/PhantomPaymaster.sol`)
- Gas sponsorship for user operations
- Whitelist-based access control

#### PhantomAccountFactory (`contracts/src/PhantomAccountFactory.sol`)
- Deterministic smart account deployment via CREATE2
- One account per owner

### 3. iExec iApp (TEE Application)

**Location:** `iapp/`

The iApp runs inside Intel SGX enclaves on the iExec network:

```
┌─────────────────────────────────────────┐
│           TEE Enclave (Intel SGX)        │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ app.js (Entry Point)            │    │
│  │  • Reads protected data         │    │
│  │  • Decrypts wallet addresses    │    │
│  │  • Orchestrates analysis        │    │
│  └─────────┬───────────────────────┘    │
│             │                            │
│  ┌──────────▼──────────────────────┐    │
│  │ riskEngine.js                   │    │
│  │  • Multi-factor risk scoring    │    │
│  │  • Concentration analysis       │    │
│  │  • Protocol risk assessment     │    │
│  │  • Correlation detection        │    │
│  │  • Liquidity scoring            │    │
│  │  • Leverage analysis            │    │
│  └─────────┬───────────────────────┘    │
│             │                            │
│  ┌──────────▼──────────────────────┐    │
│  │ strategyGenerator.js            │    │
│  │  • Rebalancing strategies       │    │
│  │  • Hedging recommendations      │    │
│  │  • Risk-adjusted optimization   │    │
│  └──────────────────────────────────┘    │
│                                          │
└─────────────────────────────────────────┘
```

## Data Flow

### Portfolio Analysis Flow

```
1. User connects wallet
       │
2. Frontend calls DataProtector.protectData()
       │  ← Wallet addresses encrypted as NFT on iExec
       │
3. Frontend calls DataProtector.processProtectedData()
       │  ← Submits computation task to iExec workerpool
       │
4. TEE enclave receives protected data
       │  ← Decrypted only inside SGX enclave
       │
5. Risk Engine analyzes portfolio
       │  ← Multi-factor scoring algorithm
       │
6. Strategy Generator creates recommendations
       │  ← Risk-adjusted rebalancing
       │
7. Results returned (encrypted)
       │  ← Only the user can decrypt results
       │
8. Frontend displays analysis
       │
9. User submits strategy to PhantomVault
       │  ← On-chain record with TEE attestation
       │
10. Strategy executed via ERC-4337
        ← Gasless, MEV-protected execution
```

### Privacy Guarantees

| Stage | Data | Protection |
|-------|------|------------|
| Input | Wallet addresses | Encrypted via DataProtector (AES-256) |
| Transit | Protected data ID | On-chain NFT reference only |
| Computation | Portfolio analysis | Inside TEE enclave (Intel SGX) |
| Output | Risk scores | Encrypted, user-decryptable only |
| Storage | Strategy hash | On-chain hash, not raw data |

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14, TypeScript | UI/UX |
| Styling | Tailwind CSS, Radix UI | Design system |
| Wallet | wagmi v2, viem, RainbowKit | Web3 connectivity |
| Privacy | @iexec/dataprotector | Confidential computing |
| Contracts | Solidity 0.8.28, OpenZeppelin v5 | On-chain logic |
| AA | ERC-4337 | Account abstraction |
| Testing | Foundry (forge) | Smart contract tests |
| TEE | Intel SGX via iExec | Trusted execution |
| Network | Arbitrum Sepolia | L2 deployment |

## Key Design Decisions

### 1. Dynamic SDK Imports
iExec SDK relies on Node.js-specific modules. We use dynamic `import()` to lazily load the SDK only on the client side, preventing SSR crashes.

### 2. Graceful TEE Fallback
When the iApp is not deployed or the TEE workerpool is unavailable, the frontend falls back to a local risk engine that still queries real SDK state (protected data verification) while computing risk scores locally.

### 3. On-Chain Strategy Verification
All strategies are submitted to PhantomVault with TEE attestation signatures. This creates an immutable audit trail of privacy-preserving portfolio management.

### 4. ERC-4337 Account Abstraction
Users can execute strategies gaslessly through PhantomPaymaster. Session keys enable automated rebalancing without requiring manual signature approval for each transaction.

## Testing

### Smart Contracts
```bash
cd contracts
forge test -v
```
34 tests covering:
- Portfolio CRUD operations
- Strategy submission and execution
- Access control and permissions
- Edge cases (expiry, reentrancy, pausing)
- Fuzz tests for parameter boundaries
- Integration tests (full workflow)

### Frontend
```bash
cd frontend
npm run build
```

## Deployment

### Contracts
- **PhantomVault**: `0xe50Ac1B9996533e158b5fE4C6955222Ff6327D07` (Arbitrum Sepolia)
- **Verification**: [Arbiscan](https://sepolia.arbiscan.io/address/0xe50Ac1B9996533e158b5fE4C6955222Ff6327D07)

### Frontend
- **Platform**: Vercel
- **URL**: Configured via Vercel deployment

### iExec iApp
- **Status**: Ready for sconification and deployment
- **Workerpool**: iExec production workerpool (TEE-enabled)
