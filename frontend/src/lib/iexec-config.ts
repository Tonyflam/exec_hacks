/**
 * iExec configuration constants for PHANTOM
 * These addresses are on the iExec Bellecour sidechain / Arbitrum Sepolia
 */

// DataProtector smart contract address (Arbitrum Sepolia)
export const DATAPROTECTOR_ADDRESS =
  process.env.NEXT_PUBLIC_DATAPROTECTOR_ADDRESS ||
  '0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6483';

// Trusted workerpool for TEE execution
export const WORKERPOOL_ADDRESS =
  process.env.NEXT_PUBLIC_WORKERPOOL_ADDRESS ||
  '0x2C06263943180Cc024dAFfeEe15612DB6e5fD248';

// PHANTOM iApp address (deployed TEE application)
export const IAPP_ADDRESS =
  process.env.NEXT_PUBLIC_IAPP_ADDRESS || '';

// PHANTOM Vault contract on Arbitrum Sepolia
export const VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
  '0xe50Ac1B9996533e158b5fE4C6955222Ff6327D07';

// Arbitrum Sepolia RPC
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://sepolia-rollup.arbitrum.io/rpc';

// iExec Explorer URL helper
export const getExplorerUrl = (address: string, type: 'dataset' | 'app' | 'deal' = 'dataset') => {
  return `https://explorer.iex.ec/bellecour/${type}/${address}`;
};

// Arbiscan URL helper
export const getArbiscanUrl = (addressOrTx: string, type: 'address' | 'tx' = 'address') => {
  return `https://sepolia.arbiscan.io/${type}/${addressOrTx}`;
};

// PhantomVault ABI (read functions for frontend)
export const PHANTOM_VAULT_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getPortfolio',
    outputs: [
      {
        components: [
          { name: 'owner', type: 'address' },
          { name: 'protectedDataId', type: 'bytes32' },
          { name: 'lastAnalysis', type: 'uint256' },
          { name: 'riskScore', type: 'uint256' },
          { name: 'autoRebalance', type: 'bool' },
          { name: 'rebalanceThreshold', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getLatestRiskReport',
    outputs: [
      {
        components: [
          { name: 'portfolioScore', type: 'uint256' },
          { name: 'concentrationRisk', type: 'uint256' },
          { name: 'protocolRisk', type: 'uint256' },
          { name: 'correlationRisk', type: 'uint256' },
          { name: 'liquidityRisk', type: 'uint256' },
          { name: 'leverageRatio', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'teeAttestation', type: 'bytes' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getRiskHistory',
    outputs: [
      {
        components: [
          { name: 'portfolioScore', type: 'uint256' },
          { name: 'concentrationRisk', type: 'uint256' },
          { name: 'protocolRisk', type: 'uint256' },
          { name: 'correlationRisk', type: 'uint256' },
          { name: 'liquidityRisk', type: 'uint256' },
          { name: 'leverageRatio', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'teeAttestation', type: 'bytes' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPortfolios',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStrategiesExecuted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'strategyHash', type: 'bytes32' }],
    name: 'isStrategyValid',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'trustedIApp',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'trustedWorkerpool',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'protectedDataId', type: 'bytes32' },
      { name: 'autoRebalance', type: 'bool' },
      { name: 'rebalanceThreshold', type: 'uint256' },
    ],
    name: 'createPortfolio',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'newProtectedDataId', type: 'bytes32' },
      { name: 'autoRebalance', type: 'bool' },
      { name: 'rebalanceThreshold', type: 'uint256' },
    ],
    name: 'updatePortfolio',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'targetAssets', type: 'address[]' },
      { name: 'allocations', type: 'uint256[]' },
      { name: 'teeSignature', type: 'bytes' },
      { name: 'validityPeriod', type: 'uint256' },
    ],
    name: 'submitStrategy',
    outputs: [{ name: 'strategyHash', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'strategyHash', type: 'bytes32' }],
    name: 'executeStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
