import pool from '../config/database.js';

export const getAllProducts = async (req, res) => {
    try {
        // Get pagination and search parameters from query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM products p';
        const params = [];
        const countParams = [];

        // Add search functionality
        if (search) {
            query += ' WHERE p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?';
            countQuery += ' WHERE p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Add sorting
        query += ' ORDER BY p.name ASC';

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
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, sku, category_id, price, cost_price, stock_quantity, min_stock_level } = req.body;
        const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

        const [result] = await pool.execute(
            `INSERT INTO products 
            (name, description, sku, category_id, price, cost_price, stock_quantity, min_stock_level, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, sku, category_id, price, cost_price, stock_quantity || 0, min_stock_level || 5, image_url]
        );

        const [newProduct] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [result.insertId]);

        res.status(201).json(newProduct[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { name, description, sku, category_id, price, cost_price, stock_quantity, min_stock_level } = req.body;
        let image_url = null;

        if (req.file) {
            image_url = `/uploads/products/${req.file.filename}`;
        }

        let query = `UPDATE products SET 
            name = ?, description = ?, sku = ?, category_id = ?, 
            price = ?, cost_price = ?, stock_quantity = ?, min_stock_level = ?`;
        const params = [name, description, sku, category_id, price, cost_price, stock_quantity, min_stock_level];

        if (image_url) {
            query += `, image_url = ?`;
            params.push(image_url);
        }

        query += ` WHERE id = ?`;
        params.push(req.params.id);

        await pool.execute(query, params);

        const [updated] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLowStockProducts = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity <= p.min_stock_level
            ORDER BY p.stock_quantity ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};