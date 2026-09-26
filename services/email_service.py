import asyncio
import smtplib
import ssl
from email.message import EmailMessage

import httpx

from app.config import settings


def _send_smtp(to: str, subject: str, text: str, html_body: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    msg["To"] = to
    msg.set_content(text)
    msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        s.send_message(msg)


async def send_email(to: str, subject: str, text: str, html_body: str) -> None:
    if settings.RESEND_API_KEY:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [to],
                    "subject": subject,
                    "text": text,
                    "html": html_body,
                },
            )
            r.raise_for_status()
        return

    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        await asyncio.to_thread(_send_smtp, to, subject, text, html_body)
        return

    raise RuntimeError("Email is not configured on the server (set SMTP_* in .env)")