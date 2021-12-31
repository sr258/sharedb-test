var http = require("http");
var express = require("express");
var ShareDB = require("sharedb");
var WebSocket = require("ws");
var WebSocketJSONStream = require("@teamwork/websocket-json-stream");
var Ajv = require("ajv/dist/2020");
var fsExtra = require("fs-extra");
var path = require("path");

const ajv = new Ajv();

const opSchema = fsExtra.readJSONSync(path.resolve("opSchema.json"));
const opSchemaValidator = ajv.compile(opSchema);

const stateSchema = fsExtra.readJSONSync(path.resolve("stateSchema.json"));
const stateSchemaValidator = ajv.compile(stateSchema);

const backend = new ShareDB();
backend.use("submit", (context, next) => {
  console.log("submit", JSON.stringify(context.op));
  console.log(context.op.op);
  if (!context.op?.op || opSchemaValidator(context.op.op)) {
    next();
  } else {
    console.log("rejecting change as op doesn't conform to schema");
    next("Op doesn't conform to schema");
  }
});

backend.use("commit", (context, next) => {
  console.log("commit", JSON.stringify(context.snapshot));
  if (stateSchemaValidator(context.snapshot.data)) {
    next();
  } else {
    console.log(
      "rejecting change as resulting state doesn't conform to schema"
    );
    next("Resulting state doesn't conform to schema");
  }
});
startServer();

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
