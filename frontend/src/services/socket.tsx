import { io } from 'socket.io-client';

// const BackendLink = "http://192.168.58.41:3000";
const BackendLink = 'http://localhost:3000';

const socket = io(BackendLink); // Replace with your server URL

export default socket;