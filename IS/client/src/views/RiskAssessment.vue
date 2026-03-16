<template>
  <div class="risk-assessment">
    <div class="header">
      <h1>Оценка рисков</h1>
      <p class="idef0-badge">Этап A2 - Оценка рисков</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка заявок...
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
    </div>

    <div v-else>
      <div class="filters">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по клиенту..."
            class="search-input"
        >
        <select v-model="stageFilter" class="filter-select">
          <option value="">Все этапы</option>
          <option value="A2">A2 - Ожидает оценки</option>
          <option value="A21">A21 - Финанализ</option>
          <option value="A22">A22 - Оценка залога</option>
          <option value="A23">A23 - Риск-решение</option>
        </select>
      </div>

      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Сумма</th>
            <th>Срок</th>
            <th>Продукт</th>
            <th>Текущий этап</th>
            <th>Действия</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="app in filteredApplications" :key="app.id">
            <td>#{{ app.id }}</td>
            <td>{{ app.client_name }}</td>
            <td>{{ formatAmount(app.requested_amount) }}</td>
            <td>{{ app.requested_term }} мес.</td>
            <td>{{ app.product_name }}</td>
            <td>
                <span class="stage-badge" :class="app.current_stage">
                  {{ getStageName(app.current_stage) }}
                </span>
            </td>
            <td>
              <button
                  class="btn-action"
                  @click="goToStage(app)"
                  :title="getActionTitle(app)"
              >
                <i :class="getActionIcon(app)"></i>
                {{ getActionText(app) }}
              </button>
            </td>
          </tr>
          </tbody>
        </table>
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

onMounted(async () => {
  try {
    loading.value = true;
    const response = await api.get('/applications');

    applications.value = response.data.filter(app =>
        ['A2', 'A21', 'A22', 'A23'].includes(app.current_stage)
    );
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    error.value = 'Не удалось загрузить заявки';
  } finally {
    loading.value = false;
  }
});

const filteredApplications = computed(() => {
  let filtered = applications.value;

  if (stageFilter.value) {
    filtered = filtered.filter(app => app.current_stage === stageFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(app =>
        app.client_name?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
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
    'approved': 'Одобрено',
    'draft': 'Черновик'
  };
  return stages[stage] || stage;
};

const getActionTitle = (app) => {
  const actions = {
    'A2': 'Начать оценку рисков',
    'A21': 'Перейти к финансовому анализу',
    'A22': 'Перейти к оценке залога',
    'A23': 'Перейти к принятию решения'
  };
  return actions[app.current_stage] || 'Оценить';
};

const getActionIcon = (app) => {
  const icons = {
    'A2': 'fas fa-play',
    'A21': 'fas fa-chart-line',
    'A22': 'fas fa-home',
    'A23': 'fas fa-gavel'
  };
  return icons[app.current_stage] || 'fas fa-arrow-right';
};

const getActionText = (app) => {
  const texts = {
    'A2': 'Начать',
    'A21': 'Анализ',
    'A22': 'Залог',
    'A23': 'Решение'
  };
  return texts[app.current_stage] || 'Оценить';
};

const goToStage = (app) => {
  const routes = {
    'A2': `/applications/${app.id}/financial-analysis`,
    'A21': `/applications/${app.id}/financial-analysis`,
    'A22': `/applications/${app.id}/collateral`,
    'A23': `/applications/${app.id}/risk-decision`
  };

  router.push(routes[app.current_stage]);
};
</script>

<style scoped>
.risk-assessment {
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

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-width: 200px;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f9fafb;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.stage-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.stage-badge.A2 { background: #f3f4f6; color: #4b5563; }
.stage-badge.A21 { background: #dbeafe; color: #1e40af; }
.stage-badge.A22 { background: #fef3c7; color: #92400e; }
.stage-badge.A23 { background: #fee2e2; color: #991b1b; }

.btn-action {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.btn-action:hover {
  background: #4338ca;
}
</style>