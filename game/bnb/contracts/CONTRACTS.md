# 📄 SusProtocol — Smart Contract Documentation

> **Network:** BNB Smart Chain Testnet
> **RPC:** `https://bsc-testnet-dataseed.bnbchain.org`
> **Solidity Version:** `^0.8.20`

---

## 📋 Contract Address Index

| Contract | Address |
|---|---|
| `GameRegistry` | `0xA07DdE4d7Cc3d2122aC20F70133520946E588eCE` |
| `PredictionMarket` | `0x6Bf43E463011066fAa65cFC5499CBc872a6b248E` |
| `GameResolver` | `0x60eaEA0Edde98bf0B5A8C3C2FAc48213444bCCd9` |
| `GamePrizePool` | `0x01555aeb46F240D4437823d10fad21D032323B92` |
| `AgentRegistry` | `0x77BEba0C93E0F93BEa328e79c1C9A7694a5c2615` |
| `AgentTokenRegistry` | `0xdbfc97A6560a360ff02dd5f8F641B2991dB1024d` |
| `PersistentAgentToken` | `0x7603a62D192033ee58842ecDe5b07AE3429617E3` |

---

## 🗺️ System Architecture

```
GameRegistry  ←──────────────────────────────────────────  GameResolver
      ↑  (finishGame)                                            ↓  (resolveMarket)
      │                                                    PredictionMarket
      │
GamePrizePool  ──(receiveRewards)──→  PersistentAgentToken
      ↑
AgentTokenRegistry  ──(creates & manages)──→  PersistentAgentToken

AgentRegistry  (standalone stat tracker)
```

---

## 1. 🏛️ GameRegistry

**Address:** `0xA07DdE4d7Cc3d2122aC20F70133520946E588eCE`
**File:** `src/GameRegistry.sol`

### Purpose
The central on-chain ledger for all games. It registers each game with a unique auto-incrementing ID, a `bytes32` game hash (off-chain identifier), a lifecycle status, and the address of the resolver authorized to advance its state.

### Game Lifecycle

```
CREATED → RUNNING → FINISHED
```

| Status | Description |
|---|---|
| `CREATED` | Game has been registered but not yet started |
| `RUNNING` | Game is actively in progress |
| `FINISHED` | Game has concluded |

### Key Functions

| Function | Access | Description |
|---|---|---|
| `createGame(bytes32 gameHash)` | Anyone | Registers a new game; the caller becomes the `resolver` |
| `startGame(uint256 gameId)` | Resolver only | Transitions game from `CREATED` → `RUNNING` |
| `finishGame(uint256 gameId)` | Resolver only | Transitions game from `RUNNING` → `FINISHED` |

### State Variables

| Variable | Type | Description |
|---|---|---|
| `gameCount` | `uint256` | Total number of games created |
| `games` | `mapping(uint256 => Game)` | Mapping of game ID to Game struct |

---

## 2. 📊 PredictionMarket

**Address:** `0x6Bf43E463011066fAa65cFC5499CBc872a6b248E`
**File:** `src/PredictionMarket.sol`

### Purpose
A fully on-chain binary prediction market (YES / NO). Users bet native BNB on the outcome of a question tied to a specific game. Winners split the entire pooled funds proportionally based on their stake.

### Market Lifecycle

```
Created → Accepting Bets → Resolved → Claims Open
```

### Key Functions

| Function | Access | Description |
|---|---|---|
| `createMarket(uint256 gameId, string question)` | Owner only | Creates a new prediction market tied to a game |
| `betYes(uint256 marketId)` | Anyone (payable) | Places a YES bet with BNB into the yes pool |
| `betNo(uint256 marketId)` | Anyone (payable) | Places a NO bet with BNB into the no pool |
| `resolveMarket(uint256 marketId, bool outcome)` | Owner only | Sets the final outcome (`true` = YES wins, `false` = NO wins) |
| `claim(uint256 marketId)` | Anyone | Winners claim their proportional payout from the entire pool |

### Payout Formula

```
payout = (userBet × totalPool) / winningPool
```

### Events

| Event | Description |
|---|---|
| `MarketCreated(marketId, gameId, question)` | Fired when a new market is opened |
| `BetPlaced(marketId, yes, amount)` | Fired on every bet |
| `MarketResolved(marketId, outcome)` | Fired when outcome is set |
| `RewardClaimed(marketId, user, amount)` | Fired when a user claims their payout |

---

