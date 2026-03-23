# Rebuild Project Notes

## Current Goal

This workspace is being rebuilt into a controllable middle-platform proxy system:

- the mini program is our own frontend
- the backend is our own proxy, assignment, and aggregation layer
- upstream platform data comes from the original `lepaiyun.work` interfaces
- upstream platform full-cache data is pulled into the middle platform first
- frontend users only see the data assigned to their own account
- frontend users should not need to bind upstream tokens themselves

## Main Folders

### Original unpacked package

Path: [`__APP__`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__)

Purpose:

- preserved as reference only
- used for reverse analysis
- not recommended as the active development project

Important files:

- [`app-service.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/app-service.js)
- [`common.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/common.js)
- [`app.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/app.js)

### Active mini program project

Path: [`rebuild-miniapp`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp)

Purpose:

- current frontend project
- import this directory into WeChat DevTools
- do not import the parent unpacked `__APP__` directory when developing

Important areas:

- app config: [`app.json`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/app.json)
- request config: [`utils/config.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/utils/config.js)
- request wrapper: [`utils/request.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/utils/request.js)
- account APIs: [`services/account.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/services/account.js)
- device APIs: [`services/device.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/services/device.js)
- dashboard APIs: [`services/dashboard.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/services/dashboard.js)

### Active backend proxy project

Path: [`rebuild-backend`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend)

Purpose:

- our own auth system
- source token binding
- upstream data proxy
- dashboard aggregation
- cache and sync layer

Important areas:

- backend entry: [`src/server.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/src/server.js)
- auth routes: [`src/routes/auth.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/src/routes/auth.js)
- source routes: [`src/routes/source.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/src/routes/source.js)
- device routes: [`src/routes/device.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/src/routes/device.js)
- dashboard route: [`src/routes/dashboard.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/src/routes/dashboard.js)

## Data Flow Direction

The desired architecture is:

`miniapp -> rebuild-backend -> upstream lepaiyun platform`

The mini program should only call our backend.

Confirmed target flow:

`upstream full cache (income + devices + status) -> middle platform auth pool and cache -> frontend account assignment display`

Important rules:

- upstream auth lives in the middle platform
- upstream token or cookie should be persisted on the backend side
- frontend users do not directly bind upstream token
- miniapp homepage income should use the current frontend user's assigned-device income, then apply the per-user ratio
- admin backend can separately display upstream account summary
- device visibility should be filtered by assignment in the middle platform

## Current Implemented Capabilities

### Frontend

- own login page connected to our backend
- node list page with:
  - auto sync when cache is empty and source auth is valid
  - local search
  - local filter
  - yesterday income display
- normal user menu no longer exposes upstream token management
- dashboard home page with:
  - upstream account income summary
  - assigned node stats
  - process stats
  - banner slot
- income detail page connected to backend income data
- node detail page with tab structure:
  - yesterday quality
  - network info
  - hardware info
  - device config

### Backend

- own auth login
- JWT session
- source token verification
- source identity check
- shared upstream auth pool fallback
- device sync
- device cache
- device assignment mapping
- user-level income adjustment and note settings
- income history snapshot
- upstream income summary aggregation
- lightweight admin dashboard and overview API
- admin login gate for `/admin`
- account-level note and income ratio save
- assignment-based device visibility
- device detail proxy
- dial info proxy
- dashboard aggregation
- sync logs
- adjustment route skeletons

## Which Data Is Real Now

These parts are already using real synced upstream data wherever available:

- node list
- node detail base fields
- network-related fields
- hardware disk list
- yesterday income
- homepage assigned node statistics
- homepage upstream account income summary
- homepage process statistics derived from synced devices
- income detail page backed by backend income history snapshots
- income values can be adjusted by backend per-user percentage setting
- assigned users can view data without binding their own upstream token

These parts are still placeholders or partial:

- yesterday quality diagnostics
- message count
- homepage rolling notice and banner content source
- some adjustment actions such as remark editing and richer config edits
- periodic sync job
- database migration from JSON storage
- richer admin account management

## How To Start Next Time

### Backend

Go to [`rebuild-backend`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend)

1. Ensure `.env` exists
2. Run:

```bash
npm run dev
```

Default local backend:

- `http://127.0.0.1:3000`

Quick bootstrap command:

```bash
npm run setup
```

Quick local deploy command:

```bash
npm run deploy:local
```

Local admin dashboard:

- `http://127.0.0.1:3000/paiyun/login`

Default test account:

- mobile: `configured during install or local setup`
- password: `configured during install or local setup`
- admin username: `configured during install or local setup`
- admin password: `configured during install or local setup`

## Deployment Flow

### What goes where

- Upload [`rebuild-miniapp`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp) to WeChat DevTools for mini program upload.
- Upload [`rebuild-backend`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend) to your Linux VPS for backend deployment.
- Keep [`__APP__`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__) only as reverse-analysis reference, not as deployment target.

### Recommended production structure

- Linux VPS runs the backend service with PM2
- your domain or subdomain points to the VPS
- mini program only requests your backend domain
- upstream `lepaiyun.work` data is fetched only by your backend

### VPS one-click deployment

After you upload the whole backend folder to the VPS, go into the backend directory and run:

```bash
sudo bash install.sh
```

This script will:

- install Node.js 20 if missing
- install PM2 if missing
- run `npm install`
- ask for admin credentials and frontend test account on first install
- generate `.env` and required JSON data files
- start the backend service with PM2

### GitHub 3-in-1 deploy command

If you want a single entry script directly from GitHub, use:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/GodDaddy-one/edge-node-platform/main/deploy.sh)
```

It will show a simple menu:

1. install
2. update
3. uninstall

You can also call actions directly:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/GodDaddy-one/edge-node-platform/main/deploy.sh) install
bash <(curl -fsSL https://raw.githubusercontent.com/GodDaddy-one/edge-node-platform/main/deploy.sh) update
bash <(curl -fsSL https://raw.githubusercontent.com/GodDaddy-one/edge-node-platform/main/deploy.sh) uninstall
```

