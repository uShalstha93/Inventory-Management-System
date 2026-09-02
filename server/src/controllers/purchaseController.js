import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllPurchases = async (req, res) => {
    try {
        // Get pagination and search parameters from query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Base query with product names
        let query = `
            SELECT 
                p.*, 
                u.username as created_by_name,
                GROUP_CONCAT(DISTINCT pr.name SEPARATOR ', ') as product_names,
                COUNT(DISTINCT pi.product_id) as total_products
            FROM purchases p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
            LEFT JOIN products pr ON pi.product_id = pr.id
        `;

        let countQuery = 'SELECT COUNT(*) as total FROM purchases p';
        const params = [];
        const countParams = [];

        // Add search functionality - including product names
        if (search) {
            const searchTerm = `%${search}%`;

            // For the main query with product name search
            query += `
                WHERE p.invoice_no LIKE ? 
                OR p.supplier_name LIKE ? 
                OR EXISTS (
                    SELECT 1 
                    FROM purchase_items pi2 
                    JOIN products pr2 ON pi2.product_id = pr2.id 
                    WHERE pi2.purchase_id = p.id 
                    AND pr2.name LIKE ?
                )
            `;
            params.push(searchTerm, searchTerm, searchTerm);

            // For the count query (needs to match the main query)
            countQuery += `
                WHERE p.invoice_no LIKE ? 
                OR p.supplier_name LIKE ? 
                OR EXISTS (
                    SELECT 1 
                    FROM purchase_items pi2 
                    JOIN products pr2 ON pi2.product_id = pr2.id 
                    WHERE pi2.purchase_id = p.id 
                    AND pr2.name LIKE ?
                )
            `;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Add grouping and sorting
        query += ' GROUP BY p.id ORDER BY p.created_at DESC';

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
        console.error('Error fetching purchases:', error);
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

export const deletePurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get purchase items to revert stock
        const [items] = await connection.execute(
            'SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?',
            [req.params.id]
        );

        // Revert stock for each item
        for (const item of items) {
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Delete purchase (cascade will delete items)
        await connection.execute(
            'DELETE FROM purchases WHERE id = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete purchase error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};