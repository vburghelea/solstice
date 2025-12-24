# Lambda Timeout Fixes - Approaches

## Context and investigation summary

### Symptoms observed

- UI error: "A bludger hit us while loading this view" with
  `ConcurrentInvocationLimitExceeded` (HTTP 429).
- CloudFront health checks sometimes return 429.
- Lambda durations pinned at 20s (timeout).

### Evidence from CloudWatch Logs (dev)

Log group: `/aws/lambda/solstice-dev-WebServerCacentral1Function-hsobmtrd`

Example request `d145d588-2d46-4ee0-82de-d7597350316d`:

- `04:16:38.530Z` "Running database health check"
- `04:16:38.803Z` "Health check: healthy" (totalDurationMs ~368)
- `04:16:56.593Z` `REPORT ... Duration: 20000.00 ms ... Status: timeout`

This shows app work finishes quickly but the invocation stays open until the
Lambda timeout, which points to event-loop handles (timers or sockets) keeping
the process alive.

### Evidence from CloudWatch Metrics (dev, last 30m)

Function: `solstice-dev-WebServerCacentral1Function-bbwfvuam`

- `ConcurrentExecutions` max = 10 (matches account limit)
- `UnreservedConcurrentExecutions` max = 10
- `Throttles` observed (2 in a single 1-minute window)
- `Duration p95` = 20000 ms (pinned to timeout)

Account limits (Lambda):

- `ConcurrentExecutions`: 10
- `UnreservedConcurrentExecutions`: 10

### Working hypothesis (root cause)

The handler finishes quickly but the Node event loop is kept alive by:

- pooled Postgres connections with idle timers, and/or
- un-cleared `setTimeout` used in `validateConnection`.

Because Lambda waits for the event loop to drain, each request hangs until the
20s timeout. With only 10 concurrent executions available, a handful of stuck
invocations quickly saturates concurrency and yields `ConcurrentInvocationLimitExceeded`.

### Fixes chosen for this incident

1. Set `callbackWaitsForEmptyEventLoop = false` in the AWS Lambda handler.
2. Clear the `validateConnection` timeout on success or failure.

These address the event-loop hang without disabling pooling.

## Approach A (recommended, currently implemented)

Keep Nitro streaming + set `callbackWaitsForEmptyEventLoop = false` + clear timers.

- Add a custom Nitro Lambda entry that sets `context.callbackWaitsForEmptyEventLoop = false`
- Keep streaming response handling intact
- Clear any `setTimeout` used for DB validation to avoid holding the event loop

Pros

- Best practice for Lambda + pooled DB connections
- Preserves streaming responses
- Minimal runtime behavior change

Cons

- Requires a custom Nitro entry file (small maintenance surface)

## Approach B (non-streaming Lambda)

Switch Nitro to non-streaming AWS Lambda entry and set `callbackWaitsForEmptyEventLoop = false`.

- Use Nitro's standard `aws-lambda` runtime (non-streaming)
- Wrap handler to set `callbackWaitsForEmptyEventLoop = false`

Pros

- Very stable, simple handler
- No streaming edge cases

Cons

- Loses streaming responses (might impact large payloads / SSR streaming)

## Approach C (timeout hygiene only)

Clear timers and reduce open handles, without callbackWaits change.

- Clear `setTimeout` in DB validation (and anywhere else)
- Optionally reduce Postgres `idle_timeout` in Lambda

Pros

- Least invasive change
- Still improves event-loop cleanup

Cons

- Less reliable than Approach A/B
- Pooled sockets can still keep the loop alive

## Approach D (force close DB connections per request)

Close DB pool at the end of each request.

- Call `sql.end()` (or `closeConnections`) after handler completes

Pros

- Event loop drains cleanly

Cons

- Performance regression
- Defeats pooling, higher latency
- Not typical for serverless DB usage

---

## Implementation Status (2025-12-24)

### Current State: Approach B (non-streaming) temporarily deployed

We discovered that **Nitro 3.0.1-alpha.1's streaming implementation is buggy**. The built-in
`aws-lambda-streaming.mjs` entry has a bug where it:

1. Creates a `writer` from `HttpResponseStream.from(responseStream, metadata)`
2. But then writes to `responseStream` directly instead of `writer`
3. This causes 0-byte responses

**Evidence:**

```javascript
// From nitro/dist/presets/aws-lambda/runtime/aws-lambda-streaming.mjs
const writer = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);
const reader = response.body.getReader();
await streamToNodeStream(reader, responseStream); // BUG: should be 'writer', not 'responseStream'
writer.end();
```

### Why streaming matters (and why we want it back)

Streaming is best practice for Lambda + SSR because:

- **Faster TTFB**: Browser receives first bytes while server is still rendering
- **Progressive rendering**: Users see content before full page is ready
- **Lower memory**: No need to buffer entire response in memory
- **Better UX**: Perceived performance improves significantly

### Temporary workaround

Using custom non-streaming entry (`src/nitro/aws-lambda-streaming.mjs` - misnamed, actually non-streaming):

- Includes `callbackWaitsForEmptyEventLoop = false` fix
- Works correctly, returns full HTML
- Lambda durations now reflect actual work (11-367ms instead of 20000ms timeout)

### TODO: Restore streaming when Nitro fixes the bug

Options:

