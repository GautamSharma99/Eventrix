"""
Bridge Server — Real-time game event relay.

Architecture:
  Game engine → POST /game/ingest/{game_id}  (HTTP, fire-and-forget)
  Browser     ← WS  /ws/game/{game_id}       (per-game subscription)
  Browser     ← WS  /ws                      (legacy single-channel)

Run:
  cd game
  python bridge_server.py
"""

import asyncio
import json
import subprocess
import sys
import time
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="MonadSus Bridge Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

# game_id → game metadata dict
active_games: Dict[str, dict] = {}

# game_id → Set[WebSocket] — per-game subscribers
game_subscribers: Dict[str, Set[WebSocket]] = defaultdict(set)

# legacy single-channel subscribers (/ws)
legacy_subscribers: Set[WebSocket] = set()

# game_id → list of recent events (replay for late joiners)
event_history: Dict[str, List[dict]] = defaultdict(list)

# game_id → subprocess.Popen
game_processes: Dict[str, object] = {}


# ---------------------------------------------------------------------------
# Fan-out helper
# ---------------------------------------------------------------------------

async def broadcast(game_id: str, event: dict):
    """Send an event to all WS subscribers of this game AND the legacy channel."""
    data = json.dumps(event)

    dead: Set[WebSocket] = set()
    for ws in list(game_subscribers.get(game_id, set())):
        try:
            await ws.send_text(data)
        except Exception:
            dead.add(ws)
    game_subscribers[game_id] -= dead

    dead_legacy: Set[WebSocket] = set()
    for ws in list(legacy_subscribers):
        try:
            await ws.send_text(data)
        except Exception:
            dead_legacy.add(ws)
    legacy_subscribers.difference_update(dead_legacy)


# ---------------------------------------------------------------------------
# REST — Game management
# ---------------------------------------------------------------------------

@app.get("/games")
def list_games():
    return list(active_games.values())


@app.get("/game/{game_id}")
def get_game(game_id: str):
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    return active_games[game_id]


@app.post("/game/start")
async def start_game():
    """Spawn a new autonomous game subprocess tagged as game-001 by default."""
    game_id = "game-001"  # canonical game-001 channel
    game_dir = Path(__file__).parent

    try:
        import os
        env = {**os.environ, "BRIDGE_GAME_ID": game_id}
        proc = subprocess.Popen(
            [sys.executable, "main_autonomous.py"],
            cwd=str(game_dir),
            env=env,
        )
        game_processes[game_id] = proc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    active_games[game_id] = {
        "id": game_id,
        "title": "Live Game — Skeld Station",
        "status": "starting",
        "players": 10,
        "viewers": 0,
        "tokenTicker": "$SUS",
        "tokenPrice": 0.001,
        "priceChange": 0,
        "hypeScore": 0,
        "startTime": "Just started",
        "tags": ["New", "Live"],
        "started_at": time.time(),
    }

    return {"game_id": game_id, "status": "starting"}


# ---------------------------------------------------------------------------
# REST — Event ingestion endpoint (game engine → bridge)
# ---------------------------------------------------------------------------

@app.post("/game/ingest/{game_id}")
async def ingest_event(game_id: str, request: Request):
    """
    The game engine POSTs every event here.
    The bridge stores it and fans out to all live WebSocket subscribers.
    """
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event.setdefault("game_id", game_id)
    event.setdefault("timestamp", time.time())

    etype = event.get("type", "")

    # FRAME events are high-frequency — never store in history, just fan-out
    if etype == "FRAME":
        await broadcast(game_id, event)
        return {"ok": True}

    # Keep capped event history for late joiners (non-frame events only)
    history = event_history[game_id]
    history.append(event)
    if len(history) > 500:
        history.pop(0)

    # Ensure game entry exists
    if game_id not in active_games:
        active_games[game_id] = {
            "id": game_id,
            "title": f"Game {game_id}",
            "status": "live",
            "players": 10,
            "viewers": 0,
            "tokenTicker": "$SUS",
            "tokenPrice": 0.001,
            "priceChange": 0,
            "hypeScore": 0,
            "startTime": "Live",
            "tags": ["Live"],
            "started_at": time.time(),
        }

    g = active_games[game_id]

    if etype == "GAME_START":
        g["status"] = "live"
        g["tags"] = ["Live"]
        agents = event.get("agents", [])
        if agents:
            g["players"] = len(agents)
    elif etype == "GAME_END":
        g["status"] = "ended"
        winner = event.get("winner", "")
        g["tags"] = ["Crew Won" if winner == "crew" else "Impostor Won"]
    elif etype == "KILL":
        g["hypeScore"] = min(100, g.get("hypeScore", 0) + 15)
    elif etype == "MEETING_START":
        g["hypeScore"] = min(100, g.get("hypeScore", 0) + 10)

    await broadcast(game_id, event)
    return {"ok": True}


