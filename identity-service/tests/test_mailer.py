import logging
from identity_service.config import Settings
from identity_service.mailer import ConsoleMailer, SmtpMailer, make_mailer

BASE = dict(database_url="x", issuer="x")


def _settings(**over):
    return Settings(**BASE, **over)


def test_make_mailer_returns_console_when_no_smtp_host():
    assert isinstance(make_mailer(_settings()), ConsoleMailer)


def test_make_mailer_returns_smtp_when_host_set():
    m = make_mailer(_settings(smtp_host="smtp.example.com", smtp_port=2525, smtp_from="x@e.com"))
    assert isinstance(m, SmtpMailer)


def test_console_mailer_logs_the_body(caplog):
    with caplog.at_level(logging.INFO, logger="identity.mailer"):
        ConsoleMailer().send("a@e.com", "Subj", "hello https://x/verify-email?token=abc")
    assert "a@e.com" in caplog.text and "verify-email?token=abc" in caplog.text


def test_smtp_mailer_builds_and_sends_message(monkeypatch):
    sent = {}

    class FakeSMTP:
        def __init__(self, host, port): sent["addr"] = (host, port)
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def starttls(self): sent["tls"] = True
        def login(self, u, p): sent["login"] = (u, p)
        def send_message(self, msg): sent["msg"] = msg

    import identity_service.mailer as m
    monkeypatch.setattr(m.smtplib, "SMTP", FakeSMTP)
    SmtpMailer("smtp.x", 2525, "u", "p", "from@e.com").send("to@e.com", "Subj", "Body")
    assert sent["addr"] == ("smtp.x", 2525) and sent["login"] == ("u", "p")
    assert sent["msg"]["To"] == "to@e.com" and sent["msg"]["From"] == "from@e.com" and sent["msg"]["Subject"] == "Subj"
