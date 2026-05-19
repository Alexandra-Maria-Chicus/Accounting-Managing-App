import os
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

MAILTRAP_HOST     = os.getenv("MAILTRAP_HOST",     "sandbox.smtp.mailtrap.io")
MAILTRAP_PORT     = int(os.getenv("MAILTRAP_PORT", "587"))
MAILTRAP_USERNAME = os.getenv("MAILTRAP_USERNAME", "")
MAILTRAP_PASSWORD = os.getenv("MAILTRAP_PASSWORD", "")
MAIL_FROM         = os.getenv("MAIL_FROM",         "noreply@completcont.ro")
MAIL_FROM_NAME    = os.getenv("MAIL_FROM_NAME",    "Complet Cont")
FRONTEND_URL      = os.getenv("FRONTEND_URL",      "http://localhost:5173")


async def _send(to_email: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=MAILTRAP_HOST,
        port=MAILTRAP_PORT,
        username=MAILTRAP_USERNAME,
        password=MAILTRAP_PASSWORD,
        start_tls=True,
    )


async def send_password_reset(to_email: str, token: str) -> None:
    link = f"{FRONTEND_URL}/reset-password/{token}"
    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #FF6B00;">Complet Cont</h2>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <a href="{link}"
         style="display:inline-block; background:#FF6B00; color:#fff;
                padding:12px 28px; border-radius:8px; text-decoration:none;
                font-weight:bold; margin: 16px 0;">
        Reset My Password
      </a>
      <p style="color:#888; font-size:0.85rem;">
        This link expires in 15 minutes. If you did not request this, ignore this email.
      </p>
      <p style="color:#bbb; font-size:0.8rem;">Or copy this link: {link}</p>
    </div>
    """
    await _send(to_email, "Reset your Complet Cont password", html)


async def send_magic_link(to_email: str, token: str) -> None:
    link = f"{FRONTEND_URL}/magic/{token}"
    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #FF6B00;">Complet Cont</h2>
      <p>Here is your one-click login link. It expires in 15 minutes and can only be used once.</p>
      <a href="{link}"
         style="display:inline-block; background:#FF6B00; color:#fff;
                padding:12px 28px; border-radius:8px; text-decoration:none;
                font-weight:bold; margin: 16px 0;">
        Sign In to Complet Cont
      </a>
      <p style="color:#888; font-size:0.85rem;">
        If you did not request this, ignore this email. Your account is safe.
      </p>
      <p style="color:#bbb; font-size:0.8rem;">Or copy this link: {link}</p>
    </div>
    """
    await _send(to_email, "Your Complet Cont login link", html)
