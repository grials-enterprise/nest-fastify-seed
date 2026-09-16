# Environment variables

Configuration is loaded from the environment and mapped into the typed
`IAppConfig` sections (`app`, `utils`, `database`, `kafka`, `aws`) in
`src/config/configurations.ts`. Copy `.env.example` to `.env` to get started.

## App

| Variable      | Type   | Default | Description                                  |
| ------------- | ------ | ------- | -------------------------------------------- |
| `APP_NAME`    | string | —       | Service name used in the global prefix.      |
| `ENVIRONMENT` | string | —       | Deployment environment (`dev`, `qa`, `prod`). Lower-cased when loaded. |
| `APP_PORT`    | number | `3000`  | HTTP port the app listens on.                |

## Utils

| Variable            | Type    | Default     | Description                                      |
| ------------------- | ------- | ----------- | ------------------------------------------------ |
| `GATEWAY_HOST`      | string  | `localhost` | Gateway host used to build `EXTERNAL_URLS`.      |
| `GATEWAY_PORT`      | number  | `3000`      | Gateway port used to build `EXTERNAL_URLS`.      |
| `AVAILABLE_VERSIONS`| string  | `1.0.0`     | Comma-separated list of API versions.            |
| `LOG_LEVEL`         | string  | `info`      | Application log level.                           |
| `ENABLED_ENCRYPT`   | boolean | `false`     | Enables request/response encryption.             |
| `INGRESS_HOST`      | string  | `localhost` | Ingress host used to build `INGRESS_HOST`.       |

## Database (MongoDB)

| Variable             | Type              | Default  | Description                                      |
| -------------------- | ----------------- | -------- | ------------------------------------------------ |
| `DB_PROVIDER`        | `mongo` \| `atlas`| `mongo`  | Connection provider.                             |
| `DB_NAME`            | string            | `test`   | Database name (also used as `authSource`).       |
| `DB_HOST`            | string            | `localhost` | Database host (or Atlas cluster host).         |
| `DB_PORT`            | number            | `27017`  | Database port (ignored for `atlas`).             |
| `DB_USERNAME`        | string            | `admin`  | Database username.                               |
| `DB_PASSWORD`        | string            | `admin`  | Database password.                               |
| `DB_SSL`             | boolean           | `false`  | Enable SSL.                                      |
| `DB_SSL_VALIDATE`    | boolean           | `false`  | Validate the server certificate.                 |
| `DB_SECURE_SOCKET`   | boolean           | `false`  | Enable the secure-socket options block.          |
| `DB_SSL_CA`          | string            | —        | Path to a CA certificate (used with `DB_SECURE_SOCKET`). |

## Kafka

| Variable          | Type   | Default              | Description                                |
| ----------------- | ------ | -------------------- | ------------------------------------------ |
| `KAFKA_ID`        | string | `defaults-service`   | Kafka client id.                           |
| `KAFKA_BROKERS`   | string | `localhost:9092`     | Comma-separated list of brokers.           |
| `KAFKA_LOG_LEVEL` | number | `0`                  | KafkaJS log level (`0` = none).            |

## AWS S3

| Variable        | Type    | Default | Description                                      |
| --------------- | ------- | ------- | ------------------------------------------------ |
| `ENABLED_AWS_S3`| boolean | `false` | Enables S3 storage features.                     |
| `AWS_ID`        | string  | —       | AWS access key id.                               |
| `AWS_SECRET`    | string  | —       | AWS secret access key.                           |
| `S3_ASSETS_BUCKET` | string | `none` | Assets bucket name.                              |
| `FILE_STORAGE`  | string  | `local` | File storage backend (`local` or S3).            |
