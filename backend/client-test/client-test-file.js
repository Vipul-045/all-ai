// client.js
var io = require("socket.io-client").io;
var socket = io("http://127.0.0.1:3000", {
    transports: ["websocket"],
});
socket.on("connect", function () {
    console.log("Connected to server:", socket.id);
    // socket.emit("test", "hello test");
    socket.emit("input", "hello google gemini");
    socket.on("live-data", function (data) {
        console.log(data);
    });
});
socket.on("connect_error", function (err) {
    console.log(err);
    console.error("Connection failed:", err.message);
});
socket.on("disconnect", function () {
    console.log("Disconnected");
});
