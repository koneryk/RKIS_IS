describe('CreditSys - Авторизация', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
    
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    cy.intercept('POST', '**/api/auth/register').as('registerRequest');
    
    cy.on('uncaught:exception', (err, runnable) => {
      return false;
    });
  });
  it('должна корректно отображаться страница входа', () => {
    cy.contains('CreditSys').should('be.visible');
    cy.contains('Вход в систему').should('be.visible');
    cy.contains('Кредитная система для владельцев частных предприятий').should('be.visible');
    
    cy.get('input[placeholder="Введите email"]').should('exist');
    cy.get('input[placeholder="Введите пароль"]').should('exist');
    
    cy.contains('Запомнить меня').should('be.visible');
    cy.contains('Забыли пароль?').should('be.visible');
    cy.contains('Войти').should('be.visible');
    cy.contains('Нет аккаунта?').should('be.visible');
    
    cy.contains('Демо: admin@example.com / password').should('be.visible');
  });

  it('должен выполнять успешный вход с демо-учетными данными', () => {
    cy.get('input[placeholder="Введите email"]').type('admin@example.com');
    cy.get('input[placeholder="Введите пароль"]').type('password');
    cy.contains('Войти').click();
    
    cy.wait('@loginRequest');
    cy.url().should('eq', 'http://localhost:5173/');
    
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null;
    });
  });

  it('должен показывать ошибку при неверных учетных данных', () => {
    cy.get('input[placeholder="Введите email"]').type('wrong@example.com');
    cy.get('input[placeholder="Введите пароль"]').type('wrongpassword');
    cy.contains('Войти').click();
    
    cy.wait('@loginRequest');
    
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').invoke('text').should('not.be.empty');
    
    cy.url().should('include', '/login');
    
    cy.get('input[placeholder="Введите email"]').should('have.value', 'wrong@example.com');
  });

  it('должен проверять обязательные поля', () => {
    cy.contains('Войти').click();
    
    cy.get('input[placeholder="Введите email"]:invalid').should('exist');
    cy.get('input[placeholder="Введите пароль"]:invalid').should('exist');
    cy.url().should('include', '/login');
  });

  it('должен переключать чекбокс "Запомнить меня"', () => {
    cy.get('input[type="checkbox"]').should('not.be.checked');
    
    cy.contains('Запомнить меня').click();
    cy.get('input[type="checkbox"]').should('be.checked');
    
    cy.contains('Запомнить меня').click();
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('должен переключать видимость пароля', () => {
    const testPassword = 'secretpassword123';
    
    cy.get('input[placeholder="Введите пароль"]').type(testPassword);
    cy.get('input[placeholder="Введите пароль"]').should('have.attr', 'type', 'password');
    
    cy.get('.toggle-password').click();
    cy.get('input[placeholder="Введите пароль"]').should('have.attr', 'type', 'text');
    cy.get('input[placeholder="Введите пароль"]').should('have.value', testPassword);
    
    cy.get('.toggle-password').click();
    cy.get('input[placeholder="Введите пароль"]').should('have.attr', 'type', 'password');
  });

  it('должно открываться модальное окно регистрации', () => {
    cy.contains('Нет аккаунта?').find('a').click();
    
    cy.get('.modal-overlay').should('be.visible');
    cy.get('.modal-content').should('be.visible');
    cy.get('.modal-content h3').should('contain', 'Регистрация');
    
    cy.get('#reg-name').should('exist');
    cy.get('#reg-email').should('exist');
    cy.get('#reg-password').should('exist');
    cy.get('.modal-content button[type="submit"]').should('contain', 'Зарегистрироваться');
  });

  it('должно закрываться модальное окно регистрации по кнопке закрытия', () => {
    cy.contains('Нет аккаунта?').find('a').click();
    cy.get('.modal-overlay').should('be.visible');
    
    cy.get('.modal-close').click({ force: true });
    cy.get('.modal-overlay').should('not.exist');
  });

  it('должно закрываться модальное окно регистрации по клику на оверлей', () => {
    cy.contains('Нет аккаунта?').find('a').click();
    cy.get('.modal-overlay').should('be.visible');
    
    cy.get('.modal-overlay').click('topLeft', { force: true });
    cy.get('.modal-overlay').should('not.exist');
  });

  it('должна выполняться успешная регистрация нового пользователя', () => {
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const userName = `Тестовый Пользователь ${Date.now()}`;
    
    cy.contains('Нет аккаунта?').find('a').click();
    cy.get('.modal-overlay').should('be.visible');
    
    cy.get('#reg-name').type(userName);
    cy.get('#reg-email').type(uniqueEmail);
    cy.get('#reg-password').type('testpassword123');
    
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Регистрация успешна! Теперь можете войти');
    });
    
    cy.get('.modal-content button[type="submit"]').click();
    cy.wait('@registerRequest');
    
    cy.get('.modal-overlay').should('not.exist');
    cy.get('input[placeholder="Введите email"]').should('have.value', uniqueEmail);
  });

  it('должен показывать ошибку при регистрации с существующим email', () => {
    cy.contains('Нет аккаунта?').find('a').click();
    cy.get('.modal-overlay').should('be.visible');
    
    cy.get('#reg-name').type('Существующий Пользователь');
    cy.get('#reg-email').type('admin@example.com');
    cy.get('#reg-password').type('password123');
    
    cy.on('window:alert', (text) => {
      expect(text).to.match(/существует|already exists/i);
    });
    
    cy.get('.modal-content button[type="submit"]').click();
    cy.wait('@registerRequest');
    
    cy.get('.modal-overlay').should('be.visible');
    cy.get('#reg-email').should('have.value', 'admin@example.com');
  });

  it('должен проверять обязательные поля формы регистрации', () => {
    cy.contains('Нет аккаунта?').find('a').click();
    cy.get('.modal-overlay').should('be.visible');
    
    cy.get('.modal-content button[type="submit"]').click();
    
    cy.get('#reg-name:invalid').should('exist');
    cy.get('#reg-email:invalid').should('exist');
    cy.get('#reg-password:invalid').should('exist');
  });

  it('должна существовать ссылка восстановления пароля', () => {
    cy.contains('Забыли пароль?').should('be.visible');
    cy.contains('Забыли пароль?').should('have.attr', 'href');
  });

  it('должен показывать состояние загрузки на кнопке входа', () => {
    cy.intercept('POST', '**/api/auth/login', (req) => {
      req.reply((res) => {
        res.setDelay(1000);
        res.send(res.body);
      });
    }).as('loginRequestDelayed');
    
    cy.get('input[placeholder="Введите email"]').type('admin@example.com');
    cy.get('input[placeholder="Введите пароль"]').type('password');
    cy.contains('Войти').click();
    
    cy.get('.btn-login').should('be.disabled');
    cy.get('.btn-login .spinner').should('be.visible');
    
    cy.wait('@loginRequestDelayed');
    
    cy.url().should('eq', 'http://localhost:5173/');
  });

  it('должен показывать состояние загрузки на кнопке регистрации', () => {
    cy.intercept('POST', '**/api/auth/register', (req) => {
      req.reply((res) => {
        res.setDelay(1000);
        res.send(res.body);
      });
    }).as('registerRequestDelayed');
    
    cy.contains('Нет аккаунта?').find('a').click();
    cy.get('.modal-overlay').should('be.visible');
    
    const uniqueEmail = `newuser${Date.now()}@example.com`;
    cy.get('#reg-name').type('Новый Пользователь');
    cy.get('#reg-email').type(uniqueEmail);
    cy.get('#reg-password').type('password123');
    
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Регистрация успешна! Теперь можете войти');
    });
    
    cy.get('.modal-content button[type="submit"]').click();
    
    cy.get('.modal-content .btn-login').should('be.disabled');
    cy.get('.modal-content .spinner').should('be.visible');
    
    cy.wait('@registerRequestDelayed');
    
    cy.get('.modal-overlay').should('not.exist');
  });

  it('должен сохранять токен после входа', () => {
    cy.get('input[placeholder="Введите email"]').type('admin@example.com');
    cy.get('input[placeholder="Введите пароль"]').type('password');
    cy.contains('Войти').click();
    
    cy.wait('@loginRequest');
    
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.not.be.null;
      expect(token).to.be.a('string');
      expect(token.length).to.be.greaterThan(0);
    });
  });

  it('должен перенаправлять на страницу входа если пользователь не авторизован', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });
    
    cy.visit('http://localhost:5173/clients');
    cy.url().should('include', '/login');
  });
});