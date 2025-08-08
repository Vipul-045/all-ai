import socket from "./socket"

export const SendInputText = (value:string,model:string) => {
    // send value to socket to return vlaue in socket only ..
    socket.emit("input",{ message: value, model });
}

