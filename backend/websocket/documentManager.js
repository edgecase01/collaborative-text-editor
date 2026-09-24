import { getUsersInRoom } from "./roomManager.js";
import { WebSocket } from "ws";

export function updateDocument(ws, documentId, content){
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