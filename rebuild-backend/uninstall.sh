#!/usr/bin/env bash
set -euo pipefail

APP_NAME="rebuild-backend"

log() {
  printf '\n[%s] %s\n' "$APP_NAME" "$1"
}

main() {
  if command -v pm2 >/dev/null 2>&1; then
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
      log "Stopping PM2 service"
      pm2 delete "$APP_NAME"
      pm2 save || true
    else
      log "PM2 service not found, nothing to remove"
    fi
  else
    log "PM2 not installed, nothing to remove"
  fi

  log "Uninstall script completed"
}

main "$@"
