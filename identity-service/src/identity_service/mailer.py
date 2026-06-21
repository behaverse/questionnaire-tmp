from typing import Protocol


class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class NullMailer:
    """Stub mailer — records messages instead of sending. Real SMTP is a later slice."""

    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent.append((to, subject, body))
