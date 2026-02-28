"use client"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect
} from "react";
import { ethers } from "ethers";

interface AccountType {
  address?: string;
  balance?: string;
  chainId?: string;
  network?: string;
}

declare global {
  interface Window {
    ethereum: any;
  }
}

interface WalletContextType {
  accountData: AccountType;
  connectWallet: () => Promise<void>;
  switchToBscTestnet: () => Promise<void>;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export const WalletContext = createContext<WalletContextType>({
  accountData: {},
  connectWallet: async () => { },
  switchToBscTestnet: async () => { },
  provider: null,
  signer: null,
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountData, setAccountData] = useState<AccountType>({});
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  console.log("Account Data: ", accountData);

  const switchToBscTestnet = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // 97 in hex
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x61',
                chainName: 'Binance Smart Chain Testnet',
                nativeCurrency: {
                  name: 'tBNB',
                  symbol: 'tBNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-testnet-dataseed.bnbchain.org'],
                blockExplorerUrls: ['https://testnet.bscscan.com'],
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding BSC Testnet", addError);
        }
      } else {
        console.error("Error switching to BSC Testnet", switchError);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    try {
      // Direct connection request (wallet_requestPermissions can sometimes fail with {} if already pending)
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        console.log("No authorized accounts found");
        return;
      }

      await switchToBscTestnet();

      const address = accounts[0];
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await browserProvider.getSigner();
      const balance = await browserProvider.getBalance(address);
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(ethersSigner);

      setAccountData({
        address,
        balance: ethers.formatEther(balance),
        chainId: network.chainId.toString(),
        network: network.name,
      });

      console.log("Connected to MetaMask:", address);
    } catch (error: any) {
      console.error("Error connecting to MetaMask:", error?.message || error);
    }
  }, [switchToBscTestnet]);

  // Optionally, listen to chain and account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccountData({});
          setProvider(null);
          setSigner(null);
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [connectWallet]);

  return (
    <WalletContext.Provider value={{ accountData, connectWallet, switchToBscTestnet, provider, signer }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};