import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllPurchases = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.*, u.username as created_by_name 
            FROM purchases p
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPurchaseById = async (req, res) => {
    try {
        const [purchase] = await pool.execute(`
            SELECT p.*, u.username as created_by_name 
            FROM purchases p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (purchase.length === 0) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        const [items] = await pool.execute(`
            SELECT pi.*, pr.name as product_name, pr.sku 
            FROM purchase_items pi
            JOIN products pr ON pi.product_id = pr.id
            WHERE pi.purchase_id = ?
        `, [req.params.id]);

        res.json({ ...purchase[0], items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { supplier_name, purchase_date, notes, items } = req.body;
        const invoice_no = `PO-${Date.now()}-${uuidv4().slice(0, 8)}`;
        const created_by = req.user.id;

        let total_amount = 0;
        for (const item of items) {
            total_amount += item.quantity * item.cost_price;
        }

        const [purchaseResult] = await connection.execute(
            `INSERT INTO purchases (invoice_no, supplier_name, total_amount, purchase_date, notes, created_by) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [invoice_no, supplier_name, total_amount, purchase_date, notes, created_by]
        );

        const purchaseId = purchaseResult.insertId;

        for (const item of items) {
            await connection.execute(
                `INSERT INTO purchase_items (purchase_id, product_id, quantity, cost_price, total) 
                 VALUES (?, ?, ?, ?, ?)`,
                [purchaseId, item.product_id, item.quantity, item.cost_price, item.quantity * item.cost_price]
            );

            // Update product stock
            await connection.execute(
                `UPDATE products 
                 SET stock_quantity = stock_quantity + ? 
                 WHERE id = ?`,
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        const [newPurchase] = await connection.execute(`
            SELECT p.*, u.username as created_by_name 
            FROM purchases p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        `, [purchaseId]);

        res.status(201).json(newPurchase[0]);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};