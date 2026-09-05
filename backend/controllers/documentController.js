import * as documentService from '../services/documentService.js';

export async function getDocument(req, res){
  const output = await documentService.getDocument(Number(req.params.id));

  return res.status(200).json(output);
}

export async function updateDocument(req, res){
  const output = await documentService.updateDocument(Number(req.params.id), req.body.content);

  return res.status(200).json(output);
}