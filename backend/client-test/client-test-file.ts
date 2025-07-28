// client.js
const { io } = require("socket.io-client");

const socket = io("http://127.0.0.1:3000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
  // socket.emit("test", "hello test");
  socket.emit("input","hello google gemini","deepseek");

  socket.on("live-data", (data) => {
  console.log(data);
});
});

socket.on("connect_error", (err) => {
  console.log(err);
  console.error("Connection failed:", err.message);
});


socket.on("disconnect", () => {
  console.log("Disconnected");
});
