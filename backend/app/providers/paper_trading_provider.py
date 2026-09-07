"""
OPPARCH AI — Paper Trading Manager
Enables risk-free virtual trading simulation and paper portfolio PnL tracking.
"""
from typing import Dict, Any, List
from app.providers.crypto_data_provider import CryptoDataProvider

class PaperTradingProvider:
    """
    Paper Trading Portfolio & Trade Execution Provider.
    """

    @classmethod
    async def simulate_trade_update(cls, trade_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates current price and unrealized PnL for an open paper position.
        """
        symbol = trade_dict["symbol"]
        direction = trade_dict["direction"]
        entry_price = trade_dict["entry_price"]
        position_size = trade_dict.get("position_size", 1000.0)

        ticker = await CryptoDataProvider.get_live_ticker(symbol)
        curr_price = ticker["price"]

        if direction == "LONG":
            pnl_percent = ((curr_price - entry_price) / entry_price) * 100.0
        else:
            pnl_percent = ((entry_price - curr_price) / entry_price) * 100.0

        realized_pnl = round(position_size * (pnl_percent / 100.0), 2)

        return {
            **trade_dict,
            "current_price": curr_price,
            "pnl_percent": round(pnl_percent, 2),
            "realized_pnl": realized_pnl
        }
