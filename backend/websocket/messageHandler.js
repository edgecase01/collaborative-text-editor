import * as roomManager from './roomManager.js';
import * as documentManager from './documentManager.js';

async function handleJoin(ws, payload) {
    const docId = Number(payload.documentId);
    const clientId = payload.clientId || ws.clientId;
    roomManager.joinRoom(docId, clientId, ws);
    await documentManager.getDocument(docId, ws);
    documentManager.broadcastPresence(docId);
}

function handleLeave(ws, payload) {
    const docId = Number(payload.documentId);
    roomManager.leaveRoom(docId, ws);
    documentManager.broadcastPresence(docId);
}

function handleUpdate(ws, payload) {
    documentManager.updateDocument(ws, Number(payload.documentId), payload.content);
}

async function handleApplyOperation(ws, payload) {
    await documentManager.applyClientOperation(ws, payload);
}

export const handlers = {
    JOIN_DOCUMENT: handleJoin,
    LEAVE_DOCUMENT: handleLeave,
    UPDATE_DOCUMENT: handleUpdate,
    APPLY_OPERATION: handleApplyOperation
};
