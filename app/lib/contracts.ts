export type ContractInfo = {
  key: string
  name: string
  address: string
  file: string
  purpose: string
  tags?: string[]
  notes?: string
}

export const bnbTestnet = {
  name: "BNB Smart Chain Testnet",
  chainId: 97,
  rpcUrl: "https://bsc-testnet-dataseed.bnbchain.org",
  explorerBase: "https://testnet.bscscan.com/address/",
  solidity: "^0.8.20",
}

export const CONTRACT_ADDRESSES = {
  gameRegistry: process.env.NEXT_PUBLIC_GAME_REGISTRY || "0xA07DdE4d7Cc3d2122aC20F70133520946E588eCE",
  predictionMarket: process.env.NEXT_PUBLIC_PREDICTION_MARKET || "0x6Bf43E463011066fAa65cFC5499CBc872a6b248E",
  gameResolver: process.env.NEXT_PUBLIC_GAME_RESOLVER || "0x60eaEA0Edde98bf0B5A8C3C2FAc48213444bCCd9",
  gamePrizePool: process.env.NEXT_PUBLIC_GAME_PRIZE_POOL || "0x01555aeb46F240D4437823d10fad21D032323B92",
  agentRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY || "0x77BEba0C93E0F93BEa328e79c1C9A7694a5c2615",
  agentTokenRegistry: process.env.NEXT_PUBLIC_AGENT_TOKEN_REGISTRY || "0xdbfc97A6560a360ff02dd5f8F641B2991dB1024d",
  persistentAgentToken: process.env.NEXT_PUBLIC_PERSISTENT_AGENT_TOKEN || "0x7603a62D192033ee58842ecDe5b07AE3429617E3",
};

export const contracts: ContractInfo[] = [
  {
    key: "gameRegistry",
    name: "GameRegistry",
    address: CONTRACT_ADDRESSES.gameRegistry,
    file: "src/GameRegistry.sol",
    purpose: "Registers games, stores resolver, manages CREATED -> RUNNING -> FINISHED lifecycle.",
    tags: ["core", "state"],
  },
  {
    key: "predictionMarket",
    name: "PredictionMarket",
    address: CONTRACT_ADDRESSES.predictionMarket,
    file: "src/PredictionMarket.sol",
    purpose: "Binary YES/NO markets funded in BNB; handles bets, resolution, and claims.",
    tags: ["markets", "payouts"],
  },
  {
    key: "gameResolver",
    name: "GameResolver",
    address: CONTRACT_ADDRESSES.gameResolver,
    file: "src/GameResolver.sol",
    purpose: "Owner-run coordinator that finalizes a game and resolves linked markets in one tx.",
    tags: ["orchestration"],
    notes: "Calls GameRegistry.finishGame then PredictionMarket.resolveMarket for each marketId/outcome.",
  },
  {
    key: "gamePrizePool",
    name: "GamePrizePool",
    address: CONTRACT_ADDRESSES.gamePrizePool,
    file: "src/GamePrizePool.sol",
    purpose: "Splits deposits 90% prize / 10% platform; distributes BNB to winning agent tokens.",
    tags: ["treasury", "rewards"],
  },
  {
    key: "agentRegistry",
    name: "AgentRegistry",
    address: CONTRACT_ADDRESSES.agentRegistry,
    file: "src/AgentRegistry.sol",
    purpose: "Open stats tracker for agents (games played/won).",
    tags: ["stats"],
    notes: "No access control; intended for off-chain game manager to update.",
  },
  {
    key: "agentTokenRegistry",
    name: "AgentTokenRegistry",
    address: CONTRACT_ADDRESSES.agentTokenRegistry,
    file: "src/AgentTokenRegistry.sol",
    purpose: "Factory + registry for PersistentAgentToken with 1,000,000 initial supply.",
    tags: ["factory"],
  },
  {
    key: "persistentAgentToken",
    name: "PersistentAgentToken",
    address: CONTRACT_ADDRESSES.persistentAgentToken,
    file: "src/PersistentAgentToken.sol",
    purpose: "ERC20 per agent; tracks stats and receives BNB rewards from GamePrizePool.",
    tags: ["erc20", "agents"],
    notes: "Transfers can be locked with setTradingEnabled; receiveRewards updates totalRewardsEarned.",
  },
]

export const architectureNotes = [
  "GameResolver finishes games and resolves markets in one transaction.",
  "PredictionMarket resolution drives bettor claims; GamePrizePool handles prize payouts.",
  "AgentTokenRegistry mints PersistentAgentToken per agent; GamePrizePool pays those tokens; holders claim BNB.",
  "AgentRegistry is standalone stats, separate from token + prize flows.",
]

