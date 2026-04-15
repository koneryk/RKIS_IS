<template>
  <div class="applications">
    <div class="header">
      <div>
        <h1>Кредитные заявки</h1>
        <p class="subtitle">Управление заявками на кредитование</p>
      </div>
      <button class="btn-create" @click="createNewApplication">
        <i class="fas fa-plus"></i>
        Новая заявка
      </button>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
            type="text"
            v-model="searchQuery"
            placeholder="Поиск по клиенту или ID..."
            class="search-input"
        >
      </div>

      <div class="filter-group">
        <select v-model="stageFilter" class="filter-select">
          <option value="">Все этапы</option>
          <option value="A1">A1 - Принятие</option>
          <option value="A2">A2 - Оценка рисков</option>
          <option value="A3">A3 - Юр. проверка</option>
          <option value="A4">A4 - Согласование</option>
          <option value="A5">A5 - Регистрация</option>
        </select>

        <select v-model="statusFilter" class="filter-select">
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="submitted">На рассмотрении</option>
          <option value="approved">Одобрена</option>
          <option value="rejected">Отказ</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка заявок...
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
      <button @click="fetchApplications" class="btn-retry">Повторить</button>
    </div>

    <div v-else-if="filteredApplications.length === 0" class="empty-state">
      <i class="fas fa-file-alt"></i>
      <h3>Заявки не найдены</h3>
      <p>Создайте первую заявку, нажав кнопку "Новая заявка"</p>
      <button class="btn-create-empty" @click="createNewApplication">
        <i class="fas fa-plus"></i>
        Создать заявку
      </button>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
        <tr>
          <th>ID</th>
          <th>Клиент</th>
          <th>Сумма</th>
          <th>Срок</th>
          <th>Продукт</th>
          <th>Статус</th>
          <th>Этап</th>
          <th>Дата</th>
          <th>Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="app in paginatedApplications" :key="app.id">
          <td class="id-cell">#{{ app.id }}</td>
          <td class="client-cell">
            <div class="client-info">
              <span class="client-name">{{ app.client_name || '—' }}</span>
            </div>
          </td>
          <td class="amount-cell">{{ formatAmount(app.requested_amount) }}</td>
          <td class="term-cell">{{ app.requested_term || '—' }} мес.</td>
          <td class="product-cell">{{ app.product_name || '—' }}</td>
          <td class="status-cell">
              <span class="status-badge" :class="app.status">
                {{ getStatusText(app.status) }}
              </span>
          </td>
          <td>{{ getStageName(app.current_stage) }}</td>
          <td class="date-cell">{{ formatDate(app.created_at) }}</td>
          <td class="actions-cell">
            <div class="actions">
              <button class="btn-icon" @click="viewApplication(app.id)" title="Просмотр">
                <i class="fas fa-eye">Просмотр</i>
              </button>
              <button class="btn-icon" @click="editApplication(app.id)" title="Редактировать">
                <i class="fas fa-edit">Редактирование</i>
              </button>
              <button class="btn-icon" @click="deleteApplication(app.id)" title="Удалить">
                <i class="fas fa-trash">Удалить</i>
              </button>
            </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const loading = ref(true);
const error = ref('');
const applications = ref([]);


const searchQuery = ref('');
const stageFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;


const fetchApplications = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get('/applications');
    applications.value = response.data;
    console.log('Заявки загружены:', applications.value);
  } catch (err) {
    console.error('Ошибка загрузки заявок:', err);
    error.value = 'Не удалось загрузить заявки';
  } finally {
    loading.value = false;
  }
};


const filteredApplications = computed(() => {
  let filtered = applications.value;


  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(app =>
        app.client_name?.toLowerCase().includes(query) ||
        app.id?.toString().includes(query)
    );
  }


  if (stageFilter.value) {
    filtered = filtered.filter(app => app.current_stage === stageFilter.value);
  }


  if (statusFilter.value) {
    filtered = filtered.filter(app => app.status === statusFilter.value);
  }


  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return filtered;
});


const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredApplications.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredApplications.value.length / itemsPerPage);
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
  return new Date(date).toLocaleDateString('ru-RU');
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

const getStageName = (stage) => {
  const stages = {
    'A1': 'Принятие',
    'A2': 'Оценка рисков',
    'A21': 'Финанализ',
    'A22': 'Оценка залога',
    'A23': 'Риск-решение',
    'A3': 'Юр. проверка',
    'A4': 'Согласование',
    'A5': 'Регистрация',
    'rejected': 'Отказано', 
    'approved': 'Одобрено'
  };
  return stages[stage] || stage;
};


const createNewApplication = () => {
  router.push('/applications/new');
};

const viewApplication = (id) => {
  router.push(`/applications/${id}`);
};

const editApplication = (id) => {
  router.push(`/applications/${id}/edit`);
};

const deleteApplication = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить заявку?')) return;

  try {
    await api.delete(`/applications/${id}`);
    applications.value = applications.value.filter(app => app.id !== id);
  } catch (err) {
    console.error('Ошибка удаления:', err);
    alert('Не удалось удалить заявку');
  }
};


onMounted(() => {
  fetchApplications();
});
</script>

<style scoped>
.applications {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header h1 {
  color: #1f2937;
  margin: 0;
  font-size: 1.8rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 5px 0 0;
}

.btn-create {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
  white-space: nowrap;
}

.btn-create:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
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
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  min-width: 150px;
}

.table-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow-x: auto;
  width: 100%;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

th {
  background: #f9fafb;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

td {
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}


th:nth-child(1) { width: 5%; }  
th:nth-child(2) { width: 15%; } 
th:nth-child(3) { width: 8%; }  
th:nth-child(4) { width: 6%; }   
th:nth-child(5) { width: 12%; }  
th:nth-child(6) { width: 10%; }  
th:nth-child(7) { width: 10%; }  
th:nth-child(8) { width: 8%; }   
th:nth-child(9) { width: 10%; }  


.id-cell {
  font-weight: 500;
  color: #4f46e5;
}

.client-name {
  font-weight: 500;
  color: #1f2937;
}

.amount-cell {
  font-weight: 500;
  color: #047857;
}

.term-cell {
  color: #6b7280;
}

.product-cell {
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

.status-badge.submitted {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.stage-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  background: #f3f4f6;
  color: #4b5563;
}

.stage-badge.A1 { background: #f3f4f6; color: #4b5563; }
.stage-badge.A2 { background: #dbeafe; color: #1e40af; }
.stage-badge.A21 { background: #dbeafe; color: #1e40af; }
.stage-badge.A22 { background: #fef3c7; color: #92400e; }
.stage-badge.A23 { background: #fee2e2; color: #991b1b; }
.stage-badge.A3 { background: #e0f2fe; color: #0369a1; }
.stage-badge.A4 { background: #d1fae5; color: #065f46; }
.stage-badge.A5 { background: #dcfce7; color: #166534; }

.date-cell {
  color: #6b7280;
  font-size: 0.9rem;
}

.actions-cell {
  min-width: 120px;
}

.actions {
  display: flex;
  gap: 5px;
  justify-content: flex-start;
  flex-wrap: nowrap;
}

.btn-icon {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.9rem;
  min-width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn-create-empty {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  transition: all 0.3s;
}

.btn-create-empty:hover {
  background: #4338ca;
  transform: scale(1.05);
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
.stage-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}
.btn-retry:hover {
  background: #b91c1c;
}
</style>