## 3. ⚖️ GameResolver

**Address:** `0x60eaEA0Edde98bf0B5A8C3C2FAc48213444bCCd9`
**File:** `src/GameResolver.sol`

### Purpose
An orchestrator contract that atomically finalizes a game in a single transaction. It calls `finishGame` on `GameRegistry` and then iterates through a list of prediction market IDs and their corresponding outcomes, resolving each one via `PredictionMarket.resolveMarket`. Only the owner (deployer) can trigger this.

### Dependencies

| Interface | Contract Called |
|---|---|
| `IGameRegistry` | `GameRegistry` at `0xA07DdE4d7Cc3d2122aC20F70133520946E588eCE` |
| `IPredictionMarket` | `PredictionMarket` at `0x6Bf43E463011066fAa65cFC5499CBc872a6b248E` |

### Key Functions

| Function | Access | Description |
|---|---|---|
| `resolveGame(uint256 gameId, uint256[] marketIds, bool[] outcomes)` | Owner only | Finishes the game on-chain and resolves all linked prediction markets in one tx |

> ⚠️ **Note:** `marketIds` and `outcomes` arrays **must be equal in length**, or the transaction will revert with `"Length mismatch"`.

---

## 4. 💰 GamePrizePool

**Address:** `0x01555aeb46F240D4437823d10fad21D032323B92`
**File:** `src/GamePrizePool.sol`

### Purpose
The financial backbone of the protocol. It accepts BNB deposits for any game, automatically splits them **90% to the prize pool / 10% to the platform**, and distributes rewards to winning `PersistentAgentToken` contracts after game resolution. Token holders then claim their individual share proportionally based on their token holdings.

### Fee Split

| Recipient | Percentage |
|---|---|
| Prize Pool (winners) | **90%** |
| Platform Wallet | **10%** |

### Key Functions

| Function | Access | Description |
|---|---|---|
| `deposit(uint256 gameId)` | Anyone (payable) | Deposits BNB into a game's pool; split 90/10 automatically |
| `distributeRewards(uint256 gameId, address[] winningTokens, uint256[] percentages)` | Game Manager only | Distributes the 90% prize pool to winning agent token contracts |
| `claimReward(uint256 gameId, address tokenAddress)` | Anyone | Token holders claim their proportional BNB reward |
| `claimPlatformFee(uint256 gameId)` | Platform Wallet only | Withdraws accumulated 10% platform fees |
| `getGameStats(uint256 gameId)` | View | Returns `totalDeposited`, `prizePool`, `platformFee`, `distributed` |
| `hasUserClaimed(uint256 gameId, address user, address tokenAddress)` | View | Checks if a user has already claimed for a given token |

### Reward Claim Formula

```
userReward = (totalRewardForToken × userTokenBalance) / totalTokenSupply
```

### Events

| Event | Description |
|---|---|
| `Deposited(gameId, user, amount)` | Fired on every deposit |
| `RewardsDistributed(gameId, tokens, amounts)` | Fired after prize pool distribution |
| `RewardClaimed(gameId, user, token, amount)` | Fired when a user claims their BNB reward |
| `PlatformFeeClaimed(gameId, amount)` | Fired when platform withdraws its fee |

> 🔒 Uses `ReentrancyGuard` from OpenZeppelin on all fund-moving functions to prevent re-entrancy attacks.

---

## 5. 📋 AgentRegistry

**Address:** `0x77BEba0C93E0F93BEa328e79c1C9A7694a5c2615`
**File:** `src/AgentRegistry.sol`

### Purpose
A lightweight stat-tracking registry for game agents. It stores each agent's name, the number of games they've played, and how many they've won. Anyone can register an agent, and anyone can update an agent's stats after a game.

> ⚠️ **Note:** This contract has **no access control** — `registerAgent` and `updateAgent` are callable by any address. It is intended to be called by the off-chain game manager.

### Key Functions

| Function | Access | Description |
|---|---|---|
| `registerAgent(string name)` | Anyone | Creates a new agent entry and increments `agentCount` |
| `updateAgent(uint256 agentId, bool won)` | Anyone | Increments `gamesPlayed`; increments `gamesWon` if `won == true` |

### Events

| Event | Description |
|---|---|
| `AgentCreated(agentId, name)` | Fired when a new agent is registered |
| `AgentUpdated(agentId, won)` | Fired when an agent's stats are updated |

---

## 6. 🏭 AgentTokenRegistry

