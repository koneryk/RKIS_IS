<template>
  <div class="application-view">
    <button @click="$router.back()" class="back-button">Назад к списку</button>

    <div v-if="loading" class="loading">
      Загрузка данных...
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="loadApplication">Повторить</button>
    </div>

    <div v-else class="application-card">
      <div class="card-header">
        <h1>Просмотр заявки #{{ applicationId }}</h1>
        <div class="status-badge" :class="getStatusClass(form.status)">
          {{ getStatusText(form.status) }}
        </div>
      </div>

      <div class="card-content">
        <div class="info-section">
          <h3>Основная информация</h3>

          <div class="info-row">
            <div class="info-label">Клиент:</div>
            <div class="info-value">
              {{ getClientName(form.client_id) }}
              <span v-if="getClientInn(form.client_id)" class="client-inn">
                ({{ getClientInn(form.client_id) }})
              </span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-label">Продукт:</div>
            <div class="info-value">
              {{ getProductName(form.product_id) }}
              <span v-if="getProductRate(form.product_id)" class="product-rate">
                ({{ getProductRate(form.product_id) }}%)
              </span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-label">Сумма:</div>
            <div class="info-value">{{ formatAmount(form.requested_amount) }} ₽</div>
          </div>

          <div class="info-row">
            <div class="info-label">Срок:</div>
            <div class="info-value">{{ form.requested_term }} мес.</div>
          </div>
        </div>

        <div class="info-section">
          <h3>Статус и этап</h3>

          <div class="info-row">
            <div class="info-label">Статус:</div>
            <div class="info-value">
              <span class="status-text" :class="getStatusClass(form.status)">
                {{ getStatusText(form.status) }}
              </span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-label">Текущий этап:</div>
            <div class="info-value">
              {{ getStageText(form.current_stage) }}
              <span class="stage-code">({{ form.current_stage }})</span>
            </div>
          </div>
        </div>

        <div class="info-section" v-if="showAdditionalInfo">
          <h3>Дополнительная информация</h3>

          <div class="info-row">
            <div class="info-label">Дата создания:</div>
            <div class="info-value">{{ formatDate(form.created_at) }}</div>
          </div>

          <div class="info-row" v-if="form.updated_at">
            <div class="info-label">Дата обновления:</div>
            <div class="info-value">{{ formatDate(form.updated_at) }}</div>
          </div>
        </div>
      </div>

      <div class="card-actions">
        <button @click="$router.push(`/applications/${applicationId}/edit`)" class="edit-button">
          Редактировать заявку
        </button>
        <button @click="showDeleteModal = true" class="delete-button" v-if="canDelete">
          Удалить заявку
        </button>
      </div>
    </div>

    <ModalWindow
        v-model:visible="showDeleteModal"
        title="Подтверждение удаления"
        @confirm="handleDelete"
    >
      <p>Вы уверены, что хотите удалить заявку №{{ applicationId }}?</p>
      <p class="warning-text">Это действие невозможно отменить.</p>
    </ModalWindow>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import ModalWindow from '../components/ModalWindow.vue';

const route = useRoute();
const router = useRouter();
const applicationId = route.params.id;

const form = ref({
  client_id: '',
  product_id: '',
  requested_amount: '',
  requested_term: '',
  status: '',
  current_stage: '',
  created_at: '',
  updated_at: ''
});

const clients = ref([]);
const products = ref([]);
const loading = ref(true);
const error = ref('');
const showDeleteModal = ref(false);
const showAdditionalInfo = ref(false);

const getClientName = (clientId) => {
  const client = clients.value.find(c => c.id === clientId);
  return client ? client.name : 'Не указан';
};

const getClientInn = (clientId) => {
  const client = clients.value.find(c => c.id === clientId);
  return client ? client.inn : '';
};

const getProductName = (productId) => {
  const product = products.value.find(p => p.id === productId);
  return product ? product.name : 'Не указан';
};

const getProductRate = (productId) => {
  const product = products.value.find(p => p.id === productId);
  return product ? product.base_rate : '';
};

const getStatusText = (status) => {
  const statusMap = {
    'draft': 'Черновик',
    'submitted': 'На рассмотрении',
    'approved': 'Одобрена',
    'rejected': 'Отказ'
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const classMap = {
    'draft': 'status-draft',
    'submitted': 'status-submitted',
    'approved': 'status-approved',
    'rejected': 'status-rejected'
  };
  return classMap[status] || 'status-default';
};

const getStageText = (stage) => {
  const stageMap = {
    'A1': 'Принятие',
    'A2': 'Оценка рисков',
    'A21': 'Финанализ',
    'A22': 'Оценка залога',
    'A23': 'Риск-решение',
    'A3': 'Юр. проверка',
    'A4': 'Согласование',
    'A5': 'Регистрация'
  };
  return stageMap[stage] || stage;
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Не указана';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const canDelete = computed(() => {
  return form.value.status === 'draft';
});

const loadApplication = async () => {
  try {
    loading.value = true;
    error.value = '';

    console.log(`Загружаем заявку ID: ${applicationId}`);
    const appRes = await api.get(`/applications/${applicationId}`);
    const application = appRes.data;

    form.value = {
      client_id: application.client_id,
      product_id: application.product_id,
      requested_amount: application.requested_amount,
      requested_term: application.requested_term,
      status: application.status,
      current_stage: application.current_stage,
      created_at: application.created_at,
      updated_at: application.updated_at
    };

    const [clientsRes, productsRes] = await Promise.all([
      api.get('/clients'),
      api.get('/products')
    ]);

    clients.value = clientsRes.data;
    products.value = productsRes.data;

    showAdditionalInfo.value = true;

  } catch (err) {
    console.error('Ошибка загрузки:', err);
    if (err.response) {
      error.value = `Ошибка ${err.response.status}: ${err.response.data?.error || 'Неизвестная ошибка'}`;
    } else if (err.request) {
      error.value = 'Сервер не отвечает. Проверьте подключение.';
    } else {
      error.value = 'Ошибка при загрузке данных заявки';
    }
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  try {
    await api.delete(`/applications/${applicationId}`);
    alert('Заявка успешно удалена!');
    router.push('/applications');
  } catch (err) {
    console.error('Ошибка удаления:', err);
    alert('Ошибка при удалении заявки');
  } finally {
    showDeleteModal.value = false;
  }
};

onMounted(() => {
  loadApplication();
});
</script>

<style scoped>
.application-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.back-button {
  display: inline-block;
  margin-bottom: 20px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.back-button:hover {
  background: #e5e7eb;
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

.application-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
}

.card-content {
  padding: 24px;
}

.info-section {
  margin-bottom: 32px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.125rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.info-row {
  display: flex;
  margin-bottom: 16px;
  line-height: 1.5;
}

.info-label {
  width: 150px;
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  flex: 1;
  color: #374151;
}

.client-inn, .product-rate, .stage-code {
  font-size: 0.875rem;
  color: #6b7280;
  margin-left: 8px;
}

.status-text {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-draft {
  background: #f3f4f6;
  color: #6b7280;
}

.status-submitted {
  background: #fef3c7;
  color: #d97706;
}

.status-approved {
  background: #d1fae5;
  color: #059669;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.card-actions {
  padding: 20px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.edit-button, .delete-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-button {
  background: #4f46e5;
  color: white;
}

.edit-button:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
}

.delete-button {
  background: #dc2626;
  color: white;
}

.delete-button:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 8px;
}

@media (max-width: 640px) {
  .info-row {
    flex-direction: column;
  }

  .info-label {
    width: auto;
    margin-bottom: 4px;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>