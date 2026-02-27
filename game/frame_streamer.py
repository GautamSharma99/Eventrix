"""
Frame Streamer v2 — Persistent WebSocket binary streaming.

Instead of HTTP POST per frame, this opens a single WebSocket to the bridge
and pumps raw binary JPEG frames at up to 25 FPS.

No base64, no HTTP overhead — the bridge receives bytes and immediately
forwards them to all browser /ws/video/{game_id} subscribers.
"""

import io
import os
import queue
import threading
import time
from typing import Optional

import pygame

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

BRIDGE_URL = os.environ.get("BRIDGE_URL", "http://localhost:8000")
WS_BASE    = BRIDGE_URL.replace("http://", "ws://").replace("https://", "wss://")

# Stream settings
STREAM_WIDTH  = 800
STREAM_HEIGHT = 450
JPEG_QUALITY  = 72          # Good balance: quality vs. bandwidth
TARGET_FPS    = 25          # Frames per second (game runs at 60 fps)
FRAME_INTERVAL = 1.0 / TARGET_FPS


class FrameStreamer:
    """
    Background thread that captures pygame Surface frames and streams
    them over a persistent WebSocket to the bridge as raw binary JPEGs.
    """

    def __init__(self, game_id: str = "game-001"):
        self.game_id = game_id
        self._q: queue.Queue = queue.Queue(maxsize=4)  # Drop stale frames if slow
        self._stopped = False
        self._last_capture = 0.0
        self._worker = threading.Thread(target=self._run, daemon=True, name="FrameStreamer")
        self._worker.start()

    def submit(self, surface: pygame.Surface):
        """Call from the game draw loop each frame. Rate-limited to TARGET_FPS."""
        now = time.monotonic()
        if now - self._last_capture < FRAME_INTERVAL:
            return
        self._last_capture = now

        try:
            jpeg = self._to_jpeg(surface)
        except Exception:
            return

        try:
            self._q.put_nowait(jpeg)
        except queue.Full:
            # Drop oldest, enqueue newest
            try:
                self._q.get_nowait()
            except queue.Empty:
                pass
            try:
                self._q.put_nowait(jpeg)
            except queue.Full:
                pass

    def close(self):
        self._stopped = True
        try:
            self._q.put_nowait(None)  # Sentinel to unblock worker
        except queue.Full:
            pass
        self._worker.join(timeout=3)

    # ------------------------------------------------------------------
    # Frame capture (on game/main thread)
    # ------------------------------------------------------------------

    def _to_jpeg(self, surface: pygame.Surface) -> bytes:
        if surface.get_width() != STREAM_WIDTH or surface.get_height() != STREAM_HEIGHT:
            scaled = pygame.transform.smoothscale(surface, (STREAM_WIDTH, STREAM_HEIGHT))
        else:
            scaled = surface

        if PIL_AVAILABLE:
            raw = pygame.image.tobytes(scaled, "RGB")
            img = Image.frombytes("RGB", (STREAM_WIDTH, STREAM_HEIGHT), raw)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=False)
            return buf.getvalue()
        else:
            buf = io.BytesIO()
            pygame.image.save(scaled, buf, ".png")
            return buf.getvalue()

    # ------------------------------------------------------------------
    # Background sender thread
    # ------------------------------------------------------------------

    def _run(self):
        """Keep a persistent WebSocket to the bridge and pump frames."""
        while not self._stopped:
            try:
                self._stream_loop()
            except Exception:
                pass
            if not self._stopped:
                time.sleep(1)  # Wait before reconnecting

    def _stream_loop(self):
        uri = f"{WS_BASE}/ws/stream/{self.game_id}"

        try:
            from websockets.sync.client import connect as ws_connect
        except ImportError:
            # Fallback: HTTP POST (slow, but works)
            self._run_http_fallback()
            return

        with ws_connect(uri, max_size=8 * 1024 * 1024, open_timeout=5) as ws:
            print(f"[FrameStreamer] Connected → {uri}")
            while not self._stopped:
                try:
                    frame = self._q.get(timeout=1.0)
                except queue.Empty:
                    continue
                if frame is None:
                    break
                try:
                    ws.send(frame)  # Raw binary JPEG
                except Exception:
                    raise  # Reconnect outer loop
                self._q.task_done()

    def _run_http_fallback(self):
        """HTTP POST fallback when websockets.sync not available."""
        import urllib.request
        import base64
        import json as _json

        while not self._stopped:
            try:
                frame = self._q.get(timeout=1.0)
            except queue.Empty:
                continue
            if frame is None:
                break
            b64 = base64.b64encode(frame).decode("ascii")
            payload = _json.dumps({"type": "FRAME", "game_id": self.game_id, "data": b64}).encode()
            url = f"{BRIDGE_URL}/game/ingest/{self.game_id}"
            req = urllib.request.Request(url, data=payload,
                                          headers={"Content-Type": "application/json"}, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=1):
                    pass
            except Exception:
                pass
            self._q.task_done()
