import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllSales = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT s.*, u.username as created_by_name 
            FROM sales s
            LEFT JOIN users u ON s.created_by = u.id
            ORDER BY s.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const [sale] = await pool.execute(`
            SELECT s.*, u.username as created_by_name 
            FROM sales s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (sale.length === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        const [items] = await pool.execute(`
            SELECT si.*, pr.name as product_name, pr.sku 
            FROM sales_items si
            JOIN products pr ON si.product_id = pr.id
            WHERE si.sale_id = ?
        `, [req.params.id]);

        res.json({ ...sale[0], items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createSale = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_name, customer_email, customer_phone, sale_date, discount, tax, notes, items } = req.body;
        const invoice_no = `INV-${Date.now()}-${uuidv4().slice(0, 8)}`;
        const created_by = req.user.id;

        let subtotal = 0;
        for (const item of items) {
            subtotal += item.quantity * item.price;
        }

        const total_amount = subtotal;
        const net_amount = total_amount - (discount || 0) + (tax || 0);

        const [saleResult] = await connection.execute(
            `INSERT INTO sales 
            (invoice_no, customer_name, customer_email, customer_phone, total_amount, discount, tax, net_amount, sale_date, notes, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoice_no, customer_name, customer_email, customer_phone, total_amount, discount || 0, tax || 0, net_amount, sale_date, notes, created_by]
        );

        const saleId = saleResult.insertId;

        for (const item of items) {
            await connection.execute(
                `INSERT INTO sales_items (sale_id, product_id, quantity, price, total) 
                 VALUES (?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.quantity, item.price, item.quantity * item.price]
            );

            // Update product stock
            await connection.execute(
                `UPDATE products 
                 SET stock_quantity = stock_quantity - ? 
                 WHERE id = ? AND stock_quantity >= ?`,
                [item.quantity, item.product_id, item.quantity]
            );
        }

        await connection.commit();

        const [newSale] = await connection.execute(`
            SELECT s.*, u.username as created_by_name 
            FROM sales s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.id = ?
        `, [saleId]);

        res.status(201).json(newSale[0]);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};