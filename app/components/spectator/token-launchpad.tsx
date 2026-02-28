"use client"

import { useEffect, useState } from "react"
import { useAgentTokenRegistry, usePersistentAgentToken, useGamePrizePool } from "@/lib/contract-hooks"
import { useWallet } from "@/hooks/wallet"
import { ethers } from "ethers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Coins, Activity, Hexagon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

function AgentTokenCard({ address }: { address: string }) {
  const tokenContract = usePersistentAgentToken(address);
  const prizePoolContract = useGamePrizePool();
  const { accountData, switchToBscTestnet } = useWallet();
  const [stats, setStats] = useState({
    name: "Loading...",
    winRate: "0",
    gamesPlayed: "0",
    rewards: "0",
    balance: "0",
  });
  const [claiming, setClaiming] = useState(false);
  const [gameIdToClaim, setGameIdToClaim] = useState("1");

  useEffect(() => {
    async function loadStats() {
      if (!tokenContract) return;
      try {
        const name = await tokenContract.agentName();
        const winRate = await tokenContract.winRate();
        const gamesPlayed = await tokenContract.gamesPlayed();
        const rewards = await tokenContract.totalRewardsEarned();
        let bal: bigint | number = 0;
        if (accountData?.address) {
          bal = await tokenContract.balanceOf(accountData.address);
        }

        setStats({
          name,
          winRate: winRate.toString(),
          gamesPlayed: gamesPlayed.toString(),
          rewards: ethers.formatEther(rewards),
          balance: ethers.formatEther(bal),
        });
      } catch (e) {
        console.error("Error loading token stats", e);
      }
    }
    loadStats();
  }, [tokenContract, accountData?.address]);

  const handleClaim = async () => {
    if (!prizePoolContract || !accountData?.address) return;
    await switchToBscTestnet();
    setClaiming(true);
    try {
      const gid = parseInt(gameIdToClaim);
      if (isNaN(gid) || gid <= 0) {
        toast.error("Enter a valid Game ID to claim from.");
        return;
      }
      const tx = await prizePoolContract.claimReward(gid, address);
      console.log("Transaction: ", tx);
      await tx.wait();
      toast.success("Rewards claimed successfully!");
    } catch (e: any) {
      console.error(e);
      if (e.code !== "ACTION_REJECTED") {
        toast.error("Claim failed: " + (e.reason || e.message));
      } else {
        toast.info("Transaction cancelled");
      }
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="rounded-md border border-border/50 bg-secondary/30 p-4 shrink-0 w-[280px] h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Hexagon className="size-5 text-primary" />
          <span className="font-mono text-sm font-bold text-foreground">{stats.name}</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
          {stats.winRate}% Win Rate
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-background/40 rounded p-2 flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground"><Activity className="size-3 inline mr-1" />Games</span>
          <span className="text-foreground font-bold">{stats.gamesPlayed}</span>
        </div>
        <div className="bg-background/40 rounded p-2 flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground"><Coins className="size-3 inline mr-1" />Earned</span>
          <span className="text-foreground font-bold">{stats.rewards}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <div className="text-[10px] font-mono text-muted-foreground border border-border/50 rounded p-1.5 flex justify-between items-center bg-background/50">
          <span>Your Tokens:</span>
          <span className="text-primary font-bold">{stats.balance}</span>
        </div>

        <div className="flex gap-2 items-center mt-2">
          <Input
            type="number"
            placeholder="GameId"
            className="h-7 w-16 text-[10px] font-mono"
            value={gameIdToClaim}
            onChange={(e) => setGameIdToClaim(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="flex-1 font-mono text-[10px] border-primary/30 text-primary hover:bg-primary/20 h-7"
            onClick={handleClaim}
            disabled={claiming || !accountData?.address}
          >
            {claiming ? "..." : "Claim Rewards"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TokenLaunchpad() {
  const tokenRegistry = useAgentTokenRegistry();
  const [tokens, setTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTokens() {
      if (!tokenRegistry) return;
      try {
        const allTokens = await tokenRegistry.getAllTokens();
        setTokens(allTokens);
      } catch (e) {
        console.error("Failed to load tokens", e);
      } finally {
        setLoading(false);
      }
    }
    loadTokens();
  }, [tokenRegistry]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background/50">
        <Trophy className="size-3.5 text-primary" />
        <span className="font-mono text-xs font-bold text-foreground tracking-wider uppercase">
          Agent Tokens & Rewards
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {tokens.length} Agent Tokens
        </span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4">
        {loading ? (
          <div className="text-muted-foreground font-mono text-xs animate-pulse mx-auto mt-10">Loading agents...</div>
        ) : tokens.length === 0 ? (
          <div className="text-muted-foreground font-mono text-xs mx-auto mt-10">No agent tokens found</div>
        ) : (
          tokens.map(address => <AgentTokenCard key={address} address={address} />)
        )}
      </div>
    </div>
  )
}
