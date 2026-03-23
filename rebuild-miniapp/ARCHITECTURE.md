# Rebuild Miniapp Architecture

## Target Architecture

This project should use a dual-auth model:

1. Our own account system
2. Source-platform authorization token

Client requests should go only to our backend.

```text
Mini Program -> Our Backend -> lepaiyun.work APIs
```

## Why

- We control our own user system, roles, and device ownership rules.
- Source tokens are stored server-side instead of exposed in the mini program.
- The backend can cache, reshape, and audit upstream data.
- We can gradually replace upstream dependencies later.

## Recommended Tables

### users

- id
- mobile
- password_hash
- nickname
- status
- created_at
- updated_at

### source_authorizations

- id
- user_id
- source_name
- source_token_encrypted
- token_expired_at
- source_uid
- source_username
- last_verify_at
- status
- created_at
- updated_at

### device_cache

- id
- source_device_uuid
- user_id
- payload_json
- sync_time

### sync_logs

- id
- user_id
- action
- target
- request_snapshot
- response_snapshot
- status
- created_at

## Backend API Contract

### Auth

- `POST /auth/login`
  - request: `{ mobile, password }`
  - response: `{ token, user }`

- `GET /auth/me`
  - response: `{ id, mobile, nickname, sourceBound }`

### Source Binding

- `POST /source/bind-token`
  - request: `{ token }`
  - behavior:
    - call upstream `/api/node/account/v1/info`
    - verify token validity
    - save encrypted token
  - response: `{ sourceUid, sourceUsername, role }`

- `GET /source/profile`
  - response: upstream account info summary

### Device

- `GET /device/list`
  - backend reads current user's bound source token
  - backend proxies upstream `/api/node/v1/device/list`

- `GET /device/detail?uuid=...`
  - backend proxies upstream detail-related endpoints

- `GET /device/dial-info?uuid=...`

### Income

- `GET /income/device?deviceIds=...`

### Work Order

- `GET /business-switch/history`
- `POST /business-switch/submit`

## Implementation Order

1. Build our own login
2. Build source token binding
3. Verify upstream account info
4. Proxy device list
5. Proxy device detail and dial info
6. Proxy income and work orders

## Security Notes

- Never store source tokens plaintext in client storage for production use.
- Encrypt source tokens in the database.
- Add request audit logs for upstream access.
- Rotate and revoke source tokens when users rebind.
