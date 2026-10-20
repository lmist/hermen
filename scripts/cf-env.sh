#!/usr/bin/env bash
# Usage: source scripts/cf-env.sh
# Exports secrets from the main checkout's cloudflare.env (works from any worktree). Prints nothing.
_hm_main="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
_hm_file="$_hm_main/cloudflare.env"
export MASKY_API_KEY="$(sed -n 's/^masky_api_key=//p' "$_hm_file" | tr -d '[:space:]')"
export ANTHROPIC_API_KEY="$(sed -n 's/^anthropic_api_key=//p' "$_hm_file" | tr -d '[:space:]')"
export CLOUDFLARE_API_TOKEN="$(grep '^cloudflare' "$_hm_file" | head -1 | cut -c17- | sed 's/^[=: ]*//' | tr -d '[:space:]')"
export CLOUDFLARE_ACCOUNT_ID="429c790bd19556259b0a43c239b4988d"
export DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' "$_hm_main/.env.local" | tr -d '"[:space:]')"
unset _hm_main _hm_file
