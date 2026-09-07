"""
OPPARCH AI - Local Ollama AI Provider
Default model: qwen3:4b
"""
import re
import json
import logging
import socket
import asyncio
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings


logger = logging.getLogger(__name__)

# Separate timeout for JSON calls (thinking model needs more time)
JSON_TIMEOUT = max(settings.OLLAMA_TIMEOUT, 150)


class OllamaProvider:
    """
    Local AI Provider via Ollama.
    Supports multi-host fallback, socket-level port detection, and dynamic model discovery.
    """

    @classmethod
    def _candidate_urls(cls) -> List[str]:
        urls = [settings.OLLAMA_BASE_URL.rstrip("/")]
        if "127.0.0.1" in settings.OLLAMA_BASE_URL:
            urls.append("http://localhost:11434")
        elif "localhost" in settings.OLLAMA_BASE_URL:
            urls.append("http://127.0.0.1:11434")
        return urls

    @classmethod
    def _default_model(cls) -> str:
        return settings.OLLAMA_MODEL

    @classmethod
    def is_port_open(cls, host: str = "127.0.0.1", port: int = 11434, timeout: float = 0.15) -> bool:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except Exception:
            return False

    @classmethod
    async def get_installed_models(cls) -> List[str]:
        for base_url in cls._candidate_urls():
            try:
                async with httpx.AsyncClient(timeout=1.0) as client:
                    res = await client.get(f"{base_url}/api/tags")
                    if res.status_code == 200:
                        models_data = res.json().get("models", [])
                        return [m.get("name", "") for m in models_data if m.get("name")]
            except Exception:
                continue
        return []

    @classmethod
    async def check_status(cls) -> Dict[str, Any]:
        """Checks Ollama reachability and lists available models."""
        for base_url in cls._candidate_urls():
            try:
                async with httpx.AsyncClient(timeout=1.5) as client:
                    res = await client.get(f"{base_url}/api/tags")
                    if res.status_code == 200:
                        data = res.json()
                        models = [m["name"] for m in data.get("models", [])]
                        has_default = any(cls._default_model().split(":")[0] in m for m in models)
                        active_model = models[0] if models else cls._default_model()
                        return {
                            "online": True,
                            "status": "ONLINE",
                            "endpoint": f"{base_url}/api/generate",
                            "base_url": base_url,
                            "installed_models": models,
                            "models": models,
                            "selected_model": cls._default_model(),
                            "configured_model": cls._default_model(),
                            "active_model": active_model,
                            "default_model": cls._default_model(),
                            "default_model_ready": has_default,
                            "installed": True,
                            "error_message": None,
                            "message": f"Ollama online at {base_url} with {len(models)} installed model(s)."
                        }
            except Exception:
                continue
        return {
            "online": False,
            "status": "OFFLINE",
            "endpoint": f"{settings.OLLAMA_BASE_URL}/api/generate",
            "base_url": settings.OLLAMA_BASE_URL,
            "installed_models": [],
            "models": [],
            "selected_model": cls._default_model(),
            "configured_model": cls._default_model(),
            "active_model": cls._default_model(),
            "default_model": cls._default_model(),
            "default_model_ready": False,
            "installed": False,
            "error_message": f"Ollama not reachable on {settings.OLLAMA_BASE_URL} or localhost:11434.",
            "message": f"Ollama not reachable on {settings.OLLAMA_BASE_URL} or localhost:11434. Running in rule-based fallback mode."
        }


    @classmethod
    async def generate_completion(
        cls,
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3
    ) -> Optional[str]:
        """Calls Ollama /api/generate with multi-host fallback."""
        if not await asyncio.to_thread(cls.is_port_open):
            return None

        use_model = model or cls._default_model()
        payload: Dict[str, Any] = {
            "model": use_model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature}
        }
        if system_prompt:
            payload["system"] = system_prompt

        for base_url in cls._candidate_urls():
            try:
                async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
                    res = await client.post(f"{base_url}/api/generate", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data.get("response", "").strip()
            except Exception as e:
                logger.debug(f"[Ollama] Generation on {base_url} error: {e}")
        return None

    @classmethod
    async def generate_json(
        cls,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.1
    ) -> Optional[Dict[str, Any]]:
        """
        Generates structured JSON from Ollama.
        Uses a direct /api/generate call with a longer timeout.
        Does NOT use format=json (causes empty responses with thinking models like qwen3:4b).
        Relies on prompt engineering + robust text parsing instead.
        """
        if not await asyncio.to_thread(cls.is_port_open):
            return None

        use_model = model or cls._default_model()
        payload: Dict[str, Any] = {
            "model": use_model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature}
        }


        for base_url in cls._candidate_urls():
            try:
                async with httpx.AsyncClient(timeout=JSON_TIMEOUT) as client:
                    res = await client.post(f"{base_url}/api/generate", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        raw_text = data.get("response", "").strip()
                        if raw_text:
                            result = cls._parse_json_from_text(raw_text)
                            if result is not None:
                                return result
                            logger.debug(f"[Ollama JSON] Parse failed. raw[:200]={raw_text[:200]!r}")
                        else:
                            logger.warning("[Ollama JSON] Empty response from model.")
                        break
            except Exception as e:
                logger.debug(f"[Ollama] JSON generation error on {base_url}: {e}")
        return None

    @classmethod
    def _parse_json_from_text(cls, text: str) -> Optional[Dict[str, Any]]:
        """
        Robustly extracts a JSON object from raw model output.
        Handles think-tags, markdown fences, and surrounding prose.
        """
        raw = text

        # Strip reasoning/thinking blocks (qwen3, deepseek-r1, etc.)
        raw = re.sub(r"<think>[\s\S]*?</think>", "", raw, flags=re.IGNORECASE).strip()
        raw = re.sub(r"<thinking>[\s\S]*?</thinking>", "", raw, flags=re.IGNORECASE).strip()
        raw = re.sub(r"\[THINKING\][\s\S]*?\[/THINKING\]", "", raw, flags=re.IGNORECASE).strip()

        # Strip markdown code fences
        for fence_marker in ["```json", "```"]:
            if fence_marker in raw:
                parts = raw.split(fence_marker, 1)
                if len(parts) > 1:
                    raw = parts[1].split("```", 1)[0].strip()
                    break

        # Direct parse attempt (clean JSON)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Find outermost { ... } block
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(raw[start:end + 1])
            except json.JSONDecodeError as e:
                logger.debug(f"[Ollama JSON] Bracket extraction failed: {e}")

        logger.warning(f"[Ollama JSON] Could not extract JSON. raw[:200]={raw[:200]!r}")
        return None

    @classmethod
    async def analyze_business(
        cls,
        business_name: str,
        industry: str,
        country: str,
        city: Optional[str],
        has_website: bool,
        website_status: str,
        phone: Optional[str],
        email: Optional[str],
        audit_evidence: List[str],
        missing_features: List[str],
        opportunity_score: int,
        data_mode: str = "REAL_FREE",
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyzes a business opportunity using local Ollama model.
        Uses a concise template-fill prompt to minimize reasoning chain length.
        """
        location = (city + ", " if city else "") + country
        # Keep prompt short to reduce reasoning chain length for faster response
        prompt = (
            "Fill in this JSON for a business digital audit. Respond with ONLY the JSON object.\n\n"
            f"Business: {business_name} | Industry: {industry} | Location: {location}\n"
            f"Has website: {has_website} | Missing: {', '.join(missing_features[:3]) if missing_features else 'none'}\n"
            f"Score: {opportunity_score}/100\n\n"
            '{"reasoning":"<2 sentences on why they need digital services>'
            '","recommended_service":"<best DevArcher service>'
            '","outreach_hook":"<one pitch sentence>'
            '","urgency":"High"}'
        )

        res = await cls.generate_json(prompt=prompt, model=model, temperature=0.2)
        if res and isinstance(res, dict) and "reasoning" in res:
            return {
                "ai_analyzed": True,
                "ai_model": model or cls._default_model(),
                "reasoning": res.get("reasoning", ""),
                "recommended_service": res.get("recommended_service", "Full-Stack Web Development"),
                "outreach_hook": res.get("outreach_hook", ""),
                "urgency": res.get("urgency", "High")
            }

        logger.warning(f"[OllamaProvider] analyze_business fallback for: {business_name}")
        return {
            "ai_analyzed": False,
            "ai_model": "Deterministic Rule Engine",
            "reasoning": f"{business_name} in {location} lacks digital presence — high-fit client for DevArcher.",
            "recommended_service": "Full-Stack Web Development" if not has_website else "SEO & Performance Optimization",
            "outreach_hook": f"Help {business_name} win more customers with a professional digital presence.",
            "urgency": "High" if not has_website else "Medium"
        }
