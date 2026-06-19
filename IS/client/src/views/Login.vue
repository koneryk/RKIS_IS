<template>
  <div class="auth-container">
    <div class="slideshow">
      <div 
        v-for="(image, index) in backgroundImages" 
        :key="index"
        class="slide"
        :class="{ active: currentSlide === index }"
        :style="{ backgroundImage: `url(${image})` }"
      ></div>
      <div class="slideshow-overlay"></div>
    </div>

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
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const showRegister = ref(false);
const registerLoading = ref(false);
const currentSlide = ref(0);
let slideInterval = null;

const backgroundImages = [
  '/image1.png',
  '/image2.webp'
];

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

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % backgroundImages.length;
};

const startSlideshow = () => {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
};

const stopSlideshow = () => {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
};

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

onMounted(() => {
  startSlideshow();
});

onBeforeUnmount(() => {
  stopSlideshow();
});
</script>

<style scoped>
.auth-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  z-index: 100;
}

.slideshow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.1);
  transition: opacity 1.5s ease-in-out, transform 1.5s ease-in-out;
  will-change: opacity, transform;
}

.slide.active {
  opacity: 1;
  transform: scale(1);
}

.slide:not(.active) {
  opacity: 0;
  transform: scale(1.05);
}

.slide::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: inherit;
  background-size: cover;
  background-position: center;
  filter: blur(20px) brightness(0.7);
  transform: scale(1.1);
  opacity: 0;
  transition: opacity 1.5s ease-in-out;
}

.slide.active::before {
  opacity: 1;
}

.slideshow-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%);
  z-index: 1;
}

.auth-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  animation: slideUp 0.5s ease-out;
  position: relative;
  z-index: 2;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  font-size: 1.5rem;
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
  background: white;
  width: 100%;
}

.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input::placeholder {
  color: #9ca3af;
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 45px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 8px;
  font-size: 1.1rem;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #4f46e5;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4b5563;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4f46e5;
}

.checkbox span {
  user-select: none;
}

.forgot-password {
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.9rem;
  white-space: nowrap;
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
  width: 100%;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
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
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
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
  font-weight: 500;
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
  word-break: break-all;
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
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: slideUp 0.3s ease-out;
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
  padding: 5px;
  transition: color 0.2s;
  line-height: 1;
}

.modal-close:hover {
  color: #4f46e5;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-size: 1.3rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .auth-card {
    padding: 1.5rem;
    max-width: 420px;
  }

  .logo {
    font-size: 1.3rem;
  }

  .logo i {
    font-size: 1.7rem;
  }

  .auth-header h2 {
    font-size: 1.3rem;
  }

  .auth-header p {
    font-size: 0.85rem;
  }

  .form-group input {
    padding: 0.65rem;
    font-size: 0.95rem;
  }

  .btn-login {
    padding: 0.85rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 0.5rem;
  }

  .auth-card {
    border-radius: 16px;
    padding: 1.25rem;
    max-width: 100%;
    margin: 0.5rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  }

  .auth-header {
    margin-bottom: 1.5rem;
  }

  .logo {
    font-size: 1.1rem;
    gap: 0.4rem;
  }

  .logo i {
    font-size: 1.5rem;
  }

  .auth-header h2 {
    font-size: 1.1rem;
  }

  .auth-header p {
    font-size: 0.8rem;
  }

  .auth-form {
    gap: 1rem;
  }

  .form-group {
    gap: 0.4rem;
  }

  .form-group label {
    font-size: 0.85rem;
  }

  .form-group label i {
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  .password-input input {
    padding-right: 40px;
  }

  .toggle-password {
    right: 10px;
    padding: 6px;
    font-size: 1rem;
  }

  .form-options {
    font-size: 0.85rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }

  .forgot-password {
    font-size: 0.85rem;
  }

  .btn-login {
    padding: 0.75rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  .error-message {
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
    border-radius: 6px;
  }

  .auth-footer {
    margin-top: 1.5rem;
    font-size: 0.85rem;
  }

  .demo-credentials {
    font-size: 0.75rem;
    padding: 0.4rem;
  }

  .modal-content {
    border-radius: 16px;
    padding: 1.5rem;
    margin: 0.5rem;
  }

  .modal-content h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .modal-close {
    font-size: 1.3rem;
    top: 0.75rem;
    right: 0.75rem;
  }
}

@media (max-width: 360px) {
  .auth-card {
    padding: 1rem;
    border-radius: 12px;
  }

  .logo {
    font-size: 1rem;
  }

  .logo i {
    font-size: 1.3rem;
  }

  .auth-header h2 {
    font-size: 1rem;
  }

  .auth-header p {
    font-size: 0.75rem;
  }

  .form-group input {
    padding: 0.5rem 0.65rem;
    font-size: 0.85rem;
  }

  .btn-login {
    padding: 0.65rem;
    font-size: 0.85rem;
  }
}

@media (max-height: 700px) {
  .auth-card {
    padding: 1.25rem;
  }

  .auth-header {
    margin-bottom: 1.25rem;
  }

  .auth-header h2 {
    font-size: 1.1rem;
  }

  .auth-header p {
    font-size: 0.8rem;
  }

  .auth-form {
    gap: 0.75rem;
  }

  .form-group {
    gap: 0.3rem;
  }

  .btn-login {
    padding: 0.7rem;
  }

  .auth-footer {
    margin-top: 1rem;
  }
}

@media (min-width: 768px) and (max-height: 500px) {
  .auth-container {
    align-items: stretch;
    padding: 0.5rem;
  }

  .auth-card {
    max-width: 450px;
    padding: 1.25rem;
    margin: auto;
  }

  .auth-header {
    margin-bottom: 1rem;
  }

  .auth-header h2 {
    font-size: 1.2rem;
  }

  .auth-header p {
    font-size: 0.8rem;
  }

  .auth-form {
    gap: 0.75rem;
  }

  .form-group {
    gap: 0.25rem;
  }

  .form-group input {
    padding: 0.5rem 0.75rem;
  }
}
</style>