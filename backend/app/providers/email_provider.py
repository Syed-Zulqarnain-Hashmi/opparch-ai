import os
import smtplib
import imaplib
import email
from email.header import decode_header
import datetime
import logging
import re
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, List


from app.core.config import settings
from app.providers.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

# Global in-memory overrides for Admin configuration
_EMAIL_SETTINGS_OVERRIDE: Dict[str, Any] = {}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class EmailProvider:
    """
    Production-grade Outbound Business Email Outreach & Inbound IMAP Reply Intelligence Engine.
    Configured for Zoho Mail (contact@devarcher.com / mail.zoho.com:587 STARTTLS).
    """

    @classmethod
    def get_smtp_config(cls) -> Dict[str, Any]:
        """
        Returns active SMTP and IMAP configuration.
        Priority: In-memory Admin override -> Environment variables -> Default settings.
        """
        return {
            "host": _EMAIL_SETTINGS_OVERRIDE.get("smtp_host") or os.getenv("SMTP_HOST", settings.SMTP_HOST),
            "port": int(_EMAIL_SETTINGS_OVERRIDE.get("smtp_port") or os.getenv("SMTP_PORT", settings.SMTP_PORT)),
            "username": _EMAIL_SETTINGS_OVERRIDE.get("smtp_username") or os.getenv("SMTP_USERNAME", settings.SMTP_USERNAME),
            "password": _EMAIL_SETTINGS_OVERRIDE.get("smtp_password") or os.getenv("SMTP_PASSWORD", settings.SMTP_PASSWORD),
            "from_email": _EMAIL_SETTINGS_OVERRIDE.get("from_email") or os.getenv("SMTP_FROM", settings.SMTP_FROM),
            "use_tls": _EMAIL_SETTINGS_OVERRIDE.get("use_tls", True) if "use_tls" in _EMAIL_SETTINGS_OVERRIDE else settings.SMTP_USE_TLS,
            "imap_host": _EMAIL_SETTINGS_OVERRIDE.get("imap_host") or os.getenv("IMAP_HOST", settings.IMAP_HOST),
            "imap_port": int(_EMAIL_SETTINGS_OVERRIDE.get("imap_port") or os.getenv("IMAP_PORT", settings.IMAP_PORT)),
            "delay_seconds": int(_EMAIL_SETTINGS_OVERRIDE.get("delay_seconds") or os.getenv("OUTREACH_DELAY_SECONDS", settings.OUTREACH_DELAY_SECONDS)),
            "batch_size": int(_EMAIL_SETTINGS_OVERRIDE.get("batch_size") or os.getenv("OUTREACH_BATCH_SIZE", settings.OUTREACH_BATCH_SIZE))
        }

    @classmethod
    def update_admin_email_config(cls, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates in-memory email settings from Admin Command Center without restarting backend.
        """
        for k, v in config.items():
            if v is not None and v != "":
                _EMAIL_SETTINGS_OVERRIDE[k] = v
        return cls.get_smtp_config()

    @classmethod
    def validate_email_syntax(cls, email_str: Optional[str]) -> bool:
        """
        Validates email syntax using standard pattern.
        """
        if not email_str or not isinstance(email_str, str):
            return False
        cleaned = email_str.strip()
        if len(cleaned) < 5 or "@" not in cleaned:
            return False
        return bool(EMAIL_REGEX.match(cleaned))

    @classmethod
    def test_smtp_connection(cls, test_recipient: Optional[str] = None) -> Dict[str, Any]:
        """
        Tests connection, STARTTLS handshake, authentication to Zoho SMTP server,
        and optionally sends a real test email to an admin-specified recipient.
        Never leaks passwords in responses.
        """
        cfg = cls.get_smtp_config()
        if not cfg["password"]:
            return {
                "status": "UNCONFIGURED",
                "success": False,
                "message": "SMTP password is not configured. Please set SMTP_PASSWORD in backend/.env or in Admin Email Settings.",
                "host": cfg["host"],
                "port": cfg["port"],
                "username": cfg["username"]
            }

        try:
            server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=12)
            if cfg["use_tls"]:
                server.starttls()
            server.login(cfg["username"], cfg["password"])

            if test_recipient and cls.validate_email_syntax(test_recipient):
                msg = MIMEMultipart()
                msg["From"] = f"DevArcher Team <{cfg['from_email']}>"
                msg["To"] = test_recipient.strip()
                msg["Subject"] = "OPPARCH AI — Zoho SMTP Verification Test"
                
                body = f"""Hello,

This is an automated verification email sent by OPPARCH AI via Zoho Mail SMTP.

Connection Details:
- SMTP Host: {cfg['host']}:{cfg['port']} (STARTTLS)
- Sender: {cfg['from_email']}
- Timestamp: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

Your Zoho Mail integration is fully operational and ready for business outreach campaigns!

Best regards,
DevArcher Team / OPPARCH AI
contact@devarcher.com
"""
                msg.attach(MIMEText(body, "plain", "utf-8"))
                server.send_message(msg)
                server.quit()

                return {
                    "status": "SUCCESS",
                    "success": True,
                    "message": f"SMTP handshake and authentication successful. Test email dispatched to {test_recipient}.",
                    "host": cfg["host"],
                    "port": cfg["port"],
                    "from_email": cfg["from_email"],
                    "test_sent": True
                }

            server.quit()
            return {
                "status": "SUCCESS",
                "success": True,
                "message": f"SMTP connection and authentication to {cfg['host']}:{cfg['port']} succeeded.",
                "host": cfg["host"],
                "port": cfg["port"],
                "from_email": cfg["from_email"],
                "test_sent": False
            }

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"[Zoho SMTP Auth Error] {e}")
            return {
                "status": "AUTH_FAILED",
                "success": False,
                "message": f"Authentication failed for {cfg['username']} on {cfg['host']}. Please check your Zoho Mail password or application-specific password."
            }
        except (smtplib.SMTPConnectError, TimeoutError, OSError) as e:
            logger.error(f"[Zoho SMTP Connection Error] {e}")
            return {
                "status": "CONNECTION_FAILED",
                "success": False,
                "message": f"Could not connect to {cfg['host']}:{cfg['port']}. Please check network connectivity and port settings."
            }
        except Exception as e:
            logger.error(f"[Zoho SMTP Error] {e}")
            return {
                "status": "SMTP_ERROR",
                "success": False,
                "message": f"SMTP error occurred: {str(e)}"
            }

    @classmethod
    async def generate_outreach_email(
        cls,
        business_name: str,
        industry: str,
        country: str,
        city: Optional[str] = None,
        website_url: Optional[str] = None,
        has_website: bool = False,
        contact_person: Optional[str] = None,
        evidence_points: Optional[List[str]] = None,
        recommended_services: Optional[List[str]] = None,
        opportunity_reason: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generates a highly personalized, grounded cold outreach email tailored to the lead's exact situation:
        - Case A (No Website): Recommend website development, mobile optimization, lead capture.
        - Case B (Outdated Website): Recommend UI/UX redesign, mobile performance, modern tech stack.
        - Case C (Weak SEO/Digital Presence): Recommend local SEO, search ranking, Google visibility.
        - Case D (E-Commerce/Ordering): Recommend online catalog, e-commerce ordering, payment workflows.
        - Case E (General Digital Gap): Recommend tailored custom software / digital solution.
        """
        greeting_target = f"Hi {contact_person.strip()}," if (contact_person and contact_person.strip()) else f"Dear {business_name} Team,"
        evidence_list = evidence_points or []
        services_list = recommended_services or ["Full-Stack Web Development & Modern Digital Solutions"]
        loc_str = f"{city}, {country}" if city else country


        # Determine Primary Case
        is_ecommerce_industry = any(k in industry.lower() for k in ["store", "shop", "boutique", "retail", "clothing", "fashion", "pharmacy", "restaurant"])
        
        if not has_website or not website_url:
            case_type = "CASE_A_NO_WEBSITE"
            case_guidance = (
                "Case A (No Official Website Detected): The business has no active website listed in public registries. "
                "Highlight the missed customer opportunities in their local market, and propose developing a fast, mobile-friendly "
                "business website with inquiry/contact functionality to build trust and capture direct leads."
            )
        elif any("outdated" in str(e).lower() or "speed" in str(e).lower() or "mobile" in str(e).lower() for e in evidence_list):
            case_type = "CASE_B_OUTDATED_WEBSITE"
            case_guidance = (
                "Case B (Website Redesign & Performance): The business has an existing website that needs visual modernization, "
                "faster page speed, or mobile responsiveness. Propose a modern UI/UX redesign that improves customer conversion."
            )
        elif is_ecommerce_industry and any("order" in str(e).lower() or "catalog" in str(e).lower() or "ecommerce" in str(e).lower() for e in evidence_list):
            case_type = "CASE_D_ECOMMERCE_ORDERING"
            case_guidance = (
                "Case D (E-commerce / Online Ordering): Recommend a modern e-commerce storefront or digital catalog with online ordering "
                "and WhatsApp / payment workflows so customers can order directly."
            )
        elif any("seo" in str(e).lower() or "search" in str(e).lower() for e in evidence_list):
            case_type = "CASE_C_WEAK_SEO"
            case_guidance = (
                "Case C (SEO & Local Visibility): The business has low search visibility. Propose technical SEO, local search ranking "
                "optimization, and Google visibility improvements."
            )
        else:
            case_type = "CASE_E_GENERAL_DIGITAL"
            case_guidance = (
                "Case E (Digital Presence Architecture): Recommend a custom DevArcher digital solution tailored to the specific business "
                "to streamline client operations and digital engagement."
            )

        prompt = f"""You are a professional business development consultant writing an outreach email on behalf of DevArcher / OPPARCH AI.
Write a personalized, concise, consultative cold email to a business based on verified public information.

Business Information:
- Business Name: {business_name}
- Industry: {industry}
- Location: {loc_str}
- Website: {website_url if has_website else 'No official website found'}
- Observed Public Audit Points: {', '.join(evidence_list) if evidence_list else (opportunity_reason or 'Digital expansion opportunity')}
- Recommended Solution: {', '.join(services_list)}
- Scenario Strategy: {case_guidance}

Email Guidelines:
1. Tone: Consultative, professional, value-driven, respectful (NOT spammy, NO fake urgency, NO pretending to be an existing customer).
2. Grounded Truth: Only refer to the observed business type and verified public information. Never hallucinate fake technical glitches, fake statistics, or fake relationships.
3. Structure:
   - Polite personalized opening.
   - Specific observation about their business in {loc_str}.
   - Clear value proposition explaining how the recommended solution will help them acquire more customers and streamline inquiries.
   - Simple, low-friction call-to-action (e.g. open to a brief 5-minute discussion or seeing a demo concept).
   - Sign off as:
     DevArcher Team
     OPPARCH AI & DevArcher
     Email: contact@devarcher.com
     Website: https://devarcher.com

Return ONLY valid JSON with keys "subject" and "body".
"""
        # Try local AI or configured LLM with fast fallback
        try:
            res = await asyncio.wait_for(OllamaProvider.generate_json(prompt), timeout=6.0)
            if res and isinstance(res, dict) and "subject" in res and "body" in res:
                return {
                    "subject": res["subject"].strip(),
                    "body": res["body"].strip()
                }
        except (asyncio.TimeoutError, Exception) as e:
            logger.debug(f"[EmailProvider] Local AI timeout or unavailable ({e}), using grounded template.")


        # Deterministic Grounded Fallback Templates (Cases A - E)
        if case_type == "CASE_A_NO_WEBSITE":
            subj = f"A quick idea for {business_name}'s online presence in {city or country}"
            body = f"""{greeting_target}

I hope this message finds you well.

While researching notable {industry.lower()} businesses in {loc_str}, we noticed that {business_name} does not currently have an active official website listed for prospective clients.

In today's digital landscape, having a fast, mobile-friendly website with online inquiries and service information helps local customers discover your business and reach out with confidence.

At DevArcher, we specialize in building high-performing, custom business websites and digital solutions that turn online visitors into loyal clients.

We would be delighted to put together a brief concept preview for {business_name}. Would you be open to a quick 5-minute conversation or receiving a sample design outline?

Warm regards,

DevArcher Team
OPPARCH AI & DevArcher
Email: contact@devarcher.com
Website: https://devarcher.com
"""
        elif case_type == "CASE_B_OUTDATED_WEBSITE":
            subj = f"Modern website & user experience upgrade for {business_name}"
            body = f"""{greeting_target}

I hope you are having a productive week.

We recently reviewed {business_name}'s digital presence and wanted to share a few quick ideas regarding your website experience. 

With modern responsive UI/UX and speed optimization, businesses in the {industry.lower()} space can significantly boost customer engagement and conversion rates on mobile devices.

At DevArcher, we build tailored, high-speed web platforms that elevate your brand and streamline customer inquiries.

Would you be open to seeing a quick audit overview with specific suggestions for {business_name}?

Best regards,

DevArcher Team
OPPARCH AI & DevArcher
Email: contact@devarcher.com
Website: https://devarcher.com
"""
        elif case_type == "CASE_D_ECOMMERCE_ORDERING":
            subj = f"Streamlined online ordering & digital storefront for {business_name}"
            body = f"""{greeting_target}

I hope you are doing well.

While reviewing {industry.lower()} leaders in {loc_str}, we noticed a great opportunity for {business_name} to expand direct customer orders through a dedicated digital catalog and seamless ordering workflow.

At DevArcher, we develop custom e-commerce stores, WhatsApp-integrated ordering systems, and customer portals designed to boost direct sales without unnecessary third-party commissions.

Could we share a quick 2-minute demo of how this would look for {business_name}?

Warm regards,

DevArcher Team
OPPARCH AI & DevArcher
Email: contact@devarcher.com
Website: https://devarcher.com
"""
        elif case_type == "CASE_C_WEAK_SEO":
            subj = f"Improving local Google visibility for {business_name}"
            body = f"""{greeting_target}

I hope all is well with you.

We noticed that {business_name} has strong potential to capture more local search inquiries for {industry.lower()} in {loc_str} through targeted search visibility and technical SEO enhancements.

DevArcher helps growing businesses rank prominently on search engines, driving steady organic traffic and high-intent customer leads.

If you are interested, we would be happy to share a complimentary local visibility report for your team.

Best regards,

DevArcher Team
OPPARCH AI & DevArcher
Email: contact@devarcher.com
Website: https://devarcher.com
"""
        else:
            subj = f"Digital growth & custom web solutions for {business_name}"
            body = f"""{greeting_target}

I hope this email finds you well.

While exploring top {industry.lower()} establishments in {loc_str}, we identified several practical opportunities for {business_name} to strengthen its digital presence and automate customer inquiries.

At DevArcher, we partner with businesses to engineer modern full-stack web applications, custom customer workflows, and digital solutions that accelerate growth.

Would you be open to a brief conversation this week to explore how we can support your goals?

Warm regards,

DevArcher Team
OPPARCH AI & DevArcher
Email: contact@devarcher.com
Website: https://devarcher.com
"""


        return {
            "subject": subj,
            "body": body
        }

    @classmethod
    def send_email(
        cls,
        recipient_email: str,
        subject: str,
        body: str
    ) -> Dict[str, Any]:
        """
        Sends cold outreach email via Zoho SMTP (mail.zoho.com:587 STARTTLS).
        If unconfigured, records as QUEUED_SIMULATED for demo safety.
        Returns structured status and sanitized telemetry.
        """
        cfg = cls.get_smtp_config()
        clean_recipient = recipient_email.strip() if recipient_email else ""

        if not cls.validate_email_syntax(clean_recipient):
            return {
                "status": "INVALID_RECIPIENT",
                "success": False,
                "message": f"Recipient email address '{recipient_email}' is missing or malformed.",
                "recipient": recipient_email,
                "sender": cfg["from_email"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

        # If SMTP password is not set, simulate safely
        if not cfg["password"]:
            logger.info(f"[OUTREACH SIMULATION] Dispatched email to {clean_recipient} via {cfg['from_email']}")
            return {
                "status": "QUEUED_SIMULATED",
                "success": True,
                "message": f"Email prepared for {clean_recipient}. (SMTP credentials unconfigured — safely recorded in CRM outreach log).",
                "recipient": clean_recipient,
                "sender": cfg["from_email"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

        try:
            msg = MIMEMultipart()
            msg["From"] = f"DevArcher Team <{cfg['from_email']}>"
            msg["To"] = clean_recipient
            msg["Subject"] = subject
            msg["Reply-To"] = cfg["from_email"]
            msg.attach(MIMEText(body, "plain", "utf-8"))

            server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=15)
            if cfg["use_tls"]:
                server.starttls()
            server.login(cfg["username"], cfg["password"])
            server.send_message(msg)
            server.quit()

            logger.info(f"[Zoho SMTP Success] Email sent to {clean_recipient} via {cfg['from_email']}")
            return {
                "status": "SENT",
                "success": True,
                "message": f"Email successfully dispatched to {clean_recipient} via Zoho Mail SMTP.",
                "recipient": clean_recipient,
                "sender": cfg["from_email"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"[Zoho SMTP Auth Error] {e}")
            return {
                "status": "AUTH_FAILED",
                "success": False,
                "message": f"Zoho SMTP authentication failed for {cfg['username']}.",
                "recipient": clean_recipient,
                "sender": cfg["from_email"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        except (smtplib.SMTPConnectError, TimeoutError, OSError) as e:
            logger.error(f"[Zoho SMTP Connection Error] {e}")
            return {
                "status": "CONNECTION_FAILED",
                "success": False,
                "message": f"Connection failed to Zoho SMTP server {cfg['host']}:{cfg['port']}.",
                "recipient": clean_recipient,
                "sender": cfg["from_email"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"[Zoho SMTP General Error] {e}")
            return {
                "status": "SMTP_ERROR",
                "success": False,
                "message": f"SMTP delivery error: {str(e)}",
                "recipient": clean_recipient,
                "sender": cfg["from_email"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

    @classmethod
    async def check_inbound_replies(cls) -> List[Dict[str, Any]]:
        """
        Polls real Zoho IMAP inbox (imap.zoho.com:993 SSL) for unread client replies.
        Extracts sender, subject, date, and plain text content.
        """
        cfg = cls.get_smtp_config()
        if not cfg["password"]:
            return []

        received_emails: List[Dict[str, Any]] = []
        try:
            mail = imaplib.IMAP4_SSL(cfg["imap_host"], cfg["imap_port"])
            mail.login(cfg["username"], cfg["password"])
            mail.select("inbox")

            status, messages = mail.search(None, "UNSEEN")
            if status == "OK" and messages[0]:
                for num in messages[0].split()[-15:]:
                    _, data = mail.fetch(num, "(RFC822)")
                    for response_part in data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])
                            subject_raw = msg.get("Subject", "")
                            subject = ""
                            if subject_raw:
                                decoded_list = decode_header(subject_raw)
                                for text, enc in decoded_list:
                                    if isinstance(text, bytes):
                                        subject += text.decode(enc or "utf-8", errors="ignore")
                                    else:
                                        subject += str(text)
                            else:
                                subject = "No Subject"

                            from_ = msg.get("From", "")
                            message_id = msg.get("Message-ID", "")
                            in_reply_to = msg.get("In-Reply-To", "")

                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() == "text/plain":
                                        payload = part.get_payload(decode=True)
                                        if payload:
                                            body = payload.decode(errors="ignore")
                                        break
                            else:
                                payload = msg.get_payload(decode=True)
                                if payload:
                                    body = payload.decode(errors="ignore")

                            received_emails.append({
                                "from": from_,
                                "subject": subject,
                                "body": body.strip(),
                                "date": msg.get("Date"),
                                "message_id": message_id,
                                "in_reply_to": in_reply_to
                            })
            mail.close()
            mail.logout()
        except Exception as e:
            logger.debug(f"[Zoho IMAP Inbound] Error: {e}")

        return received_emails

    @classmethod
    async def analyze_client_reply(
        cls,
        business_name: str,
        reply_body: str
    ) -> Dict[str, Any]:
        """
        Uses AI to extract structured business requirements, budget, timeline, objections, and suggested response from incoming client replies.
        """
        prompt = f"""You are an AI Deal Assistant analyzing a client's email reply for {business_name}.

Client Email Reply:
\"\"\"
{reply_body}
\"\"\"

Extract the following as structured JSON:
- "requirements": list of specific features or services mentioned (e.g. ["Website", "Online Ordering", "Payment Gateway"])
- "budget": extracted budget or "Open for discussion"
- "timeline": extracted timeline or "Standard timeline"
- "technology": extracted tech preferences or "Modern Next.js / Python stack"
- "urgency": "High", "Medium", or "Low"
- "objections": list of concerns or objections mentioned
- "questions": list of questions asked by the client
- "summary": 1-2 sentence executive summary
- "recommended_response": polite consultative reply answering their points.

Return ONLY valid JSON.
"""
        res = await OllamaProvider.generate_json(prompt)
        if res and isinstance(res, dict):
            return res

        return {
            "requirements": ["Full-Stack Web Development", "Digital Transformation"],
            "budget": "Open for discussion",
            "timeline": "Immediate / 2-4 weeks",
            "technology": "Next.js / React / Python",
            "urgency": "Medium",
            "objections": [],
            "questions": ["Can you share portfolio samples and estimated pricing?"],
            "summary": f"{business_name} expressed positive interest and requested details regarding services and timeline.",
            "recommended_response": f"Hi {business_name} team,\n\nThank you for getting back to us! We would be delighted to assist you. I will prepare a tailored proposal outlining our deliverables, timeline, and budget options.\n\nCould we schedule a brief 10-minute discovery call this week?\n\nBest regards,\nDevArcher Team\ncontact@devarcher.com\nhttps://devarcher.com"
        }

