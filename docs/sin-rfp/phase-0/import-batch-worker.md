# Batch Import Worker (Lane 2) - Draft

This document captures the intended ECS task definition and runtime contract for
Lane 2 batch imports. It is a draft scaffold to satisfy the SIN backlog item and
can be updated with concrete infrastructure when the ECS worker is provisioned.

## ECS Task Definition (Draft)

```yaml
family: sin-import-worker
cpu: 2048
memory: 4096
ephemeralStorage:
  sizeInGiB: 50
networkMode: awsvpc
requiresCompatibilities: [FARGATE]
executionRoleArn: <ecs-execution-role-arn>
taskRoleArn: <ecs-task-role-arn>
containerDefinitions:
  - name: import-worker
    image: <artifact-registry>/solstice-import-worker:<tag>
    essential: true
    command: ["node", "dist/workers/import-batch.js", "--job-id", "<job-id>"]
    environment:
      - name: NODE_ENV
        value: production
      - name: SST_STAGE
        value: dev
      - name: SIN_ARTIFACTS_BUCKET
        value: <bucket>
      - name: SIN_IMPORT_ACTOR_USER_ID
        value: <optional-user-id>
    secrets:
      - name: DatabaseUrl
        valueFrom: <secret-arn>
      - name: BetterAuthSecret
        valueFrom: <secret-arn>
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /sst/solstice-dev/import-worker
        awslogs-region: ca-central-1
        awslogs-stream-prefix: ecs
```

## Networking + IAM Notes

- Run the task in private subnets with NAT access to S3/Secrets Manager.
- Security group requires outbound to RDS Proxy and S3 (HTTPS).
- Task role needs: `s3:GetObject`, `s3:PutObject`, `secretsmanager:GetSecretValue`,
  `logs:CreateLogStream`, `logs:PutLogEvents`, and `sqs:SendMessage` for status.

## Runtime Contract

- Worker receives an `import_job_id` and executes the Lane 2 batch flow.
- The current batch implementation exists as a server function:
  - `runBatchImport` in `src/features/imports/imports.mutations.ts`
- ECS entrypoint now exists at `src/workers/import-batch.ts`, which calls the
  shared batch runner helper and accepts `--job-id` plus optional
  `SIN_IMPORT_ACTOR_USER_ID`.
- Worker is expected to:
  1. Fetch job metadata
  2. Stream the import file from S3
  3. Validate and insert rows in chunks
  4. Persist checkpoints for resumption
  5. Upload error report to S3

## TODOs Before Production

- Create container build (`src/workers/import-batch.ts` or similar entrypoint).
- Wire EventBridge → SQS → ECS RunTask for job execution.
- Add observability (CloudWatch logs + metrics).
