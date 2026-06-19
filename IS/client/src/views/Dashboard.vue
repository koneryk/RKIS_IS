<template>
  <div class="dashboard">
    <h1>Панель управления</h1>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка данных...
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
      <button @click="loadStats" class="btn-retry">Повторить</button>
    </div>

    <div v-else class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="stat-info">
          <h3>Всего заявок</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>

      <div class="stat-card submitted">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3>На рассмотрении</h3>
          <p class="stat-value">{{ stats.submitted }}</p>
        </div>
      </div>

      <div class="stat-card approved">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <h3>Одобрено</h3>
          <p class="stat-value">{{ stats.approved }}</p>
        </div>
      </div>

      <div class="stat-card rejected">
        <div class="stat-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-info">
          <h3>Отказы</h3>
          <p class="stat-value">{{ stats.rejected }}</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && !error" class="recent-applications">
      <h2>Последние заявки</h2>
      <div v-if="recentApplications.length === 0" class="empty-state">
        <p>Нет заявок</p>
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in recentApplications" :key="app.id">
            <td>#{{ app.id }}</td>
            <td>{{ app.client_name || '—' }}</td>
            <td>{{ formatAmount(app.requested_amount) }}</td>
            <td>
              <span class="status-badge" :class="app.status">
                {{ getStatusText(app.status) }}
              </span>
            </td>
            <td>{{ formatDate(app.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';

const loading = ref(true);
const error = ref('');
const applications = ref([]);

const stats = computed(() => {
  const total = applications.value.length;
  const submitted = applications.value.filter(a => a.status === 'submitted').length;
  const approved = applications.value.filter(a => a.status === 'approved').length;
  const rejected = applications.value.filter(a => a.status === 'rejected').length;
  
  return { total, submitted, approved, rejected };
});

const recentApplications = computed(() => {
  return [...applications.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
});

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getStatusText = (status) => {
  const statuses = {
    'draft': 'Черновик',
    'submitted': 'На рассмотрении',
    'approved': 'Одобрена',
    'rejected': 'Отказ'
  };
  return statuses[status] || status;
};

const loadStats = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await api.get('/applications');
    applications.value = response.data;
    console.log('Загружено заявок:', applications.value.length);
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    error.value = 'Не удалось загрузить данные';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard h1 {
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 10px;
}

.error {
  color: #dc2626;
}

.btn-retry {
  margin-top: 15px;
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #b91c1c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-card.total .stat-icon {
  background: #e0f2fe;
  color: #0369a1;
}

.stat-card.submitted .stat-icon {
  background: #fef3c7;
  color: #d97706;
}

.stat-card.approved .stat-icon {
  background: #d1fae5;
  color: #059669;
}

.stat-card.rejected .stat-icon {
  background: #fee2e2;
  color: #dc2626;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.recent-applications {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.recent-applications h2 {
  font-size: 1.2rem;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

td {
  color: #1f2937;
  font-size: 0.95rem;
}

tr:hover td {
  background: #f9fafb;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.draft {
  background: #f3f4f6;
  color: #4b5563;
}

.status-badge.submitted {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.approved {
  background: #d1fae5;
  color: #059669;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #dc2626;
}
</style>