Notes:

- install should be run with `sudo`
- update and uninstall assume the project is already cloned to `/opt/edge-node-platform`
- first install prompts for admin username/password, frontend test account, and optional upstream login magic
- later code updates do not require modifying this script as long as:
  - repository address stays the same
  - backend path stays `rebuild-backend`
  - backend service name stays `rebuild-backend`

Useful commands after deployment:

```bash
pm2 status
pm2 logs rebuild-backend
pm2 restart rebuild-backend
pm2 stop rebuild-backend
```

### VPS update

After replacing backend files on the server, run:

```bash
bash update.sh
```

This script will:

- reinstall dependencies if needed
- refresh bootstrap data
- restart the PM2 service

### VPS uninstall

To remove the PM2 service only:

```bash
bash uninstall.sh
```

This script does not delete your project files or database.

### Recommended deployment order

1. Prepare a Linux VPS
2. Upload [`rebuild-backend`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend)
3. Run `sudo bash install.sh`
4. Edit `.env` for production values
5. Restart with `pm2 restart rebuild-backend`
6. Bind your domain to the VPS
7. Add the backend domain to WeChat mini program request domain whitelist
8. Open [`rebuild-miniapp`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp) in WeChat DevTools and upload

### Important environment values

Edit [`rebuild-backend/.env.example`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/.env.example) or the generated `.env`:

