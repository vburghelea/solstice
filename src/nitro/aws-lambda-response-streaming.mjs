import "#nitro-internal-pollyfills";
import { useNitroApp } from "nitro/app";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const nitroApp = useNitroApp();

/**
 * AWS Lambda Response Streaming Handler
 *
 * This handler follows AWS's recommended pattern for Lambda response streaming:
 * https://docs.aws.amazon.com/lambda/latest/dg/response-streaming-tutorial.html
 *
 * Key differences from Nitro's buggy 3.0.1-alpha.1 streaming runtime:
 * 1. Writes to the WRAPPED stream (HttpResponseStream.from result), not the raw responseStream
 * 2. Uses pipeline() for proper backpressure handling
 * 3. Sets callbackWaitsForEmptyEventLoop = false for DB pooling compatibility
 *
 * See docs/lambda-timeout-approaches.md for full analysis.
 */
export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    // CRITICAL: Prevent DB pool sockets/timers from holding the invocation open
    if (context && "callbackWaitsForEmptyEventLoop" in context) {
      context.callbackWaitsForEmptyEventLoop = false;
    }

    let response;
    try {
      const request = awsRequest(event, context);
      response = await nitroApp.fetch(request);
    } catch (err) {
      // If Nitro throws before we can build a Response, send a plain 500
      const meta = {
        statusCode: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      };
      responseStream = awslambda.HttpResponseStream.from(responseStream, meta);
      responseStream.end("Internal Server Error");
      if (typeof responseStream.finished === "function")
        await responseStream.finished();
      return;
    }

    const { headers, cookies } = awsResponseHeadersForStreaming(response);

    // IMPORTANT: Wrap and then write ONLY to the wrapped stream
    // This is the bug in Nitro 3.0.1-alpha.1 - it writes to responseStream instead of the wrapped stream
    const meta = {
      statusCode: response.status,
      headers,
      ...(cookies.length ? { cookies } : {}),
    };

    responseStream = awslambda.HttpResponseStream.from(responseStream, meta);

    if (response.body) {
      // Convert Web ReadableStream -> Node Readable and pipeline with backpressure
      await pipeline(Readable.fromWeb(response.body), responseStream);
    } else {
      responseStream.end();
    }

    // AWS tutorial shows waiting for stream completion
    if (typeof responseStream.finished === "function") {
      await responseStream.finished();
    }
  },
);

// --- Helpers (adapted from Nitro's _utils.mjs with bug fixes) ---

function stringifyQuery(query) {
  return Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null)
    .map((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value
          .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
          .join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");
}

function awsRequest(event, context) {
  const method = awsEventMethod(event);
  const url = awsEventURL(event);
  const headers = awsEventHeaders(event);
  const body = awsEventBody(event);

  const req = new Request(url, { method, headers, body });

  // Keep Nitro runtime hints on the request object
  // NOTE: Nitro's _utils.mjs has a bug where it creates req, sets runtime, then returns a NEW Request
  req.runtime ??= { name: "aws-lambda" };
  req.runtime.aws ??= { event, context };

  return req;
}

function awsEventMethod(event) {
  return event.httpMethod || event.requestContext?.http?.method || "GET";
}

function awsEventURL(event) {
  const headers = event.headers || {};
  const hostname =
    headers.host || headers.Host || event.requestContext?.domainName || "localhost";
  const path = event.path || event.rawPath || "/";
  const query = awsEventQuery(event);
  const protocol =
    (headers["X-Forwarded-Proto"] || headers["x-forwarded-proto"]) === "http"
      ? "http"
      : "https";
  return new URL(`${path}${query ? `?${query}` : ""}`, `${protocol}://${hostname}`);
}

function awsEventQuery(event) {
  if (typeof event.rawQueryString === "string") {
    return event.rawQueryString;
  }
  const queryObj = {
    ...event.queryStringParameters,
    ...event.multiValueQueryStringParameters,
  };
  return stringifyQuery(queryObj);
}

function awsEventHeaders(event) {
  const headers = new Headers();
  if (event.headers && typeof event.headers === "object") {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value) headers.set(key, value);
    }
  }
  if ("cookies" in event && event.cookies) {
    for (const cookie of event.cookies) headers.append("cookie", cookie);
  }
  return headers;
}

function awsEventBody(event) {
  if (!event.body) return undefined;
  if (event.isBase64Encoded) return Buffer.from(event.body || "", "base64");
  return event.body;
}

/**
 * Extract headers for streaming response.
 * Removes hop-by-hop headers that can cause issues with streaming.
 */
function awsResponseHeadersForStreaming(response) {
  const headers = Object.create(null);

  for (const [key, value] of response.headers) {
    const k = key.toLowerCase();
    if (!value) continue;

    // Avoid hop-by-hop / problematic headers in streaming context
    if (k === "content-length" || k === "transfer-encoding" || k === "connection")
      continue;

    // We'll pass cookies separately
    if (k === "set-cookie") continue;

    headers[key] = String(value);
  }

  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  return { headers, cookies };
}
