import {WebSocketServer} from "ws";

const wss = new WebSocketServer;

wss.on("connection", function(socket){
    socket.onopen(()=>{
        
    })
});