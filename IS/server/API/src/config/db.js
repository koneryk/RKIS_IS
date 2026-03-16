const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'IS',
    password: 'QWERTY1234',
    port: 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('✅ Подключено к PostgreSQL');
        release();
    }
});

module.exports = pool;