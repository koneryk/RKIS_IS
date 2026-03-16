const pool = require('../config/db');

exports.getContracts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   a.client_id,
                   cl.name as client_name,
                   cl.inn,
                   cl.ogrn
            FROM contracts c
            LEFT JOIN applications a ON c.application_id = a.id
            LEFT JOIN clients cl ON a.client_id = cl.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка getContracts:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getContractById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   a.client_id,
                   cl.name as client_name,
                   cl.inn,
                   cl.ogrn,
                   a.requested_amount,
                   a.requested_term
            FROM contracts c
            LEFT JOIN applications a ON c.application_id = a.id
            LEFT JOIN clients cl ON a.client_id = cl.id
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Договор не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка getContractById:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createContract = async (req, res) => {
    const { id } = req.params;
    const {
        contract_number,
        created_date,
        amount,
        interest_rate,
        term,
        payment_frequency,
        conditions
    } = req.body;

    if (!contract_number || !amount || !interest_rate || !term) {
        return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    try {
        const appCheck = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
        if (appCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        const result = await pool.query(
            `INSERT INTO contracts 
             (application_id, contract_number, created_date, amount, interest_rate, term, payment_frequency, conditions, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, contract_number, created_date || new Date(), amount, interest_rate, term, payment_frequency || 'monthly', conditions || {}, 'draft']
        );

        await pool.query(
            `UPDATE applications SET current_stage = 'A5', status = 'contract_ready' WHERE id = $1`,
            [id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка createContract:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateContract = async (req, res) => {
    const { id } = req.params;
    const {
        contract_number,
        signed_date,
        effective_date,
        maturity_date,
        amount,
        interest_rate,
        status
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE contracts 
             SET contract_number = COALESCE($1, contract_number),
                 signed_date = COALESCE($2, signed_date),
                 effective_date = COALESCE($3, effective_date),
                 maturity_date = COALESCE($4, maturity_date),
                 amount = COALESCE($5, amount),
                 interest_rate = COALESCE($6, interest_rate),
                 status = COALESCE($7, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [contract_number, signed_date, effective_date, maturity_date, amount, interest_rate, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Договор не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка updateContract:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteContract = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Договор не найден' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Ошибка deleteContract:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.signContract = async (req, res) => {
    const { id } = req.params;
    const { signed_by } = req.body;

    try {
        const result = await pool.query(
            `UPDATE contracts 
             SET status = 'signed',
                 signed_date = CURRENT_DATE,
                 signed_by = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [signed_by || 'system', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Договор не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка signContract:', err);
        res.status(500).json({ error: err.message });
    }
};