- `PORT`
- `JWT_SECRET`
- `ADMIN_JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `UPSTREAM_NODE_BASE`
- `UPSTREAM_BFF_BASE`
- `UPSTREAM_LOGIN_MAGIC`

If your upstream login uses a stable `magic`, set `UPSTREAM_LOGIN_MAGIC` once on the server and the admin quick-login panel can leave `magic` empty.

### Mini Program

Open [`rebuild-miniapp`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp) in WeChat DevTools.

Do not open the parent unpacked package root unless you only want to inspect the original reverse-engineered files.

## Current Development Direction

The next preferred direction is:

1. keep miniapp homepage income on assigned-device income path, while admin keeps upstream total overview
2. finish middle-platform-only user flow
3. complete admin-side account note, per-user income ratio, and assignment management
4. add periodic sync jobs and better cache strategy
5. migrate JSON storage to database for deployment

## Current Admin Semantics

- frontend account notes are lightweight single-line metadata, shown directly inside the user card
- each frontend account income preview must be based on assigned devices only
- each frontend account keeps:
  - note
  - income ratio
  - assigned device count
  - first assigned time
- upstream summary cards show the upstream account total income and yesterday income
- frontend-side display should only show middle-platform-calculated numbers after assignment and ratio handling

## Upstream Authorization Strategy

Current recommended mode:

- admin maintains upstream bearer tokens in the backend admin page
- middle platform stores upstream auth on the server side
- frontend users do not bind upstream token

This is intentionally different from the frontend user account system.

### About upstream quick login panel

Current status:

- upstream quick login has been added to the admin panel
- if the server sets `UPSTREAM_LOGIN_MAGIC`, the admin login panel can leave `magic` empty
- manual token input still remains as a fallback

Remaining cautions:

- it may still require cookie persistence and refresh rules later
- if multiple upstream accounts are introduced, we must confirm:
  - which upstream account is the default sync source
  - whether different upstream accounts should maintain separate cache namespaces
  - whether assigned frontend users can mix devices from multiple upstream accounts

## Notes

- Source token should be rebound only when invalid or changed.
- Device and income data should be synchronized through our backend.
- Frontend users should not rely on upstream token binding.
- Homepage income in the mini program should use the current frontend user's assigned-device income, then apply the per-user ratio.
- Upstream account summary should stay in the admin backend overview, not be shown as the frontend user's own income total.
- Node list access in the mini program should rely on the middle-platform auth pool and assignment visibility, not require the frontend user to bind upstream token personally.
- The unpacked original project is reference material, not the primary dev project.
- If upstream login uses a stable `magic`, set it in [`rebuild-backend/.env.example`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend/.env.example) as `UPSTREAM_LOGIN_MAGIC`, and the admin quick-login panel can omit it.

## Account Strategy

The frontend user account system does not need to be the same as the upstream platform account system.

Recommended model:

- your mini program user logs into your own account system
- your backend stores the relationship between your user and one upstream authorization
- your backend uses that upstream authorization to fetch data and perform upstream actions

This means:

- your user mobile/password can be completely independent from the upstream platform account
- your frontend login is for your own system identity
- upstream token is for source-platform data access only

### Recommended authorization modes

#### Mode A: manual source token binding

Current prototype mainly supports this mode.

Flow:

- user logs into your own mini program account
- user binds one upstream bearer token once
- backend stores and verifies the upstream token
- later data sync uses the stored upstream token automatically

Advantages:

- easiest to implement
- clear separation between your accounts and upstream accounts
- easiest to control and audit

#### Mode B: backend simulates upstream login

This can be added later only if you fully understand the upstream login interface.

Flow:

- user enters upstream account/password into your system
- your backend calls upstream login
- your backend stores the returned token

Risks:

- maintenance cost is higher
- upstream login may change
- may involve risk control, captcha, or appid coupling

#### Mode C: admin-managed upstream authorization

Suitable for杩愯惀鍨嬪钩鍙?

Flow:

- normal frontend users only log into your own system
- admin binds and manages upstream authorizations in the admin dashboard
- backend maps different users or business groups to different upstream authorizations

Advantages:

- strongest operational control
- frontend users never touch upstream credentials
- easiest to standardize later

### Current recommendation

For this project, the safest near-term path is:

- keep your own frontend account system independent
- do not require frontend users to use upstream username/password to log in
- bind upstream authorization separately through your middle platform
- gradually move from manual token binding to admin-managed authorization

## Data Ownership And Storage Rule

### What should stay in the mini program

- our own backend login token
- lightweight page cache
- local UI state

### What should stay on our server

- user accounts
- password hashes
- source-platform tokens
- source-platform identity mapping
- device cache
- sync logs
- operation audit logs
- device assignment relationships

### Strong recommendation

Do not permanently store source-platform bearer tokens in mini program storage.

The mini program should only send the source token once for binding, then the backend stores it and uses it for all later upstream requests.

## Recommended Production Storage Structure

Use a real database instead of json files when deploying.

### Suggested tables

#### users

- id
- mobile
- password_hash
- nickname
- status
- created_at
- updated_at

#### source_authorizations

- id
- user_id
- source_name
- source_uid
- source_username
- source_token_encrypted
- status
- last_verify_at
- created_at
- updated_at

#### device_cache

- id
- user_id
- source_device_uuid
- payload_json
- sync_time

#### sync_logs

- id
- user_id
- action
- target
- request_snapshot
- response_snapshot
- status
- created_at

#### operation_logs

- id
- user_id
- device_uuid
- operation_type
- payload_json
- status
- created_at

## Detailed Deployment Tutorial

## Recommended Online Architecture Plan

### Goal

The online production structure should separate four concerns:

- mini program client traffic
- admin web dashboard traffic
- backend API traffic
- static asset delivery

The key principle is:

`client only talks to your own backend`

The upstream platform must never be exposed as the direct business data source for your users.

### Recommended domain split

Use separate domains or subdomains:

- mini program backend API:
  - `https://api.yourdomain.com`
