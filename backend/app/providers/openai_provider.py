"""
OPPARCH AI — OpenAI API Provider
Enables user-specific OpenAI (GPT-4o-mini) API integration.
Uses user's own API key configured in AI Settings.
"""
import logging
import json
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions"


class OpenAIProvider:
    """
    Direct client for OpenAI API (gpt-4o-mini).
    Operates statelessly using user-supplied API key.
    """

    @classmethod
    async def test_connection(cls, api_key: str) -> Dict[str, Any]:
        """
        Validates whether the user's OpenAI API key is valid.
        """
        if not api_key or not api_key.strip():
            return {"valid": False, "error": "OpenAI API key is empty."}

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Respond with 'ONLINE'"}],
            "max_tokens": 10,
            "temperature": 0.1
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(OPENAI_API_ENDPOINT, json=payload, headers=headers)
                if res.status_code == 200:
                    return {"valid": True, "model": "gpt-4o-mini", "message": "OpenAI API connected successfully."}
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
        Executes a chat completion against OpenAI gpt-4o-mini.
        """
        if not api_key or not api_key.strip():
            logger.warning("[OpenAI] No API key provided.")
            return None

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(OPENAI_API_ENDPOINT, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "").strip()
                logger.warning(f"[OpenAI API error {res.status_code}]: {res.text[:200]}")
                return None
        except Exception as e:
            logger.warning(f"[OpenAI Exception]: {e}")
            return None

    @classmethod
    async def generate_json(
        cls,
        prompt: str,
        api_key: str,
        temperature: float = 0.1
    ) -> Optional[Dict[str, Any]]:
        """
        Generates structured JSON response from OpenAI.
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
            logger.debug(f"[OpenAI JSON Parse Error]: {e}")
            return None
