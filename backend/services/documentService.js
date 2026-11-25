import * as documentRepository from '../repositories/documentRepository.js';
import AppError from '../errors/AppError.js';

export async function getAllDocuments() {
  return await documentRepository.getAllDocuments();
}

export async function getDocument(id) {
  const doc = await documentRepository.getDocumentByID(id);
  if (!doc) {
    throw new AppError(404, "Document not found");
  }
  return doc;
}

export async function createDocument(title, content) {
  return await documentRepository.createDocument(title, content);
}

export async function updateDocument(id, content) {
  const doc = await documentRepository.updateDocumentByID(id, content);
  if (!doc) {
    throw new AppError(404, "Document not found");
  }
  return doc;
}

export async function deleteDocument(id) {
  const deleted = await documentRepository.deleteDocumentByID(id);
  if (!deleted) {
    throw new AppError(404, "Document not found");
  }
  return { success: true };
}
