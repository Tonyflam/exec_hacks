'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { encodeFunctionData, parseAbi } from 'viem';

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

const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

const PHANTOM_ACCOUNT_ABI = parseAbi([
  'function execute(address dest, uint256 value, bytes calldata func) external',
  'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
  'function createSessionKey(address key, uint256 duration, bytes4 selector, address target) external',
  'function getNonce() public view returns (uint256)',
]);

const PHANTOM_VAULT_ABI = parseAbi([
  'function submitStrategy(bytes32 portfolioId, uint256 riskScore, bytes calldata strategy, bytes calldata teeSignature) external',
  'function executeStrategy(bytes32 portfolioId) external',
]);

export function useSmartAccount(config?: {
  accountFactoryAddress?: string;
  paymasterAddress?: string;
  vaultAddress?: string;
}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get or predict smart account address
  useEffect(() => {
    if (address && config?.accountFactoryAddress) {
      // In production: call factory.getAddress(owner, salt)
      // For demo, derive deterministically
      setSmartAccountAddress(
        `0x${address.slice(2, 10)}${'0'.repeat(24)}${address.slice(-8)}`
      );
    }
  }, [address, config?.accountFactoryAddress]);

  // Create a session key for automated operations
  const createSessionKey = useCallback(async (
    duration: number = 86400, // 24 hours default
    selector: string = '0x00000000', // function selector
    target?: string
  ): Promise<SessionKey | null> => {
    if (!walletClient || !smartAccountAddress) {
      setError('Wallet or smart account not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate ephemeral key
      const sessionKeyAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
      
      // In production: actually create session key on-chain
      // const calldata = encodeFunctionData({
      //   abi: PHANTOM_ACCOUNT_ABI,
      //   functionName: 'createSessionKey',
      //   args: [sessionKeyAddress, BigInt(duration), selector, target || config?.vaultAddress]
      // });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newKey: SessionKey = {
        key: sessionKeyAddress,
        expires: Date.now() + duration * 1000,
        selector,
        target: target || config?.vaultAddress || '',
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
  }, [walletClient, smartAccountAddress, config?.vaultAddress]);

  // Execute strategy through smart account with paymaster
  const executeStrategy = useCallback(async (
    portfolioId: string,
    riskScore: number,
    strategyData: string,
    teeSignature: string
  ): Promise<string | null> => {
    if (!walletClient || !smartAccountAddress || !config?.vaultAddress) {
      setError('Configuration incomplete');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build UserOperation
      const callData = encodeFunctionData({
        abi: PHANTOM_VAULT_ABI,
        functionName: 'submitStrategy',
        args: [
          portfolioId as `0x${string}`,
          BigInt(riskScore),
          strategyData as `0x${string}`,
          teeSignature as `0x${string}`,
        ],
      });

      // In production: build full UserOp and submit to bundler
      // const userOp: UserOperation = {
      //   sender: smartAccountAddress,
      //   nonce: await getNonce(),
      //   initCode: '0x',
      //   callData: encodeFunctionData({
      //     abi: PHANTOM_ACCOUNT_ABI,
      //     functionName: 'execute',
      //     args: [config.vaultAddress, 0n, callData]
      //   }),
      //   callGasLimit: 500000n,
      //   verificationGasLimit: 150000n,
      //   preVerificationGas: 50000n,
      //   maxFeePerGas: parseGwei('1'),
      //   maxPriorityFeePerGas: parseGwei('0.1'),
      //   paymasterAndData: config.paymasterAddress + '...',
      //   signature: '0x'
      // };
      // 
      // const signedOp = await signUserOp(userOp);
      // const txHash = await submitToBundler(signedOp);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66);
      return mockTxHash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute strategy';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, smartAccountAddress, config?.vaultAddress]);

  // Execute batch operations
  const executeBatch = useCallback(async (
    operations: Array<{ target: string; value: bigint; data: `0x${string}` }>
  ): Promise<string | null> => {
    if (!walletClient || !smartAccountAddress) {
      setError('Wallet or smart account not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build batch calldata
      const targets = operations.map(op => op.target);
      const values = operations.map(op => op.value);
      const datas = operations.map(op => op.data);

      // In production: submit as UserOperation through bundler
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66);
      return mockTxHash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute batch';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, smartAccountAddress]);

  // Check if user has an active session key
  const hasActiveSessionKey = useCallback((selector?: string): boolean => {
    const now = Date.now();
    return sessionKeys.some(
      key => key.expires > now && (!selector || key.selector === selector)
    );
  }, [sessionKeys]);

  // Get gas estimation for UserOperation
  const estimateGas = useCallback(async (
    callData: `0x${string}`
  ): Promise<{ total: bigint; sponsored: boolean }> => {
    // In production: call bundler's eth_estimateUserOperationGas
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      total: BigInt(450000),
      sponsored: !!config?.paymasterAddress,
    };
  }, [config?.paymasterAddress]);

  return {
    // State
    smartAccountAddress,
    sessionKeys,
    isLoading,
    error,
    
    // Actions
    createSessionKey,
    executeStrategy,
    executeBatch,
    estimateGas,
    hasActiveSessionKey,
    
    // Computed
    isDeployed: !!smartAccountAddress,
    hasPaymaster: !!config?.paymasterAddress,
  };
}

export type { UserOperation, SessionKey };
