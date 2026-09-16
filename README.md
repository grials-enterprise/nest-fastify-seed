<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# NestJS Seed — Mongoose

A production-ready [NestJS](https://nestjs.com/) seed project built with
[Mongoose](https://mongoosejs.com/). It provides a fully wired CRUD
microservice (`defaults-service`) that can be used as a starting point for new
services: configuration management, MongoDB integration, Kafka
producers/consumers, request validation, licensing, encryption, health checks,
Swagger documentation and a complete test suite.

## Features

- **NestJS 12** with TypeScript and ESM (`nodenext`).
- **Mongoose** schema, DAO/service layering and document middleware.
- **Kafka** producer/consumer with environment-aware topic prefixes.
- **Request pipeline** composed of a header interceptor, a license guard,
  logging/response interceptors, AJV validation pipes and an exception filter.
- **Configuration** centralized in typed sections (`app`, `utils`, `database`,
  `kafka`, `aws`).
- **Health checks** via [@nestjs/terminus](https://docs.nestjs.com/recipes/terminus).
- **Swagger** documentation auto-generated from decorators.
- **Observability** ready via [NestJS Observe](https://observe.nestjs.com).
- **Testing** with Mocha + c8 across three suites: unit, e2e and point-to-point,
  backed by [testcontainers](https://testcontainers.com/) and
  `mongodb-memory-server`.

## Tech stack

| Area        | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Runtime     | Node.js 20+, TypeScript 6 (ESM, `nodenext`)                                |
| Framework   | [NestJS 12](https://nestjs.com/) + [Fastify](https://fastify.dev/)         |
| Database    | [Mongoose 9](https://mongoosejs.com/) (MongoDB / MongoDB Atlas)            |
| Messaging   | [KafkaJS](https://kafka.js.org/)                                           |
| Validation  | [AJV](https://ajv.js.org/) via `@grials/shared-tools`                      |
| Docs        | [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)            |
| Health      | [@nestjs/terminus](https://docs.nestjs.com/recipes/terminus)               |
| Testing     | Mocha 12, c8, supertest, testcontainers, mongodb-memory-server             |
| Lint/Format | oxlint, Prettier, husky, lint-staged, commitizen                           |

## Prerequisites

- Node.js 20+ and npm
- Docker (only required for the `e2e`/`p2p` suites, which spin up a Kafka
  container)
- A MongoDB instance (or MongoDB Atlas) for local development

## Installation

```bash
$ npm install
```

Copy the environment template and adjust it to your environment:

```bash
$ cp .env.example .env
```

See [`docs/environment-variables.md`](docs/environment-variables.md) for a full
reference of every variable.

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# debug mode
$ npm run start:debug

# production build + run
$ npm run build
$ npm run start:prod
```

Once running, the API is served under the `/defaults-service/api` global prefix
and the Swagger UI is available at `/defaults-service/defaults-docs`.

## Testing

```bash
# all suites (requires Docker for the Kafka testcontainer)
$ npm test

# unit tests (no Docker required)
$ npm run test:unit

# end-to-end tests (Kafka container via testcontainers)
$ npm run test:e2e

# point-to-point tests (Kafka container via testcontainers)
$ npm run test:p2p
```

Each suite enforces a coverage threshold via c8. For details on how the suites
are structured and how to run them, see [`docs/testing.md`](docs/testing.md).

## Linting and formatting

```bash
# lint
$ npm run lint

# format
$ npm run format
```

## Project structure

```
src/
├── app.module.ts                # Root module (global providers, Mongo, config)
├── main.ts                      # Bootstrap: prefix, versioning, Fastify plugins, Swagger
├── common/
│   ├── ajv/                     # AJV schemas and validator setup
│   ├── decorators/              # ResponseMessage decorator
│   ├── filters/                 # HttpExceptionFilter
│   ├── guards/                  # LicenseGuard (JWT-based licensing)
│   ├── interceptors/            # Header, Logger + Response interceptors
│   └── pipes/                   # AjvValidationPipe, ParseObjectIdPipe
├── config/                      # Typed config, DB URI builder, config module
├── defaults/                    # Feature module: controller, service, DAO,
│                                # schema, crypto interceptor
├── health/                      # Terminus health check
├── kafka/                       # Kafka producer/consumer services
└── utils/                       # MongoDB document middleware helpers
tests/
├── unit-tests/                  # Isolated unit tests
├── e2e/                         # Full HTTP stack with overridden Kafka
├── p2p/                         # Real stack incl. Kafka testcontainer
├── containers/                  # testcontainers start/stop helpers
└── setup.ts                     # Shared e2e/p2p bootstrap
```

## Docker / Deployment

A production `Dockerfile` (multi-stage, non-root, `tini` as PID 1) is provided
at the repository root, along with a `.dockerignore`.

```bash
# build the image
$ docker build -t defaults-service .

# run it locally (configuration is injected at runtime)
$ docker run --rm -p 3000:3000 -e ENVIRONMENT=dev defaults-service
```

For ECR push steps and EKS deployment guidance (including health probes), see
[docs/deployment.md](docs/deployment.md).

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Testing](docs/testing.md)
- [Environment variables](docs/environment-variables.md)
- [Deployment](docs/deployment.md)

## License

MIT
