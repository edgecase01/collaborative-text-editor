import { getUsersInRoom } from "./roomManager.js";
import { WebSocket } from "ws";
import * as documentServices from '../services/documentService.js';

export async function updateDocument(ws, documentId, content){
    await documentServices.updateDocument(documentId, content);

    const users = getUsersInRoom(documentId);
    if(!users) return;

    users.forEach(user => {
        if(user !== ws && user.readyState === WebSocket.OPEN){
            user.send(JSON.stringify({
                "type" : "DOCUMENT_UPDATED",
                "payload" : {
                    "content" : content
                }
            }));
        }
    });
}

export async function getDocument(documentId, ws){
    try {
        const doc = await documentServices.getDocument(documentId); 
        if(ws.readyState === WebSocket.OPEN){
            ws.send(JSON.stringify({
                "type" : "JOINED_DOCUMENT",
                "payload" : {
                    "documentId" : doc.id,
                    "title" : doc.title,
                    "content" : doc.content
                }
            }));
        }
    } catch(err){
        console.error(err);
    }
}