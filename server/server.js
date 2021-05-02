const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });
});

app.use(express.static("../client"));

server.listen(process.env.PORT || 8000, () => {
  console.log(`Server started on port ${server.address().port}`);
});