**Address:** `0xdbfc97A6560a360ff02dd5f8F641B2991dB1024d`
**File:** `src/AgentTokenRegistry.sol`

### Purpose
A factory and registry for `PersistentAgentToken` contracts. Only the designated **game manager** address may deploy new tokens. Upon creation, each agent receives **1,000,000 tokens** (`INITIAL_SUPPLY`) and ownership is immediately transferred to the game manager. The registry maintains a lookup from `agentName → tokenAddress`.

### Key Functions

| Function | Access | Description |
|---|---|---|
| `createAgentToken(string agentName, string personality)` | Game Manager only | Deploys a new `PersistentAgentToken`, registers it, and transfers ownership to the game manager |
| `getOrCreateToken(string agentName, string personality)` | Game Manager only | Returns existing token address or creates a new one if none exists |
| `getAllTokens()` | View | Returns array of all registered token addresses |
| `getTokenAddress(string agentName)` | View | Returns the token address for a given agent name |
| `tokenCount()` | View | Returns total number of registered agent tokens |

### Events

| Event | Description |
|---|---|
| `AgentTokenCreated(agentName, tokenAddress, timestamp)` | Fired when a new token contract is deployed |

### Constants

| Constant | Value |
|---|---|
| `INITIAL_SUPPLY` | `1,000,000` tokens (× 10^18 decimals) |

---

## 7. 🪙 PersistentAgentToken

**Address:** `0x7603a62D192033ee58842ecDe5b07AE3429617E3`
**File:** `src/PersistentAgentToken.sol`

### Purpose
An ERC20 token representing a single game agent that persists across multiple games. Each token carries the agent's name, personality, and live on-chain stats (games played, games won, total rewards earned). Trading can be locked during active games to prevent market manipulation. The contract also accepts BNB directly from `GamePrizePool` via `receiveRewards()`.

### Token Naming Convention

```
Name:   "MonadSus <agentName>"   →  e.g., "MonadSus Red"
Symbol: "SUS<agentName>"         →  e.g., "SUSRed"
```

### Key Functions

| Function | Access | Description |
|---|---|---|
| `setTradingEnabled(bool _enabled)` | Owner only | Locks/unlocks token transfers (minting/burning always allowed) |
| `updateStats(bool won)` | Owner only | Increments `gamesPlayed`; conditionally increments `gamesWon` |
| `receiveRewards()` | Anyone (payable) | Accepts BNB prize distribution from `GamePrizePool`; updates `totalRewardsEarned` |
| `winRate()` | View | Returns `(gamesWon × 100) / gamesPlayed` as a 0–100 percentage |

### Events

| Event | Description |
|---|---|
| `TradingStatusChanged(enabled)` | Fired when trading is locked or unlocked |
| `StatsUpdated(gamesPlayed, gamesWon)` | Fired after stat update |
| `RewardsReceived(amount)` | Fired when BNB rewards are received |

> 💡 **Tip:** The `_update` override ensures normal transfers are blocked when `tradingEnabled == false`, but **minting** (`from == address(0)`) and **burning** (`to == address(0)`) are always permitted regardless of trading status.

---

## 🔄 End-to-End Flow Summary

```
1. SETUP
   AgentTokenRegistry.createAgentToken()   →  deploys PersistentAgentToken per agent

2. GAME CREATION
   GameRegistry.createGame(gameHash)        →  registers game, assigns resolver
   PredictionMarket.createMarket()          →  opens YES/NO prediction markets

3. GAME IN PROGRESS
   PredictionMarket.betYes() / betNo()     →  users stake BNB on outcomes
   GamePrizePool.deposit()                 →  users fund the prize pool (90/10 split)

4. GAME RESOLUTION
   GameResolver.resolveGame()              →  atomically:
     ├─ GameRegistry.finishGame()           →  marks game FINISHED
     └─ PredictionMarket.resolveMarket()    →  sets YES/NO outcome for each market

5. REWARD DISTRIBUTION
   GamePrizePool.distributeRewards()       →  sends BNB to winning PersistentAgentTokens
   AgentRegistry.updateAgent()             →  updates agent win/loss stats

6. CLAIMING
   GamePrizePool.claimReward()             →  token holders claim proportional BNB
   PredictionMarket.claim()                →  bettors claim prediction market winnings
   GamePrizePool.claimPlatformFee()        →  platform collects its 10%
```

---

*Generated on 2026-02-27 | BNB Smart Chain Testnet*
