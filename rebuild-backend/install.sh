#!/usr/bin/env bash
set -euo pipefail

APP_NAME="rebuild-backend"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

log() {
  printf '\n[%s] %s\n' "$APP_NAME" "$1"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

install_node() {
  if need_cmd node && need_cmd npm; then
    log "Node.js already installed: $(node -v)"
    return
  fi

  log "Installing Node.js 20"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
}

install_pm2() {
  if need_cmd pm2; then
    log "PM2 already installed: $(pm2 -v)"
    return
  fi

  log "Installing PM2"
  npm install -g pm2
}

prompt_with_default() {
  local prompt_text="$1"
  local default_value="$2"
  local result=""
  read -r -p "$prompt_text [$default_value]: " result
  if [ -z "$result" ]; then
    result="$default_value"
  fi
  printf '%s' "$result"
}

prompt_secret_with_default() {
  local prompt_text="$1"
  local default_value="$2"
  local result=""
  read -r -s -p "$prompt_text [$default_value]: " result
  printf '\n'
  if [ -z "$result" ]; then
    result="$default_value"
  fi
  printf '%s' "$result"
}

collect_bootstrap_inputs() {
  if [ -f "$APP_DIR/.env" ]; then
    log ".env already exists, keeping current credentials"
    return
  fi

  log "First install detected, configuring default accounts"

  export BOOTSTRAP_ADMIN_USERNAME
  export BOOTSTRAP_ADMIN_PASSWORD
  export BOOTSTRAP_TEST_MOBILE
  export BOOTSTRAP_TEST_PASSWORD
  export BOOTSTRAP_TEST_NICKNAME
  export BOOTSTRAP_UPSTREAM_LOGIN_MAGIC

  BOOTSTRAP_ADMIN_USERNAME="$(prompt_with_default 'Admin username' 'admin')"
  BOOTSTRAP_ADMIN_PASSWORD="$(prompt_secret_with_default 'Admin password' 'admin123')"
  BOOTSTRAP_TEST_MOBILE="$(prompt_with_default 'Frontend test mobile' '13800000000')"
  BOOTSTRAP_TEST_PASSWORD="$(prompt_secret_with_default 'Frontend test password' 'admin123')"
  BOOTSTRAP_TEST_NICKNAME="$BOOTSTRAP_ADMIN_USERNAME"
  BOOTSTRAP_UPSTREAM_LOGIN_MAGIC="$(prompt_with_default 'Upstream login magic (optional)' '')"
}

main() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Please run this script as root: sudo bash install.sh"
    exit 1
  fi

  cd "$APP_DIR"

  install_node
  install_pm2
  collect_bootstrap_inputs

  log "Installing backend dependencies"
  npm install

  log "Bootstrapping environment"
  node scripts/bootstrap.js

  log "Starting service with PM2"
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME"
  else
    pm2 start ecosystem.config.js
  fi
  pm2 save

  log "Deployment completed"
  echo "Backend dir: $APP_DIR"
  echo "Service name: $APP_NAME"
  echo "View logs: pm2 logs $APP_NAME"
  echo "Restart: pm2 restart $APP_NAME"
  echo "Stop: pm2 stop $APP_NAME"
}

main "$@"
