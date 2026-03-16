<template>
  <div class="application-form">
    <h1>{{ isEdit ? 'Редактирование заявки' : 'Новая заявка' }}</h1>

    <div v-if="loading" class="loading">
      Загрузка данных...
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="loadData">Повторить</button>
    </div>

    <form v-else @submit.prevent="submitForm" class="form">
      <div class="form-group">
        <label>Клиент:</label>
        <select v-model="form.client_id" required :disabled="isEdit">
          <option value="">Выберите клиента</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }} ({{ client.inn }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Продукт:</label>
        <select v-model="form.product_id" required :disabled="isEdit">
          <option value="">Выберите продукт</option>
          <option v-for="product in products" :key="product.id" :value="product.id">
            {{ product.name }} ({{ product.base_rate }}%)
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Сумма (₽):</label>
        <input type="number" v-model.number="form.requested_amount" required>
      </div>

      <div class="form-group">
        <label>Срок (мес.):</label>
        <input type="number" v-model.number="form.requested_term" required>
      </div>

      <div v-if="isEdit" class="form-group">
        <label>Статус:</label>
        <select v-model="form.status">
          <option value="draft">Черновик</option>
          <option value="submitted">На рассмотрении</option>
          <option value="approved">Одобрена</option>
          <option value="rejected">Отказ</option>
        </select>
      </div>

      <div v-if="isEdit" class="form-group">
        <label>Этап:</label>
        <select v-model="form.current_stage">
          <option value="A1">A1 - Принятие</option>
          <option value="A2">A2 - Оценка рисков</option>
          <option value="A21">A21 - Финанализ</option>
          <option value="A22">A22 - Оценка залога</option>
          <option value="A23">A23 - Риск-решение</option>
          <option value="A3">A3 - Юр. проверка</option>
          <option value="A4">A4 - Согласование</option>
          <option value="A5">A5 - Регистрация</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.back()">Отмена</button>
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter();

const clients = ref([]);
const products = ref([]);
const loading = ref(true);
const error = ref('');
const submitting = ref(false);

const isEdit = computed(() => !!route.params.id);

const form = ref({
  client_id: '',
  product_id: '',
  requested_amount: '',
  requested_term: '',
  status: 'draft',
  current_stage: 'A1'
});

const loadData = async () => {
  try {
    loading.value = true;
    error.value = '';

    console.log('1. Загружаем клиентов...');
    const clientsRes = await api.get('/clients');
    clients.value = clientsRes.data;

    console.log('2. Загружаем продукты...');
    const productsRes = await api.get('/products');
    products.value = productsRes.data;

    if (isEdit.value) {
      console.log(`3. Загружаем заявку ID: ${route.params.id}`);
      const appRes = await api.get(`/applications/${route.params.id}`);
      const app = appRes.data;

      form.value = {
        client_id: app.client_id,
        product_id: app.product_id,
        requested_amount: app.requested_amount,
        requested_term: app.requested_term,
        status: app.status,
        current_stage: app.current_stage
      };
    }

    console.log('Все данные загружены');
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    if (err.response) {
      error.value = `Ошибка ${err.response.status}: ${err.response.data?.error || 'Неизвестная ошибка'}`;
    } else if (err.request) {
      error.value = 'Сервер не отвечает. Проверьте подключение.';
    } else {
      error.value = 'Ошибка при загрузке данных';
    }
  } finally {
    loading.value = false;
  }
};

const submitForm = async () => {
  try {
    submitting.value = true;
    error.value = '';

    console.log('Отправка данных:', form.value);

    if (isEdit.value) {
      await api.put(`/applications/${route.params.id}`, form.value);
      alert('Заявка успешно обновлена!');
    } else {
      await api.post('/applications', form.value);
      alert('Заявка успешно создана!');
    }
    router.push('/applications');
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    if (err.response) {
      error.value = `Ошибка ${err.response.status}: ${err.response.data?.error || err.message}`;
    } else {
      error.value = 'Ошибка при сохранении';
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.application-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error-message {
  text-align: center;
  padding: 40px;
  border-radius: 8px;
}

.loading {
  color: #6b7280;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-message button:hover {
  background: #b91c1c;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

button[type="submit"] {
  background: #4f46e5;
  color: white;
}

button[type="submit"]:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
}

button[type="button"] {
  background: #f3f4f6;
  color: #374151;
}

button[type="button"]:hover {
  background: #e5e7eb;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>