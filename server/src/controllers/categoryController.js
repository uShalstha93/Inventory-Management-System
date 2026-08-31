import pool from '../config/database.js';

export const getAllCategories = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        const [newCategory] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );
        res.status(201).json(newCategory[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.execute(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        const [updated] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );
        if (updated.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};