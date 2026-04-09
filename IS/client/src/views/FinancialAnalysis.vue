<template>
  <div class="financial-analysis">
    <div class="header">
      <h2>Финансовый анализ</h2>
      <p class="idef0-badge">Финансовый анализ</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка...
    </div>

    <div v-else class="content">
 
      <div class="application-info card">
        <h3>Заявка #{{ application?.id }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Клиент:</span>
            <span class="value">{{ application?.client_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Сумма:</span>
            <span class="value">{{ formatAmount(application?.requested_amount) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Срок:</span>
            <span class="value">{{ application?.requested_term }} мес.</span>
          </div>
          <div class="info-item">
            <span class="label">Продукт:</span>
            <span class="value">{{ application?.product_name }}</span>
          </div>
        </div>
      </div>

    
      <form @submit.prevent="submitAnalysis" class="analysis-form card">
        <h3>Введите финансовые показатели</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Годовая выручка (₽)</label>
            <input type="number" v-model="form.revenue" required>
          </div>
          <div class="form-group">
            <label>Годовые расходы (₽)</label>
            <input type="number" v-model="form.expenses" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Текущий долг (₽)</label>
            <input type="number" v-model="form.debt" required>
          </div>
          <div class="form-group">
            <label>Активы (₽)</label>
            <input type="number" v-model="form.assets" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Отрасль</label>
            <select v-model="form.industry" required>
              <option value="">Выберите отрасль</option>
              <option value="IT">IT / Технологии</option>
              <option value="retail">Розничная торговля</option>
              <option value="manufacturing">Производство</option>
              <option value="construction">Строительство</option>
              <option value="services">Услуги</option>
            </select>
          </div>
          <div class="form-group">
            <label>Кредитная история</label>
            <select v-model="form.creditHistory" required>
              <option value="excellent">Отличная</option>
              <option value="good">Хорошая</option>
              <option value="fair">Средняя</option>
              <option value="poor">Плохая</option>
            </select>
          </div>
        </div>

        <button type="button" class="btn-secondary" @click="calculateScore">
          <i class="fas fa-calculator"></i> Рассчитать скоринг
        </button>

    
        <div v-if="results" class="results">
          <h4>Результаты анализа</h4>

          <div class="score-display" :class="scoreClass">
            <span class="score-label">Скоринг:</span>
            <span class="score-value">{{ results.score }}/100</span>
          </div>

          <div class="metrics">
            <div class="metric">
              <span>Ликвидность:</span>
              <strong>{{ results.liquidity.toFixed(2) }}</strong>
            </div>
            <div class="metric">
              <span>Долговая нагрузка:</span>
              <strong>{{ results.debtRatio.toFixed(2) }}</strong>
            </div>
            <div class="metric">
              <span>Рентабельность:</span>
              <strong>{{ results.profitMargin.toFixed(1) }}%</strong>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$router.back()">
            Отмена
          </button>
          <button type="submit" class="btn-primary" :disabled="!results">
            Сохранить и продолжить
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const application = ref(null);
const results = ref(null);

const form = reactive({
  revenue: null,
  expenses: null,
  debt: null,
  assets: null,
  industry: '',
  creditHistory: ''
});

onMounted(async () => {
  try {
    const response = await api.get(`/applications/${route.params.id}`);
    application.value = response.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const calculateScore = () => {
  const revenue = form.revenue || 0;
  const expenses = form.expenses || 0;
  const debt = form.debt || 0;
  const assets = form.assets || 0;

  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const liquidity = expenses > 0 ? assets / (expenses / 12) : 0;
  const debtRatio = profit > 0 ? debt / profit : 999;

  let score = 0;
  if (profitMargin >= 30) score += 30;
  else if (profitMargin >= 20) score += 20;
  else if (profitMargin >= 10) score += 10;

  if (liquidity >= 2) score += 25;
  else if (liquidity >= 1.5) score += 20;
  else if (liquidity >= 1) score += 15;

  if (debtRatio <= 1) score += 25;
  else if (debtRatio <= 2) score += 20;
  else if (debtRatio <= 3) score += 15;

  const historyScores = { excellent: 20, good: 15, fair: 10, poor: 0 };
  score += historyScores[form.creditHistory] || 0;

  results.value = {
    score,
    liquidity,
    debtRatio,
    profitMargin
  };
};

const scoreClass = computed(() => {
  if (!results.value) return '';
  if (results.value.score >= 70) return 'high';
  if (results.value.score >= 50) return 'medium';
  return 'low';
});

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
};

const submitAnalysis = async () => {
  try {
    await api.post(`/applications/${route.params.id}/financial-analysis`, {
      financial_score: results.value.score,
      liquidity_ratio: results.value.liquidity,
      debt_ratio: results.value.debtRatio,
      profit_margin: results.value.profitMargin,
      revenue: form.revenue,
      expenses: form.expenses,
      debt: form.debt,
      assets: form.assets,
      industry_risk: form.industry
    });

    router.push(`/applications/${route.params.id}/collateral`);
  } catch (err) {
    console.error(err);
    alert('Ошибка при сохранении');
  }
};
</script>

<style scoped>
.financial-analysis {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.idef0-badge {
  display: inline-block;
  background: #4f46e5;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 0.9rem;
  color: #6b7280;
}

.info-item .value {
  font-weight: 600;
  color: #1f2937;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.results {
  margin-top: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.score-display {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.score-display.high { background: #d1fae5; color: #065f46; }
.score-display.medium { background: #fef3c7; color: #92400e; }
.score-display.low { background: #fee2e2; color: #991b1b; }

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>