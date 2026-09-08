"""
OPPARCH AI — Local Ollama Connector & Health Tool
=============================================================================
This lightweight utility helps users connect their local Ollama instance
(running on http://127.0.0.1:11434) with OPPARCH AI.

Usage:
    python local_ollama_connector.py check
    python local_ollama_connector.py tunnel --port 11434
=============================================================================
"""
import sys
import json
import httpx

OLLAMA_LOCAL_URL = "http://127.0.0.1:11434"

def check_local_ollama():
    print("=" * 60)
    print("  OPPARCH AI — Local Ollama Diagnostic & Connector")
    print("=" * 60)
    print(f"[*] Testing connection to: {OLLAMA_LOCAL_URL} ...")

    try:
        with httpx.Client(timeout=4.0) as client:
            res = client.get(f"{OLLAMA_LOCAL_URL}/api/tags")
            if res.status_code == 200:
                data = res.json()
                models = [m.get("name") for m in data.get("models", [])]
                print(f"[+] Status: ONLINE")
                print(f"[+] Installed Models ({len(models)}):")
                for m in models:
                    print(f"    - {m}")
                if "qwen3:4b" in models or any("qwen" in m for m in models):
                    print("\n[+] Recommended model detected: Qwen is installed and ready!")
                else:
                    print("\n[!] Recommended: Run 'ollama pull qwen3:4b' for best local analysis.")
                return True
            else:
                print(f"[-] Ollama returned HTTP {res.status_code}")
                return False
    except Exception as e:
        print(f"[-] Ollama is NOT reachable on {OLLAMA_LOCAL_URL}")
        print(f"    Error: {e}")
        print("\nTo start Ollama:")
        print("  1. Launch the Ollama desktop app or run 'ollama serve' in a terminal.")
        print("  2. Ensure port 11434 is open locally.")
        print("  3. For cloud-hosted OPPARCH AI (Render + Vercel), use OpenAI or Gemini,")
        print("     or run OPPARCH AI locally via run_opparch.bat for full local Ollama support.")
        return False

if __name__ == "__main__":
    check_local_ollama()
