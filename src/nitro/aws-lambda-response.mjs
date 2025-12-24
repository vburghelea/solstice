import "#nitro-internal-pollyfills";
import { useNitroApp } from "nitro/app";

const nitroApp = useNitroApp();

// Inline stringifyQuery to avoid external dependency on ufo
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

// Non-streaming handler with callbackWaitsForEmptyEventLoop fix
// This prevents Lambda from waiting for DB connection pool to drain
export async function handler(event, context) {
  // Critical fix for Lambda timeout issue with pooled DB connections
  if (context && "callbackWaitsForEmptyEventLoop" in context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const request = awsRequest(event, context);
  const response = await nitroApp.fetch(request);

  return {
    statusCode: response.status,
    ...awsResponseHeaders(response),
    ...(await awsResponseBody(response)),
  };
}

// Local copy of Nitro AWS Lambda utils to avoid importing internal package paths.
function awsRequest(event, context) {
  const method = awsEventMethod(event);
  const url = awsEventURL(event);
  const headers2 = awsEventHeaders(event);
  const body = awsEventBody(event);
  const req = new Request(url, {
    method,
    headers: headers2,
    body,
  });
  // Keep Nitro runtime hints on the request object
  req.runtime ??= { name: "aws-lambda" };
  req.runtime.aws ??= {
    event,
    context,
  };
  // Return the request WITH runtime hints (was returning a new Request, losing them)
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
  const headers2 = new Headers();
  if (event.headers && typeof event.headers === "object") {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value) {
        headers2.set(key, value);
      }
    }
  }
  if ("cookies" in event && event.cookies) {
    for (const cookie of event.cookies) {
      headers2.append("cookie", cookie);
    }
  }
  return headers2;
}

function awsEventBody(event) {
  if (!event.body) {
    return undefined;
  }
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64");
  }
  return event.body;
}

function awsResponseHeaders(response) {
  const headers2 = Object.create(null);
  for (const [key, value] of response.headers) {
    if (value) {
      headers2[key] = Array.isArray(value) ? value.join(",") : String(value);
    }
  }
  const cookies = response.headers.getSetCookie();
  return cookies.length > 0
    ? {
        headers: headers2,
        cookies,
        multiValueHeaders: { "set-cookie": cookies },
      }
    : { headers: headers2 };
}

// Convert response body to Lambda-compatible format
async function awsResponseBody(response) {
  if (!response.body) {
    return { body: "" };
  }
  const buffer = await toBuffer(response.body);
  const contentType = response.headers.get("content-type") || "";
  return isTextType(contentType)
    ? { body: buffer.toString("utf8") }
    : { body: buffer.toString("base64"), isBase64Encoded: true };
}

function isTextType(contentType = "") {
  return /^text\/|\/(javascript|json|xml)|utf-?8/i.test(contentType);
}

function toBuffer(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    data
      .pipeTo(
        new WritableStream({
          write(chunk) {
            chunks.push(chunk);
          },
          close() {
            resolve(Buffer.concat(chunks));
          },
          abort(reason) {
            reject(reason);
          },
        }),
      )
      .catch(reject);
  });
}

