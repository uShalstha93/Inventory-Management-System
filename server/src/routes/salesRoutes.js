import express from 'express';
import {
    getAllSales,
    getSaleById,
    createSale
} from '../controllers/salesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllSales);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSale);

export default router;