// @ts-nocheck - Dev server only, Cloudflare types conflict with Bun
import homepage from "../public/index.html";

const BACKEND_URL = "http://localhost:8787";

const proxyToBackend = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
    },
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
  });

  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    },
  });
};

const server = Bun.serve({
  port: 3000,
  development: true,
  routes: {
    "/api/*": {
      GET: (req) => proxyToBackend(req),
      POST: (req) => proxyToBackend(req),
      PUT: (req) => proxyToBackend(req),
      DELETE: (req) => proxyToBackend(req),
      PATCH: (req) => proxyToBackend(req),
    },
    "/": homepage,
    "/*": homepage,
  },
});

console.log(`Frontend server running at http://localhost:${server.port}`);
console.log(`Proxying /api/* to ${BACKEND_URL}`);
