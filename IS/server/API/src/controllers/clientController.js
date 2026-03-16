const pool = require('../config/db');

exports.getClients = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*,
                   COUNT(a.id) as applications_count,
                   MAX(a.created_at) as last_application_date
            FROM clients c
                     LEFT JOIN applications a ON c.id = a.client_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка getClients:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getClientById = async (req, res) => {
    const { id } = req.params;

    try {
        const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

        if (client.rows.length === 0) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }

        const applications = await pool.query(
            'SELECT * FROM applications WHERE client_id = $1 ORDER BY created_at DESC',
            [id]
        );

        res.json({
            ...client.rows[0],
            applications: applications.rows
        });
    } catch (err) {
        console.error('Ошибка getClientById:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createClient = async (req, res) => {
    const { name, inn, ogrn, address, phone, email } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Поле name обязательно' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO clients (name, inn, ogrn, address, phone, email)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, inn, ogrn, address, phone, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка createClient:', err);

        if (err.code === '23505') { 
            return res.status(400).json({ error: 'Клиент с таким ИНН уже существует' });
        }

        res.status(500).json({ error: err.message });
    }
};

exports.updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, inn, ogrn, address, phone, email } = req.body;

    try {
        const checkExists = await pool.query('SELECT id FROM clients WHERE id = $1', [id]);

        if (checkExists.rows.length === 0) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }

        const result = await pool.query(
            `UPDATE clients 
             SET name = COALESCE($1, name),
                 inn = COALESCE($2, inn),
                 ogrn = COALESCE($3, ogrn),
                 address = COALESCE($4, address),
                 phone = COALESCE($5, phone),
                 email = COALESCE($6, email),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [name, inn, ogrn, address, phone, email, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка updateClient:', err);

        if (err.code === '23505') {
            return res.status(400).json({ error: 'Клиент с таким ИНН уже существует' });
        }

        res.status(500).json({ error: err.message });
    }
};
exports.searchClients = async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query(
            `SELECT * FROM clients 
             WHERE name ILIKE $1 OR inn ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1`,
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        const applications = await pool.query(
            'SELECT id FROM applications WHERE client_id = $1 LIMIT 1',
            [id]
        );

        if (applications.rows.length > 0) {
            return res.status(400).json({
                error: 'Нельзя удалить клиента с существующими заявками',
                applications_count: applications.rows.length
            });
        }

        const result = await pool.query(
            'DELETE FROM clients WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }

        res.status(204).send(); 
    } catch (err) {
        console.error('Ошибка deleteClient:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.searchClients = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Параметр q обязателен' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM clients 
             WHERE name ILIKE $1 
                OR inn ILIKE $1 
                OR email ILIKE $1 
                OR phone ILIKE $1
             ORDER BY name
             LIMIT 20`,
            [`%${q}%`]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка searchClients:', err);
        res.status(500).json({ error: err.message });
    }
};