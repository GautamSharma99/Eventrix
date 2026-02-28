"use client"

import { usePredictionMarket } from "@/lib/contract-hooks"
import { useWallet } from "@/hooks/wallet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Lock, CheckCircle2, XCircle, BarChart3, Coins } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ethers } from "ethers"

interface OnChainMarket {
  id: number;
  gameId: number;
  question: string;
  yesPool: bigint;
  noPool: bigint;
  resolved: boolean;
  outcome: boolean; // true = YES
  userYesBet: bigint;
  userNoBet: bigint;
}

export function PredictionMarkets() {
  const predictionMarketContract = usePredictionMarket();
  const { accountData, switchToBscTestnet } = useWallet();
  const [realMarkets, setRealMarkets] = useState<OnChainMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [txPending, setTxPending] = useState<Record<number, boolean>>({});

  const fetchMarkets = async () => {
    if (!predictionMarketContract) return;

    try {
      const count = await predictionMarketContract.marketCount();
      const countNum = Number(count);

      const marketsData: OnChainMarket[] = [];
      for (let i = Math.max(1, countNum - 20); i <= countNum; i++) {
        const m = await predictionMarketContract.markets(i);
        let userYesBet: bigint | number | string = BigInt(0);
        let userNoBet: bigint | number | string = BigInt(0);

        if (accountData?.address) {
          userYesBet = await predictionMarketContract.yesBets(i, accountData.address);
          userNoBet = await predictionMarketContract.noBets(i, accountData.address);
        }

        marketsData.push({
          id: i,
          gameId: Number(m.gameId),
          question: m.question,
          yesPool: BigInt(m.yesPool),
          noPool: BigInt(m.noPool),
          resolved: m.resolved,
          outcome: m.outcome,
          userYesBet: BigInt(userYesBet),
          userNoBet: BigInt(userNoBet),
        });
      }

      setRealMarkets(marketsData.reverse());
    } catch (e) {
      console.error("Failed to fetch markets", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5000);
    return () => clearInterval(interval);
  }, [predictionMarketContract, accountData?.address]);

  const handleBet = async (marketId: number, isYes: boolean) => {
    if (!predictionMarketContract || !predictionMarketContract.runner) {
      toast.error("Please connect wallet first");
      return;
    }
    await switchToBscTestnet();

    setTxPending(prev => ({ ...prev, [marketId]: true }));
    try {
      const betAmount = ethers.parseEther("0.01"); // Fixed 0.01 BNB bet for now
      const tx = isYes
        ? await predictionMarketContract.betYes(marketId, { value: betAmount })
        : await predictionMarketContract.betNo(marketId, { value: betAmount });

      console.log("Transaction: ", tx);
      await tx.wait();

      toast.success("Bet placed successfully!");
      await fetchMarkets(); // Refresh data immediately
    } catch (e: any) {
      console.error("Bet error:", e);
      if (e.code !== "ACTION_REJECTED") {
        toast.error("Transaction failed: " + (e.reason || e.message));
      } else {
        toast.info("Transaction cancelled");
      }
    } finally {
      setTxPending(prev => ({ ...prev, [marketId]: false }));
    }
  };

  const handleClaim = async (marketId: number) => {
    if (!predictionMarketContract) return;

    setTxPending(prev => ({ ...prev, [marketId]: true }));
    try {
      const tx = await predictionMarketContract.claim(marketId);
      console.log("Claim Transaction: ", tx);
      await tx.wait();

      toast.success("Winnings claimed successfully!");
      await fetchMarkets();
    } catch (e: any) {
      console.error("Claim error:", e);
      if (e.code !== "ACTION_REJECTED") {
        toast.error("Claim failed: " + (e.reason || e.message));
      } else {
        toast.info("Transaction cancelled");
      }
    } finally {
      setTxPending(prev => ({ ...prev, [marketId]: false }));
    }
  };

  const calculateOdds = (yesPool: bigint, noPool: bigint) => {
    const total = yesPool + noPool;
    if (total === BigInt(0)) return { yes: 50, no: 50 };

    // Convert to Number for percentage calculation safely
    const numYes = Number(ethers.formatEther(yesPool));
    const numNo = Number(ethers.formatEther(noPool));
    const numTotal = numYes + numNo;

    const yesOdds = Math.round((numYes / numTotal) * 100);
    return { yes: yesOdds, no: 100 - yesOdds };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
        <BarChart3 className="size-3.5 text-primary" />
        <span className="font-mono text-xs font-bold text-foreground tracking-wider uppercase">
          On-Chain Markets
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {realMarkets.filter(m => !m.resolved).length} open
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-muted-foreground animate-pulse">Loading markets...</p>
        </div>
      ) : realMarkets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-8 opacity-30" />
            <p className="font-mono text-xs">No markets created yet</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {realMarkets.map((market) => {
              const isOpen = !market.resolved;
              const odds = calculateOdds(market.yesPool, market.noPool);

              const hasBet = market.userYesBet > BigInt(0) || market.userNoBet > BigInt(0);
              const hasWon = market.resolved && (
                (market.outcome && market.userYesBet > BigInt(0)) ||
                (!market.outcome && market.userNoBet > BigInt(0))
              );

              return (
                <div
                  key={market.id}
                  className={`rounded-lg border p-3.5 transition-all ${isOpen ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                    }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <p className="text-xs font-semibold text-foreground leading-snug flex-1">
                      {market.question}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono shrink-0 ${isOpen ? "text-primary border-primary/30" : "text-muted-foreground"
                        }`}
                    >
                      {isOpen ? (
                        <><TrendingUp className="size-2.5 mr-0.5" /> OPEN</>
                      ) : (
                        <><CheckCircle2 className="size-2.5 mr-0.5" /> RESOLVED</>
                      )}
                    </Badge>
                  </div>

                  {/* Odds bar */}
                  <div className="mb-2.5">
                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                      <span>YES {odds.yes}%</span>
                      <span>NO {odds.no}%</span>
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-muted-foreground mb-1 opacity-60">
                      <span>Vol: {ethers.formatEther(market.yesPool)} tBNB</span>
                      <span>Vol: {ethers.formatEther(market.noPool)} tBNB</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                      <div
                        className="bg-primary transition-all duration-500 rounded-l-full"
                        style={{ width: `${odds.yes}%` }}
                      />
                      <div
                        className="bg-destructive transition-all duration-500 rounded-r-full"
                        style={{ width: `${odds.no}%` }}
                      />
                    </div>
                  </div>

                  {/* User Bets */}
                  {hasBet && (
                    <div className="mb-3 flex justify-between rounded bg-background/50 px-2 py-1 text-[10px] font-mono text-muted-foreground border border-border/50">
                      <span className="flex items-center gap-1">
                        <Coins className="size-2.5" /> Your Bets:
                      </span>
                      <span className="text-foreground">
                        {market.userYesBet > BigInt(0) && `YES: ${ethers.formatEther(market.userYesBet)} BNB `}
                        {market.userNoBet > BigInt(0) && `NO: ${ethers.formatEther(market.userNoBet)} BNB`}
                      </span>
                    </div>
                  )}

                  {/* Resolved & Claiming */}
                  {market.resolved && (
                    <div className="flex flex-col gap-1.5">
                      <div
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold font-mono ${market.outcome
                          ? "bg-primary/20 text-primary"
                          : "bg-destructive/20 text-destructive"
                          }`}
                      >
                        {market.outcome ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        Outcome: {market.outcome ? "YES" : "NO"}
                      </div>

                      {hasWon && (
                        <Button
                          size="sm"
                          className="w-full bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30 font-mono text-xs h-8 mt-1"
                          onClick={() => handleClaim(market.id)}
                          disabled={txPending[market.id]}
                        >
                          {txPending[market.id] ? "Claiming..." : "Claim Winnings!"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {isOpen && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-mono text-[10px] h-7"
                          onClick={() => handleBet(market.id, true)}
                          disabled={txPending[market.id] || !accountData?.address}
                        >
                          {txPending[market.id] ? "..." : "BET YES (0.01)"}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 font-mono text-[10px] h-7"
                          onClick={() => handleBet(market.id, false)}
                          disabled={txPending[market.id] || !accountData?.address}
                        >
                          {txPending[market.id] ? "..." : "BET NO (0.01)"}
                        </Button>
                      </div>
                      {!accountData?.address && (
                        <div className="text-center text-[9px] text-muted-foreground font-mono mt-1">
                          Connect wallet to bet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
