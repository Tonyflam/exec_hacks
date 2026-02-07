'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useReadContract, useWriteContract } from 'wagmi';
import { encodeFunctionData, parseAbi, keccak256, toBytes, toHex } from 'viem';
import { waitForTransactionReceipt } from '@wagmi/core';
import { PHANTOM_VAULT_ABI, VAULT_ADDRESS } from '@/lib/iexec-config';

// ERC-4337 Types
interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

interface SessionKey {
  key: string;
  expires: number;
  selector: string;
  target: string;
}

interface OnChainPortfolio {
  owner: string;
  protectedDataId: string;
  lastAnalysis: bigint;
  riskScore: bigint;
  autoRebalance: boolean;
  rebalanceThreshold: bigint;
  createdAt: bigint;
}

interface OnChainRiskReport {
  portfolioScore: bigint;
  concentrationRisk: bigint;
  protocolRisk: bigint;
  correlationRisk: bigint;
  liquidityRisk: bigint;
  leverageRatio: bigint;
  timestamp: bigint;
  teeAttestation: string;
}

const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

const PHANTOM_ACCOUNT_ABI_PARSED = parseAbi([
  'function execute(address dest, uint256 value, bytes calldata func) external',
  'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
  'function createSessionKey(address key, uint256 duration, bytes4 selector, address target) external',
  'function getNonce() public view returns (uint256)',
]);