# ---------------------------------------------------------------------------
# WebSocket — Per-game channel
# ---------------------------------------------------------------------------

@app.websocket("/ws/game/{game_id}")
async def ws_game(websocket: WebSocket, game_id: str):
    await websocket.accept()
    game_subscribers[game_id].add(websocket)
    print(f"[WS] Client connected → game/{game_id} ({len(game_subscribers[game_id])} total)")

    # Replay recent history so late joiners catch up
    for evt in event_history.get(game_id, [])[-50:]:
        try:
            await websocket.send_text(json.dumps(evt))
        except Exception:
            break

    try:
        while True:
            await asyncio.sleep(25)
            await websocket.send_text('{"type":"PING"}')
    except WebSocketDisconnect:
        game_subscribers[game_id].discard(websocket)
        print(f"[WS] Client disconnected → game/{game_id}")


# ---------------------------------------------------------------------------
# WebSocket — Legacy single-channel (backward compat with demo mode)
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def ws_legacy(websocket: WebSocket):
    await websocket.accept()
    legacy_subscribers.add(websocket)
    print(f"[WS] Legacy client connected ({len(legacy_subscribers)} total)")
    try:
        while True:
            await asyncio.sleep(25)
            await websocket.send_text('{"type":"PING"}')
    except WebSocketDisconnect:
        legacy_subscribers.discard(websocket)


# ---------------------------------------------------------------------------
# WebSocket — Game engine pushes binary video frames here
# ---------------------------------------------------------------------------

# game_id → Set[WebSocket] — browser video subscribers
video_subscribers: Dict[str, Set[WebSocket]] = defaultdict(set)


@app.websocket("/ws/stream/{game_id}")
async def ws_stream_ingest(websocket: WebSocket, game_id: str):
    """
    The game engine connects here and pushes raw binary JPEG frames.
    Bridge immediately fans them out to all /ws/video/{game_id} subscribers.
    """
    await websocket.accept()
    print(f"[STREAM] Game engine connected for {game_id}")
    try:
        while True:
            frame_bytes = await websocket.receive_bytes()
            dead: Set[WebSocket] = set()
            for ws in list(video_subscribers.get(game_id, set())):
                try:
                    await ws.send_bytes(frame_bytes)
                except Exception:
                    dead.add(ws)
            video_subscribers[game_id] -= dead
    except WebSocketDisconnect:
        print(f"[STREAM] Game engine disconnected for {game_id}")


@app.websocket("/ws/video/{game_id}")
async def ws_video_subscribe(websocket: WebSocket, game_id: str):
    """Browser connects here to receive raw binary JPEG video frames."""
    await websocket.accept()
    video_subscribers[game_id].add(websocket)
    print(f"[VIDEO] Browser subscribed to {game_id} ({len(video_subscribers[game_id])} total)")
    try:
        while True:
            # Just keep alive — frames are pushed to us, we don't receive from browser
            await asyncio.sleep(30)
            await websocket.send_text('{"type":"PING"}')
    except WebSocketDisconnect:
        video_subscribers[game_id].discard(websocket)
        print(f"[VIDEO] Browser unsubscribed from {game_id}")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "games": len(active_games)}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 50)
    print("  MonadSus Bridge Server")
    print("  http://localhost:8000")
    print("  Game stream: ws://localhost:8000/ws/game/game-001")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
