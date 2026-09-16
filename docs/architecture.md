# Architecture

This document describes the high-level architecture of the `defaults-service`
seed project: the module layout, the request lifecycle and the supporting
cross-cutting concerns.

## Modules

The application is organized into the following feature and infrastructure
modules, wired together in `src/app.module.ts`.

### `AppModule` (root)

`src/app.module.ts` assembles the whole application:

- Imports the feature/infrastructure modules (`KafkaModule`, `UtilsModule`,
  `HealthModule`, `DefaultsModule`, `AppConfigModule`).
- Configures `MongooseModule.forRootAsync` so the connection URI is built
  dynamically from `DB_PROVIDER` (`mongo` or `atlas`).
- Loads the global `ConfigModule` with the typed configuration factory.
- Registers global providers:
  - `APP_INTERCEPTOR` → `HeaderInterceptor`, `LoggerInterceptor`,
    `ResponseInterceptor`
  - `APP_FILTER` → `HttpExceptionFilter`
  - `APP_GUARD` → `LicenseGuard`

### `AppConfigModule`

`src/config/` is a global module that exposes:

- **`AppConfigService`** — typed accessors over the loaded configuration
  (`getApp`, `getUtils`, `getDatabase`, `getKafka`, `getAws`).
- **`DbService`** — builds the MongoDB connection URI for the `mongo`/`atlas`
  providers and exposes `connect`/`disconnect`/`dbHealth` helpers.
- **`configurations.ts`** — the configuration factory that reads `process.env`
  into a strongly typed `IAppConfig` object.

### `DefaultsModule`

`src/defaults/` is the main feature module and demonstrates the recommended
layering for a NestJS + Mongoose resource:

- **`defaults.controller.ts`** — HTTP entry point. Defines the routes, Swagger
  metadata, response messages and request validation pipes.
- **`defaults.service.ts`** — thin business-logic layer that delegates to the DAO.
- **`defaults.daos.ts`** — data access. Implements the `paginateDefault`,
  `listDefault`, `getDefaultById`, `createDefault`, `updateDefault`,
  `activateDefault` and `deactivateDefault` operations.
- **`defaults.schema.ts`** — the Mongoose schema (`name`, `text`, `active`).
- **`crypto.interceptor.ts`** — encrypts/decrypts request and response bodies
  when encryption is enabled (currently a no-op placeholder).
- **`defaults.module.ts`** — registers the model and attaches Mongoose
  pre/post hooks that audit document versions and emit Kafka events on every
  insert/update/delete.

### `HealthModule`

`src/health/` exposes a Terminus health endpoint that pings MongoDB. The
controller uses `VERSION_NEUTRAL` so `/health` is reachable without a version
header.

### `KafkaModule`

`src/kafka/` is a global module providing:

- **`KafkaService`** — manages the `kafkajs` client and producer, and emits
  messages with an environment-aware topic prefix.
- **`DefaultConsumerService`** — consumes the `default-insert`,
  `default-update` and `default-delete` topics and logs the received messages.

### `UtilsModule`

`src/utils/` provides the `InterceptorMongoDocument` service used by the
Mongoose pre-hooks to capture the previous document version (for audit) and to
increment the `__v` version field on updates.

## Request lifecycle

Every HTTP request passes through the following stages:

1. **`HeaderInterceptor`** — builds the initial `logData` object from the
   request (`path`, `method`, `originalPath`, `language`, `appVersion`,
   `licenseKey`, `authorization`) and stores it in `req.headers.logData`. Note
   that, unlike the previous Express middleware, it no longer rejects requests
   with a missing `l-api-version` header.
2. **`LicenseGuard`** — inspects the `authorization` header:
   - No header or a non-`Bearer` scheme → allowed (anonymous request).
   - `Bearer` token → decoded with `jwt-decode`; the `licenseKey` is propagated.
     Requests with a `cancelled` license are rejected with `403` on non-`GET`
     methods.
   - On `GET`, the query is stored in `req.logQuery`; on `POST`/`PATCH`, user
     info is merged into `logData`.
3. **`LoggerInterceptor`** — logs `IN`/`OUT`/`ERR` events with method, URL,
   duration and payload size.
4. **Controller** — receives the request. `ParseObjectIdPipe` validates `:id`
   params and `AjvValidationPipe` validates the body against the configured AJV
   schema.
5. **`DefaultsService` → `DefaultsDaos`** — executes the operation against
   Mongoose.
6. **`CryptoDefaultsInterceptor`** — wraps the handler to decrypt the request
   and encrypt the response (when enabled).
7. **`ResponseInterceptor`** — wraps the result in the standard response
   envelope.
8. **`HttpExceptionFilter`** — catches any exception and normalizes the error
   response.

## Cross-cutting concerns

### Response envelope

`ResponseInterceptor` wraps every successful response as:

```json
{
  "message": "defaults list successfully",
  "data": { "...": "..." },
  "status": "OK"
}
```

The `message` comes from the `@ResponseMessage()` decorator (or defaults to
`OK`).

### Error handling

`HttpExceptionFilter` normalizes errors:

- `AjvValidatorError` → `422` with `message`, `length`, `errors` and `code`.
- `HttpException` → its status, plus the `[CODE]` extracted from the message
  when present.
- Any other `Error` → `500`.

### Error codes

| Code     | Meaning                                    |
| -------- | ------------------------------------------ |
| `ISV001` | AJV schema validation failed               |
| `II000`  | Invalid id (not a valid Mongo `ObjectId`)  |
| `AU001`  | Unauthorized access (cancelled license)    |

### Topic naming

`KafkaService.setTopicEnv` prefixes topics with the environment name unless the
environment is `prod` or undefined. For example, in `DEV` the
`default-insert` topic becomes `DEV-default-insert`.
