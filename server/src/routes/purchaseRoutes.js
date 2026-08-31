import express from 'express';
import {
    getAllPurchases,
    getPurchaseById,
    createPurchase
} from '../controllers/purchaseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllPurchases);
router.get('/:id', authenticate, getPurchaseById);
router.post('/', authenticate, createPurchase);

export default router;