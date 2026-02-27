export type GameStatus = "live" | "starting" | "upcoming" | "ended"

export interface GameListing {
  id: string
  title: string
  status: GameStatus
  players: number
  viewers: number
  tokenTicker: string
  tokenPrice: number
  priceChange: number
  hypeScore: number
  startTime: string
  thumbnail?: string
  tags: string[]
}

// Simulated games data -- in production these come from an API or WebSocket
export const MOCK_GAMES: GameListing[] = [
  {
    id: "game-001",
    title: "Skeld Station Alpha",
    status: "live",
    players: 8,
    viewers: 1247,
    tokenTicker: "$SUS",
    tokenPrice: 0.0842,
    priceChange: 34.2,
    hypeScore: 78,
    startTime: "12 min ago",
    tags: ["High Hype", "1 Kill"],
  },
  {
    id: "game-002",
    title: "Polus Expedition",
    status: "live",
    players: 10,
    viewers: 892,
    tokenTicker: "$PLR",
    tokenPrice: 0.0421,
    priceChange: 12.5,
    hypeScore: 52,
    startTime: "3 min ago",
    tags: ["Just Started"],
  },
  {
    id: "game-003",
    title: "Mira HQ Showdown",
    status: "starting",
    players: 6,
    viewers: 341,
    tokenTicker: "$MRA",
    tokenPrice: 0.01,
    priceChange: 0,
    hypeScore: 0,
    startTime: "Starting in 45s",
    tags: ["New Token"],
  },
  {
    id: "game-004",
    title: "Airship Gauntlet",
    status: "upcoming",
    players: 8,
    viewers: 0,
    tokenTicker: "$AIR",
    tokenPrice: 0.01,
    priceChange: 0,
    hypeScore: 0,
    startTime: "In 5 min",
    tags: ["Upcoming"],
  },
  {
    id: "game-005",
    title: "Fungus Labs Run",
    status: "upcoming",
    players: 10,
    viewers: 0,
    tokenTicker: "$FNG",
    tokenPrice: 0.01,
    priceChange: 0,
    hypeScore: 0,
    startTime: "In 12 min",
    tags: ["Upcoming"],
  },
  {
    id: "game-006",
    title: "Reactor Meltdown",
    status: "ended",
    players: 8,
    viewers: 3201,
    tokenTicker: "$RCT",
    tokenPrice: 0.2145,
    priceChange: 114.5,
    hypeScore: 95,
    startTime: "Ended 2 min ago",
    tags: ["Crew Won", "Massive Hype"],
  },
  {
    id: "game-007",
    title: "Deep Space Sigma",
    status: "ended",
    players: 6,
    viewers: 542,
    tokenTicker: "$DSS",
    tokenPrice: 0.0023,
    priceChange: -77.0,
    hypeScore: 8,
    startTime: "Ended 18 min ago",
    tags: ["Impostor Won", "Rug"],
  },
  {
    id: "game-008",
    title: "Orbital Deck Nine",
    status: "ended",
    players: 10,
    viewers: 1800,
    tokenTicker: "$ORB",
    tokenPrice: 0.1562,
    priceChange: 56.2,
    hypeScore: 71,
    startTime: "Ended 8 min ago",
    tags: ["Crew Won"],
  },
]