- admin web dashboard:
  - `https://admin.yourdomain.com`
  - or `https://api.yourdomain.com/admin` during the early stage
- static assets / screenshots / help content:
  - `https://static.yourdomain.com`

Do not mix all responsibilities into one public root domain if you can avoid it.

### Recommended traffic path

#### Mini program

`wechat mini program -> api.yourdomain.com -> rebuild-backend -> upstream lepaiyun`

Rules:

- mini program only calls `api.yourdomain.com`
- mini program never stores upstream long-lived token
- mini program never calls upstream `lepaiyun.work` directly in production

#### Admin web dashboard

`browser -> admin.yourdomain.com -> admin web ui / admin api -> rebuild-backend`

Rules:

- admin dashboard must be protected by your own admin login
- admin operations must be logged
- admin dashboard should never expose upstream token plaintext

#### Static resources

`browser or webview -> static.yourdomain.com -> CDN / object storage`

Use static storage for:

- help center images
- screenshots
- downloadable documents
- possible future web admin frontend assets

### Reverse proxy and gateway plan

Nginx or another gateway should be your public entry layer.

Responsibilities:

- HTTPS termination
- domain routing
- request size limits
- rate limiting
- IP allow/deny rules for admin endpoints
- hiding the internal Node.js service port

Recommended mapping:

- `api.yourdomain.com/*` -> Node backend app
- `admin.yourdomain.com/*` -> admin frontend or admin route group
- `static.yourdomain.com/*` -> CDN or object storage bucket

### Security hardening plan

#### 1. Never expose upstream token to users

Upstream bearer token must:

- be submitted only once during binding
- be encrypted on your server
- never be returned back to mini program pages
- never be rendered in admin pages

#### 2. Force all income display through middle-platform logic

Income pages must always read:

- backend-adjusted values
- backend income history snapshots

Never allow:

- fallback to upstream raw income on client failure
- direct client calls to upstream billing endpoints
- multiple different income calculation paths in frontend

#### 3. Add admin authentication

Current `/admin` is a local prototype only.

Before public deployment, add:

- admin login page
- admin-only JWT or session cookie
- role check middleware
- route protection for `/admin/*`
- logout and session expiration

Suggested roles:

- `super_admin`
- `ops_admin`
- `viewer`

#### 4. Add audit logging

Important admin actions must be logged:

- income adjustment rate changes
- source rebind actions
- dispatch changes
- remark updates
- dial save actions

Suggested log fields:

- operator id
- operator role
- target object
- old value
- new value
- result
- time
- source IP

#### 5. Add rate limiting and abuse protection

Recommended controls:

- rate limit `/auth/login`
- rate limit `/source/bind-token`
- rate limit `/device/sync`
- stricter rate limit on `/admin/*`

Optional enhancements:

- IP allowlist for admin
- VPN-only admin access
- secondary verification for sensitive operations

#### 6. Add environment isolation

Keep at least two environments:

- test environment
- production environment

Do not share:

- JWT secret
- database
- source token records
- admin accounts

between test and production.

### Recommended production server layout

At minimum:

- 1 application server
- 1 database server or managed database
- 1 reverse proxy / Nginx layer

Preferred small-team production layout:

- application server:
  - Node.js backend
  - PM2 process manager
- database:
  - MySQL or PostgreSQL
- object storage:
  - OSS / COS / S3 compatible bucket
- CDN:
  - for static content only

### Recommended database expansion

Add these tables beyond the current prototype:

- `admin_users`
- `admin_sessions`
- `income_adjustment_logs`
- `source_verify_logs`
- `sync_job_runs`

### Recommended deployment order for safer go-live

#### Phase 1

- deploy backend API
- connect mini program
- verify source binding
- verify device sync
- verify adjusted income path

#### Phase 2

- deploy admin web dashboard
- protect admin routes
- add audit logs
- add scheduled sync jobs

#### Phase 3

- move prototype json files to database
- add encryption key rotation
- add monitoring and alerting
- start internal operational use

