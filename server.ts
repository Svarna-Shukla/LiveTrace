import { createServer } from "node:http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { runFlow } from "./src/server/demoFlows";
import { EVENTS, SOCKET_PATH } from "./src/lib/types";
import type { FlowScenario } from "./src/lib/types";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new IOServer(httpServer, {
    path: SOCKET_PATH,
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on(EVENTS.TRIGGER_FLOW, async (payload: { scenario: FlowScenario }) => {
      try {
        await runFlow(io, payload.scenario);
      } catch (err) {
        console.error("[socket] flow error", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> LiveTrace ready on http://localhost:${port}`);
  });
});
