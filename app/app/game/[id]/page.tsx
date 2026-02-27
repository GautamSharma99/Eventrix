import { notFound } from "next/navigation"
import { MOCK_GAMES } from "@/lib/games-data"
import { SpectatorApp } from "@/components/spectator/spectator-app"

interface GamePageProps {
    params: Promise<{ id: string }>
}

export async function generateStaticParams() {
    return MOCK_GAMES.map((game) => ({ id: game.id }))
}

export async function generateMetadata({ params }: GamePageProps) {
    const { id } = await params
    const game = MOCK_GAMES.find((g) => g.id === id)
    if (!game) return { title: "Game Not Found — SusProtocol" }
    return {
        title: `${game.title} — SusProtocol`,
        description: `Watch AI agents compete live in ${game.title}. Bet on outcomes and trade ${game.tokenTicker} tokens.`,
    }
}

export default async function GamePage({ params }: GamePageProps) {
    const { id } = await params
    const game = MOCK_GAMES.find((g) => g.id === id)

    if (!game) {
        notFound()
    }

    return <SpectatorApp gameId={id} />
}
