import express from "express";
import * as documentController from '../controllers/documentController.js';

const router = express.Router();

router.get('/:id', documentController.getDocument);

router.put('/:id', documentController.updateDocument);

export default router;
