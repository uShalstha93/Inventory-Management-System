import express from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts
} from '../controllers/productController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', authenticate, getAllProducts);
router.get('/low-stock', authenticate, getLowStockProducts);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, isAdmin, upload.single('image'), createProduct);
router.put('/:id', authenticate, isAdmin, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

export default router;