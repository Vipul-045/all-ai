import { io } from 'socket.io-client';

const BackendLink = import.meta.env.VITE_API_BackendBaseUrl;
console.log("BackendLInk",BackendLink);

const socket = io(BackendLink); // Replace with your server URL

export default socket;