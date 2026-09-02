import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllSales = async (req, res) => {
    try {
        // Get pagination and search parameters from query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `
            SELECT s.*, u.username as created_by_name 
            FROM sales s
            LEFT JOIN users u ON s.created_by = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM sales s';
        const params = [];
        const countParams = [];

        // Add search functionality
        if (search) {
            query += ' WHERE s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_email LIKE ?';
            countQuery += ' WHERE s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_email LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Add sorting
        query += ' ORDER BY s.created_at DESC';

        // Add pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Get total count
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Get paginated results
        const [rows] = await pool.execute(query, params);

        res.json({
            data: rows,
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
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

export const deleteSale = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get sale items to revert stock
        const [items] = await connection.execute(
            'SELECT product_id, quantity FROM sales_items WHERE sale_id = ?',
            [req.params.id]
        );

        // Revert stock for each item
        for (const item of items) {
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Delete sale (cascade will delete items)
        await connection.execute(
            'DELETE FROM sales WHERE id = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete sale error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};