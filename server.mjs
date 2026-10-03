import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4188);
const version = String(process.env.RENDER_GIT_COMMIT || process.env.APP_VERSION || "local").slice(0, 12);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/healthz") return sendJson(res, 200, { success: true });
  if (url.pathname === "/api/version") return sendJson(res, 200, { success: true, version });
  await serveStatic(res, url.pathname, url.searchParams);
});

async function serveStatic(res, pathname, query) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const fullPath = path.normalize(path.join(publicDir, requested));
  if (!fullPath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const ext = path.extname(fullPath);
    let data = await fs.readFile(fullPath);
    const headers = { "content-type": mime[ext] || "application/octet-stream" };
    if (ext === ".html") {
      data = Buffer.from(addAssetVersion(data.toString("utf8")), "utf8");
      headers["cache-control"] = "no-store, max-age=0";
    } else if ((ext === ".js" || ext === ".css") && query.has("v")) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    } else if (ext === ".js" || ext === ".css") {
      headers["cache-control"] = "no-cache";
    }
    res.writeHead(200, headers);
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function addAssetVersion(html) {
  const encoded = encodeURIComponent(version || "local");
  return html.replace(/\b(href|src)="(\/[^"]+\.(?:css|js))(?:\?v=[^"]*)?"/g, `$1="$2?v=${encoded}"`);
}

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Shopee contract online: http://localhost:${port}`);
});
