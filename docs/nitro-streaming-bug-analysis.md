# Nitro 3.0.1-alpha.1 Lambda Streaming Bug Analysis

## Summary

The Nitro 3.0.1-alpha.1 `aws-lambda-streaming.mjs` runtime has a bug where the streaming response writes to the wrong stream object, causing 0-byte responses.

## Bug Location

**File:** `node_modules/nitro/dist/presets/aws-lambda/runtime/aws-lambda-streaming.mjs`

## Buggy Code (Nitro 3.0.1-alpha.1)

```javascript
import "#nitro-internal-pollyfills";
import { useNitroApp } from "nitro/app";
import { awsRequest, awsResponseHeaders } from "./_utils.mjs";
const nitroApp = useNitroApp();
export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    const request = awsRequest(event, context);
    const response = await nitroApp.fetch(request);
    response.headers.set("transfer-encoding", "chunked");
    const httpResponseMetadata = {
      statusCode: response.status,
      ...awsResponseHeaders(response),
    };
    if (response.body) {
      const writer = awslambda.HttpResponseStream.from(
        // @ts-expect-error TODO: IMPORTANT! It should be a Writable according to the aws-lambda types
        responseStream,
        httpResponseMetadata,
      );
      const reader = response.body.getReader();
      await streamToNodeStream(reader, responseStream); // BUG: should be 'writer', not 'responseStream'
      writer.end();
    }
  },
);
async function streamToNodeStream(reader, writer) {
  let readResult = await reader.read();
  while (!readResult.done) {
    writer.write(readResult.value);
    readResult = await reader.read();
  }
  writer.end(); // BUG: Double-ends the stream
}
```

## Bug Analysis

### Issue 1: Wrong stream passed to `streamToNodeStream`

- **Line 14-18:** Creates `writer` from `awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata)`
  - The `writer` is the wrapped stream that includes HTTP headers/metadata
- **Line 20:** Calls `streamToNodeStream(reader, responseStream)`
  - Passes raw `responseStream` instead of `writer`
  - Headers/metadata from `HttpResponseStream.from()` are **never written**
  - Causes 0-byte responses because metadata wrapper is bypassed

### Issue 2: Double stream ending

- **Line 21:** `writer.end()` is called
- **Line 30:** `streamToNodeStream` also calls `writer.end()` on its second argument
- Since `responseStream` is passed (not `writer`), this ends the raw stream twice

## Correct Implementation

```javascript
export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    context.callbackWaitsForEmptyEventLoop = false; // Required for DB pooling

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
    writer.end(); // Only end once
  },
);
```

## Current Workaround

Using non-streaming Lambda entry at `src/nitro/aws-lambda-streaming.mjs` (misnamed):

- Returns full buffered response instead of streaming
- Includes `callbackWaitsForEmptyEventLoop = false` fix for DB connection pooling
- Works correctly, Lambda durations now 11-367ms instead of 20000ms timeout

## Impact

- **Symptoms:** 0-byte responses, eventual throttling due to stuck invocations
- **Root causes combined:**
  1. Nitro streaming bug causes malformed responses
  2. DB connection pooling keeps event loop alive until Lambda timeout
  3. Low concurrency limit (10) quickly exhausted

## Verification

```bash
# Check Nitro version
cat node_modules/nitro/package.json | grep version
# Output: "3.0.1-alpha.1"

# Verify buggy code exists
grep -n "streamToNodeStream(reader, responseStream)" node_modules/nitro/dist/presets/aws-lambda/runtime/aws-lambda-streaming.mjs
# Output: 20:  await streamToNodeStream(reader, responseStream);
```

## References

- Lambda Response Streaming docs: https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html
- Nitro repo: https://github.com/nitrojs/nitro
- SST TanStackStart component: https://sst.dev/docs/component/aws/tanstack-start