1. **Wait for Nitro stable release** - The alpha has this bug, stable may fix it
2. **Fix in our custom entry** - Write correct streaming logic that writes to `writer`
3. **Open issue/PR on Nitro** - Report the bug upstream

### Correct streaming implementation (for future reference)

The fix should write to `writer`, not `responseStream`:

```javascript
export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const request = awsRequest(event, context);
    const response = await nitroApp.fetch(request);

    const writer = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: response.status,
      ...awsResponseHeaders(response),
    });

    if (response.body) {
      const reader = response.body.getReader();
      let result = await reader.read();
      while (!result.done) {
        writer.write(result.value); // Write to 'writer', NOT 'responseStream'
        result = await reader.read();
      }
    }
    writer.end();
  },
);
```

**Note:** Our attempts to implement this correctly still resulted in 0-byte responses.
This may be due to additional issues with how Nitro/Vite bundles the entry file,
or compatibility issues with the Lambda streaming runtime in the alpha version.

### Verification commands

```bash
# Test that responses are working
curl -sS -w "\nStatus: %{http_code}, Size: %{size_download} bytes\n" https://d151to0xpdboo8.cloudfront.net/

# Check Lambda durations (should NOT be 20000ms)
AWS_PROFILE=techdev aws logs tail "/aws/lambda/solstice-dev-WebServerCacentral1Function-hsobmtrd" \
  --region ca-central-1 --since 5m | grep REPORT

# Check for throttles
AWS_PROFILE=techdev aws cloudwatch get-metric-statistics \
  --region ca-central-1 --namespace AWS/Lambda --metric-name Throttles \
  --dimensions Name=FunctionName,Value=solstice-dev-WebServerCacentral1Function-hsobmtrd \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ) --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 --statistics Sum
```

---

## Detailed Analysis (2025-12-24)

### Two Separate Problems

1. **Lambda timeout (20s pinned)**: Event loop held open by DB pool sockets/timers
2. **Nitro streaming returns 0 bytes**: Bug in Nitro 3.0.1-alpha.1 streaming runtime

### Problem 1: Lambda Timeout - SOLVED

The handler work finishes quickly but Node's event loop stays alive due to:

- **postgres-js pooling** with `idle_timeout: 20` keeping sockets/timers active
- Uncleaned `setTimeout` in `validateConnection`

**Fix applied:**

1. `context.callbackWaitsForEmptyEventLoop = false` in Lambda handler
2. Clear `validateConnection` timeout in `finally` block

### Problem 2: Nitro Streaming Bug - ANALYZED

Nitro 3.0.1-alpha.1's `aws-lambda-streaming.mjs` has a bug:

```javascript
// Line 14-18: Creates wrapped writer with metadata
const writer = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);

// Line 20: BUG - writes to raw responseStream instead of writer
await streamToNodeStream(reader, responseStream); // Should be 'writer'!

// Line 21: ends writer (but data went to wrong stream)
writer.end();
```

AWS's tutorial explicitly warns: you must write to the stream returned by
`HttpResponseStream.from()`, not the original `responseStream`.

### VPC Limitation - CRITICAL

AWS docs explicitly state:

> "Lambda function URLs do not support response streaming within a VPC environment."

Since our Lambda is in a VPC for RDS access, **Function URL streaming may not work**.

### How SST Enables Streaming

SST's TanStackStart component reads `nitro.config.awsLambda.streaming` from the built
output at `.output/nitro.json` (see `~/dev/sst/platform/src/components/aws/tan-stack-start.ts:405`):

```typescript
streaming: nitro?.config?.awsLambda?.streaming === true,
```

This value controls:

1. **Function URL invokeMode**: `RESPONSE_STREAM` vs `BUFFERED`
2. **Lambda streaming configuration**

To enable streaming, set in `vite.config.ts`:

```typescript
nitro: {
  preset: "aws-lambda",
  entry: "src/nitro/aws-lambda-response-streaming.mjs",
  awsLambda: {
    streaming: true,
  },
},
```

### Custom Entry Files

Two entry files are available in `src/nitro/`:

| File                                | Mode      | Description                                 |
| ----------------------------------- | --------- | ------------------------------------------- |
| `aws-lambda-streaming.mjs`          | Buffered  | Non-streaming, works with VPC, stable       |
| `aws-lambda-response-streaming.mjs` | Streaming | Follows AWS tutorial pattern, needs testing |

Both include `callbackWaitsForEmptyEventLoop = false` for DB pooling.

### Testing Streaming (If VPC Allows)

1. Update `vite.config.ts`:

   ```typescript
   entry: "src/nitro/aws-lambda-response-streaming.mjs",
   awsLambda: { streaming: true },
   ```

2. Deploy to AWS (not `sst dev` - streaming not supported in dev mode)

3. Test Function URL directly (bypass CloudFront buffering):

   ```bash
   curl --no-buffer -i https://xxxxx.lambda-url.ca-central-1.on.aws/
   ```

4. Check Function URL config:
   ```bash
   AWS_PROFILE=techdev aws lambda get-function-url-config \
     --function-name <FUNCTION_NAME> --region ca-central-1
   ```
   Look for `"InvokeMode": "RESPONSE_STREAM"`

### If Streaming Still Fails

If VPC blocks streaming, options are:

1. **Stay buffered** (current approach, stable)
2. **Move Lambda out of VPC** (access DB via VPC peering or public endpoint)
3. **Switch to API Gateway** (supports streaming, but different architecture)
