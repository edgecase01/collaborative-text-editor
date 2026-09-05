import * as documentRepository from '../repositories/documentRepository.js';

export async function getDocument(id){
  const doc = await documentRepository.getDocumentByID(id);

  if(!doc){
    throw new Error("Document not found", { cause : 404 });
  } 

  return doc;
}

export async function updateDocument(id, content){
  const doc = await documentRepository.updateDocumentByID(id, content);

  if(!doc){
    throw new Error("Document not found", { cause : 404 });
  } 

  return doc;
}