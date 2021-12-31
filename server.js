var http = require("http");
var express = require("express");
var ShareDB = require("sharedb");
var WebSocket = require("ws");
var WebSocketJSONStream = require("@teamwork/websocket-json-stream");

const backend = new ShareDB();
startServer();

// Create initial document then fire callback
function createDoc(callback) {
  var connection = backend.connect();
  var doc = connection.get("examples", "counter");
  doc.fetch(function (err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create({ numClicks: 0 }, callback);
      return;
    }
    callback();
  });
}

function startServer() {
  // Create a web server to serve files and listen to WebSocket connections
  var app = express();
  var server = http.createServer(app);

  // Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({ server: server });
  wss.on("connection", (ws) => {
    console.log("Websocket connected");
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
    ws.on("close", () => {
      console.log("Websocket disconnected");
    });
  });

  server.listen(5001);
  console.log("Listening on http://localhost:5001");
}
