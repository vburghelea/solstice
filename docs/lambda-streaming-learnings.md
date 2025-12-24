# Lambda Streaming Implementation Learnings

This document captures key learnings from implementing AWS Lambda response streaming with TanStack Start, Nitro, and SST. These insights should guide future debugging and infrastructure decisions.

## Executive Summary

We solved two distinct problems that were causing Lambda invocations to pin at 20 seconds:

1. **Event Loop Issue**: DB connection pools kept the Node.js event loop alive after response was sent
2. **Nitro Streaming Bug**: Built-in Nitro 3.0.1-alpha.1 runtime wrote to wrong stream object

The fix involved custom Lambda entry files and proper configuration across Vite, Nitro, and SST.

---

## Problem 1: Lambda Timeout from DB Connection Pool

### Symptom

Lambda invocations consistently showed ~20,000ms duration even for simple requests that completed in milliseconds.

### Root Cause

AWS Lambda waits for the Node.js event loop to empty before considering an invocation complete. Database connection pools (like those from Drizzle/node-postgres) maintain persistent connections that keep the event loop alive.

### Solution

Set `callbackWaitsForEmptyEventLoop = false` in the Lambda handler context:

```javascript
export async function handler(event, context) {
  // Critical fix: Don't wait for DB pool to drain
  if (context && "callbackWaitsForEmptyEventLoop" in context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  // ... handle request
}
```

### Key Learning

> Any Lambda using pooled database connections MUST set `callbackWaitsForEmptyEventLoop = false` or invocations will hang until the configured timeout.

---

## Problem 2: Nitro Streaming Bug

### Symptom

Streaming was enabled but responses weren't actually streaming; they were being buffered or failing silently.

### Root Cause

In `nitro/dist/presets/aws-lambda/runtime/aws-lambda-streaming.mjs`, the code creates a wrapped writer but writes to the raw stream:

```javascript
// BUGGY CODE in Nitro 3.0.1-alpha.1
const writer = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);
const reader = response.body.getReader();
await streamToNodeStream(reader, responseStream); // BUG: writes to responseStream, not writer
writer.end();
```

The `HttpResponseStream.from()` wrapper is required for AWS to properly handle the streaming response with metadata.

### Solution

