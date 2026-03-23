#!/usr/bin/env bash
set -euo pipefail

APP_NAME="rebuild-backend"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

log() {
  printf '\n[%s] %s\n' "$APP_NAME" "$1"
}

main() {
  cd "$APP_DIR"

  log "Installing updated dependencies"
  npm install

  log "Refreshing bootstrap data"
  node scripts/bootstrap.js

  log "Restarting PM2 service"
  pm2 restart "$APP_NAME"
  pm2 save

  log "Update completed"
}

main "$@"
