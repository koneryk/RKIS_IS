<template>
  <div class="client-form-container">
    <button class="btn-back" @click="router.back()">
      ← Назад к списку
    </button>

    <div class="client-card">
      <h3>Регистрация нового клиента</h3>

      <div v-if="error" class="error-banner">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </div>

      <div class="form-grid">
        <div class="field-group">
          <p>Наименование организации</p>
          <input 
            type="text" 
            v-model="client.name" 
            placeholder="ООО 'Пример'"
            :class="{ 'input-error': error && !rules.name.test(client.name) }"
          >
        </div>

        <div class="form-row">
          <div class="field-group">
            <p>ИНН</p>
            <input type="text" v-model="client.inn" placeholder="10 или 12 цифр">
          </div>
          <div class="field-group">
            <p>ОГРН</p>
            <input type="text" v-model="client.ogrn" placeholder="13 или 15 цифр">
          </div>
        </div>

        <div class="field-group">
          <p>Юридический адрес</p>
          <input type="text" v-model="client.address" placeholder="г. Москва, ул. Ленина, д. 1">
        </div>

        <div class="form-row">
          <div class="field-group">
            <p>Телефон</p>
            <input type="tel" v-model="client.phone" placeholder="+7 (___) ___-__-__">
          </div>
          <div class="field-group">
            <p>Email</p>
            <input type="email" v-model="client.email" placeholder="info@company.ru">
          </div>
        </div>

        <div class="form-actions">
          <button 
            class="submit-btn" 
            :disabled="submitting" 
            @click="addClient"
          >
            <span v-if="!submitting">Добавить клиента</span>
            <span v-else><i class="loading-spinner"></i> Сохранение...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const submitting = ref(false);
const error = ref('');

const client = reactive({
    name: '',
    inn: '',
    ogrn: '',
    address: '',
    phone: '',
    email: ''
});

const rules = {
    name: /^[\w\s\d\-А-яЁё]+$/,
    inn: /^(\d{10}|\d{12})$/,
    ogrn: /^(\d{13}|\d{15})$/,
    address: /^[а-яА-ЯёЁa-zA-Z0-9\s\.,\-\/№]+$/,
    phone: /^(\+7|8)?\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
};

async function addClient() {
    error.value = '';
    
    if (!rules.name.test(client.name)) return error.value = 'Некорректное наименование';
    if (!rules.inn.test(client.inn)) return error.value = 'ИНН должен содержать 10 или 12 цифр';
    if (!rules.ogrn.test(client.ogrn)) return error.value = 'ОГРН должен содержать 13 или 15 цифр';
    if (!rules.address.test(client.address)) return error.value = 'Проверьте правильность адреса';
    if (!rules.phone.test(client.phone)) return error.value = 'Неверный формат телефона';
    if (!rules.email.test(client.email)) return error.value = 'Некорректный email';

    try {
        submitting.value = true;
        
        const response = await api.post('/clients', client); 
        
        if (response.status === 200 || response.status === 201) {
            router.push('/clients'); 
        }
    } catch (e) {
        error.value = 'Ошибка сервера: ' + (e.response?.data?.message || 'Не удалось сохранить клиента');
        console.error(e);
    } finally {
        submitting.value = false;
    }
}
</script>
<style scoped>
.client-form {
  max-width: 600px;
  margin: 20px auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-block p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
}

input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box; 
}

input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.error-msg {
  color: #dc3545;
  background: #fff5f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  border: 1px solid #feb2b2;
}

.submit-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
  margin-top: 10px;
}

.submit-btn:hover {
  background: #45a049;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-back {
  background: none;
  border: 1px solid #ddd;
  color: #666;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

.btn-back:hover {
  background: #f5f5f5;
}
</style>
