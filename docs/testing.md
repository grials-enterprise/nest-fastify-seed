# Testing

The project uses [Mocha](https://mochajs.org/) with
[c8](https://github.com/bcoe/c8) for coverage, [supertest](https://github.com/ladjs/supertest)
for HTTP assertions, [testcontainers](https://testcontainers.com/) for Kafka and
[mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) for an
in-memory MongoDB. The application runs on [Fastify](https://fastify.dev/)
(`@nestjs/platform-fastify`), so the e2e/p2p bootstrap instantiates the Nest app
with a `FastifyAdapter`.

## Scripts

| Script             | Command                                                                 | Notes                              |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------------- |
| `test`             | all suites (`unit-tests`, `e2e`, `p2p`) with coverage thresholds        | Requires Docker (Kafka container)  |
| `test:unit`        | `tests/unit-tests/**/*.spec.ts`                                         | No Docker required                 |
| `test:e2e`         | `tests/e2e/**/*.spec.ts`                                                | Requires Docker (Kafka container)  |
| `test:p2p`         | `tests/p2p/**/*.spec.ts`                                                | Requires Docker (Kafka container)  |

### Coverage thresholds

Coverage is enforced by c8. The thresholds differ per suite:

| Suite   | Lines | Statements | Functions | Branches |
| ------- | ----- | ---------- | --------- | -------- |
| `test`  | 90    | 90         | 90        | 85       |
| `unit`  | 90    | 90         | 90        | 90       |
| `e2e`   | 80    | 80         | 80        | 70       |
| `p2p`   | 90    | 90         | 85        | 80       |

## Running the tests

```bash
# unit tests (fast, no external services)
$ npm run test:unit

# e2e tests (spins up a Kafka testcontainer)
$ npm run test:e2e

# point-to-point tests (spins up a Kafka testcontainer)
$ npm run test:p2p

# everything
$ npm test
```

> The e2e/p2p suites use testcontainers to start a real Kafka broker. Make sure
> Docker is running before executing them.

## Suite layout

```
tests/
├── unit-tests/      # Isolated tests for individual classes
├── e2e/             # Full HTTP stack via supertest (Kafka overridden)
├── p2p/             # Real stack incl. Kafka testcontainer
├── containers/      # testcontainers start/stop helpers
├── utils/           # Shared env helpers
├── env.json         # Local (git-ignored) overrides for tests
└── setup.ts         # Shared e2e/p2p bootstrap
```

### Unit tests (`tests/unit-tests/`)

Each unit spec exercises a single class in isolation using hand-rolled mocks or
`@nestjs/testing`. Examples:

- `defaults.daos.spec.ts` — mocks the Mongoose model to verify query building.
- `license.guard.spec.ts` — crafts unsigned JWTs to verify guard behavior.
- `kafka.service.spec.ts` — stubs the `kafkajs` producer.
- `http-exception.filter.spec.ts` — verifies status/code extraction.

### End-to-end tests (`tests/e2e/`)

Boots the real `AppModule` against an in-memory MongoDB, but overrides
`KafkaService` and `DefaultConsumerService` to avoid requiring a live broker.
Assertions go through the full HTTP stack with supertest. The app is created
with `FastifyAdapter`, and `app.getHttpAdapter().getInstance().ready()` is
called after `app.init()` so supertest can drive the Fastify instance.

```ts
const app = moduleRef.createNestApplication<NestFastifyApplication>(
  new FastifyAdapter(),
);
await app.init();
await app.getHttpAdapter().getInstance().ready();
```

### Point-to-point tests (`tests/p2p/`)

Boots the real `AppModule` **and** a real Kafka broker (testcontainer) via
`tests/setup.ts`. These validate the full production-like path, including Kafka
connectivity, split across:

- `1.default.spec.ts` — CRUD happy path.
- `2.errors.spec.ts` — validation and id error handling.
- `3.auth.spec.ts` — license/authorization behavior.
- `4.misc.spec.ts` — health and root endpoints.

## Containers

Testcontainers are managed by `@grials/testing-tools`:

```bash
# start containers manually (also starts MongoDB)
$ npm run start:containers

# stop containers manually
$ npm run stop:containers
```

`tests/containers/startContainers.ts` / `stopContainers.ts` are also imported by
the test bootstrap. When run directly (via `import.meta.main`), they include the
MongoDB container in addition to Kafka.

## Environment for tests

`tests/utils/setDefaultEnv.ts` seeds the environment variables used by tests
(reading optional overrides from `tests/env.json`). MongoDB is provided by
`mongodb-memory-server`, so its host/port are injected at runtime into
`process.env`.
