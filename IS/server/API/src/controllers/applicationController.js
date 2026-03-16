const pool = require('../config/db');

exports.getApplications = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
                   c.name as client_name, 
                   cp.name as product_name,
                   cp.base_rate
            FROM applications a
            LEFT JOIN clients c ON a.client_id = c.id
            LEFT JOIN credit_products cp ON a.product_id = cp.id
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка getApplications:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getApplicationById = async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`Запрос заявки ID: ${id}`);

        const result = await pool.query(`
            SELECT a.*, 
                   c.name as client_name, 
                   c.inn as client_inn,
                   c.phone as client_phone,
                   c.email as client_email,
                   cp.name as product_name,
                   cp.base_rate
            FROM applications a
            LEFT JOIN clients c ON a.client_id = c.id
            LEFT JOIN credit_products cp ON a.product_id = cp.id
            WHERE a.id = $1   
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        let riskAssessment = null;
        try {
            const riskResult = await pool.query(
                'SELECT * FROM risk_assessments WHERE application_id = $1',
                [id]
            );
            riskAssessment = riskResult.rows[0] || null;
        } catch (err) {
            console.log('Ошибка получения risk_assessments:', err.message);
        }

        res.json({
            ...result.rows[0],
            risk_assessment: riskAssessment
        });

    } catch (err) {
        console.error('❌ Ошибка getApplicationById:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createApplication = async (req, res) => {
    const { client_id, product_id, requested_amount, requested_term } = req.body;

    if (!client_id || !product_id || !requested_amount || !requested_term) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO applications (client_id, product_id, requested_amount, requested_term, status, current_stage) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [client_id, product_id, requested_amount, requested_term, 'submitted', 'A2']
        );

        await pool.query(
            `INSERT INTO stage_history (application_id, stage, entered_by, decision) 
             VALUES ($1, $2, $3, $4)`,
            [result.rows[0].id, 'A1', req.user?.id, 'submitted']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка createApplication:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateApplication = async (req, res) => {
    const { id } = req.params;
    const { client_id, product_id, requested_amount, requested_term, status, current_stage } = req.body;

    try {
        const result = await pool.query(
            `UPDATE applications 
             SET client_id = COALESCE($1, client_id),
                 product_id = COALESCE($2, product_id),
                 requested_amount = COALESCE($3, requested_amount),
                 requested_term = COALESCE($4, requested_term),
                 status = COALESCE($5, status),
                 current_stage = COALESCE($6, current_stage),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [client_id, product_id, requested_amount, requested_term, status, current_stage, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка updateApplication:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteApplication = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM applications WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Ошибка deleteApplication:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateApplicationStage = async (req, res) => {
    const { id } = req.params;
    const { stage, decision, comments } = req.body;

    try {
        const result = await pool.query(
            `UPDATE applications 
             SET current_stage = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [stage, id]
        );

        await pool.query(
            `INSERT INTO stage_history (application_id, stage, entered_by, decision, comments) 
             VALUES ($1, $2, $3, $4, $5)`,
            [id, stage, req.user?.id, decision, comments]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка updateApplicationStage:', err);
        res.status(500).json({ error: err.message });
    }
};


exports.getFinancialAnalysis = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM risk_assessments WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error('Ошибка getFinancialAnalysis:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveFinancialAnalysis = async (req, res) => {
    const { id } = req.params;
    const {
        financial_score,
        liquidity_ratio,
        debt_ratio,
        industry_risk,
        profit_margin,
        revenue,
        expenses,
        debt,
        assets
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO risk_assessments 
             (application_id, financial_score, liquidity_ratio, debt_ratio, industry_risk, 
              profit_margin, revenue, expenses, debt, assets, assessed_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [id, financial_score, liquidity_ratio, debt_ratio, industry_risk,
                profit_margin, revenue, expenses, debt, assets, req.user?.id]
        );

        await pool.query(
            `UPDATE applications SET current_stage = 'A22' WHERE id = $1`,
            [id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка saveFinancialAnalysis:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getCollateral = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM collateral WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error('Ошибка getCollateral:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveCollateral = async (req, res) => {
    const { id } = req.params;
    const {
        type,
        description,
        estimated_value,
        market_value,
        valuation_date,
        appraiser,
        ltv_ratio,
        comments
    } = req.body;

    console.log('📥 Сохранение залога для заявки:', id);
    console.log('Данные:', { type, description, estimated_value, market_value, valuation_date, appraiser, ltv_ratio });

    try {
        const result = await pool.query(
            `INSERT INTO collateral
             (application_id, type, description, estimated_value, market_value, valuation_date, appraiser, ltv_ratio, comments)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
            [id, type, description, estimated_value, market_value, valuation_date, appraiser, ltv_ratio, comments]
        );

        console.log('Залог сохранен, ID:', result.rows[0].id);


        await pool.query(
            `UPDATE applications SET current_stage = 'A23' WHERE id = $1`,
            [id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка saveCollateral:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getRiskDecision = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM risk_assessments WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error('Ошибка getRiskDecision:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveRiskDecision = async (req, res) => {
    const { id } = req.params;
    const {
        final_decision,
        comment,
        conditions,
        approved_amount,
        approved_rate,
        approved_term
    } = req.body;

    try {
        const existing = await pool.query(
            'SELECT id FROM risk_assessments WHERE application_id = $1',
            [id]
        );

        let result;
        if (existing.rows.length > 0) {
            result = await pool.query(
                `UPDATE risk_assessments 
                 SET final_decision = $1, 
                     comment = $2, 
                     conditions = $3,
                     approved_amount = $4, 
                     approved_rate = $5, 
                     approved_term = $6,
                     decision_date = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE application_id = $7
                 RETURNING *`,
                [final_decision, comment, conditions, approved_amount, approved_rate, approved_term, id]
            );
        } else {
            result = await pool.query(
                `INSERT INTO risk_assessments 
                 (application_id, final_decision, comment, conditions, 
                  approved_amount, approved_rate, approved_term, decision_date)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [id, final_decision, comment, conditions, approved_amount, approved_rate, approved_term]
            );
        }

        let nextStage = 'A3';
        let status = 'approved';

        if (final_decision === 'rejected') {
            nextStage = 'rejected';
            status = 'rejected';
        } else if (final_decision === 'conditional') {
            nextStage = 'A2_conditional';
            status = 'conditional';
        }

        await pool.query(
            `UPDATE applications SET status = $1, current_stage = $2 WHERE id = $3`,
            [status, nextStage, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка saveRiskDecision:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getLegalCheck = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM legal_checks WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error('Ошибка getLegalCheck:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveLegalCheck = async (req, res) => {
    const { id } = req.params;
    const { checks, conditions, conclusion } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO legal_checks 
             (application_id, checks, conditions, conclusion, signed_by, signed_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             RETURNING *`,
            [id, checks, conditions, conclusion, req.user?.id]
        );

        await pool.query(
            `UPDATE applications SET current_stage = 'A4' WHERE id = $1`,
            [id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка saveLegalCheck:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getApprovals = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM approvals WHERE application_id = $1 ORDER BY created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка getApprovals:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveApproval = async (req, res) => {
    const { id } = req.params;
    const { decision, comment, approver_name, approver_role } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO approvals 
             (application_id, decision, comment, approver_name, approver_role, approved_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [id, decision, comment, approver_name, approver_role, req.user?.id]
        );

        const approvalsCount = await pool.query(
            'SELECT COUNT(*) FROM approvals WHERE application_id = $1',
            [id]
        );

        if (approvalsCount.rows[0].count >= 3) {
            await pool.query(
                `UPDATE applications SET current_stage = 'A5' WHERE id = $1`,
                [id]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка saveApproval:', err);
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

    try {
        const result = await pool.query(
            `INSERT INTO contracts 
             (application_id, contract_number, created_date, amount, interest_rate, 
              term, payment_frequency, conditions, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, contract_number, created_date || new Date(), amount, interest_rate,
                term, payment_frequency, conditions || {}, 'draft']
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

exports.getContracts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   a.client_id,
                   cl.name as client_name
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
                   cl.ogrn
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

exports.uploadDocument = async (req, res) => {
    const { id } = req.params;
    const { document_type, file_name, file_path } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO documents 
             (application_id, document_type, file_name, file_path, uploaded_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id, document_type, file_name, file_path, req.user?.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка uploadDocument:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getDocuments = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM documents WHERE application_id = $1 ORDER BY uploaded_at DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка getDocuments:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDocument = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Ошибка deleteDocument:', err);
        res.status(500).json({ error: err.message });
    }
};