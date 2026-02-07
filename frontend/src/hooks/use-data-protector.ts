'use client';

import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { IExecDataProtectorCore } from '@iexec/dataprotector';

/**
 * React hook for iExec DataProtector SDK integration.
 * Uses dynamic imports to avoid Next.js SSR/prerender crashes
 * (the SDK pulls in Node.js modules like ipfs-utils that break during static generation).
 */
export function useDataProtector() {
  const { isConnected, connector } = useAccount();
  const chainId = useChainId();
  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [iexec, setIexec] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (isConnected && connector) {
        setIsInitializing(true);
        try {
          const provider =
            (await connector.getProvider()) as import('ethers').Eip1193Provider;

          // Dynamic import to avoid SSR/prerender issues with Node.js modules
          const { IExecDataProtector } = await import('@iexec/dataprotector');
          const dataProtector = new IExecDataProtector(provider);
          setDataProtectorCore(dataProtector.core);

          // Also init raw iExec SDK for low-level operations (balance checks, dataset lookup)
          const { IExec } = await import('iexec');
          setIexec(new IExec({ ethProvider: provider }));
        } catch (error) {
          console.error('Failed to initialize DataProtector:', error);
        } finally {
          setIsInitializing(false);
        }
      } else {
        setDataProtectorCore(null);
        setIexec(null);
      }
    };

    init();
    // Re-init when chain changes so the internal ethers provider has the correct network
  }, [isConnected, connector, chainId]);

  return { dataProtectorCore, iexec, isInitializing };
}