export function useSmartAccount(config?: {
  accountFactoryAddress?: string;
  paymasterAddress?: string;
  vaultAddress?: string;
}) {
  const vaultAddr = config?.vaultAddress || VAULT_ADDRESS;
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read on-chain portfolio data from PhantomVault
  const { data: onChainPortfolio, refetch: refetchPortfolio } = useReadContract({
    address: vaultAddr as `0x${string}`,
    abi: PHANTOM_VAULT_ABI,
    functionName: 'getPortfolio',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!vaultAddr },
  });

  // Read latest risk report from PhantomVault
  const { data: onChainRiskReport, refetch: refetchRiskReport } = useReadContract({
    address: vaultAddr as `0x${string}`,
    abi: PHANTOM_VAULT_ABI,
    functionName: 'getLatestRiskReport',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!vaultAddr },
  });

  // Read total portfolios count
  const { data: totalPortfolios } = useReadContract({
    address: vaultAddr as `0x${string}`,
    abi: PHANTOM_VAULT_ABI,
    functionName: 'totalPortfolios',
    query: { enabled: !!vaultAddr },
  });

  // Read total strategies executed
  const { data: totalStrategiesExecuted } = useReadContract({
    address: vaultAddr as `0x${string}`,
    abi: PHANTOM_VAULT_ABI,
    functionName: 'totalStrategiesExecuted',
    query: { enabled: !!vaultAddr },
  });

  // Read trusted iApp address
  const { data: trustedIApp } = useReadContract({
    address: vaultAddr as `0x${string}`,
    abi: PHANTOM_VAULT_ABI,
    functionName: 'trustedIApp',
    query: { enabled: !!vaultAddr },
  });

  // Get or predict smart account address
  useEffect(() => {
    if (address && config?.accountFactoryAddress) {
      // In a full deployment, call factory.getAddress(owner, salt)
      // For now, derive deterministically from the owner address
      const hash = keccak256(toBytes(address));
      setSmartAccountAddress(`0x${hash.slice(2, 42)}`);
    }
  }, [address, config?.accountFactoryAddress]);

  /**
   * Create portfolio on-chain via PhantomVault contract
   */
  const createPortfolio = useCallback(async (
    protectedDataId: string,
    autoRebalance: boolean = false,
    rebalanceThreshold: number = 500 // 5% in basis points
  ): Promise<string | null> => {
    if (!walletClient || !vaultAddr) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: vaultAddr as `0x${string}`,
        abi: PHANTOM_VAULT_ABI,
        functionName: 'createPortfolio',
        args: [
          protectedDataId as `0x${string}`,
          autoRebalance,
          BigInt(rebalanceThreshold),
        ],
      });

      // Wait for confirmation
      if (publicClient) {
        await waitForTransactionReceipt(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { getClient: () => publicClient } as any,
          { hash }
        );
      }

      await refetchPortfolio();
      return hash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create portfolio';
      setError(message);
      console.error('createPortfolio error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, vaultAddr, writeContractAsync, publicClient, refetchPortfolio]);

  /**
   * Submit strategy to PhantomVault on-chain
   */
  const submitStrategy = useCallback(async (
    targetAssets: string[],
    allocations: bigint[],
    teeSignature: string,
    validityPeriod: number = 3600 // 1 hour
  ): Promise<string | null> => {
    if (!walletClient || !vaultAddr) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: vaultAddr as `0x${string}`,
        abi: PHANTOM_VAULT_ABI,
        functionName: 'submitStrategy',
        args: [
          targetAssets as `0x${string}`[],
          allocations,
          teeSignature as `0x${string}`,
          BigInt(validityPeriod),
        ],
      });

      return hash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit strategy';
      setError(message);
      console.error('submitStrategy error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, vaultAddr, writeContractAsync]);

  /**
   * Execute a previously submitted strategy
   */
  const executeStrategy = useCallback(async (
    strategyHash: string
  ): Promise<string | null> => {
    if (!walletClient || !vaultAddr) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: vaultAddr as `0x${string}`,
        abi: PHANTOM_VAULT_ABI,
        functionName: 'executeStrategy',
        args: [strategyHash as `0x${string}`],
      });

      return hash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute strategy';
      setError(message);
      console.error('executeStrategy error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, vaultAddr, writeContractAsync]);

  // Create a session key for automated operations
  const createSessionKey = useCallback(async (
    duration: number = 86400,
    selector: string = '0x00000000',
    target?: string
  ): Promise<SessionKey | null> => {
    if (!walletClient || !smartAccountAddress) {
      setError('Wallet or smart account not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate ephemeral key address
      const sessionKeyAddress = `0x${keccak256(toBytes(`session-${Date.now()}-${Math.random()}`)).slice(2, 42)}`;

      // In full AA deployment: create session key on-chain via SmartAccount contract
      // For now, register locally and demonstrate the flow
      const newKey: SessionKey = {
        key: sessionKeyAddress,
        expires: Date.now() + duration * 1000,
        selector,
        target: target || vaultAddr || '',
      };

      setSessionKeys(prev => [...prev, newKey]);
      return newKey;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session key';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, smartAccountAddress, vaultAddr]);

  // Check if user has an active session key
  const hasActiveSessionKey = useCallback((selector?: string): boolean => {
    const now = Date.now();
    return sessionKeys.some(
      key => key.expires > now && (!selector || key.selector === selector)
    );
  }, [sessionKeys]);

  // Get gas estimation
  const estimateGas = useCallback(async (
    callData: `0x${string}`
  ): Promise<{ total: bigint; sponsored: boolean }> => {
    if (publicClient && vaultAddr) {
      try {
        const gasEstimate = await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: vaultAddr as `0x${string}`,
          data: callData,
        });
        return {
          total: gasEstimate,
          sponsored: !!config?.paymasterAddress,
        };
      } catch {
        // Fallback estimate
      }
    }
    return {
      total: BigInt(450000),
      sponsored: !!config?.paymasterAddress,
    };
  }, [publicClient, address, vaultAddr, config?.paymasterAddress]);

  return {
    // State
    smartAccountAddress,
    sessionKeys,
    isLoading,
    error,

    // On-chain data (real reads from PhantomVault)
    onChainPortfolio: onChainPortfolio as OnChainPortfolio | undefined,
    onChainRiskReport: onChainRiskReport as OnChainRiskReport | undefined,
    totalPortfolios: totalPortfolios as bigint | undefined,
    totalStrategiesExecuted: totalStrategiesExecuted as bigint | undefined,
    trustedIApp: trustedIApp as string | undefined,

    // Contract write actions
    createPortfolio,
    submitStrategy,
    executeStrategy,

    // Session key actions
    createSessionKey,
    hasActiveSessionKey,

    // Utilities
    estimateGas,
    refetchPortfolio,
    refetchRiskReport,

    // Computed
    isDeployed: !!smartAccountAddress,
    hasPaymaster: !!config?.paymasterAddress,
    vaultAddress: vaultAddr,
  };
}

export type { UserOperation, SessionKey, OnChainPortfolio, OnChainRiskReport };
