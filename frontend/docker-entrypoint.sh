#!/bin/sh
set -e

# Inject runtime API base URL for the browser
: "${API_BASE_URL:=http://localhost:8000}"
echo "window.__API_BASE_URL = \"${API_BASE_URL}\";" > /app/dist/env.js
echo "[frontend] Using API_BASE_URL=${API_BASE_URL}"

exec "$@"
