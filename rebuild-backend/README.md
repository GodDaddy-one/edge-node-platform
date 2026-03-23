# Rebuild Backend

Minimal backend for:

- our own account login
- source token binding
- upstream device proxy

## Quick Start

1. Copy `.env.example` to `.env`
2. Run `npm install`
3. Run `npm run dev`

Default demo account:

- mobile: `configured during install or local setup`
- password: `configured during install or local setup`
- admin username: `configured during install or local setup`
- admin password: `configured during install or local setup`

## Main APIs

- `POST /auth/login`
- `GET /auth/me`
- `POST /source/bind-token`
- `GET /source/profile`
- `GET /source/check`
- `GET /device/list`
- `GET /device/detail?uuid=...`
- `GET /device/dial-info?uuid=...`
- `POST /device/sync`
- `GET /device/cache`
- `POST /device/dispatch`
- `POST /device/dial-save`
- `POST /device/update`
- `GET /device/sync-logs`
