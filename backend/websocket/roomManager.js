/**
 * rooms<documentId, Set<WebSocket>>
 */
const rooms = new Map();

export function joinRoom(documentId, ws){
    if(rooms.has(documentId)){
        rooms.get(documentId).add(ws);
    } else {
        const s = new Set();
        s.add(ws);
        rooms.set(documentId, s);
    }
    ws.documentId = documentId;
}

export function leaveRoom(documentId, ws){
    if(rooms.has(documentId)){
        rooms.get(documentId).delete(ws);
        if(rooms.get(documentId).size === 0){
            rooms.delete(documentId);
        }
    }
}

export function getUsersInRoom(key){
    return rooms.get(key);
}

export function broadcast(){}