"""
OPPARCH AI — Gemini API Provider
Enables user-specific Google Gemini 1.5 Flash API integration.
Uses user's own API key configured in AI Settings.
"""
import logging
import json
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


class GeminiProvider:
    """
    Direct client for Google Gemini 1.5 Flash API.
    Operates statelessly using user-supplied API key.
    """

    @classmethod
    async def test_connection(cls, api_key: str) -> Dict[str, Any]:
        """
        Validates whether the user's Gemini API key is valid.
        """
        if not api_key or not api_key.strip():
            return {"valid": False, "error": "Gemini API key is empty."}

        url = f"{GEMINI_API_ENDPOINT}?key={api_key.strip()}"
        payload = {
            "contents": [{"parts": [{"text": "Respond with 'ONLINE'"}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 10}
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    return {"valid": True, "model": "gemini-1.5-flash", "message": "Gemini API connected successfully."}
                else:
                    err_json = res.json().get("error", {})
                    msg = err_json.get("message", f"HTTP {res.status_code}")
                    return {"valid": False, "error": msg}
        except Exception as e:
            return {"valid": False, "error": str(e)}

    @classmethod
    async def generate_completion(
        cls,
        prompt: str,
        api_key: str,
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> Optional[str]:
        """
        Executes a completion prompt against Gemini 1.5 Flash.
        """
        if not api_key or not api_key.strip():
            logger.warning("[Gemini] No API key provided.")
            return None

        url = f"{GEMINI_API_ENDPOINT}?key={api_key.strip()}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                logger.warning(f"[Gemini API error {res.status_code}]: {res.text[:200]}")
                return None
        except Exception as e:
            logger.warning(f"[Gemini Exception]: {e}")
            return None

    @classmethod
    async def generate_json(
        cls,
        prompt: str,
        api_key: str,
        temperature: float = 0.1
    ) -> Optional[Dict[str, Any]]:
        """
        Generates structured JSON response from Gemini 1.5 Flash.
        """
        text = await cls.generate_completion(prompt=prompt, api_key=api_key, temperature=temperature)
        if not text:
            return None

        try:
            raw = text
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            return json.loads(raw)
        except Exception as e:
            logger.debug(f"[Gemini JSON Parse Error]: {e}")
            return None
