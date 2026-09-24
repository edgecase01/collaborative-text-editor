import { WebSocketServer } from 'ws';
import * as messageHandler from './messageHandler.js';
import * as roomManager from './roomManager.js';

export function initWebSocketServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('New Websocket Client Connected');

        ws.on('error', (err) => {
            console.error(err);
        });

        ws.on('close', () => {
            roomManager.leaveRoom(ws.documentId, ws);
            console.log('WebSocket Client Disconnected');
        });

        ws.on('message', (raw_data) => {
            try {
                const data = JSON.parse(raw_data);
                console.log(data.type);
                const handler = messageHandler.handlers[data.type];

                if(handler){
                    handler(ws, data.payload);
                } else {
                    console.error(`Unknown message type : ${data.type}`);
                }
            } catch(err) {
                console.error(err);
            }

        });
    });

    return wss;
}