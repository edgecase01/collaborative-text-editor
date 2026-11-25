import { WebSocketServer } from 'ws';
import * as messageHandler from './messageHandler.js';
import * as roomManager from './roomManager.js';
import * as documentManager from './documentManager.js';

export function initWebSocketServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('New Websocket Client Connected');

        ws.on('error', (err) => {
            console.error(err);
        });

        ws.on('close', () => {
            const docId = ws.documentId;
            if (docId !== undefined && docId !== null) {
                roomManager.leaveRoom(docId, ws);
                documentManager.broadcastPresence(docId);
            }
            console.log('WebSocket Client Disconnected');
        });

        ws.on('message', (raw_data) => {
            try {
                const data = JSON.parse(raw_data);
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
