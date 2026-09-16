# Deployment

This document describes how to build, tag and deploy the `defaults-service`
container image to AWS EKS.

## Build

The image is built with a multi-stage `Dockerfile` (two stages: one to install
dependencies, one to merge the project files, build the TypeScript output and
run the app).

```bash
docker build -t defaults-service .
```

No configuration is baked into the image. Everything (`ENVIRONMENT`, `DB_*`,
`KAFKA_*`, `AWS_*`) is read at runtime by the NestJS `ConfigModule`
(`src/config/configurations.ts`) from environment variables provided by the
platform.

## Run locally

```bash
docker run --rm -p 3000:3000 \
  -e ENVIRONMENT=dev \
  -e DB_PROVIDER=mongo \
  -e DB_HOST=localhost \
  -e DB_PORT=27017 \
  -e DB_NAME=test \
  -e DB_USERNAME=admin \
  -e DB_PASSWORD=admin \
  -e KAFKA_BROKERS=localhost:9092 \
  defaults-service
```

See [`environment-variables.md`](environment-variables.md) for the full list of
supported variables.

## Push to Amazon ECR

```bash
# authenticate (uses your local AWS credentials)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# tag and push
docker tag defaults-service:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/defaults-service:<tag>
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/defaults-service:<tag>
```

## Deploy on EKS

The container is stateless and configured entirely through the environment, so
deployment only requires:

- The container image reference (ECR URI above).
- A `Deployment` exposing port `3000`.
- A `Service` (and optionally an `Ingress`) routing to it.
- Runtime configuration via a `ConfigMap` and `Secret` (or an external secrets
  manager) for the variables listed in
  [`environment-variables.md`](environment-variables.md).

### Health probes

EKS liveness and readiness probes should target the `/health` endpoint. The
endpoint is version-neutral (`VERSION_NEUTRAL`) and lives outside the
`/defaults-service/api` global prefix, so no version header is required.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Graceful shutdown

`tini` runs as PID 1 and the app handles `SIGTERM` (the Kafka producer and
consumer disconnect in `onApplicationShutdown`). Ensure the pod has a suitable
`terminationGracePeriodSeconds` so in-flight requests and Kafka connections
shut down cleanly.
