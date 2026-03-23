#!/usr/bin/env bash
set -euo pipefail

GITEE_REPO_URL="https://gitee.com/GodDaddy-one/edge-node-platform.git"
GITHUB_REPO_URL="https://github.com/GodDaddy-one/edge-node-platform.git"

try_clone() {
  local target_dir="$1"
  echo "[deploy] Trying Gitee repository..."
  if git clone "$GITEE_REPO_URL" "$target_dir"; then
    REPO_URL="$GITEE_REPO_URL"
    return 0
  fi
  echo "[deploy] Gitee clone failed, falling back to GitHub..."
  git clone "$GITHUB_REPO_URL" "$target_dir"
  REPO_URL="$GITHUB_REPO_URL"
}
INSTALL_ROOT="/opt/edge-node-platform"
BACKEND_DIR="$INSTALL_ROOT/rebuild-backend"

log() {
  printf '\n[deploy] %s\n' "$1"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

ensure_git() {
  if need_cmd git; then
    return
  fi

  log "Installing git"
  if need_cmd apt-get; then
    apt-get update -y
    apt-get install -y git
  else
    echo "git is required. Please install git manually first."
    exit 1
  fi
}

run_backend_script() {
  local script_name="$1"
  if [ ! -f "$BACKEND_DIR/$script_name" ]; then
    echo "Backend script not found: $BACKEND_DIR/$script_name"
    exit 1
  fi

  cd "$BACKEND_DIR"
  bash "$script_name"
}

install_action() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Please run install as root:"
    echo "sudo bash <(curl -fsSL https://gitee.com/GodDaddy-one/edge-node-platform/raw/main/deploy.sh)"
    exit 1
  fi

  ensure_git

  if [ -d "$INSTALL_ROOT/.git" ]; then
    log "Repository already exists, refreshing code"
    cd "$INSTALL_ROOT"
    git pull
  else
    log "Cloning repository to $INSTALL_ROOT"
    mkdir -p "$(dirname "$INSTALL_ROOT")"
    git clone "$REPO_URL" "$INSTALL_ROOT"
  fi

  run_backend_script "install.sh"
}

update_action() {
  if [ ! -d "$INSTALL_ROOT/.git" ]; then
    echo "Project is not installed yet at $INSTALL_ROOT"
    exit 1
  fi

  ensure_git
  log "Updating repository"
  cd "$INSTALL_ROOT"
  git pull
  run_backend_script "update.sh"
}

uninstall_action() {
  if [ ! -d "$INSTALL_ROOT" ]; then
    echo "Project directory not found: $INSTALL_ROOT"
    exit 1
  fi

  run_backend_script "uninstall.sh"
}

show_menu() {
  echo "=============================="
  echo " Edge Node Platform Deploy"
  echo "=============================="
  echo "1. Install"
  echo "2. Update"
  echo "3. Uninstall"
  printf "Choose action [1/2/3]: "
  read -r choice
}

main() {
  local action="${1:-}"

  if [ -z "$action" ]; then
    show_menu
    action="$choice"
  fi

  case "$action" in
    1|install)
      install_action
      ;;
    2|update)
      update_action
      ;;
    3|uninstall)
      uninstall_action
      ;;
    *)
      echo "Unknown action: $action"
      echo "Use one of: install, update, uninstall"
      exit 1
      ;;
  esac
}

main "$@"


