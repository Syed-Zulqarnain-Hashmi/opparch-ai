"""
OPPARCH AI — Project → DevArcher AI Matching & Proposal Engine
Powered by Local Ollama (qwen3:4b).
Calculates:
  - Client Need Analysis & Pain Points
  - Required Technologies & Complexity
  - Recommended DevArcher Service & Match Score (0–100)
  - Estimated Project Value ($) & Urgency
  - Full Ready-to-Send Proposal Draft
  - 4 Key Discovery Questions (Requirements, Features, Budget, Timeline)
"""
import logging
import json
from typing import Dict, Any, List, Optional
from app.providers.ollama_provider import OllamaProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class DevArcherMatchingEngine:
    """
    Synthesizes freelance projects and public RFPs against DevArcher service capabilities using local Ollama LLM.
    """

    SERVICES_MAP = [
        {"id": "web-dev", "name": "Full-Stack Web Development (Next.js / Python / React)", "keywords": ["website", "web", "next.js", "react", "full-stack", "backend", "frontend", "portal", "saas"]},
        {"id": "ecom", "name": "E-Commerce Website & Storefront (Shopify / Custom / Stripe)", "keywords": ["ecommerce", "e-commerce", "store", "shop", "shopify", "woocommerce", "cart", "clothing"]},
        {"id": "uiux", "name": "UI/UX & Mobile App Design (Figma / iOS / Android)", "keywords": ["ui", "ux", "design", "figma", "mobile", "app", "ios", "android", "flutter", "react native"]},
        {"id": "seo-opt", "name": "SEO & Web Performance Optimization", "keywords": ["seo", "speed", "performance", "optimization", "ranking", "google", "audit"]},
        {"id": "ai-auto", "name": "AI Integration, LLM & Workflow Automation", "keywords": ["ai", "llm", "automation", "python", "ollama", "bot", "crawler", "agent", "data"]},
        {"id": "branding", "name": "Branding & Visual Identity System", "keywords": ["branding", "logo", "identity", "graphic", "visual", "guidelines"]}
    ]

    @classmethod
    def deterministic_match(cls, title: str, description: str) -> Dict[str, Any]:
        text = f"{title} {description}".lower()

        best_service = cls.SERVICES_MAP[0]["name"]
        max_hits = 0

        for srv in cls.SERVICES_MAP:
            hits = sum(1 for kw in srv["keywords"] if kw in text)
            if hits > max_hits:
                max_hits = hits
                best_service = srv["name"]

        # Calculate fit score
        fit_score = min(98, 70 + (max_hits * 6)) if max_hits > 0 else 78

        # Estimated value based on project cues
        if any(w in text for w in ["enterprise", "saas", "mobile app", "custom platform", "ai"]):
            val_est = "$2,500 – $6,000 USD"
            urgency = "HIGH (Enterprise Need)"
            complexity = "High Complexity"
        elif any(w in text for w in ["ecommerce", "e-commerce", "shopify", "portal", "full-stack"]):
            val_est = "$1,200 – $3,000 USD"
            urgency = "MEDIUM (Active Commercial Goal)"
            complexity = "Moderate Complexity"
        else:
            val_est = "$600 – $1,800 USD"
            urgency = "STANDARD (Ready for Execution)"
            complexity = "Standard Scope"

        return {
            "recommended_service": best_service,
            "fit_score": fit_score,
            "estimated_project_value": val_est,
            "urgency": urgency,
            "complexity": complexity,
            "opportunity_score": fit_score,
            "pain_point": "Client needs high-quality digital execution with reliable delivery timeline and modern architecture.",
            "recommended_approach": f"Deploy a modular {best_service} solution with responsive design, rapid iteration, and direct client consultation.",
            "proposal_draft": (
                f"Hello,\n\n"
                f"I reviewed your project requirements for '{title}'.\n\n"
                f"Our agency, DevArcher, specializes in {best_service}. We deliver robust, high-performance digital solutions with clean code, modern UX, and reliable delivery.\n\n"
                f"To ensure we align perfectly with your vision, I'd love to ask:\n"
                f"1. What are the must-have core requirements and deliverables for this project?\n"
                f"2. Are there any specific third-party integrations or custom features needed?\n"
                f"3. What is your target budget range for this scope?\n"
                f"4. What is your desired launch timeline?\n\n"
                f"Looking forward to discussing how we can deliver this efficiently for you.\n\n"
                f"Best regards,\n"
                f"Syed Zulqarnain\n"
                f"DevArcher / OPPARCH AI"
            ),
            "discovery_questions": [
                "What exactly do you need built or upgraded for this project?",
                "Which specific features, third-party integrations, or user flows are required?",
                "What is your allocated budget range for this scope?",
                "What is your desired timeline or target launch date?"
            ]
        }

    @classmethod
    async def match_project(cls, title: str, description: str, budget_str: str = "") -> Dict[str, Any]:
        """
        Executes Ollama AI project evaluation, falling back to deterministic matching if Ollama is offline.
        """
        base_match = cls.deterministic_match(title, description)

        prompt = (
            f"You are the Lead Opportunity Architect for DevArcher digital services.\n"
            f"Analyze this client project request:\n"
            f"Title: {title}\n"
            f"Budget: {budget_str}\n"
            f"Description: {description}\n\n"
            f"Respond with a clean JSON object containing:\n"
            f"- client_needs: string (summary of what client needs)\n"
            f"- required_technologies: array of strings\n"
            f"- complexity: string (Low, Moderate, High)\n"
            f"- recommended_service: string\n"
            f"- estimated_value: string (e.g. '$800 - $2,000 USD')\n"
            f"- urgency: string (Low, Medium, High)\n"
            f"- fit_score: integer (0 to 100)\n"
            f"- client_pain_point: string\n"
            f"- recommended_approach: string\n"
            f"- proposal_draft: string (consultative pitch without spam)\n"
            f"- discovery_questions: array of 4 strings probing requirements, features, budget, timeline."
        )

        ollama_res = await OllamaProvider.generate_completion(prompt=prompt, temperature=0.2)
        if ollama_res:
            try:
                # Extract JSON block if wrapped in markdown
                raw_json = ollama_res
                if "```json" in raw_json:
                    raw_json = raw_json.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_json:
                    raw_json = raw_json.split("```")[1].split("```")[0].strip()
                parsed = json.loads(raw_json)

                return {
                    "recommended_service": parsed.get("recommended_service", base_match["recommended_service"]),
                    "fit_score": parsed.get("fit_score", base_match["fit_score"]),
                    "estimated_project_value": parsed.get("estimated_value", base_match["estimated_project_value"]),
                    "urgency": parsed.get("urgency", base_match["urgency"]),
                    "complexity": parsed.get("complexity", base_match["complexity"]),
                    "opportunity_score": parsed.get("fit_score", base_match["opportunity_score"]),
                    "client_needs": parsed.get("client_needs", title),
                    "required_technologies": parsed.get("required_technologies", ["Next.js", "Python", "TypeScript"]),
                    "pain_point": parsed.get("client_pain_point", base_match["pain_point"]),
                    "recommended_approach": parsed.get("recommended_approach", base_match["recommended_approach"]),
                    "proposal_draft": parsed.get("proposal_draft", base_match["proposal_draft"]),
                    "discovery_questions": parsed.get("discovery_questions", base_match["discovery_questions"]),
                    "ai_powered_by": settings.OLLAMA_MODEL
                }
            except Exception as e:
                logger.debug(f"[DevArcherMatch] JSON parse failed: {e}")

        return {
            **base_match,
            "client_needs": title,
            "required_technologies": ["Next.js", "React", "Python", "Tailwind CSS"],
            "ai_powered_by": "Rule Engine (Ollama Fallback)"
        }
