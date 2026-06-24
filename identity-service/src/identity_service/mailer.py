import logging
import smtplib
from email.message import EmailMessage
from typing import Protocol

from .config import Settings


class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class NullMailer:
    """Stub mailer — records messages instead of sending. Real SMTP is a later slice."""

    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent.append((to, subject, body))


_log = logging.getLogger("identity.mailer")


class ConsoleMailer:
    """Logs the email (incl. any link) instead of sending — zero-setup local dev."""

    def send(self, to: str, subject: str, body: str) -> None:
        _log.info("EMAIL to=%s subject=%s body=%s", to, subject, body)


class SmtpMailer:
    def __init__(self, host: str, port: int, username: str | None, password: str | None, sender: str) -> None:
        self._host, self._port = host, port
        self._username, self._password, self._sender = username, password, sender

    def send(self, to: str, subject: str, body: str) -> None:
        msg = EmailMessage()
        msg["From"], msg["To"], msg["Subject"] = self._sender, to, subject
        msg.set_content(body)
        with smtplib.SMTP(self._host, self._port) as s:
            s.starttls()
            if self._username and self._password:
                s.login(self._username, self._password)
            s.send_message(msg)


class ResendMailer:
    """Sends via the Resend transactional-email API (https://resend.com)."""

    def __init__(self, api_key: str, sender: str) -> None:
        self._api_key, self._sender = api_key, sender

    def send(self, to: str, subject: str, body: str) -> None:
        import httpx
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"from": self._sender, "to": [to], "subject": subject, "text": body},
            timeout=10.0,
        )
        resp.raise_for_status()


def make_mailer(settings: Settings) -> Mailer:
    if settings.resend_api_key:
        return ResendMailer(settings.resend_api_key, settings.smtp_from)
    if settings.smtp_host:
        return SmtpMailer(settings.smtp_host, settings.smtp_port, settings.smtp_username,
                          settings.smtp_password, settings.smtp_from)
    return ConsoleMailer()
