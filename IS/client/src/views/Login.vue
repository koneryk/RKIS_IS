<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo">
          <i class="fas fa-hand-holding-usd"></i>
          <span>CreditSys</span>
        </div>
        <h2>Вход в систему</h2>
        <p>Кредитная система для владельцев частных предприятий</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i>
            Email
          </label>
          <input
              type="email"
              id="email"
              v-model="form.email"
              placeholder="Введите email"
              required
              autocomplete="email"
          >
        </div>

        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i>
            Пароль
          </label>
          <div class="password-input">
            <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="form.password"
                placeholder="Введите пароль"
                required
                autocomplete="current-password"
            >
            <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox">
            <input type="checkbox" v-model="form.rememberMe">
            <span>Запомнить меня</span>
          </label>
          <a href="#" class="forgot-password">Забыли пароль?</a>
        </div>

        <button
            type="submit"
            class="btn-login"
            :disabled="loading"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else>Войти</span>
        </button>

        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
      </form>

      <div class="auth-footer">
        <p>Нет аккаунта? <a href="#" @click.prevent="showRegister = true">Зарегистрироваться</a></p>
        <p class="demo-credentials">Демо: admin@example.com / password</p>
      </div>
    </div>

    <div v-if="showRegister" class="modal-overlay" @click.self="showRegister = false">
      <div class="modal-content">
        <button class="modal-close" @click="showRegister = false">
          <i class="fas fa-times"></i>
        </button>
        <h3>Регистрация</h3>
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="reg-name">Имя</label>
            <input type="text" id="reg-name" v-model="registerForm.name" required>
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" v-model="registerForm.email" required>
          </div>
          <div class="form-group">
            <label for="reg-password">Пароль</label>
            <input type="password" id="reg-password" v-model="registerForm.password" required>
          </div>
          <button type="submit" class="btn-login" :disabled="registerLoading">
            <span v-if="registerLoading" class="spinner"></span>
            <span v-else>Зарегистрироваться</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const showRegister = ref(false);
const registerLoading = ref(false);

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
});

const registerForm = reactive({
  name: '',
  email: '',
  password: ''
});

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.post('/auth/login', {
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe
    });

    localStorage.setItem('token', response.data.token);

    if (form.rememberMe) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else {
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }

    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка входа';
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  registerLoading.value = true;

  try {
    await api.post('/auth/register', registerForm);
    showRegister.value = false;
    form.email = registerForm.email;
    alert('Регистрация успешна! Теперь можете войти');
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка регистрации');
  } finally {
    registerLoading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.auth-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 1rem;
}

.logo i {
  font-size: 2rem;
}

.auth-header h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6b7280;
  font-size: 0.9rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group label i {
  color: #4f46e5;
  font-size: 1rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.password-input {
  position: relative;
}

.password-input input {
  width: 100%;
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
}

.toggle-password:hover {
  color: #4f46e5;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4b5563;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.forgot-password {
  color: #4f46e5;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.btn-login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
}

.auth-footer a {
  color: #4f46e5;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.demo-credentials {
  margin-top: 1rem;
  font-size: 0.8rem;
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 6px;
  color: #374151;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
}

.modal-close:hover {
  color: #4f46e5;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>