### What the current prototype already matches

Already aligned with the final direction:

- mini program mainly calls your own backend
- source auth is being isolated into your middle platform
- income adjustment is now designed to be middle-platform controlled
- admin dashboard prototype exists

Still required before real production:

- database migration
- true token encryption
- scheduled sync jobs
- centralized logging and monitoring
- production-grade backup strategy

### Step 1: Prepare a server

Recommended basic environment:

- Ubuntu 22.04
- Node.js 20 LTS
- PM2
- Nginx
- MySQL or PostgreSQL

Minimum suggested server for testing:

- 2 CPU
- 4 GB RAM
- 40 GB disk

### Step 2: Prepare a domain

You need a public HTTPS domain for the backend, for example:

- `https://api.yourdomain.com`

The mini program cannot rely on `127.0.0.1` after deployment.

### Step 3: Deploy the backend

Project path:

- [`rebuild-backend`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-backend)

Server-side example:

```bash
mkdir -p /srv/rebuild-backend
cd /srv/rebuild-backend
```

Upload backend files, then:

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
JWT_SECRET=replace-with-a-strong-random-secret
ADMIN_JWT_SECRET=replace-with-another-strong-random-secret
ADMIN_USERNAME=daddy
ADMIN_PASSWORD=mengna11..
UPSTREAM_NODE_BASE=https://lepaiyun.work/api/node
UPSTREAM_BFF_BASE=https://lepaiyun.work/api/bff/console/miniapp/api
```

Start for testing:

```bash
npm run dev
```

Start with PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name rebuild-backend
pm2 save
pm2 startup
```

### Step 4: Configure Nginx reverse proxy

Example config:

```nginx
server {
  listen 80;
  server_name api.yourdomain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  ssl_certificate /path/to/fullchain.pem;
  ssl_certificate_key /path/to/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Step 5: Replace local frontend backend address

File:

- [`rebuild-miniapp/utils/config.js`](/E:/aisi/wx480fcf6f8f2db7df/33/__APP__/rebuild-miniapp/utils/config.js)

Replace:

```js
ownBackend: 'http://127.0.0.1:3000'
```

With:

```js
ownBackend: 'https://api.yourdomain.com'
```

### Step 6: Configure WeChat mini program request domain

In the WeChat mini program admin console:

- add your backend domain to the legal request domains list

For example:

- `https://api.yourdomain.com`

Without this step, deployed mini program requests will fail.

### Step 7: Replace json storage with a real database

Current backend prototype uses:

- `data/users.json`
- `data/source-authorizations.json`
- `data/device-cache.json`
- `data/device-assignments.json`
- `data/user-settings.json`
- `data/sync-logs.json`
- `data/system-settings.json`
- `data/income-history.json`

For deployment, migrate them to MySQL/PostgreSQL.

Recommended migration order:

1. replace `users.json`
2. replace `source-authorizations.json`
3. replace `device-cache.json`
4. replace `sync-logs.json`

### Step 8: Encrypt source tokens

Current prototype uses simple base64 encoding only for development convenience.

For production, replace it with real encryption:

- AES-256-GCM
- secret stored in server env
- never expose source token to frontend after binding

### Step 9: Add token lifecycle control

Recommended production rules:

- check source token validity before critical operations
- mark invalid source bindings
- ask users to rebind only when token is invalid or source identity changed

### Step 10: Add scheduled sync

Recommended background jobs:

- sync device list every 10 to 30 minutes
- sync dashboard aggregates on schedule
- refresh cache after adjustment actions

Suggested examples:

- cron
- BullMQ
- node-cron

## Deployment Sequence Recommendation

The safest rollout order is:

1. deploy backend on a test server
2. connect mini program to test backend
3. verify login
4. verify source token binding
5. verify device sync
6. verify dashboard/home aggregation
7. verify adjustment actions
8. migrate json storage to database
9. start small-scale internal testing

## What Still Needs To Be Done Before Wider Testing

- connect real device adjustment actions
- improve token invalidation handling
- move file storage to database
- add operation logs
- add better error monitoring
- improve dashboard diagnostics and notices

## Next Recommended Development Direction

To reach a practical testable release faster, continue in this order:

1. complete device detail adjustment actions
2. add source token invalidation feedback
3. move backend persistence to database
4. add deployment environment configuration
5. internal test and verify real workflows

