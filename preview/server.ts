/* Preview server: serves the built client and proxies /api/v1 to the API.
 * One origin keeps the browser requests same-origin, which the client expects
 * because it calls the API with a relative base URL.
 *
 * Static files are served as-is. Unknown paths without a file extension fall
 * back to the SPA shell so client-side routes survive a refresh. A missing file
 * that does have an extension is a genuine 404: returning index.html there
 * would be parsed as JavaScript and render a blank page. */

import { createReadStream, existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
);
const clientRoot = path.join(projectRoot, "dist", "client");
const apiTarget = process.env.API_TARGET ?? "http://127.0.0.1:3100";
const port = Number(process.env.PREVIEW_PORT ?? 8080);

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
};

function sendFile(filePath: string, response: ServerResponse): void {
    const type =
        MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream";

    response.writeHead(200, { "Content-Type": type });
    createReadStream(filePath).pipe(response);
}

async function proxy(
    request: IncomingMessage,
    response: ServerResponse,
): Promise<void> {
    const target = new URL(request.url ?? "/", apiTarget);
    const chunks: Buffer[] = [];

    for await (const chunk of request) {
        chunks.push(chunk as Buffer);
    }

    const upstream = await fetch(target, {
        method: request.method,
        headers: {
            "content-type":
                request.headers["content-type"] ?? "application/json",
        },
        body:
            request.method === "GET" || request.method === "HEAD"
                ? undefined
                : Buffer.concat(chunks),
    });

    const body = Buffer.from(await upstream.arrayBuffer());

    response.writeHead(upstream.status, {
        "Content-Type":
            upstream.headers.get("content-type") ?? "application/json",
    });
    response.end(body);
}

const server = createServer((request, response) => {
    const url = request.url ?? "/";

    if (url.startsWith("/api/v1")) {
        proxy(request, response).catch(() => {
            response.writeHead(502, { "Content-Type": "application/json" });
            response.end(
                JSON.stringify({
                    error: {
                        code: "UPSTREAM_UNAVAILABLE",
                        message: "The API is not reachable.",
                    },
                }),
            );
        });

        return;
    }

    const requested = path.join(
        clientRoot,
        decodeURIComponent(url.split("?")[0] ?? "/"),
    );
    const safePath = requested.startsWith(clientRoot) ? requested : clientRoot;

    // Hashed assets are immutable; anything else falls back to the SPA shell.
    if (existsSync(safePath) && statSync(safePath).isFile()) {
        sendFile(safePath, response);

        return;
    }

    // A path that names a file is missing, not a client-side route.
    if (path.extname(safePath)) {
        response.writeHead(404, {
            "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("Not found\n");

        return;
    }

    sendFile(path.join(clientRoot, "index.html"), response);
});

server.listen(port, "0.0.0.0", () => {
    console.info(`Preview on http://0.0.0.0:${port} (API -> ${apiTarget})`);
});
