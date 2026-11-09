"""Envío de correo por SMTP para el código de acceso del administrador."""

import os
import smtplib
from email.message import EmailMessage


class MailNotConfigured(Exception):
    """Faltan SMTP_HOST o un remitente."""


class MailDeliveryError(Exception):
    """El servidor SMTP rechazó o no completó el envío."""


def mail_configured() -> bool:
    """Hay servidor y remitente suficientes para intentar un envío."""
    return bool(os.getenv("SMTP_HOST", "").strip() and _sender())


def _sender() -> str:
    return os.getenv("SMTP_FROM", "").strip() or os.getenv("SMTP_USER", "").strip()


def send_email(recipient: str, subject: str, body: str) -> None:
    """Envía un mensaje de texto plano. No incluye el cuerpo en las excepciones."""
    host = os.getenv("SMTP_HOST", "").strip()
    sender = _sender()
    if not host or not sender:
        raise MailNotConfigured()

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    use_tls = os.getenv("SMTP_TLS", "true").lower() != "false"

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            if use_tls:
                smtp.starttls()
            if user:
                smtp.login(user, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise MailDeliveryError() from exc
