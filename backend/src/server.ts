import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getAIResponse } from "./handler/together_API";
import { addUserSocket, removeUserSocket } from "./handler/socket_handler";
import Urouter from "./routers/user_router";
import { dbconnection } from "./db/db_connection";
require("dotenv").config();
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const port = process.env.PORT || 3000;

import { Pinecone } from '@pinecone-database/pinecone';
import { embeidingtranform, run, searchText, storeText } from "./vector-db/pinecone_vector";

const pc = new Pinecone({
  apiKey: process.env.pinecone_db_key || 'pcsk_41NUFz_KZrAgWgFhkdczp1Yh7QDXFbPKSj49Stu5aLoRGGCFsnFffMvzZNEMqRhc7DkCzY'
});
const index = pc.index('all-ai');

console.log("index",index);


app.use(cors());
app.use(express.json());

app.use("/user", Urouter);

const io = new Server(server, {
  cors: { origin: "*" },
});

let userId: any;

dbconnection()
  .then((data) => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.log("err",err);
    console.log("erro while connecting db");
  });

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  userId = socket.id;

  socket.setMaxListeners(100); // max hundrad lisner 

  addUserSocket(socket.id, socket);

  socket.on("input", (data) => {
    getAIResponse(socket.id, data);
  });

  socket.on("test",(data)=>{
    // console.log("test input");
    console.log("data",data);
  })
  
  socket.on("disconnect", () => {
    if (userId) removeUserSocket(userId);
    console.log(`User ${userId} disconnected`);
    console.log("Client disconnected:", socket.id);
  });
});


app.get('',(req,res)=>{
  res.status(200).send({'message':"get request is working"});
})
// embeidingtranform().then(()=>{
// run().then(()=>{
//   //  storeText("4","i am graduated from asmita college");
//    searchText("where i studied");
// }).catch(err=>{
//   console.error("Error:", err);
// })
// }).catch(err => {
//   console.error('Error:', err);
// });





server.listen(3000,'0.0.0.0', () => {
  console.log("Socket server running on http://localhost:3000");
});