Created custom entry files that follow the [AWS Lambda streaming tutorial](https://docs.aws.amazon.com/lambda/latest/dg/response-streaming-tutorial.html) pattern:

```javascript
// Correct implementation
export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    // ... get response from Nitro app

    const meta = { statusCode: response.status, headers, cookies };
    responseStream = awslambda.HttpResponseStream.from(responseStream, meta);

    if (response.body) {
      // Use pipeline for proper backpressure handling
      await pipeline(Readable.fromWeb(response.body), responseStream);
    } else {
      responseStream.end();
    }
  },
);
```

### Key Learning

> Always use `pipeline()` from `node:stream/promises` for streaming. It handles backpressure correctly and ensures proper cleanup on errors.

---

## Configuration Architecture

### How Streaming Config Flows

```
vite.config.ts (nitro.awsLambda.streaming)
    ↓ (build)
.output/nitro.json (config.awsLambda.streaming)
    ↓ (SST reads)
SST TanStackStart component
    ↓ (deploys)
Lambda Function URL (invokeMode: RESPONSE_STREAM)
```

### Nitro Entry File Selection

Nitro's preset hook appends `-streaming` to the entry path when `awsLambda.streaming = true`:

```typescript
// vite.config.ts
nitro: {
  preset: "aws-lambda",
  entry: "src/nitro/aws-lambda-response",  // No extension!
  awsLambda: {
    streaming: true,
  },
}
```

With this config:

- `streaming: false` → resolves to `src/nitro/aws-lambda-response.mjs`
- `streaming: true` → resolves to `src/nitro/aws-lambda-response-streaming.mjs`

### Key Learning

> The entry path must NOT include the file extension. Nitro appends `-streaming.mjs` automatically based on the streaming flag.

---

## VPC and Streaming

### AWS Documentation Warning

AWS docs state: "Lambda function URLs do not support response streaming within a VPC environment."

### Our Experience

Despite this warning, streaming worked correctly with our Lambda in a VPC (required for RDS access). The Function URL was configured with `InvokeMode: RESPONSE_STREAM` and responses streamed successfully.

### Possible Explanations

1. The limitation may apply to specific VPC configurations
2. The warning may be outdated
3. CloudFront in front of the Function URL may handle the streaming differently

### Key Learning

> Don't assume VPC blocks streaming without testing. Our production setup (Lambda in VPC + RDS Proxy + CloudFront) streams successfully.

---

## SST Integration Details

### Where SST Reads Streaming Config

From `sst/platform/src/components/aws/tan-stack-start.ts`:

```typescript
// Line ~405
streaming: nitro?.config?.awsLambda?.streaming === true,
```

SST reads the built `nitro.json` file, not the Vite config directly. This means:

1. You must build before SST can detect the streaming setting
2. The `nitro.json` must contain the correct config

### Verifying the Build Output

After `pnpm build`, check `.output/nitro.json`:

```json
{
  "preset": "aws-lambda",
  "config": {
    "awsLambda": {
      "streaming": true
    }
  }
}
```

---

## Custom Entry File Structure

### Non-Streaming Entry (`aws-lambda-response.mjs`)

```javascript
import "#nitro-internal-pollyfills";
import { useNitroApp } from "nitro/app";

const nitroApp = useNitroApp();

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const request = awsRequest(event, context);
  const response = await nitroApp.fetch(request);

  return {
    statusCode: response.status,
    headers: /* ... */,
    body: await response.text(),
  };
}
```

### Streaming Entry (`aws-lambda-response-streaming.mjs`)

```javascript
import "#nitro-internal-pollyfills";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { useNitroApp } from "nitro/app";

const nitroApp = useNitroApp();

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const request = awsRequest(event, context);
    const response = await nitroApp.fetch(request);

    const meta = { statusCode: response.status, headers, cookies };
    responseStream = awslambda.HttpResponseStream.from(responseStream, meta);

    if (response.body) {
      await pipeline(Readable.fromWeb(response.body), responseStream);
    } else {
      responseStream.end();
    }
  },
);
```

### Critical: Runtime Hints

The `awsRequest()` function must preserve Nitro's runtime hints:

```javascript
function awsRequest(event, context) {
  const req = new Request(url, { method, headers, body });
  req.runtime ??= { name: "aws-lambda" };
  req.runtime.aws ??= { event, context };
  return req; // Return the SAME request object, not a new one
}
```

---

## Verification Commands

### Check Function URL Configuration

```bash
AWS_PROFILE=techdev aws lambda get-function-url-config \
  --function-name solstice-dev-TanStackStartServerFunction \
  --region ca-central-1 \
  --query 'InvokeMode'
# Should return: "RESPONSE_STREAM"
```

### Test Lambda Duration

```bash
# Get recent invocation durations from CloudWatch
AWS_PROFILE=techdev aws logs filter-log-events \
  --log-group-name /aws/lambda/solstice-dev-TanStackStartServerFunction \
  --filter-pattern "REPORT" \
  --limit 5 \
  --region ca-central-1 \
  --query 'events[].message'
```

Look for `Duration: XX.XX ms` - should be <1000ms for warm requests, not 20000ms.

### Test Streaming Response

```bash
# Direct Function URL test
curl -s -w "\n\nTime: %{time_total}s\n" \
  https://YOUR_FUNCTION_URL.lambda-url.ca-central-1.on.aws/

# Check response is streaming (transfer-encoding: chunked)
curl -sI https://YOUR_FUNCTION_URL.lambda-url.ca-central-1.on.aws/ | grep -i transfer
```

---

## Troubleshooting Checklist

### Lambda Still Timing Out?

1. ✅ Is `callbackWaitsForEmptyEventLoop = false` set in handler?
2. ✅ Are you using the custom entry file, not Nitro's built-in?
3. ✅ Check for other event loop holders (timers, open connections)

### Streaming Not Working?

1. ✅ Is `awsLambda.streaming: true` in vite.config.ts?
2. ✅ Does `.output/nitro.json` show streaming enabled?
3. ✅ Is Function URL InvokeMode `RESPONSE_STREAM`?
4. ✅ Is the streaming entry file being used? (check build output)
5. ✅ Are you writing to the wrapped stream from `HttpResponseStream.from()`?

### Build Errors About Entry File?

1. ✅ Entry path should NOT have file extension
2. ✅ Both `.mjs` and `-streaming.mjs` files must exist
3. ✅ File names must match exactly (Nitro appends `-streaming`)

---

## Performance Results

After implementing these fixes:

| Metric             | Before             | After    |
| ------------------ | ------------------ | -------- |
| Cold Start         | 20,000ms (timeout) | 2,500ms  |
| Warm Request       | 20,000ms (timeout) | 37-224ms |
| Response Streaming | Not working        | Working  |

---

## References

- [AWS Lambda Response Streaming Tutorial](https://docs.aws.amazon.com/lambda/latest/dg/response-streaming-tutorial.html)
- [Nitro AWS Lambda Preset](https://v3.nitro.build/deploy/aws-lambda)
- [SST TanStackStart Component](https://sst.dev/docs/component/aws/tanstack-start)
- [Node.js Streams Pipeline](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options)

---

## File Locations

- Custom streaming entry: `src/nitro/aws-lambda-response-streaming.mjs`
- Custom non-streaming entry: `src/nitro/aws-lambda-response.mjs`
- Vite/Nitro config: `vite.config.ts` (nitro section)
- Build output: `.output/nitro.json`
- Original analysis: `docs/lambda-timeout-approaches.md`
