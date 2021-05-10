const net = require("net");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { nanoid } = require("nanoid");

const SERVER_PORT = process.env.SERVER_PORT || 8000;
const SOCKET_PORT = process.env.SOCKET_PORT || 8001;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const socketServer = net.createServer();

// ========================================

const state = {
  pressed: false,
  x: 0,
  y: 0,
};

// ========================================

wss.on("connection", (ws) => {
  ws.id = nanoid();
  console.log(`A frontend client ${ws.id} connected`);

  ws.on("message", (message) => {
    console.log(`Receive ${message} from frontend client ${ws.id}`);
  });

  ws.on("close", () => {
    console.log(`A frontend client ${ws.id} disconnected`);
  });

  ws.send(JSON.stringify(state));
});

// ========================================

socketServer.on("connection", (socket) => {
  socket.id = nanoid();
  console.log(`A STM32 client ${socket.id} connected`);

  socket.on("end", () => {
    console.log(`A STM32 client ${socket.id} disconnected`);
  });

  socket.on("data", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Receive", data, `from STM32 ${socket.id}`);
      if (data.mouse === "down") {
        state.pressed = true;
      }
      if (data.mouse === "up") {
        state.pressed = false;
      }
      if (typeof data.dx === "number" || typeof data.dy === "number") {
        data.dx = data.dx || 0;
        data.dy = data.dy || 0;
        state.x += data.dx;
        state.y += data.dy;
        state.x = Math.max(Math.min(state.x, 1), -1);
        state.y = Math.max(Math.min(state.y, 1), -1);
      }
      // broadcast state information to all frontend clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(state));
        }
      });
    } catch (e) {
      console.error(
        `Invalid message from STM32 ${socket.id}: ${message.toString()}`
      );
    }
  });
});

socketServer.on("error", (e) => {
  console.error(e);
});

socketServer.listen(SOCKET_PORT, () => {
  console.log(`Socket server listening on port ${SOCKET_PORT}`);
});

// ========================================

app.use(express.static("../frontend"));

server.listen(SERVER_PORT, () => {
  console.log(`Web server listening on port ${server.address().port}`);
});
