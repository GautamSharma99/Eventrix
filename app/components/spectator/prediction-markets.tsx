"use client"

import { usePredictionMarket } from "@/lib/contract-hooks"
import { useWallet } from "@/hooks/wallet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Lock, CheckCircle2, XCircle, BarChart3, Coins, Sparkles } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useGameStore } from "@/hooks/use-game-store"
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

  // AI Suggestions
  const { feed } = useGameStore()
  const [questions, setQuestions] = useState<string[]>([])
  const lastRequestRef = useRef(0);
  const [aiPending, setAiPending] = useState<Record<number, string>>({});  // index -> "yes"|"no"

  console.log("Feed: ", feed)

  // Poll for AI suggestions whenever the feed updates
  useEffect(() => {
    if (!feed || feed.length < 3) return;

    const now = Date.now();
    if (now - lastRequestRef.current < 8000) return;

    lastRequestRef.current = now;
    const logs = feed
      .slice(0, 8)
      .map(e => `${e.type}: ${e.message}`)
      .join("\n")

    console.log("Logs: ", logs)

    fetch("/api/ai-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs })
    })
      .then(r => r.json())
      .then(d => {
        if (d?.questions) setQuestions(d.questions)
      })
      .catch(() => { })
  }, [feed])
  console.log("Questions: ", questions)
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

  // Handle betting on an AI-suggested question
  const handleAISuggestionBet = async (questionIndex: number, isYes: boolean) => {
    const question = questions[questionIndex];
    if (!question) return;

    if (!predictionMarketContract || !predictionMarketContract.runner) {
      toast.error("Please connect wallet first");
      return;
    }

    await switchToBscTestnet();

    setAiPending(prev => ({ ...prev, [questionIndex]: isYes ? "yes" : "no" }));

    try {
      // Step 1: Create market on-chain via server API (owner-only)
      toast.info("Creating market on-chain...");
      const res = await fetch("/api/create-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, gameId: 1 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create market");
      }

      const { marketId, txHash } = await res.json();
      console.log(`Market #${marketId} created on-chain: ${txHash}`);

      // Step 2: Place bet via user's wallet
      toast.info(`Market created! Placing ${isYes ? "YES" : "NO"} bet...`);
      const betAmount = ethers.parseEther("0.01");
      const tx = isYes
        ? await predictionMarketContract.betYes(marketId, { value: betAmount })
        : await predictionMarketContract.betNo(marketId, { value: betAmount });

      await tx.wait();
      toast.success(`Bet placed on "${question.slice(0, 40)}..." ✓`);

      // Remove the question from suggestions since it's now an on-chain market
      setQuestions(prev => prev.filter((_, i) => i !== questionIndex));

      // Refresh on-chain markets list
      await fetchMarkets();
    } catch (e: any) {
      console.error("AI suggestion bet error:", e);
      if (e.code !== "ACTION_REJECTED") {
        toast.error("Transaction failed: " + (e.reason || e.message));
      } else {
        toast.info("Transaction cancelled");
      }
    } finally {
      setAiPending(prev => {
        const next = { ...prev };
        delete next[questionIndex];
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-[#0d0d15]">
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

      {/* AI Suggestions Section — always visible when questions exist */}
      {questions.length > 0 && (
        <div className="border-t border-border/50 pt-5 px-4 pb-6 bg-[#0d0d15]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
              AI Dynamic Suggestions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-primary/20 bg-background/50 p-4 flex flex-col gap-3 shadow-sm hover:border-primary/40 transition-colors">
                <p className="text-xs font-semibold leading-relaxed text-foreground/90 italic">
                  {`"${q}"`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-mono text-[10px] h-8 bg-green-500/5 text-green-500 border-green-500/30 hover:bg-green-500/20"
                    onClick={() => handleAISuggestionBet(i, true)}
                    disabled={!!aiPending[i] || !accountData?.address}
                  >
                    {aiPending[i] === "yes" ? "Creating..." : "YES (0.01 BNB)"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-mono text-[10px] h-8 bg-red-500/5 text-red-500 border-red-500/30 hover:bg-red-500/20"
                    onClick={() => handleAISuggestionBet(i, false)}
                    disabled={!!aiPending[i] || !accountData?.address}
                  >
                    {aiPending[i] === "no" ? "Creating..." : "NO (0.01 BNB)"}
                  </Button>
                </div>
                {!accountData?.address && (
                  <p className="text-[9px] text-muted-foreground font-mono text-center">
                    Connect wallet to bet
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground font-mono mt-4 text-center opacity-60">
            These questions are generated in real-time by the AI observer based on game events.
          </p>
        </div>
      )}
    </div>
  )
}