#!/bin/bash
# ── BTC Tool — Productie Deploy ───────────────────────────────────────────────
# Gebruik: ./deploy-prod.sh
#
# Doet altijd BEIDE stappen:
#   1. vercel --prod  → update kingfisher-btc-tool.vercel.app
#   2. alias set      → update kingfisher-btcprod.vercel.app
#
# Waarom: kingfisher-btcprod.vercel.app is een handmatige Vercel-alias die
# niet automatisch meegaat met --prod. Stap 2 pint hem naar de nieuwe versie.

set -e  # stop bij fout

eval "$(/opt/homebrew/bin/brew shellenv zsh)" 2>/dev/null || true

cd "$(dirname "$0")"

echo "🚀 Deploying to production…"
vercel --prod

echo ""
echo "🔗 Updating alias: kingfisher-btcprod.vercel.app → kingfisher-btc-tool.vercel.app"
vercel alias set kingfisher-btc-tool.vercel.app kingfisher-btcprod.vercel.app

echo ""
echo "✅ Done. Both URLs are now up to date:"
echo "   https://kingfisher-btc-tool.vercel.app"
echo "   https://kingfisher-btcprod.vercel.app"
