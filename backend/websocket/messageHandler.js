import * as roomManager from './roomManager.js';
import * as documentManager from './documentManager.js';

function handleJoin(ws, payload){
    roomManager.joinRoom(Number(payload.documentId), ws);
}

function handleLeave(ws, payload){
    roomManager.leaveRoom(Number(payload.documentId), ws);
}

function handleUpdate(ws, payload){
    documentManager.updateDocument(ws, Number(payload.documentId), payload.content);
}

export const handlers = {
    JOIN_DOCUMENT: handleJoin,
    LEAVE_DOCUMENT: handleLeave,
    UPDATE_DOCUMENT: handleUpdate
};