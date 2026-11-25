import { getUsersInRoom } from "./roomManager.js";
import { WebSocket } from "ws";
import * as documentServices from '../services/documentService.js';
import { applyOperations, transformOps, computeOperations } from './operation.js';

// In-memory document state: Map<documentId, { documentId, title, content, revision, history }>
const activeDocuments = new Map();

export async function getDocument(documentId, ws) {
    try {
        let activeDoc = activeDocuments.get(documentId);
        if (!activeDoc) {
            const doc = await documentServices.getDocument(documentId);
            activeDoc = {
                documentId,
                title: doc.title,
                content: doc.content || "",
                revision: 0,
                history: []
            };
            activeDocuments.set(documentId, activeDoc);
        }

        const users = getUsersInRoom(documentId);
        const peerCount = users ? users.length : 1;

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "JOINED_DOCUMENT",
                payload: {
                    documentId: activeDoc.documentId,
                    title: activeDoc.title,
                    content: activeDoc.content,
                    revision: activeDoc.revision,
                    peerCount: peerCount
                }
            }));
        }
    } catch (err) {
        console.error("Error in getDocument:", err);
    }
}

export function broadcastPresence(documentId) {
    const users = getUsersInRoom(documentId);
    if (!users) return;

    const count = users.length;
    const msg = JSON.stringify({
        type: "ROOM_PRESENCE",
        payload: {
            documentId,
            peerCount: count
        }
    });

    users.forEach(user => {
        if (user.readyState === WebSocket.OPEN) {
            user.send(msg);
        }
    });
}

export async function applyClientOperation(ws, payload) {
    try {
        const documentId = Number(payload.documentId);
        const clientRev = Number(payload.revision);
        const operations = payload.operations;
        const clientId = payload.clientId || ws.clientId;

        let activeDoc = activeDocuments.get(documentId);
        if (!activeDoc) {
            const doc = await documentServices.getDocument(documentId);
            activeDoc = {
                documentId,
                title: doc.title,
                content: doc.content || "",
                revision: 0,
                history: []
            };
            activeDocuments.set(documentId, activeDoc);
        }

        if (!operations || !Array.isArray(operations) || operations.length === 0) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: "OPERATION_ACK",
                    payload: {
                        documentId,
                        revision: activeDoc.revision
                    }
                }));
            }
            return;
        }

        // Transform incoming operations against all operations in history newer than clientRev
        let transformedOps = operations;
        if (clientRev < activeDoc.revision) {
            const concurrentEntries = activeDoc.history.filter(h => h.revision > clientRev);
            for (const entry of concurrentEntries) {
                // Server history has priority over late client operations
                transformedOps = transformOps(transformedOps, entry.operations, false);
            }
        }

        // Apply transformed operations to the server's current document content
        activeDoc.content = applyOperations(activeDoc.content, transformedOps);
        activeDoc.revision += 1;
        const newRevision = activeDoc.revision;

        activeDoc.history.push({
            revision: newRevision,
            operations: transformedOps
        });

        // Keep last 1000 operations in history buffer to bound memory
        if (activeDoc.history.length > 1000) {
            activeDoc.history.shift();
        }

        // Persist to document service asynchronously
        documentServices.updateDocument(documentId, activeDoc.content).catch(err => {
            console.error("Failed to persist document:", err);
        });

        // 1. Send ACK back to the sending client
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "OPERATION_ACK",
                payload: {
                    documentId,
                    revision: newRevision
                }
            }));
        }

        // 2. Broadcast the applied operation to all other unique clients in the room
        const users = getUsersInRoom(documentId);
        if (users) {
            const broadcastMsg = JSON.stringify({
                type: "OPERATION_APPLIED",
                payload: {
                    documentId,
                    clientId,
                    revision: newRevision,
                    operations: transformedOps
                }
            });

            users.forEach(user => {
                // Filter out the sender's socket AND any socket sharing the sender's clientId
                if (user !== ws && (!clientId || user.clientId !== clientId) && user.readyState === WebSocket.OPEN) {
                    user.send(broadcastMsg);
                }
            });
        }
    } catch (err) {
        console.error("Error in applyClientOperation:", err);
    }
}

export async function updateDocument(ws, documentId, content) {
    let activeDoc = activeDocuments.get(documentId);
    if (!activeDoc) {
        const doc = await documentServices.getDocument(documentId);
        activeDoc = {
            documentId,
            title: doc.title,
            content: doc.content || "",
            revision: 0,
            history: []
        };
        activeDocuments.set(documentId, activeDoc);
    }

    const ops = computeOperations(activeDoc.content, content);
    if (ops.length > 0) {
        await applyClientOperation(ws, {
            documentId,
            revision: activeDoc.revision,
            operations: ops
        });
    }
}
