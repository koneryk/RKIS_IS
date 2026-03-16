const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Кредитная система API',
            version: '1.0.0',
            description: 'API для управления кредитными заявками (IDEF0-модель)',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Локальный сервер разработки'
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Введите JWT токен в формате: Bearer <token>'
                }
            },
            schemas: {

                User: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор пользователя'
                        },
                        name: {
                            type: 'string',
                            description: 'Имя пользователя'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email пользователя'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'credit_specialist', 'security', 'lawyer', 'manager'],
                            description: 'Роль пользователя (M1-M9)'
                        },
                        department: {
                            type: 'string',
                            description: 'Отдел пользователя'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата создания'
                        }
                    },
                    example: {
                        id: 1,
                        name: 'Иван Петров',
                        email: 'ivan@example.com',
                        role: 'credit_specialist',
                        department: 'Отдел кредитования (M1)',
                        created_at: '2024-01-15T10:30:00Z'
                    }
                },

                Client: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор клиента'
                        },
                        name: {
                            type: 'string',
                            description: 'Наименование клиента'
                        },
                        inn: {
                            type: 'string',
                            description: 'ИНН'
                        },
                        ogrn: {
                            type: 'string',
                            description: 'ОГРН'
                        },
                        address: {
                            type: 'string',
                            description: 'Адрес'
                        },
                        phone: {
                            type: 'string',
                            description: 'Телефон'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата создания'
                        }
                    },
                    example: {
                        id: 1,
                        name: 'ООО "Ромашка"',
                        inn: '7701234567',
                        ogrn: '1027701234567',
                        address: 'Москва, ул. Ленина, 1',
                        phone: '+7(495)123-45-67',
                        email: 'info@romashka.ru',
                        created_at: '2024-01-15T10:30:00Z'
                    }
                },

                CreditProduct: {
                    type: 'object',
                    required: ['code', 'name', 'min_amount', 'max_amount', 'base_rate', 'min_term', 'max_term'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор продукта'
                        },
                        code: {
                            type: 'string',
                            description: 'Код продукта'
                        },
                        name: {
                            type: 'string',
                            description: 'Название продукта'
                        },
                        description: {
                            type: 'string',
                            description: 'Описание'
                        },
                        min_amount: {
                            type: 'number',
                            description: 'Минимальная сумма кредита'
                        },
                        max_amount: {
                            type: 'number',
                            description: 'Максимальная сумма кредита'
                        },
                        base_rate: {
                            type: 'number',
                            description: 'Базовая процентная ставка'
                        },
                        min_term: {
                            type: 'integer',
                            description: 'Минимальный срок (месяцев)'
                        },
                        max_term: {
                            type: 'integer',
                            description: 'Максимальный срок (месяцев)'
                        },
                        requires_collateral: {
                            type: 'boolean',
                            description: 'Требуется залог'
                        },
                        requires_business_plan: {
                            type: 'boolean',
                            description: 'Требуется бизнес-план'
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Активен'
                        }
                    },
                    example: {
                        id: 1,
                        code: 'BUS-START',
                        name: 'Бизнес-Старт',
                        description: 'Для начинающих предпринимателей',
                        min_amount: 100000,
                        max_amount: 1000000,
                        base_rate: 15.5,
                        min_term: 12,
                        max_term: 36,
                        requires_collateral: false,
                        requires_business_plan: true,
                        is_active: true
                    }
                },

                Application: {
                    type: 'object',
                    required: ['client_id', 'product_id', 'requested_amount', 'requested_term'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор заявки'
                        },
                        client_id: {
                            type: 'integer',
                            description: 'ID клиента'
                        },
                        product_id: {
                            type: 'integer',
                            description: 'ID кредитного продукта'
                        },
                        requested_amount: {
                            type: 'number',
                            description: 'Запрашиваемая сумма'
                        },
                        requested_term: {
                            type: 'integer',
                            description: 'Запрашиваемый срок (месяцев)'
                        },
                        status: {
                            type: 'string',
                            enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'contract_ready'],
                            description: 'Статус заявки'
                        },
                        current_stage: {
                            type: 'string',
                            enum: ['A1', 'A2', 'A21', 'A22', 'A23', 'A3', 'A4', 'A5', 'rejected'],
                            description: 'Текущий этап (IDEF0)'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата создания'
                        }
                    },
                    example: {
                        id: 1,
                        client_id: 1,
                        product_id: 1,
                        requested_amount: 500000,
                        requested_term: 24,
                        status: 'in_review',
                        current_stage: 'A21',
                        created_at: '2024-01-15T10:30:00Z'
                    }
                },

                RiskAssessment: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор'
                        },
                        application_id: {
                            type: 'integer',
                            description: 'ID заявки'
                        },
                        financial_score: {
                            type: 'integer',
                            description: 'Скоринг-балл (A21)'
                        },
                        liquidity_ratio: {
                            type: 'number',
                            description: 'Коэффициент ликвидности'
                        },
                        debt_ratio: {
                            type: 'number',
                            description: 'Коэффициент долговой нагрузки'
                        },
                        industry_risk: {
                            type: 'string',
                            enum: ['Низкий', 'Средний', 'Высокий'],
                            description: 'Отраслевой риск (C4.4)'
                        },
                        collateral_value: {
                            type: 'number',
                            description: 'Стоимость залога (A22)'
                        },
                        ltv_ratio: {
                            type: 'number',
                            description: 'LTV (Loan-to-Value)'
                        },
                        business_plan_score: {
                            type: 'integer',
                            description: 'Оценка бизнес-плана'
                        },
                        final_decision: {
                            type: 'string',
                            enum: ['approved', 'rejected', 'conditional'],
                            description: 'Итоговое решение (O3/O4/I3)'
                        },
                        decision_date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата решения'
                        }
                    }
                },

                Contract: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор'
                        },
                        application_id: {
                            type: 'integer',
                            description: 'ID заявки'
                        },
                        contract_number: {
                            type: 'string',
                            description: 'Номер договора (O1)'
                        },
                        signed_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Дата подписания'
                        },
                        effective_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Дата вступления в силу'
                        },
                        maturity_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Дата погашения'
                        },
                        amount: {
                            type: 'number',
                            description: 'Сумма кредита'
                        },
                        interest_rate: {
                            type: 'number',
                            description: 'Процентная ставка'
                        },
                        status: {
                            type: 'string',
                            enum: ['draft', 'signed', 'active', 'closed'],
                            description: 'Статус договора'
                        }
                    }
                },

                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email пользователя'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            description: 'Пароль'
                        },
                        rememberMe: {
                            type: 'boolean',
                            description: 'Запомнить меня (30 дней)'
                        }
                    },
                    example: {
                        email: 'admin@example.com',
                        password: 'password',
                        rememberMe: true
                    }
                },

                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'JWT токен'
                        },
                        user: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                },

                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Сообщение об ошибке'
                        }
                    },
                    example: {
                        error: 'Неверный email или пароль'
                    }
                }
            }
        },
        tags: [
            {
                name: 'Auth',
                description: 'Авторизация и регистрация'
            },
            {
                name: 'Users',
                description: 'Управление пользователями (M1-M9)'
            },
            {
                name: 'Clients',
                description: 'Управление клиентами (I2)'
            },
            {
                name: 'Products',
                description: 'Кредитные продукты (C1)'
            },
            {
                name: 'Applications',
                description: 'Кредитные заявки (A1-A5)'
            },
            {
                name: 'Risk Assessment',
                description: 'Оценка рисков (A21-A23)'
            },
            {
                name: 'Contracts',
                description: 'Договоры (O1)'
            }
        ]
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;