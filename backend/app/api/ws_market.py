"""
OPPARCH AI — WebSocket Live Price Feed Router
Provides real-time price & ticker streaming to frontend without expensive HTTP polling.
"""
import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.providers.crypto_data_provider import CryptoDataProvider, SUPPORTED_SYMBOLS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSocket Live Market Stream"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/market-stream")
async def websocket_market_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint broadcasting live crypto prices every 2 seconds.
    """
    await manager.connect(websocket)
    try:
        while True:
            tickers = await CryptoDataProvider.get_all_tickers()
            await websocket.send_json({
                "type": "TICKERS_UPDATE",
                "tickers": tickers
            })
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"[WebSocket Disconnect] {e}")
        manager.disconnect(websocket)
