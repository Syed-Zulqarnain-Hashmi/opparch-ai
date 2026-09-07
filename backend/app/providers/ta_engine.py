"""
OPPARCH AI — Quantitative Technical Analysis (TA) Engine
Calculates multi-indicator technical analysis on OHLCV candlestick data:
  - RSI (14)
  - MACD (12, 26, 9) & Histogram
  - EMA (20, 50) & SMA (200)
  - Bollinger Bands (20, 2)
  - ATR (14)
  - Volume Expansion & Momentum
  - Support / Resistance Levels
  - Overall Technical Verdict (BULLISH, BEARISH, NEUTRAL)
"""
import math
from typing import List, Dict, Any, Tuple

class TAEngine:
    """
    Quantitative Technical Analysis Engine.
    No external heavy dependencies required — pure vectorized Python implementation.
    """

    @staticmethod
    def calculate_rsi(closes: List[float], period: int = 14) -> float:
        if len(closes) < period + 1:
            return 50.0
        
        gains = []
        losses = []
        for i in range(1, len(closes)):
            diff = closes[i] - closes[i - 1]
            if diff >= 0:
                gains.append(diff)
                losses.append(0.0)
            else:
                gains.append(0.0)
                losses.append(abs(diff))

        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return round(100.0 - (100.0 / (1.0 + rs)), 2)

    @staticmethod
    def calculate_ema(closes: List[float], period: int) -> float:
        if len(closes) < period:
            return closes[-1] if closes else 0.0
        k = 2.0 / (period + 1.0)
        ema = sum(closes[:period]) / period
        for p in closes[period:]:
            ema = (p * k) + (ema * (1.0 - k))
        return round(ema, 2)

    @staticmethod
    def calculate_sma(closes: List[float], period: int) -> float:
        if len(closes) < period:
            return closes[-1] if closes else 0.0
        return round(sum(closes[-period:]) / period, 2)

    @classmethod
    def calculate_macd(cls, closes: List[float]) -> Tuple[float, float, float]:
        if len(closes) < 26:
            return 0.0, 0.0, 0.0
        ema12 = cls.calculate_ema(closes, 12)
        ema26 = cls.calculate_ema(closes, 26)
        macd_line = ema12 - ema26
        
        # Calculate signal line over last 9 points
        macd_series = []
        for i in range(len(closes) - 9, len(closes)):
            sub_c = closes[:i+1]
            m12 = cls.calculate_ema(sub_c, 12)
            m26 = cls.calculate_ema(sub_c, 26)
            macd_series.append(m12 - m26)
        
        signal_line = cls.calculate_ema(macd_series, 9) if len(macd_series) >= 9 else macd_line
        hist = macd_line - signal_line
        return round(macd_line, 4), round(signal_line, 4), round(hist, 4)

    @classmethod
    def calculate_bollinger_bands(cls, closes: List[float], period: int = 20, num_std: float = 2.0) -> Tuple[float, float, float]:
        if len(closes) < period:
            c = closes[-1] if closes else 0.0
            return c, c, c
        slice_c = closes[-period:]
        sma = sum(slice_c) / period
        variance = sum((x - sma) ** 2 for x in slice_c) / period
        std = math.sqrt(variance)
        upper = sma + (num_std * std)
        lower = sma - (num_std * std)
        return round(upper, 2), round(sma, 2), round(lower, 2)

    @staticmethod
    def calculate_atr(candles: List[Dict[str, Any]], period: int = 14) -> float:
        if len(candles) < period + 1:
            return 0.0
        tr_list = []
        for i in range(1, len(candles)):
            h = candles[i]["high"]
            l = candles[i]["low"]
            pc = candles[i-1]["close"]
            tr = max(h - l, abs(h - pc), abs(l - pc))
            tr_list.append(tr)
        return round(sum(tr_list[-period:]) / period, 2)

    @classmethod
    def analyze_klines(cls, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes complete quantitative technical analysis over candle dataset.
        Returns indicator metrics and overall verdict.
        """
        if not candles or len(candles) < 20:
            return {
                "rsi_14": 50.0,
                "macd": 0.0,
                "macd_signal": 0.0,
                "macd_hist": 0.0,
                "ema_20": 0.0,
                "ema_50": 0.0,
                "sma_200": 0.0,
                "bb_upper": 0.0,
                "bb_lower": 0.0,
                "atr_14": 0.0,
                "technical_verdict": "NEUTRAL",
                "trend": "Sideways",
                "support_level": 0.0,
                "resistance_level": 0.0,
                "signals": ["Insufficient price history"]
            }

        closes = [c["close"] for c in candles]
        highs = [c["high"] for c in candles]
        lows = [c["low"] for c in candles]
        volumes = [c["volume"] for c in candles]
        last_price = closes[-1]

        rsi = cls.calculate_rsi(closes)
        macd, macd_sig, macd_hist = cls.calculate_macd(closes)
        ema20 = cls.calculate_ema(closes, 20)
        ema50 = cls.calculate_ema(closes, 50)
        sma200 = cls.calculate_sma(closes, 200)
        bb_upper, bb_mid, bb_lower = cls.calculate_bollinger_bands(closes)
        atr = cls.calculate_atr(candles)

        # Support & Resistance levels
        recent_lows = sorted(lows[-30:])
        recent_highs = sorted(highs[-30:])
        support = round(sum(recent_lows[:3]) / 3, 2)
        resistance = round(sum(recent_highs[-3:]) / 3, 2)

        # Volume Analysis
        avg_vol = sum(volumes[-20:]) / 20 if len(volumes) >= 20 else volumes[-1]
        vol_expansion = volumes[-1] > (avg_vol * 1.25)

        # Technical Scoring
        bull_score = 0
        bear_score = 0
        signals = []

        if rsi < 30:
            bull_score += 2
            signals.append("RSI Oversold (<30) — Bullish Reversal Signal")
        elif rsi > 70:
            bear_score += 2
            signals.append("RSI Overbought (>70) — Bearish Pullback Risk")
        elif 50 <= rsi <= 65:
            bull_score += 1
            signals.append("RSI Bullish Momentum Zone")

        if macd_hist > 0 and macd > macd_sig:
            bull_score += 2
            signals.append("MACD Bullish Crossover")
        elif macd_hist < 0 and macd < macd_sig:
            bear_score += 2
            signals.append("MACD Bearish Crossover")

        if last_price > ema20 > ema50:
            bull_score += 2
            signals.append("EMA Alignment: Price > EMA20 > EMA50 (Uptrend)")
        elif last_price < ema20 < ema50:
            bear_score += 2
            signals.append("EMA Alignment: Price < EMA20 < EMA50 (Downtrend)")

        if last_price > sma200:
            bull_score += 1
            signals.append("Price Above 200 SMA (Long-term Bullish)")
        else:
            bear_score += 1
            signals.append("Price Below 200 SMA (Long-term Bearish)")

        if vol_expansion:
            if last_price > closes[-2]:
                bull_score += 1
                signals.append("Volume Expansion on Price Rise")
            else:
                bear_score += 1
                signals.append("Volume Expansion on Sell-off")

        if bull_score > bear_score + 1:
            verdict = "BULLISH"
            trend = "Strong Uptrend"
        elif bear_score > bull_score + 1:
            verdict = "BEARISH"
            trend = "Downtrend"
        else:
            verdict = "NEUTRAL"
            trend = "Sideways / Consolidation"

        return {
            "rsi_14": rsi,
            "macd": macd,
            "macd_signal": macd_sig,
            "macd_hist": macd_hist,
            "ema_20": ema20,
            "ema_50": ema50,
            "sma_200": sma200,
            "bb_upper": bb_upper,
            "bb_lower": bb_lower,
            "atr_14": atr,
            "technical_verdict": verdict,
            "trend": trend,
            "support_level": support,
            "resistance_level": resistance,
            "bull_score": bull_score,
            "bear_score": bear_score,
            "signals": signals
        }
