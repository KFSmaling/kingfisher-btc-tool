#!/bin/bash
# ── BTC Tool — Productie Deploy ───────────────────────────────────────────────
# Gebruik: ./deploy-prod.sh [commit message]
#
# Doet altijd ALLE stappen in volgorde:
#   1. git add -A + commit + push → GitHub (triggert Supabase migraties)
#   2. vercel --prod              → update kingfisher-btc-tool.vercel.app
#   3. vercel alias set           → update kingfisher-btcprod.vercel.app
#
# Stap 1 is verplicht: zonder push naar GitHub lopen Supabase-migraties niet.
# Stap 3 is verplicht: btcprod gaat NIET automatisch mee met --prod.

set -e  # stop bij fout

eval "$(/opt/homebrew/bin/brew shellenv zsh)" 2>/dev/null || true

cd "$(dirname "$0")"

# ── 1. GIT ────────────────────────────────────────────────────────────────────
echo "📦 Checking git status…"
if [[ -n "$(git status --porcelain)" ]]; then
  COMMIT_MSG="${1:-chore: deploy $(date '+%Y-%m-%d %H:%M')}"
  echo "📝 Committing: $COMMIT_MSG"
  git add -A
  git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  echo "⬆️  Pushing to GitHub…"
  git push origin master
  echo "✅ Git done — Supabase migrations will run automatically via GitHub integration"
else
  echo "✅ Nothing to commit, checking if push needed…"
  git push origin master 2>/dev/null || echo "   (already up to date)"
fi

echo ""

# ── 2. VERCEL ─────────────────────────────────────────────────────────────────
echo "🚀 Deploying to Vercel production…"
vercel --prod

echo ""

# ── 3. ALIAS ──────────────────────────────────────────────────────────────────
echo "🔗 Updating alias: kingfisher-btcprod.vercel.app → kingfisher-btc-tool.vercel.app"
vercel alias set kingfisher-btc-tool.vercel.app kingfisher-btcprod.vercel.app

echo ""
echo "✅ All done:"
echo "   https://kingfisher-btc-tool.vercel.app  (Vercel prod)"
echo "   https://kingfisher-btcprod.vercel.app   (alias — bijgewerkt)"
echo "   GitHub → Supabase migraties lopen automatisch"
