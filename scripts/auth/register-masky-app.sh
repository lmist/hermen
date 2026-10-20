#!/usr/bin/env bash
# One-time: register Hermen as a Masky OAuth client and store the credentials as Worker secrets.
# Usage: scripts/auth/register-masky-app.sh   (prints only the public clientId)
set -euo pipefail
cd "$(dirname "$0")/../.."
source scripts/cf-env.sh
resp=$(curl -sS -X POST https://masky.ai/api/oauth/clients \
  -H "Authorization: Bearer $MASKY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"name":"Hermen","redirectDomains":["hermeneutic.live","hermen.oxwilde.workers.dev","localhost"],"scopes":["profile"]}')
field() { printf %s "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(String(JSON.parse(s)[process.argv[1]]||"")))' "$1"; }
ID=$(field clientId)
SECRET=$(field clientSecret)
[ -n "$ID" ] && [ -n "$SECRET" ] || { echo "registration failed" >&2; exit 1; }
printf %s "$ID" | pnpm exec wrangler secret put MASKY_CLIENT_ID >/dev/null
printf %s "$SECRET" | pnpm exec wrangler secret put MASKY_CLIENT_SECRET >/dev/null
echo "clientId: $ID"
