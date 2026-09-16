# API reference

Base URL (local): `http://localhost:3000/defaults-service/api`

Interactive documentation (Swagger UI): `http://localhost:3000/defaults-service/defaults-docs`

## Conventions

- **Versioning** — the API uses header-based versioning. Every request to the
  API must include the `l-api-version` header, e.g. `l-api-version: 1.0.0`.
- **Response envelope** — successful responses are wrapped by
  `ResponseInterceptor`:

  ```json
  {
    "message": "default created successfully",
    "data": { "...": "..." },
    "status": "OK"
  }
  ```

- **Errors** — errors are normalized by `HttpExceptionFilter`:

  ```json
  { "message": "Invalid data", "length": 1, "errors": [], "code": "ISV001" }
  ```

## Endpoints

| Method | Path                              | Description                |
| ------ | --------------------------------- | -------------------------- |
| `GET`  | `/defaults`                       | List defaults              |
| `GET`  | `/defaults/:id`                   | Get a default by id        |
| `POST` | `/defaults`                       | Create a default           |
| `PATCH`| `/defaults/:id`                   | Update a default           |
| `PATCH`| `/defaults/:id/activate`          | Activate a default         |
| `PATCH`| `/defaults/:id/deactivate`        | Deactivate a default       |
| `GET`  | `/health`                         | Health check (no prefix)   |

> `GET /health` lives outside the `/defaults-service/api` global prefix and is
> version-neutral.

### GET /defaults

Lists active defaults. Supports the following query parameters:

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| `skip`    | number | Number of documents to skip          |
| `limit`   | number | Maximum number of documents          |
| `select`  | string | Field selection                      |
| `filter`  | object | Filter criteria (supports `$text`)   |

**Response**

```json
{
  "message": "defaults list successfully",
  "data": [
    { "_id": "507f1f77bcf86cd799439011", "name": "test", "text": "hello", "active": true }
  ],
  "status": "OK"
}
```

### GET /defaults/:id

Returns a single default by its Mongo `ObjectId`.

- `:id` must be a valid `ObjectId`; otherwise a `400` (`II000`) is returned.

### POST /defaults

Creates a default. The body is validated against the `default` AJV schema:

| Field    | Type    | Required | Description            |
| -------- | ------- | -------- | ---------------------- |
| `name`   | string  | No       | Display name           |
| `text`   | string  | Yes      | Body text              |
| `active` | boolean | No       | Active flag (defaults `true`) |

**Request**

```json
{ "name": "test", "text": "hello" }
```

**Response**

```json
{
  "message": "default created successfully",
  "data": { "_id": "507f1f77bcf86cd799439011", "name": "test", "text": "hello", "active": true },
  "status": "OK"
}
```

### PATCH /defaults/:id

Updates a default using the same body schema as `POST`.

### PATCH /defaults/:id/activate

Marks an inactive default as active.

### PATCH /defaults/:id/deactivate

Marks an active default as inactive (soft delete).

### GET /health

Terminus health check that pings MongoDB.

**Response**

```json
{
  "status": "OK",
  "data": {
    "status": "ok",
    "details": { "mongodb": { "status": "up" } }
  }
}
```

## Authentication

The `LicenseGuard` inspects the `authorization` header:

- **Anonymous** — no `authorization` header, or a non-`Bearer` scheme, is
  allowed.
- **`Bearer <jwt>`** — the token payload is decoded (unsigned, base64url) and
  the `licenseKey` is propagated:
  - `licenseStatus: "active"` → allowed on all methods.
  - `licenseStatus: "cancelled"` → rejected with `403` (`AU001`) on non-`GET`
    methods; `GET` is allowed.

## Error responses

| Status | Code     | Description                               |
| ------ | -------- | ----------------------------------------- |
| `400`  | `II000`  | Invalid `:id` (not a valid `ObjectId`)    |
| `403`  | `AU001`  | Unauthorized access (cancelled license)   |
| `422`  | `ISV001` | Body failed AJV schema validation         |
| `500`  | —        | Unexpected server error                   |
