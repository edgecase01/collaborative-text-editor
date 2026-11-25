import * as documentService from '../services/documentService.js';

export async function getAllDocuments(req, res) {
  const docs = await documentService.getAllDocuments();
  return res.status(200).json(docs);
}

export async function getDocument(req, res) {
  const output = await documentService.getDocument(Number(req.params.id));
  return res.status(200).json(output);
}

export async function createDocument(req, res) {
  const { title, content } = req.body;
  const newDoc = await documentService.createDocument(title, content);
  return res.status(201).json(newDoc);
}

export async function updateDocument(req, res) {
  const output = await documentService.updateDocument(Number(req.params.id), req.body.content);
  return res.status(200).json(output);
}

export async function deleteDocument(req, res) {
  const result = await documentService.deleteDocument(Number(req.params.id));
  return res.status(200).json(result);
}
