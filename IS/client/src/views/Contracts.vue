<template>
  <div class="contracts">
    <div class="header">
      <h1>Реестр договоров</h1>
      <p class="idef0-badge">Этап A5 - Регистрация и выдача</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка договоров...
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
      <button @click="fetchContracts" class="btn-retry">Повторить</button>
    </div>

    <div v-else>
  
      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
              type="text"
              v-model="searchQuery"
              placeholder="Поиск по номеру или клиенту..."
              class="search-input"
          >
        </div>

        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="signed">Подписан</option>
            <option value="active">Активен</option>
            <option value="closed">Закрыт</option>
          </select>

          <select v-model="sortBy" class="filter-select">
            <option value="date_desc">Сначала новые</option>
            <option value="date_asc">Сначала старые</option>
            <option value="amount_desc">По сумме (убыв.)</option>
            <option value="amount_asc">По сумме (возр.)</option>
          </select>
        </div>
      </div>

   
      <div class="stats-grid" v-if="contracts.length">
        <div class="stat-card">
          <div class="stat-icon blue">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ contracts.length }}</span>
            <span class="stat-label">Всего договоров</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ signedCount }}</span>
            <span class="stat-label">Подписано</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ draftCount }}</span>
            <span class="stat-label">Черновиков</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ formatAmount(totalAmount) }}</span>
            <span class="stat-label">Общая сумма</span>
          </div>
        </div>
      </div>

      <div class="table-container" v-if="filteredContracts.length">
        <table class="contracts-table">
          <thead>
          <tr>
            <th>№ договора</th>
            <th>Клиент</th>
            <th>Сумма</th>
            <th>Ставка</th>
            <th>Дата подписания</th>
            <th>Срок действия</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="contract in filteredContracts" :key="contract.id">
            <td class="contract-number">
              <strong>{{ contract.contract_number || '—' }}</strong>
            </td>
            <td>{{ contract.client_name || '—' }}</td>
            <td class="amount">{{ formatAmount(contract.amount) }}</td>
            <td>{{ contract.interest_rate ? contract.interest_rate + '%' : '—' }}</td>
            <td>{{ formatDate(contract.signed_date) }}</td>
            <td>
                <span v-if="contract.maturity_date">
                  до {{ formatDate(contract.maturity_date) }}
                </span>
              <span v-else>—</span>
            </td>
            <td>
                <span class="status-badge" :class="contract.status">
                  {{ getStatusText(contract.status) }}
                </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="viewContract(contract.id)" title="Просмотр">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon" @click="downloadContract(contract.id)" title="Скачать">
                <i class="fas fa-download"></i>
              </button>
              <button v-if="contract.status === 'draft'"
                      class="btn-icon"
                      @click="editContract(contract.id)"
                      title="Редактировать">
                <i class="fas fa-edit"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>

     
        <div class="pagination" v-if="totalPages > 1">
          <button
              class="btn-page"
              :disabled="currentPage === 1"
              @click="currentPage--">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">{{ currentPage }} из {{ totalPages }}</span>
          <button
              class="btn-page"
              :disabled="currentPage === totalPages"
              @click="currentPage++">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

  
      <div v-else class="empty-state">
        <i class="fas fa-file-contract"></i>
        <h3>Договоры не найдены</h3>
        <p>После одобрения заявок здесь появятся договоры</p>
        <router-link to="/applications" class="btn-primary">
          <i class="fas fa-arrow-left"></i> К заявкам
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const loading = ref(true);
const error = ref('');
const contracts = ref([]);

// Фильтры и сортировка
const searchQuery = ref('');
const statusFilter = ref('');
const sortBy = ref('date_desc');
const currentPage = ref(1);
const itemsPerPage = 10;

// Загрузка договоров
const fetchContracts = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get('/contracts');
    contracts.value = response.data;
    console.log('Договоры загружены:', contracts.value);
  } catch (err) {
    console.error('Ошибка загрузки договоров:', err);
    error.value = 'Не удалось загрузить договоры';
  } finally {
    loading.value = false;
  }
};

// Фильтрация и сортировка
const filteredContracts = computed(() => {
  let filtered = contracts.value;

  // Поиск по номеру или клиенту
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(c =>
        (c.contract_number?.toLowerCase() || '').includes(query) ||
        (c.client_name?.toLowerCase() || '').includes(query)
    );
  }

  // Фильтр по статусу
  if (statusFilter.value) {
    filtered = filtered.filter(c => c.status === statusFilter.value);
  }

  // Сортировка
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_desc':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'date_asc':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      case 'amount_desc':
        return (b.amount || 0) - (a.amount || 0);
      case 'amount_asc':
        return (a.amount || 0) - (b.amount || 0);
      default:
        return 0;
    }
  });

  return filtered;
});

// Пагинация
const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredContracts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredContracts.value.length / itemsPerPage);
});

// Статистика
const signedCount = computed(() => {
  return contracts.value.filter(c => c.status === 'signed' || c.status === 'active').length;
});

const draftCount = computed(() => {
  return contracts.value.filter(c => c.status === 'draft').length;
});

const totalAmount = computed(() => {
  return contracts.value.reduce((sum, c) => sum + (c.amount || 0), 0);
});

// Вспомогательные функции
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
  return new Date(date).toLocaleDateString('ru-RU');
};

const getStatusText = (status) => {
  const statuses = {
    'draft': 'Черновик',
    'signed': 'Подписан',
    'active': 'Активен',
    'closed': 'Закрыт'
  };
  return statuses[status] || status;
};

// Действия
const viewContract = (id) => {
  router.push(`/contracts/${id}`);
};

const editContract = (id) => {
  router.push(`/contracts/${id}/edit`);
};

const downloadContract = async (id) => {
  try {
    // Здесь будет скачивание файла
    alert('Функция скачивания в разработке');
  } catch (err) {
    console.error('Ошибка скачивания:', err);
  }
};

// Загрузка при монтировании
onMounted(() => {
  fetchContracts();
});
</script>

<style scoped>
.contracts {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.idef0-badge {
  background: #4f46e5;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.filter-group {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  min-width: 150px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.blue {
  background: #e0f2fe;
  color: #0369a1;
}

.stat-icon.green {
  background: #dcfce7;
  color: #166534;
}

.stat-icon.orange {
  background: #fed7aa;
  color: #9a3412;
}

.stat-icon.purple {
  background: #e9d5ff;
  color: #6b21a8;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.table-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.contracts-table {
  width: 100%;
  border-collapse: collapse;
}

.contracts-table th {
  background: #f9fafb;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.contracts-table td {
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
}

.contracts-table tr:hover {
  background: #f9fafb;
}

.contract-number {
  font-weight: 500;
  color: #4f46e5;
}

.amount {
  font-weight: 500;
  color: #1f2937;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.draft {
  background: #f3f4f6;
  color: #4b5563;
}

.status-badge.signed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.closed {
  background: #e5e7eb;
  color: #374151;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #4f46e5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.btn-page {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #374151;
}

.btn-page:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #4f46e5;
  color: #4f46e5;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.95rem;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 10px;
}

.empty-state i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 10px;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 20px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #4f46e5;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
}

.btn-primary:hover {
  background: #4338ca;
}

.loading, .error {
  text-align: center;
  padding: 60px;
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
  border-radius: 4px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #b91c1c;
}
</style>