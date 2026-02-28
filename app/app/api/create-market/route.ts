import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { PredictionMarketABI } from "@/lib/abis";

const RPC_URL = process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://bsc-testnet-dataseed.bnbchain.org";
const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET || "0x6Bf43E463011066fAa65cFC5499CBc872a6b248E";

export async function POST(req: NextRequest) {
    try {
        const { question, gameId } = await req.json();

        if (!question || typeof question !== "string") {
            return NextResponse.json({ error: "Missing question" }, { status: 400 });
        }

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json({ error: "Server not configured" }, { status: 500 });
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL, 97);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(PREDICTION_MARKET_ADDRESS, PredictionMarketABI, wallet);

        // Get current market count before creating
        const countBefore = await contract.marketCount();

        // Create market on-chain (owner-only function)
        const tx = await contract.createMarket(gameId || 1, question);
        const receipt = await tx.wait();

        // New market ID = countBefore + 1
        const newMarketId = Number(countBefore) + 1;

        console.log(`[create-market] Created market #${newMarketId}: "${question}" tx: ${receipt.hash}`);

        return NextResponse.json({
            marketId: newMarketId,
            txHash: receipt.hash,
            question,
        });
    } catch (err: any) {
        console.error("[create-market] Error:", err);
        return NextResponse.json(
            { error: err.reason || err.message || "Failed to create market" },
            { status: 500 }
        );
    }
}
