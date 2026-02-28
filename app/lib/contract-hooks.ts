"use client";

import { useMemo } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/wallet";

// Import ABIs
import {
  GameRegistryABI,
  PredictionMarketABI,
  GamePrizePoolABI,
  AgentRegistryABI,
  AgentTokenRegistryABI,
  PersistentAgentTokenABI,
} from "./abis";

import { CONTRACT_ADDRESSES } from "./contracts";

export const useContract = (address: string, abi: any) => {
  const { provider, signer } = useWallet();

  return useMemo(() => {
    if (!address) return null;
    
    if (signer) {
      return new ethers.Contract(address, abi, signer);
    } else if (provider) {
      return new ethers.Contract(address, abi, provider);
    } else {
      // Fallback to read-only provider
      const rpcUrl = process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://bsc-testnet-dataseed.bnbchain.org";
      const fallbackProvider = new ethers.JsonRpcProvider(rpcUrl, 97);
      return new ethers.Contract(address, abi, fallbackProvider);
    }
  }, [address, abi, provider, signer]);
};

export const useGameRegistry = () => useContract(CONTRACT_ADDRESSES.gameRegistry, GameRegistryABI);
export const usePredictionMarket = () => useContract(CONTRACT_ADDRESSES.predictionMarket, PredictionMarketABI);
export const useGamePrizePool = () => useContract(CONTRACT_ADDRESSES.gamePrizePool, GamePrizePoolABI);
export const useAgentRegistry = () => useContract(CONTRACT_ADDRESSES.agentRegistry, AgentRegistryABI);
export const useAgentTokenRegistry = () => useContract(CONTRACT_ADDRESSES.agentTokenRegistry, AgentTokenRegistryABI);
export const usePersistentAgentToken = (address: string) => useContract(address, PersistentAgentTokenABI);
