#!/bin/bash
LAN_IP=$(hostname -I | awk '{print $1}')
echo "Server starting at: https://$LAN_IP:8000"
echo "Docs:               https://$LAN_IP:8000/docs"
echo ""

uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --ssl-keyfile server.key \
  --ssl-certfile server.crt \
  --reload
