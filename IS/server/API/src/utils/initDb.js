const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
    try {
        console.log('🔄 Проверка и создание таблиц в базе данных...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                                                 id SERIAL PRIMARY KEY,
                                                 name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                department VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица users создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS credit_products (
                                                           id SERIAL PRIMARY KEY,
                                                           code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                min_amount DECIMAL(15,2) NOT NULL,
                max_amount DECIMAL(15,2) NOT NULL,
                base_rate DECIMAL(5,2) NOT NULL,
                min_term INTEGER NOT NULL,
                max_term INTEGER NOT NULL,
                requires_collateral BOOLEAN DEFAULT false,
                requires_business_plan BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица credit_products создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS clients (
                                                   id SERIAL PRIMARY KEY,
                                                   name VARCHAR(255) NOT NULL,
                inn VARCHAR(12) UNIQUE,
                ogrn VARCHAR(15),
                address TEXT,
                phone VARCHAR(20),
                email VARCHAR(255),
                registration_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица clients создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS applications (
                                                        id SERIAL PRIMARY KEY,
                                                        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES credit_products(id),
                requested_amount DECIMAL(15,2) NOT NULL,
                requested_term INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                current_stage VARCHAR(10) DEFAULT 'A1',
                submitted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица applications создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS documents (
                                                     id SERIAL PRIMARY KEY,
                                                     application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                document_type VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                uploaded_by INTEGER REFERENCES users(id),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица documents создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS risk_assessments (
                                                            id SERIAL PRIMARY KEY,
                                                            application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                assessed_by INTEGER REFERENCES users(id),

                financial_score INTEGER,
                liquidity_ratio DECIMAL(10,2),
                debt_ratio DECIMAL(10,2),
                profit_margin DECIMAL(10,2),
                revenue DECIMAL(15,2),
                expenses DECIMAL(15,2),
                debt DECIMAL(15,2),
                assets DECIMAL(15,2),

                collateral_type VARCHAR(50),
                collateral_description TEXT,
                collateral_value DECIMAL(15,2),
                ltv_ratio DECIMAL(5,2),
                business_plan_score INTEGER,

                industry_risk VARCHAR(50),
                final_decision VARCHAR(20),
                approved_amount DECIMAL(15,2),
                approved_rate DECIMAL(5,2),
                approved_term INTEGER,
                conditions JSONB,
                decision_date TIMESTAMP,
                comments TEXT,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица risk_assessments создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS collateral (
                                                      id SERIAL PRIMARY KEY,
                                                      application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                estimated_value DECIMAL(15,2),
                market_value DECIMAL(15,2),
                valuation_date DATE,
                appraiser VARCHAR(255),
                ltv_ratio DECIMAL(5,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица collateral создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS stage_history (
                                                         id SERIAL PRIMARY KEY,
                                                         application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                stage VARCHAR(10) NOT NULL,
                entered_by INTEGER REFERENCES users(id),
                decision VARCHAR(20),
                comments TEXT,
                entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица stage_history создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS legal_checks (
                                                        id SERIAL PRIMARY KEY,
                                                        application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                checks JSONB,
                conditions JSONB,
                conclusion JSONB,
                signed_by INTEGER REFERENCES users(id),
                signed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица legal_checks создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS approvals (
                                                     id SERIAL PRIMARY KEY,
                                                     application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                decision VARCHAR(20),
                comment TEXT,
                approver_name VARCHAR(255),
                approver_role VARCHAR(100),
                approved_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `);
        console.log('✅ Таблица approvals создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS contracts (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                contract_number VARCHAR(50) UNIQUE,
                signed_date DATE,
                effective_date DATE,
                maturity_date DATE,
                amount DECIMAL(15,2),
                interest_rate DECIMAL(5,2),
                term INTEGER,
                payment_frequency VARCHAR(20),
                conditions JSONB,
                status VARCHAR(20) DEFAULT 'draft',
                document_id INTEGER REFERENCES documents(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Таблица contracts создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
                due_date DATE NOT NULL,
                paid_date DATE,
                amount DECIMAL(15,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                payment_order INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Таблица payments создана');

        await addTestData(pool);

        console.log('Все таблицы успешно инициализированы!\n');

    } catch (err) {
        console.error('Ошибка при создании таблиц:', err);
        throw err;
    }
}

async function addTestData(pool) {
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);

    if (adminCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('password', 10);

        await pool.query(
            `INSERT INTO users (name, email, password, role, department) VALUES
                                                                             ($1, $2, $3, $4, $5),
                                                                             ($6, $7, $8, $9, $10),
                                                                             ($11, $12, $13, $14, $15)`,
            [
                'Администратор', 'admin@example.com', hashedPassword, 'admin', 'IT',
                'Иван Петров', 'credit@example.com', hashedPassword, 'credit_specialist', 'Отдел кредитования (M1)',
                'Мария Сидорова', 'security@example.com', hashedPassword, 'security', 'ОЭБ (M2)'
            ]
        );
        console.log('✅ Тестовые пользователи созданы');
    }

    const productsCheck = await pool.query('SELECT * FROM credit_products');

    if (productsCheck.rows.length === 0) {
        await pool.query(
            `INSERT INTO credit_products (code, name, description, min_amount, max_amount, base_rate, min_term, max_term, requires_collateral, requires_business_plan) VALUES
                                                                                                                                                                           ('BUS-START', 'Бизнес-Старт', 'Для начинающих предпринимателей', 100000, 1000000, 15.5, 12, 36, false, true),
                                                                                                                                                                           ('BUS-DEV', 'Бизнес-Развитие', 'Для действующего бизнеса', 1000000, 5000000, 13.0, 24, 60, true, true),
                                                                                                                                                                           ('BUS-INVEST', 'Бизнес-Инвест', 'Крупные инвестиционные проекты', 5000000, 50000000, 11.5, 36, 120, true, true)`
        );
        console.log('✅ Тестовые кредитные продукты созданы');
    }

    const clientCheck = await pool.query('SELECT * FROM clients');

    if (clientCheck.rows.length === 0) {
        await pool.query(
            `INSERT INTO clients (name, inn, ogrn, address, phone, email) VALUES
                                                                              ('ООО "Ромашка"', '7701234567', '1027701234567', 'Москва, ул. Ленина, 1', '+7(495)123-45-67', 'info@romashka.ru'),
                                                                              ('ИП Иванов И.И.', '770123456789', '310770123456789', 'Москва, ул. Пушкина, 10', '+7(903)123-45-67', 'ivanov@mail.ru')`
        );
        console.log('✅ Тестовые клиенты созданы');
    }
}

module.exports = initializeDatabase;