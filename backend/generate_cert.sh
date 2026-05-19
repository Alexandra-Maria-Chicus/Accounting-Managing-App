#!/bin/bash
set -e

LAN_IP=$(hostname -I | awk '{print $1}')
echo "Detected LAN IP: $LAN_IP"
echo "Generating self-signed TLS certificate..."

cat > cert_config.cnf <<EOF
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
x509_extensions    = v3_req

[dn]
C  = RO
ST = Cluj
L  = Cluj-Napoca
O  = CompletCont Dev
CN = $LAN_IP

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1  = $LAN_IP
IP.2  = 127.0.0.1
DNS.1 = localhost
EOF

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -config cert_config.cnf

echo ""
echo "Done. Two files created: server.crt and server.key"
echo ""
echo "Add to frontend .env.local:"
echo "  VITE_API_BASE=https://$LAN_IP:8000"
echo "  VITE_WS_BASE=wss://$LAN_IP:8000"
