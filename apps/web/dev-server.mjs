/**
 * Custom dev server — Next.js + WebSocket proxy on port 3000.
 *
 * Uses noServer mode so WE route upgrade events:
 *   /ws          → proxy to Express backend
 *   everything   → Next.js (HMR etc.)
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

const dev = true;
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";
const wsTarget = apiOrigin.replace(/^http/, "ws") + "/ws";

const app = next({ dev, hostname, port });

app.prepare().then(() => {
  const handle = app.getRequestHandler();
  const upgradeHandler = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    handle(req, res, parse(req.url || "/", true));
  });

  // ── WebSocket proxy (noServer — we route manually) ──────────
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url || "/", true);

    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        console.log("[ws-proxy] Browser connected, proxying to backend");

        const pendingMessages = [];
        let targetReady = false;

        const target = new WebSocket(wsTarget, {
          headers: { cookie: req.headers.cookie || "" },
        });

        target.on("open", () => {
          console.log("[ws-proxy] Backend connected — proxying active");
          targetReady = true;
          // Flush any messages received while backend was connecting
          for (const msg of pendingMessages) {
            target.send(msg);
          }
          pendingMessages.length = 0;
        });

        clientWs.on("message", (d) => {
          if (targetReady && target.readyState === WebSocket.OPEN) {
            target.send(d);
          } else {
            pendingMessages.push(d);
          }
        });
        target.on("message", (d) => {
          if (clientWs.readyState === WebSocket.OPEN) clientWs.send(d);
        });

        clientWs.on("close", () => {
          if (target.readyState <= WebSocket.OPEN) target.close();
        });
        target.on("close", () => {
          if (clientWs.readyState <= WebSocket.OPEN) clientWs.close();
        });
        target.on("error", (err) => {
          console.warn("[ws-proxy] Backend error:", err.message);
          if (clientWs.readyState <= WebSocket.OPEN) clientWs.close();
        });
      });
    } else {
      // Next.js handles HMR and other internal upgrades
      upgradeHandler(req, socket, head);
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port} (WS proxy → ${wsTarget})`);
  });
});
