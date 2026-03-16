const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const initializeDatabase = require('./utils/initDb');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Кредитная система API',
    customfavIcon: '/favicon.ico'
}));

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        time: new Date().toISOString(),
        database: process.env.DB_NAME,
        version: '1.0.0',
        docs: '/api-docs'
    });
});

app.use('/api', routes);

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
    console.error('Ошибка:', err.stack);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
    });
});

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`\nСервер запущен на порту ${PORT}`);
        console.log(`API доступно: http://localhost:${PORT}/api`);
        console.log(`Swagger документация: http://localhost:${PORT}/api-docs`);
        console.log(`Тестовый пользователь: admin@example.com / password`);
        console.log(`Маршруты:`);
        console.log(`   - GET  /api/health`);
        console.log(`   - GET  /api-docs`);
        console.log(`   - POST /api/auth/login`);
        console.log(`   - GET  /api/products`);
        console.log(`   - GET  /api/clients`);
        console.log(`   - GET  /api/applications`);
        console.log(`   - POST /api/applications\n`);
    });
}).catch(err => {
    console.error('Не удалось запустить сервер:', err);
    process.exit(1);
});