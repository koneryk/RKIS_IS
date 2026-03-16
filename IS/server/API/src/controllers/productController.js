const pool = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM credit_products WHERE is_active = true ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка getProducts:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM credit_products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка getProductById:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    const {
        code, name, description, min_amount, max_amount,
        base_rate, min_term, max_term, requires_collateral,
        requires_business_plan, is_active
    } = req.body;

    if (!code || !name || !min_amount || !max_amount || !base_rate || !min_term || !max_term) {
        return res.status(400).json({
            error: 'Обязательные поля: code, name, min_amount, max_amount, base_rate, min_term, max_term'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO credit_products 
             (code, name, description, min_amount, max_amount, base_rate, 
              min_term, max_term, requires_collateral, requires_business_plan, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [code, name, description, min_amount, max_amount, base_rate,
                min_term, max_term, requires_collateral || false,
                requires_business_plan || false, is_active !== undefined ? is_active : true]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка createProduct:', err);

        if (err.code === '23505') {
            return res.status(400).json({ error: 'Продукт с таким кодом уже существует' });
        }

        res.status(500).json({ error: err.message });
    }
};