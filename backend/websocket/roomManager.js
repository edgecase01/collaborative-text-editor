/**
 * rooms: Map<documentId, Map<clientId, WebSocket>>
 * Storing by clientId guarantees at most ONE active socket per client in any room.
 */
const rooms = new Map();

export function joinRoom(documentId, clientId, ws) {
    const docId = Number(documentId);
    if (!rooms.has(docId)) {
        rooms.set(docId, new Map());
    }
    const room = rooms.get(docId);

    // If this client already has an active socket in this room, close the old one
    const cid = clientId || ws.clientId || Math.random().toString(36);
    if (room.has(cid)) {
        const oldWs = room.get(cid);
        if (oldWs !== ws && oldWs.readyState === 1) { // 1 = WebSocket.OPEN
            try {
                oldWs.close();
            } catch (e) {}
        }
    }

    room.set(cid, ws);
    ws.documentId = docId;
    ws.clientId = cid;
}

export function leaveRoom(documentId, ws) {
    const docId = Number(documentId);
    if (rooms.has(docId)) {
        const room = rooms.get(docId);
        if (ws.clientId && room.has(ws.clientId)) {
            if (room.get(ws.clientId) === ws) {
                room.delete(ws.clientId);
            }
        }
        // Also prune any dead sockets
        for (const [cid, s] of room.entries()) {
            if (s === ws || s.readyState !== 1) {
                room.delete(cid);
            }
        }
        if (room.size === 0) {
            rooms.delete(docId);
        }
    }
}

export function getUsersInRoom(documentId) {
    const docId = Number(documentId);
    if (!rooms.has(docId)) return [];
    const room = rooms.get(docId);
    const active = [];
    for (const [cid, ws] of room.entries()) {
        if (ws.readyState === 1) {
            active.push(ws);
        } else {
            room.delete(cid);
        }
    }
    return active;
}
