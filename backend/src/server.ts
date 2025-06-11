import { Request, Response } from "express";
// import GPTRouter from "./router/userInput";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Socket } from "dgram";
import { getAIResponse } from "./handler/together_API";
import { addUserSocket, removeUserSocket } from "./handler/socket_handler";
require("dotenv").config();
const app = express();
const server = http.createServer(app);

const cors = require("cors");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const io = new Server(server, {
  cors: { origin: "*" },
});

let userId:any;

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  userId = socket.id;

  addUserSocket(socket.id, socket);

  socket.on("input", (data) => {

    getAIResponse(socket.id, data);
  });


  socket.on("disconnect", () => {
    if (userId) removeUserSocket(userId);
    console.log(`User ${userId} disconnected`);
    console.log("Client disconnected:", socket.id);
  });
});



server.listen(3000, () => {
  console.log("Socket server running on http://localhost:3000");
});
