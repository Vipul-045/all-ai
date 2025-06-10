import { Request, Response } from 'express'
import GPTRouter from './router/userInput';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

export const connectedSockets = new Map<string, any>(); // used here hasmap

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
    connectedSockets.set(socket.id, socket);
  // Emit data continuously
//   const interval = setInterval(() => {
//     const data = { message: "Live data " + new Date().toISOString() };
//     socket.emit('live-data', data);
//   }, 2000);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

require('dotenv').config()
const cors = require('cors');
const port =  process.env.PORT || 3000

app.use(cors());
app.use(express.json());
app.use('',GPTRouter);

server.listen(3000, () => {
  console.log('Socket server running on http://localhost:3000');
});