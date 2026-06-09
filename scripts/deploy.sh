#!/usr/bin/env bash
#
# Deploy the latest m-bot release on this server.
#
# Pulls the newest GitHub Release tarball, swaps in the compiled build,
# installs matching dependencies (incl. native better-sqlite3 bindings),
# and reloads the pm2 process.
#
# Prerequisites (one-time, see docs/deployment.md):
#   - gh    (authenticated: `gh auth login`)
#   - yarn  (via corepack: `corepack enable`)
#   - pm2   (already running the bot)
#
# Usage:
#   ./deploy.sh                 # deploy the latest release
#   APP_DIR=/srv/m-bot ./deploy.sh
#   PM2_APP=m-bot ./deploy.sh   # if your pm2 process has a name instead of id 0
#   ./deploy.sh v0.15.0         # deploy/rollback to a specific release tag

set -euo pipefail

REPO="knoxcord/m-bot"
APP_DIR="${APP_DIR:-$HOME/m-bot}"
PM2_APP="${PM2_APP:-0}"
TAG="${1:-}" # optional release tag; empty = latest

cd "$APP_DIR"

echo "==> Downloading release (${TAG:-latest}) from $REPO ..."
rm -f m-bot-*.tgz
gh release download $TAG --repo "$REPO" --pattern 'm-bot-*.tgz'

tarball=$(ls m-bot-*.tgz)
echo "==> Downloaded $tarball"

echo "==> Replacing build/ ..."
rm -rf build
tar xzf "$tarball"

echo "==> Installing dependencies ..."
yarn install --immutable

echo "==> Reloading pm2 process ($PM2_APP) ..."
pm2 reload "$PM2_APP"

echo "==> Cleaning up ..."
rm -f "$tarball"

echo "==> Done. Deployed $tarball"
