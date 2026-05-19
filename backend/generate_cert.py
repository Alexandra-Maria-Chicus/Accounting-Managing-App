"""
Generate a self-signed TLS certificate for HTTPS.
Works on Windows/Mac/Linux — no openssl binary required.

Usage:
    python generate_cert.py                     # auto-detects LAN IP
    python generate_cert.py 192.168.1.131       # specify IP manually

Outputs: server.crt  server.key
"""
import ipaddress
import socket
import sys
from datetime import datetime, timedelta, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID


def get_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def generate(lan_ip: str) -> None:
    print(f"Generating self-signed TLS certificate for IP: {lan_ip}")

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "RO"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "CompletCont Dev"),
        x509.NameAttribute(NameOID.COMMON_NAME, lan_ip),
    ])

    san = x509.SubjectAlternativeName([
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
        x509.IPAddress(ipaddress.IPv4Address(lan_ip)),
    ])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(days=365))
        .add_extension(san, critical=False)
        .sign(key, hashes.SHA256())
    )

    with open("server.key", "wb") as f:
        f.write(key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ))

    with open("server.crt", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print("Done. Created: server.crt  server.key")
    print()
    print("Add to frontend .env:")
    print(f"  VITE_API_BASE=https://{lan_ip}:8000")
    print(f"  VITE_WS_BASE=wss://{lan_ip}:8000")
    print()
    print("Start backend with HTTPS:")
    print("  uvicorn app.main:app --host 0.0.0.0 --port 8000 --ssl-keyfile server.key --ssl-certfile server.crt --reload")
    print()
    print("NOTE: Browser will show a security warning for self-signed certs.")
    print("      Open https://<IP>:8000/docs in the browser and click 'Advanced > Proceed' once to accept it.")


if __name__ == "__main__":
    ip = sys.argv[1] if len(sys.argv) > 1 else get_lan_ip()
    generate(ip)
