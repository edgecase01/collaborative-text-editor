import { WebSocketServer } from 'ws';

export function initWebSocketServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('New Websocket Client Connected');

        ws.on('error', (err) => {
            console.error(`Error : ${err}`);
        });

        ws.on('close', () => {
            console.log('WebSocket Client Disconnected');
        });

        ws.on('message', (message) => {
            console.log(`Client : ${message}`);
        });
    });

    return wss;
}