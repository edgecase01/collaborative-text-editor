import * as documentRepository from '../repositories/documentRepository.js';
import AppError from '../errors/AppError.js';

export async function getDocument(id){
  const doc = await documentRepository.getDocumentByID(id);

  if(!doc){
    throw new AppError(404, "Document not found");
  } 

  return doc;
}

export async function updateDocument(id, content){
  const doc = await documentRepository.updateDocumentByID(id, content);

  if(!doc){
    throw new AppError(404, "Document not found");
  } 

  return doc;
}