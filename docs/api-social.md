# Social API Endpoints

Thin REST wrappers around server functions. All endpoints require authentication.

Base path: `/api/social/*`

- `POST /api/social/follow`
  - Body: `{ "followingId": string }`
  - Response: `OperationResult<boolean>`

- `POST /api/social/unfollow`
  - Body: `{ "followingId": string }`
  - Response: `OperationResult<boolean>`

- `POST /api/social/block`
  - Body: `{ "userId": string, "reason"?: string }`
  - Response: `OperationResult<boolean>`

- `POST /api/social/unblock`
  - Body: `{ "userId": string }`
  - Response: `OperationResult<boolean>`

- `GET /api/social/relationship`
  - Query/body: `{ "userId": string }`
  - Response: `OperationResult<RelationshipSnapshot>`

- `GET /api/social/blocklist`
  - Query/body: `{ "page"?: number, "pageSize"?: number }`
  - Response: `OperationResult<{ items: BlocklistItem[]; totalCount: number }>`

Notes:

- Inputs validated with Zod. Errors returned via `errors[]` array with `code` and `message`.
- Server-only imports are used inside handlers to avoid client bundle pollution.
- Social actions are client-rate-limited (10/min) via TanStack Pacer.
